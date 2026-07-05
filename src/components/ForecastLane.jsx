import { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Pagination } from "react-bootstrap";

export default function BadgerMart(props) {

    const [feature, setFeature] = useState(null);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    // hard coding for proof of concept
    const madison = [-89.4012, 43.0731]; // lng, lat
    const indianapolis = [-86.1581, 39.7684];

    async function getRoute() {

        // might want to validate here and error before continueing
        const startAdd=geocode(document.getElementById("startLocation").value);
        const finalAdd=geocode(document.getElementById("finalLocation").value);

        console.log(startAdd);
        console.log(finalAdd);

        console.log(startAdd.promiseresult);
        // console.log(finalAdd);

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${madison[0]},${madison[1]};${indianapolis[0]},${indianapolis[1]}?geometries=geojson&overview=full&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        const route = data.routes[0];
        setFeature({
            type: "Feature",
            geometry: route.geometry,
            properties: {}
        });

        console.log("Route coordinates:", route.geometry.coordinates);
        console.log("Trip duration in seconds:", route.duration);

        getWeatherPoints(route,60)

    }

    function getWeatherPoints(route, intervalMinutes = 60) {
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

            // figure out the too many requests here
            // fetchWeather(lng, lat);

            weatherPoints.push({
            lat,
            lng,
            secondsFromStart: durationSeconds * fraction
            });
        }

        console.log(weatherPoints)

        return weatherPoints;
    }

    async function fetchWeather(lat, lng) {
        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lng}` +
            `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
            `&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        console.log(data);

        return data;
    }

    async function geocode(address) {
        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
            `?access_token=${token}`;

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
        <div className="time-dropdown">
            <select>
                <option value="1:00">1:00</option>
                <option value="2:00">2:00</option>
                <option value="3:00">3:00</option>
                <option value="4:00">4:00</option>
                <option value="5:00">5:00</option>
                <option value="6:00">6:00</option>
                <option value="7:00">7:00</option>
                <option value="8:00">8:00</option>
                <option value="9:00">9:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
            </select>
        </div>
        <div className="time-ampm">
            <select>
                <option value="am">am</option>
                <option value="pm">pm</option>
            </select>
        </div>
        <button onClick={addTimes}>Add A New Time</button>
        <button onClick={getRoute}>Let's Go!</button>
        <button onClick={resetFields}>Reset</button>
    </div>
}