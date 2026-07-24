import { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Pagination } from "react-bootstrap";
import "./ForecastLane.css";

export default function ForecastLane(props) {

    const [feature, setFeature] = useState(null);
    const [forecastEntries, setForecastEntries] = useState([]);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    const weatherCodes = {
        0: { text: "Clear"},
        1: { text: "Mainly Clear"},
        2: { text: "Partly Cloudy"},
        3: { text: "Overcast"},
        45: { text: "Fog"},
        48: { text: "Fog"},
        51: { text: "Light Drizzle"},
        56: { text: "Freezing Drizzle"},
        57: { text: "Freezing Drizzle"},
        61: { text: "Light Rain"},
        63: { text: "Moderate Rain"},
        65: { text: "Heavy Rain"},
        66: { text: "Freezing Rain"},
        67: { text: "Freezing Rain"},
        71: { text: "Light Snow"},
        73: { text: "Moderate Snow"},
        75: { text: "Heavy Snow"},
        77: { text: "Snow Grains"},
        80: { text: "Light Rain Showers"},
        81: { text: "Moderate Rain Showers"},
        82: { text: "Heavy Rain Showers"},
        85: { text: "Snow Showers"},
        86: { text: "Snow Showers"},
        95: { text: "Thunderstorm"},
        96: { text: "Thunderstorm with hail"},
        99: { text: "Thunderstorm with hail"}
    };

    // start times
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
    const [hour, setHour] = useState(1);
    const [minute, setMinute] = useState(0);
    const [ampm, setAmpm] = useState("am");

    // hard coding for proof of concept
    const madison = [-89.4012, 43.0731]; // lng, lat
    const indianapolis = [-86.1581, 39.7684];

    async function getRoute(event) {
        event.preventDefault();

        if (document.getElementById("startLocation").value === "" || document.getElementById("finalLocation").value === ""){
            alert("Please enter a starting address and final destination!")
            return
        }

        const startAdd = await geocode(document.getElementById("startLocation").value);
        const finalAdd = await geocode(document.getElementById("finalLocation").value);

        // const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startAdd[0]},${startAdd[1]};${finalAdd[0]},${finalAdd[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${madison[0]},${madison[1]};${indianapolis[0]},${indianapolis[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`

        const response = await fetch(url);
        const data = await response.json();

        const route = data.routes[0];

        setFeature({
            type: "Feature",
            geometry: route.geometry,
            properties: {}
        });

        const points = await getWeatherPoints(route, 60);


        const pointsWithNames = await Promise.all(
        points.map(async point => ({
            ...point,
            cityState: await reverseGeocode(point.lng, point.lat),
            weather: calculateWeather(point)
        }))
        );

        setForecastEntries(pointsWithNames);
    }

    function calculateWeather(data){

        const secondsFromStart = data.secondsFromStart;
        // calculate the arrive at time based on the secondsFromStart and hour + minutes

        // hardcoded currently to be the first weather code. need to calculate the weather code based on seconds from
        console.log(data.weatherData.hourly.weather_code[0])

        return weatherCodes[data.weatherData.hourly.weather_code[0]].text
    }


    async function getWeatherPoints(route, intervalMinutes = 60) {
        const coords = route.geometry.coordinates;
        const durationSeconds = route.duration;

        const intervalSeconds = intervalMinutes * 60;

        const numPoints = Math.ceil(durationSeconds / intervalSeconds) + 1;

        const weatherPoints = [];

        for (let i = 0; i < numPoints; i++) {
            console.log(i)
            const fraction = i / (numPoints - 1);
            const index = Math.floor(fraction * (coords.length - 1));

            const [lng, lat] = coords[index];

            // pull the weather data
            const weatherData = await fetchWeather(lng, lat);

            weatherPoints.push({
            lat,
            lng,
            secondsFromStart: durationSeconds * fraction,
            weatherData
            });
        }

        console.log("Weather Points")
        console.log(weatherPoints)

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
        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
            `?access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features.length === 0) {
            throw new Error("Address not found");
        }

        return data.features[0].center;
    }

    function addTimes(){

    }

    function resetFields(){

    }

    return <div>
        <h1>Forecast Lane</h1>
        <Form>
            <Form.Label htmlFor="startLocation">Starting Address</Form.Label>
            <Form.Control id="startLocation"/>
            <Form.Label htmlFor="finalLocation">Destination</Form.Label>
            <Form.Control id="finalLocation"/>
            <br />
        </Form>


        <div className="controls">
        <div className="time-picker">
        <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
            {hours.map(hour => (
            <option key={hour} value={hour}>
                {hour}
            </option>
            ))}
        </select>

        <span>:</span>

        <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}>
            {minutes.map(minute => (
            <option key={minute} value={minute}>
                {String(minute).padStart(2, "0")}
            </option>
            ))}
        </select>

        <select value={ampm} onChange={(e) => setAmpm(e.target.value)}>
            <option value="am">AM</option>
            <option value="pm">PM</option>
        </select>
        </div>

        <div className="button-row">
            <button onClick={addTimes}>Add A New Time</button>
            <button onClick={getRoute}>Let's Go!</button>
            <button onClick={resetFields}>Reset</button>
        </div>
        </div>

        <div className="forecast-columns">
            <div className="forecast-column">
                {forecastEntries.map((entry, index) => (
                    <div className="forecast-card" key={index}>
                    <span>
                        Stop {index + 1}: {entry.cityState}
                    </span>
                    <span>
                        {Math.round(entry.secondsFromStart / 60)} min
                    </span>
                    <span>
                        {entry.weather}
                    </span>
                    </div>
                ))}
            </div>
        </div>
    </div>

    
}