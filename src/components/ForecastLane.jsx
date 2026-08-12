import { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Pagination, Image } from "react-bootstrap";
import "./ForecastLane.css";
import ForecastCard from "./ForecastCard";
import weatherCodes from "../data/WeatherCodes";
import RouteCard from "./RouteCard"
import ForecastDaySelector from "./ForecastDaySelector";

export default function ForecastLane(props) {

    const [routes, setRoutes] = useState([]);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    // hardcoded token for testing

    const [inputInterval, setInterval] = useState(30);

    const getTodayValue = () => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayValue());

    const getCurrentTimeValue = () => {
        const current = new Date();

        const hour = String(current.getHours()).padStart(2, "0");
        const minute = String(current.getMinutes()).padStart(2, "0");

        return `${hour}:${minute}`;
    };
    

    const [departureTime, setDepartureTime] = useState(getCurrentTimeValue());
    
    const [sessionstartDT, setSessionstartDT] = useState(new Date(`${getTodayValue()}T${getCurrentTimeValue()}:00`));
    const [startLocation, setStartLocation] = useState("");
    const [finalLocation, setFinalLocation] = useState("");
    const [isLoaded, setIsLoaded] = useState(false)
    const[isLoading,setIsLoading] = useState(false)

    // hard coding for proof of concept
    const madison = [-89.4012, 43.0731]; // lng, lat
    const indianapolis = [-86.1581, 39.7684];


    useEffect(() => {
        const selectedDT = new Date(`${selectedDate}T${departureTime}:00`);
        if (selectedDT < sessionstartDT) {
            alert("Time can't be in the past")
            setSelectedDate(getTodayValue())
            setDepartureTime(getCurrentTimeValue())
        }
    },[selectedDate,departureTime])

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
        
        
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startAdd[0]},${startAdd[1]};${finalAdd[0]},${finalAdd[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}&alternatives=true`;

    
        try {
        const response = await fetch(url);
        const data = await response.json();

        console.log(data) 

        if (data.code === "NoRoute") {
            alert("Unable to find a Route")
            return
        }
        setIsLoading(true)

        const routesWithWeather = await Promise.all(
        data.routes.map(async (route, routeIndex) => {

        const points = await getWeatherPoints(
            route,
            inputInterval
        );

        const pointsWithNames = await Promise.all(
            points.map(async point => {

                const weatherIndex = getWeatherIndex(point);

                return {
                    ...point,

                    cityState: await reverseGeocode(
                        point.lng,
                        point.lat
                    ),

                    weather: getWeatherText(
                        point,
                        weatherIndex
                    ),

                    icon: getWeatherIcon(
                        point,
                        weatherIndex
                    ),

                    time: calculateCurrentTime(
                        point.secondsFromStart
                    ),

                    severity: getWeatherSeverity(
                        point,
                        weatherIndex
                    )
                };
            })
        );

        return {
            ...route,
            routeNumber: routeIndex + 1,
            forecastEntries: pointsWithNames
        };
    })
);
        setRoutes(routesWithWeather)
        } finally {
        
        setIsLoaded(true)
        setIsLoading(false)
        }
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
        if (data.weatherData.hourly.is_day[index]) {
            return weatherCodes[data.weatherData.hourly.weather_code[index]].dayIcon
        }

        return weatherCodes[data.weatherData.hourly.weather_code[index]].nightIcon
    }

    function getWeatherIndex(point) {
        // The user's selected departure date + time
    const departureDateTime = new Date(
        `${selectedDate}T${departureTime}:00`
    );

    // Add the amount of time spent driving to this point
    const arrivalTimestamp =
        departureDateTime.getTime() +
        point.secondsFromStart * 1000;

    // Open-Meteo tells us the UTC offset for this location
    const offsetSeconds =
        point.weatherData.utc_offset_seconds;

    // Convert the arrival timestamp into the local time
    // at this particular weather point.
    const localTimestamp =
        arrivalTimestamp + offsetSeconds * 1000;

    const localDate = new Date(localTimestamp);

    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localDate.getUTCDate()).padStart(2, "0");
    const hour = String(localDate.getUTCHours()).padStart(2, "0");

    const targetHour = `${year}-${month}-${day}T${hour}:00`;

    const index =
        point.weatherData.hourly.time.findIndex(
            time => time === targetHour
        );

    return index;
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
            `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day` +
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
        setStartLocation("");
    setFinalLocation("");
    setSelectedDate(getTodayValue());
    setDepartureTime(getCurrentTimeValue());
    setInterval(30);
    setRoutes([]);
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
            onClick={() => {
                setFinalLocation("")}
            }
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

       <div className="routes-scroll">
    {!isLoading ? (
        routes.map((route, index) => (
            <RouteCard
                key={index}
                routeNumber={index + 1}
                forecastEntries={route.forecastEntries}
            />
        ))
    ) : (
        <p className="loading-text">Loading Forecast ...</p>
    )}
</div>
    </div>
    </div>
    </div>

    
}