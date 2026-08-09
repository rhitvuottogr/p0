import { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Pagination, Image } from "react-bootstrap";
import "./ForecastLane.css";
import ForecastCard from "./ForecastCard";
import weatherCodes from "../data/WeatherCodes";
import RouteCard from "./RouteCard"
import ForecastDaySelector from "./ForecastDaySelector";

export default function ForecastLane(props) {

    const [feature, setFeature] = useState(null);
    const [forecastEntries, setForecastEntries] = useState([]);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    // hardcoded token for testing

    const [inputInterval, setInterval] = useState(30);

    const getTodayValue = () => {
    return new Date().toISOString().split("T")[0];
    };

    const [selectedDate, setSelectedDate] = useState(getTodayValue());

    const getCurrentTimeValue = () => {
        const current = new Date();

        const hour = String(current.getHours()).padStart(2, "0");
        const minute = String(current.getMinutes()).padStart(2, "0");

        return `${hour}:${minute}`;
    };

    const [departureTime, setDepartureTime] = useState(getCurrentTimeValue());

    const [startLocation, setStartLocation] = useState("");
    const [finalLocation, setFinalLocation] = useState("");
    const [isLoaded, setIsLoaded] = useState(false)
    const[isLoading,setIsLoading] = useState(false)

    // hard coding for proof of concept
    const madison = [-89.4012, 43.0731]; // lng, lat
    const indianapolis = [-86.1581, 39.7684];

    async function getRoute(event) {
        event.preventDefault();        

        if (
            startLocation.trim() === "" ||
            finalLocation.trim() === ""
        ) {
            alert("Please enter a starting address and final destination!");
            return;
        }

        const startAdd = await geocode(startLocation);
        const finalAdd = await geocode(finalLocation);


        if (startAdd === "NoAddress") {
            alert("Unable to find starting address")
            return
        } else if (finalAdd === "NoAddress") {
            alert("Unable to find destination")
            return
        }
        await setIsLoading(true)
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startAdd[0]},${startAdd[1]};${finalAdd[0]},${finalAdd[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

    

        const response = await fetch(url);
        const data = await response.json();

        console.log(data)

        if (data.code === "NoRoute") {
            alert("Unable to find a Route")
            return
        }

        const route = data.routes[0];

        setFeature({
            type: "Feature",
            geometry: route.geometry,
            properties: {}
        });

        const points = await getWeatherPoints(route, inputInterval); //todo: use input for interval


        const pointsWithNames = await Promise.all(
        points.map(async point => ({
            ...point,
            cityState: await reverseGeocode(point.lng, point.lat),
            weather: getWeatherText(point,getWeatherIndex(point)),
            icon: getWeatherIcon(point,getWeatherIndex(point)),
            time: calculateCurrentTime(point.secondsFromStart),
            severity: getWeatherSeverity(point,getWeatherIndex(point))
        }))
        );

        setForecastEntries(pointsWithNames);
        setIsLoaded(true)
        setIsLoading(false)
    }

    function getWeatherText(data,index){

        const secondsFromStart = data.secondsFromStart;
        // calculate the arrive at time based on the secondsFromStart and hour + minutes

        // hardcoded currently to be the first weather code. need to calculate the weather code based on seconds from
        //console.log("GET TEXXXXTTTT!!!")
        //console.log(data)
        //console.log(data.weatherData.hourly.weather_code[0])

        return weatherCodes[data.weatherData.hourly.weather_code[index]].text
    }

    function getWeatherIcon(data,index){

        const secondsFromStart = data.secondsFromStart;
        // calculate the arrive at time based on the secondsFromStart and hour + minutes

        // hardcoded currently to be the first weather code. need to calculate the weather code based on seconds from
        //console.log(data.weatherData.hourly.weather_code[0])

        return weatherCodes[data.weatherData.hourly.weather_code[index]].icon
    }

    function getWeatherIndex(point) {
        console.log("yo yo: ", Math.round(point.secondsFromStart / 3600))
        return Math.round(point.secondsFromStart / 3600)
    }

    function getWeatherSeverity(data, index){

        const secondsFromStart = data.secondsFromStart;
        // copyied from the other guys above

        return weatherCodes[data.weatherData.hourly.weather_code[index]].severity
    }

    async function getWeatherPoints(route, intervalMinutes = 60) {
        const coords = route.geometry.coordinates;
        const durationSeconds = route.duration;

        const intervalSeconds = intervalMinutes * 60;

        const numPoints = Math.ceil(durationSeconds / intervalSeconds) + 1;

        const weatherPoints = [];

        for (let i = 0; i < numPoints; i++) {
            const secondsFromStart = i * intervalSeconds;

            // don't go past the end of the route
            const fraction = Math.min(secondsFromStart / durationSeconds, 1);

            const index = Math.floor(fraction * (coords.length - 1));

            const [lng, lat] = coords[index];

            // pull the weather data
            const weatherData = await fetchWeather(lng, lat);

            weatherPoints.push({
            lat,
            lng,
            secondsFromStart: secondsFromStart,
            weatherData
            });
        }

        //console.log("Weather Points")
        //console.log(weatherPoints)

        return weatherPoints;
    }

    async function fetchWeather(lng, lat) {
        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lng}` +
            `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
            `&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        // console.log("weather");
        // console.log(data);

        return data;
    }

    async function reverseGeocode(lng, lat) {
        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
            `?types=place,region` +
            `&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        const city = data.features.find(f => f.place_type.includes("place"));
        const state = data.features.find(f => f.place_type.includes("region"));

        return `${city?.text || "Unknown city"}, ${state?.text || "Unknown state"}`;
    }

    async function geocode(address) {
        console.log("token: ",MAPBOX_TOKEN)
        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
            `?access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features.length === 0) {
            //throw new Error("Address not found");
            return "NoAddress"
        }

        return data.features[0].center;
    }

    function addTimes(){

    }

    function resetFields(){
        document.getElementById("startLocation").value = "";
        document.getElementById("finalLocation").value = "";

        // const now = new Date();
        // const hours = Array.from({ length: 12 }, (_, i) => i + 1);
        // const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
        // setHour((now.getHours()%12) + 1);
        // setMinute(0)
        // setAmpm(now.getHours() >= 12 ? "pm" : "am");

        setDepartureTime(getCurrentTimeValue());
        setInterval(30);

        setForecastEntries([]);
        setFeature(null);
    }

//     function calculateCurrentTime(secondsFromStart) {
//     let totalMinutes = Math.floor(secondsFromStart / 60);

//     let startHour = hour;
//     let startMinute = minute;

//     // convert starting time to 24-hour format
//     if (ampm === "pm" && startHour !== 12) {
//         startHour += 12;
//     }

//     if (ampm === "am" && startHour === 12) {
//         startHour = 0;
//     }

//     // add travel time
//     let totalStartMinutes = startHour * 60 + startMinute;
//     let arrivalMinutes = totalStartMinutes + totalMinutes;

//     // handle days rolling over
//     arrivalMinutes = arrivalMinutes % (24 * 60);

//     let arrivalHour = Math.floor(arrivalMinutes / 60);
//     let arrivalMinute = arrivalMinutes % 60;

//     // convert back to 12 hour format
//     let displayAmPm = arrivalHour >= 12 ? "PM" : "AM";

//     arrivalHour = arrivalHour % 12;
//     if (arrivalHour === 0) {
//         arrivalHour = 12;
//     }

//     return `${arrivalHour}:${String(arrivalMinute).padStart(2, "0")} ${displayAmPm}`;
// }

    function calculateCurrentTime(secondsFromStart) {

        const [startHour, startMinute] = departureTime
            .split(":")
            .map(Number);

        const travelMinutes = Math.floor(secondsFromStart / 60);

        let totalStartMinutes =
            startHour * 60 + startMinute;

        let arrivalMinutes =
            totalStartMinutes + travelMinutes;

        // Handle going past midnight
        arrivalMinutes =
            arrivalMinutes % (24 * 60);

        let arrivalHour =
            Math.floor(arrivalMinutes / 60);

        const arrivalMinute =
            arrivalMinutes % 60;

        const displayAmPm =
            arrivalHour >= 12 ? "PM" : "AM";

        // Convert 24-hour → 12-hour
        arrivalHour =
            arrivalHour % 12;

        if (arrivalHour === 0) {
            arrivalHour = 12;
        }

        return `${arrivalHour}:${String(arrivalMinute).padStart(2, "0")} ${displayAmPm}`;
    }

    return <div>
        <div className="route-radar-header">
       <div className="route-radar-icon-wrap">
        <img
            src={`${import.meta.env.BASE_URL}header_icon.png`}
            alt="header_icon"
            className="route-radar-icon"
        />
        </div>

        <div className="route-radar-text">
            <h1>Route Radar</h1>
            <h2>Know Your Route Before You Go.</h2>
        </div>
        </div>
        <div className="forecast-form-card">
    <Form className="route-form">
      <div className="address-row">

    {/* Starting Address */}
    <Form.Group className="route-field">
        <Form.Label htmlFor="startLocation">
        Starting Address
        </Form.Label>

        <div className="route-input-wrapper">
        <div className="route-input-icon">
            <img
            src="/p0/starting_icon.png"
            alt="starting_icon"
            />
        </div>

        <Form.Control
            id="startLocation"
            className="route-input"
            placeholder="Enter starting address"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
        />

        <button
            type="button"
            className="route-clear-button"
            aria-label="Clear starting address"
            onClick={() => {
                setStartLocation("")}
            }
        >
            ×
        </button>
        </div>
    </Form.Group>

    {/* Destination */}
    <Form.Group className="route-field">
        <Form.Label htmlFor="finalLocation">
        Destination
        </Form.Label>

        <div className="route-input-wrapper">
        <div className="route-input-icon">
            <img
            src="/p0/dest_icon.png"
            alt="dest_icon"
            />
        </div>

        <Form.Control
            id="finalLocation"
            className="route-input"
            placeholder="Enter destination"
            value={finalLocation}
            onChange={(e) => setFinalLocation(e.target.value)}
        />

        <button
            type="button"
            className="route-clear-button"
            aria-label="Clear destination"
        >
            ×
        </button>
        </div>
    </Form.Group>
    </div>
</Form>

    <div className="time-section">

        <div className="time-section-header">
            <span className="time-icon">◷</span>
            <span>Trip Timing</span>
        </div>

        <ForecastDaySelector
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
        />

        <div className="time-picker-row">

            {/* Departure Time */}
            <div className="time-field-group">
                <label htmlFor="departureTime">
                    Departure Time
                </label>

                <input
                    id="departureTime"
                    type="time"
                    step="300"
                    className="departure-time-input"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    onPointerDown={(e) => {
                        if (e.currentTarget.showPicker) {
                        e.currentTarget.showPicker();
                        }
                    }}
                />
            </div>


            {/* Forecast Interval */}
            <div className="interval-group">
                <span className="interval-label">
                    Forecast Every
                </span>

                <div className="interval-chips">

                    {[15, 30, 45, 60].map((minutes) => (
                        <button
                            key={minutes}
                            type="button"
                            className={`interval-chip ${
                                inputInterval === minutes ? "active" : ""
                            }`}
                            onClick={() => setInterval(minutes)}
                        >
                            {minutes === 60
                                ? "1 hour"
                                : `${minutes} min`}
                        </button>
                    ))}

                </div>
            </div>

        </div>

            <div className="action-buttons">
            {/* <button className="action-button secondary" onClick={addTimes}>
                <span>＋</span>
                Add A New Time
            </button> */}

            <button className="action-button primary" onClick={getRoute}>
                <span>➤</span>
                Let's Go!
            </button>

            <button className="action-button secondary" onClick={resetFields}>
                <span>↻</span>
                Reset
            </button>
        </div>

        </div>
        {!isLoaded || !isLoading ? (
        <RouteCard
            forecastEntries={forecastEntries}/>
    ) : (
        <p className="loading-text">Loading Forecast ...</p>
    )}
    </div>
    </div>

    
}