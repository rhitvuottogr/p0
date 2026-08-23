import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import "./ForecastLane.css";
import weatherCodes from "../data/WeatherCodes";
import RouteCard from "./RouteCard";
import ForecastDaySelector from "./ForecastDaySelector";

export default function ForecastLane(props) {

    const [routes, setRoutes] = useState([]);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

    const [departureTime, setDepartureTime] = useState(
        getCurrentTimeValue()
    );

    const [sessionstartDT] = useState(
        new Date(`${getTodayValue()}T${getCurrentTimeValue()}:00`)
    );

    const [startLocation, setStartLocation] = useState("");
    const [finalLocation, setFinalLocation] = useState("");

    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    // ============================================================
    // AUTOCOMPLETE STATE
    // ============================================================

    const [startSuggestions, setStartSuggestions] = useState([]);
    const [finalSuggestions, setFinalSuggestions] = useState([]);

    const [selectedStart, setSelectedStart] = useState(null);
    const [selectedFinal, setSelectedFinal] = useState(null);

    const [startActiveIndex, setStartActiveIndex] = useState(-1);
    const [finalActiveIndex, setFinalActiveIndex] = useState(-1);


    // ============================================================
    // DATE / TIME VALIDATION
    // ============================================================

    useEffect(() => {

        const selectedDT = new Date(
            `${selectedDate}T${departureTime}:00`
        );

        if (selectedDT < sessionstartDT) {

            alert("Time can't be in the past");

            setSelectedDate(getTodayValue());
            setDepartureTime(getCurrentTimeValue());
        }

    }, [selectedDate, departureTime, sessionstartDT]);


    // ============================================================
    // ADDRESS AUTOCOMPLETE
    // ============================================================

    async function getAddressSuggestions(query) {

        if (query.trim().length < 3) {
            return [];
        }

        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${encodeURIComponent(query)}.json` +
            `?access_token=${MAPBOX_TOKEN}` +
            `&autocomplete=true` +
            `&types=address` +
            `&country=us` +
            `&limit=5`;

        try {

            const response = await fetch(url);

            if (!response.ok) {

                console.error(
                    "Autocomplete request failed:",
                    response.status,
                    response.statusText
                );

                return [];
            }

            const data = await response.json();

            return data.features || [];

        } catch (error) {

            console.error(
                "Autocomplete request failed:",
                error
            );

            return [];
        }
    }


    // ============================================================
    // START ADDRESS AUTOCOMPLETE
    // ============================================================

    useEffect(() => {

        if (selectedStart) {
            return;
        }

        if (startLocation.trim().length < 3) {

            setStartSuggestions([]);
            setStartActiveIndex(-1);

            return;
        }

        const timer = setTimeout(async () => {

            const suggestions =
                await getAddressSuggestions(startLocation);

            setStartSuggestions(suggestions);
            setStartActiveIndex(-1);

        }, 300);

        return () => clearTimeout(timer);

    }, [startLocation, selectedStart]);


    // ============================================================
    // FINAL ADDRESS AUTOCOMPLETE
    // ============================================================

    useEffect(() => {

        if (selectedFinal) {
            return;
        }

        if (finalLocation.trim().length < 3) {

            setFinalSuggestions([]);
            setFinalActiveIndex(-1);

            return;
        }

        const timer = setTimeout(async () => {

            const suggestions =
                await getAddressSuggestions(finalLocation);

            setFinalSuggestions(suggestions);
            setFinalActiveIndex(-1);

        }, 300);

        return () => clearTimeout(timer);

    }, [finalLocation, selectedFinal]);


    // ============================================================
    // SELECT AUTOCOMPLETE RESULT
    // ============================================================

    function selectStartSuggestion(suggestion) {

        setStartLocation(suggestion.place_name);
        setSelectedStart(suggestion);

        setStartSuggestions([]);
        setStartActiveIndex(-1);
    }


    function selectFinalSuggestion(suggestion) {

        setFinalLocation(suggestion.place_name);
        setSelectedFinal(suggestion);

        setFinalSuggestions([]);
        setFinalActiveIndex(-1);
    }


    // ============================================================
    // KEYBOARD NAVIGATION
    // ============================================================

    function handleStartKeyDown(e) {

        if (
            e.key === "ArrowDown" &&
            startSuggestions.length > 0
        ) {

            e.preventDefault();

            setStartActiveIndex(prev =>
                prev < startSuggestions.length - 1
                    ? prev + 1
                    : 0
            );

            return;
        }


        if (
            e.key === "ArrowUp" &&
            startSuggestions.length > 0
        ) {

            e.preventDefault();

            setStartActiveIndex(prev =>
                prev > 0
                    ? prev - 1
                    : startSuggestions.length - 1
            );

            return;
        }


        if (e.key === "Enter") {

            if (
                startSuggestions.length > 0 &&
                startActiveIndex >= 0
            ) {

                e.preventDefault();

                selectStartSuggestion(
                    startSuggestions[startActiveIndex]
                );
            }

            /*
                If nothing is highlighted,
                DON'T prevent default.

                The form will submit naturally.
            */

            return;
        }


        if (e.key === "Tab") {

            if (
                startSuggestions.length > 0 &&
                startActiveIndex >= 0
            ) {

                selectStartSuggestion(
                    startSuggestions[startActiveIndex]
                );
            }

            return;
        }


        if (e.key === "Escape") {

            setStartSuggestions([]);
            setStartActiveIndex(-1);
        }
    }


    function handleFinalKeyDown(e) {

        if (
            e.key === "ArrowDown" &&
            finalSuggestions.length > 0
        ) {

            e.preventDefault();

            setFinalActiveIndex(prev =>
                prev < finalSuggestions.length - 1
                    ? prev + 1
                    : 0
            );

            return;
        }


        if (
            e.key === "ArrowUp" &&
            finalSuggestions.length > 0
        ) {

            e.preventDefault();

            setFinalActiveIndex(prev =>
                prev > 0
                    ? prev - 1
                    : finalSuggestions.length - 1
            );

            return;
        }


        if (e.key === "Enter") {

            if (
                finalSuggestions.length > 0 &&
                finalActiveIndex >= 0
            ) {

                e.preventDefault();

                selectFinalSuggestion(
                    finalSuggestions[finalActiveIndex]
                );
            }

            return;
        }


        if (e.key === "Tab") {

            if (
                finalSuggestions.length > 0 &&
                finalActiveIndex >= 0
            ) {

                selectFinalSuggestion(
                    finalSuggestions[finalActiveIndex]
                );
            }

            return;
        }


        if (e.key === "Escape") {

            setFinalSuggestions([]);
            setFinalActiveIndex(-1);
        }
    }


    // ============================================================
    // ROUTE
    // ============================================================

    async function getRoute(event) {

        event.preventDefault();

        if (
            startLocation.trim() === "" ||
            finalLocation.trim() === ""
        ) {

            alert(
                "Please enter a starting address and final destination!"
            );

            return;
        }


        let startAdd;
        let finalAdd;


        if (selectedStart?.center) {

            startAdd = selectedStart.center;

        } else {

            startAdd =
                await geocode(startLocation);
        }


        if (selectedFinal?.center) {

            finalAdd = selectedFinal.center;

        } else {

            finalAdd =
                await geocode(finalLocation);
        }


        if (startAdd === "NoAddress") {

            alert("Unable to find starting address");
            return;

        } else if (finalAdd === "NoAddress") {

            alert("Unable to find destination");
            return;
        }


        const url =
            `https://api.mapbox.com/directions/v5/mapbox/driving/` +
            `${startAdd[0]},${startAdd[1]};` +
            `${finalAdd[0]},${finalAdd[1]}` +
            `?geometries=geojson` +
            `&overview=full` +
            `&access_token=${MAPBOX_TOKEN}` +
            `&alternatives=true`;


        try {

            const response = await fetch(url);
            const data = await response.json();

            console.log(data);


            if (data.code === "NoRoute") {

                alert("Unable to find a Route");
                return;
            }


            setIsLoading(true);


            const routesWithWeather =
                await Promise.all(

                    data.routes.map(
                        async (route, routeIndex) => {

                            const points =
                                await getWeatherPoints(
                                    route,
                                    inputInterval
                                );


                            const pointsWithNames =
                                await Promise.all(

                                    points.map(
                                        async point => {

                                            const weatherIndex =
                                                getWeatherIndex(point);


                                            return {

                                                ...point,

                                                cityState:
                                                    await reverseGeocode(
                                                        point.lng,
                                                        point.lat
                                                    ),

                                                weather:
                                                    getWeatherText(
                                                        point,
                                                        weatherIndex
                                                    ),

                                                icon:
                                                    getWeatherIcon(
                                                        point,
                                                        weatherIndex
                                                    ),

                                                time:
                                                    calculateCurrentTime(
                                                        point.secondsFromStart
                                                    ),

                                                severity:
                                                    getWeatherSeverity(
                                                        point,
                                                        weatherIndex
                                                    )
                                            };
                                        }
                                    )
                                );


                            return {

                                ...route,

                                routeNumber:
                                    routeIndex + 1,

                                forecastEntries:
                                    pointsWithNames
                            };
                        }
                    )
                );


            setRoutes(routesWithWeather);

        } catch (error) {

            console.error(
                "Unable to retrieve route:",
                error
            );

            alert("Unable to retrieve route.");

        } finally {

            setIsLoaded(true);
            setIsLoading(false);
        }
    }


    // ============================================================
    // WEATHER
    // ============================================================

    function getWeatherText(data, index) {

        return weatherCodes[
            data.weatherData.hourly.weather_code[index]
        ].text;
    }


    function getWeatherIcon(data, index) {

        if (data.weatherData.hourly.is_day[index]) {

            return weatherCodes[
                data.weatherData.hourly.weather_code[index]
            ].dayIcon;
        }

        return weatherCodes[
            data.weatherData.hourly.weather_code[index]
        ].nightIcon;
    }


    function getWeatherIndex(point) {

        const departureDateTime =
            new Date(
                `${selectedDate}T${departureTime}:00`
            );


        const arrivalTimestamp =
            departureDateTime.getTime() +
            point.secondsFromStart * 1000;


        const offsetSeconds =
            point.weatherData.utc_offset_seconds;


        const localTimestamp =
            arrivalTimestamp +
            offsetSeconds * 1000;


        const localDate =
            new Date(localTimestamp);


        const year =
            localDate.getUTCFullYear();


        const month =
            String(
                localDate.getUTCMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                localDate.getUTCDate()
            ).padStart(2, "0");


        const hour =
            String(
                localDate.getUTCHours()
            ).padStart(2, "0");


        const targetHour =
            `${year}-${month}-${day}T${hour}:00`;


        const index =
            point.weatherData.hourly.time.findIndex(
                time => time === targetHour
            );


        return index;
    }


    function getWeatherSeverity(data, index) {

        return weatherCodes[
            data.weatherData.hourly.weather_code[index]
        ].severity;
    }


    async function getWeatherPoints(
        route,
        intervalMinutes = 60
    ) {

        const coords =
            route.geometry.coordinates;

        const durationSeconds =
            route.duration;

        const intervalSeconds =
            intervalMinutes * 60;


        const numPoints =
            Math.ceil(
                durationSeconds /
                intervalSeconds
            ) + 1;


        const weatherPoints = [];


        for (let i = 0; i < numPoints; i++) {

            const secondsFromStart =
                i * intervalSeconds;


            const fraction =
                Math.min(
                    secondsFromStart /
                    durationSeconds,
                    1
                );


            const index =
                Math.floor(
                    fraction *
                    (coords.length - 1)
                );


            const [lng, lat] =
                coords[index];


            const weatherData =
                await fetchWeather(
                    lng,
                    lat
                );


            weatherPoints.push({

                lat,
                lng,
                secondsFromStart,
                weatherData
            });
        }


        return weatherPoints;
    }


    async function fetchWeather(lng, lat) {

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lng}` +
            `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day` +
            `&timezone=auto`;


        const response =
            await fetch(url);

        const data =
            await response.json();


        return data;
    }


    // ============================================================
    // REVERSE GEOCODE
    // ============================================================

    async function reverseGeocode(lng, lat) {

        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${lng},${lat}.json` +
            `?types=place,region` +
            `&access_token=${MAPBOX_TOKEN}`;


        const response =
            await fetch(url);

        const data =
            await response.json();


        const city =
            data.features.find(
                f =>
                    f.place_type.includes("place")
            );


        const state =
            data.features.find(
                f =>
                    f.place_type.includes("region")
            );


        return `${
            city?.text || "Unknown city"
        }, ${
            state?.text || "Unknown state"
        }`;
    }


    // ============================================================
    // FINAL ADDRESS VALIDATION
    // ============================================================

    async function geocode(address) {

        const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${encodeURIComponent(address)}.json` +
            `?access_token=${MAPBOX_TOKEN}` +
            `&autocomplete=false` +
            `&country=us` +
            `&limit=1`;


        try {

            const response =
                await fetch(url);


            if (!response.ok) {

                console.error(
                    "Geocoding request failed:",
                    response.status,
                    response.statusText
                );

                return "NoAddress";
            }


            const data =
                await response.json();


            if (
                !data.features ||
                data.features.length === 0
            ) {

                return "NoAddress";
            }


            return data.features[0].center;

        } catch (error) {

            console.error(
                "Geocoding error:",
                error
            );

            return "NoAddress";
        }
    }


    // ============================================================
    // RESET
    // ============================================================

    function resetFields() {

        setStartLocation("");
        setFinalLocation("");

        setStartSuggestions([]);
        setFinalSuggestions([]);

        setSelectedStart(null);
        setSelectedFinal(null);

        setStartActiveIndex(-1);
        setFinalActiveIndex(-1);

        setSelectedDate(
            getTodayValue()
        );

        setDepartureTime(
            getCurrentTimeValue()
        );

        setInterval(30);

        setRoutes([]);
    }


    // ============================================================
    // DISPLAY TIME
    // ============================================================

    function calculateCurrentTime(
        secondsFromStart
    ) {

        const [
            startHour,
            startMinute
        ] =
            departureTime
                .split(":")
                .map(Number);


        const travelMinutes =
            Math.floor(
                secondsFromStart / 60
            );


        let totalStartMinutes =
            startHour * 60 +
            startMinute;


        let arrivalMinutes =
            totalStartMinutes +
            travelMinutes;


        arrivalMinutes =
            arrivalMinutes %
            (24 * 60);


        let arrivalHour =
            Math.floor(
                arrivalMinutes / 60
            );


        const arrivalMinute =
            arrivalMinutes % 60;


        const displayAmPm =
            arrivalHour >= 12
                ? "PM"
                : "AM";


        arrivalHour =
            arrivalHour % 12;


        if (arrivalHour === 0) {

            arrivalHour = 12;
        }


        return `${
            arrivalHour
        }:${
            String(
                arrivalMinute
            ).padStart(2, "0")
        } ${displayAmPm}`;
    }


    // ============================================================
    // JSX
    // ============================================================

    return (

        <div>

            <div className="route-radar-header">

                <div className="route-radar-icon-wrap">

                    <img
                        src={`${import.meta.env.BASE_URL}header_icon.png`}
                        alt="header_icon"
                        className="route-radar-icon"
                    />

                </div>


                <div className="route-radar-text">

                    <h1>
                        Route Radar
                    </h1>

                    <h2>
                        Know Your Route Before You Go.
                    </h2>

                </div>

            </div>


            <div className="forecast-form-card">


                {/* ONE FORM NOW HANDLES ENTER / SUBMIT */}

                <Form
                    className="route-form"
                    onSubmit={getRoute}
                >

                    <div className="address-row">


                        {/* STARTING ADDRESS */}

                        <Form.Group className="route-field">

                            <Form.Label htmlFor="startLocation">
                                Starting Address
                            </Form.Label>


                            <div className="autocomplete-container">

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
                                        autoComplete="off"

                                        role="combobox"

                                        aria-expanded={
                                            startSuggestions.length > 0
                                        }

                                        aria-controls="start-suggestions"

                                        aria-activedescendant={
                                            startActiveIndex >= 0
                                                ? `start-suggestion-${startActiveIndex}`
                                                : undefined
                                        }

                                        onChange={(e) => {

                                            setStartLocation(
                                                e.target.value
                                            );

                                            setSelectedStart(null);
                                            setStartActiveIndex(-1);
                                        }}

                                        onKeyDown={
                                            handleStartKeyDown
                                        }
                                    />


                                    <button
                                        type="button"
                                        className="route-clear-button"
                                        aria-label="Clear starting address"

                                        tabIndex={-1}

                                        onClick={() => {

                                            setStartLocation("");

                                            setStartSuggestions([]);

                                            setSelectedStart(null);

                                            setStartActiveIndex(-1);
                                        }}
                                    >
                                        ×
                                    </button>

                                </div>


                                {startSuggestions.length > 0 && (

                                    <div
                                        id="start-suggestions"
                                        className="address-suggestions"
                                        role="listbox"
                                    >

                                        {startSuggestions.map(
                                            (suggestion, index) => (

                                                <button
                                                    id={`start-suggestion-${index}`}
                                                    key={suggestion.id}
                                                    type="button"
                                                    role="option"

                                                    tabIndex={-1}

                                                    aria-selected={
                                                        index === startActiveIndex
                                                    }

                                                    className={
                                                        `address-suggestion ${
                                                            index === startActiveIndex
                                                                ? "active"
                                                                : ""
                                                        }`
                                                    }

                                                    onMouseEnter={() =>
                                                        setStartActiveIndex(
                                                            index
                                                        )
                                                    }

                                                    onClick={() =>
                                                        selectStartSuggestion(
                                                            suggestion
                                                        )
                                                    }
                                                >

                                                    <span
                                                        className="suggestion-icon"
                                                        aria-hidden="true"
                                                    >
                                                        📍
                                                    </span>


                                                    <span className="suggestion-text">
                                                        {suggestion.place_name}
                                                    </span>

                                                </button>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>

                        </Form.Group>


                        {/* DESTINATION */}

                        <Form.Group className="route-field">

                            <Form.Label htmlFor="finalLocation">
                                Destination
                            </Form.Label>


                            <div className="autocomplete-container">

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
                                        autoComplete="off"

                                        role="combobox"

                                        aria-expanded={
                                            finalSuggestions.length > 0
                                        }

                                        aria-controls="final-suggestions"

                                        aria-activedescendant={
                                            finalActiveIndex >= 0
                                                ? `final-suggestion-${finalActiveIndex}`
                                                : undefined
                                        }

                                        onChange={(e) => {

                                            setFinalLocation(
                                                e.target.value
                                            );

                                            setSelectedFinal(null);
                                            setFinalActiveIndex(-1);
                                        }}

                                        onKeyDown={
                                            handleFinalKeyDown
                                        }
                                    />


                                    <button
                                        type="button"
                                        className="route-clear-button"
                                        aria-label="Clear destination"

                                        tabIndex={-1}

                                        onClick={() => {

                                            setFinalLocation("");

                                            setFinalSuggestions([]);

                                            setSelectedFinal(null);

                                            setFinalActiveIndex(-1);
                                        }}
                                    >
                                        ×
                                    </button>

                                </div>


                                {finalSuggestions.length > 0 && (

                                    <div
                                        id="final-suggestions"
                                        className="address-suggestions"
                                        role="listbox"
                                    >

                                        {finalSuggestions.map(
                                            (suggestion, index) => (

                                                <button
                                                    id={`final-suggestion-${index}`}
                                                    key={suggestion.id}
                                                    type="button"
                                                    role="option"

                                                    tabIndex={-1}

                                                    aria-selected={
                                                        index === finalActiveIndex
                                                    }

                                                    className={
                                                        `address-suggestion ${
                                                            index === finalActiveIndex
                                                                ? "active"
                                                                : ""
                                                        }`
                                                    }

                                                    onMouseEnter={() =>
                                                        setFinalActiveIndex(
                                                            index
                                                        )
                                                    }

                                                    onClick={() =>
                                                        selectFinalSuggestion(
                                                            suggestion
                                                        )
                                                    }
                                                >

                                                    <span
                                                        className="suggestion-icon"
                                                        aria-hidden="true"
                                                    >
                                                        📍
                                                    </span>


                                                    <span className="suggestion-text">
                                                        {suggestion.place_name}
                                                    </span>

                                                </button>
                                            )
                                        )}

                                    </div>
                                )}

                            </div>

                        </Form.Group>

                    </div>


                    {/* TRIP TIMING */}

                    <div className="time-section">

                        <div className="time-section-header">

                            <span className="time-icon">
                                ◷
                            </span>

                            <span>
                                Trip Timing
                            </span>

                        </div>


                        <ForecastDaySelector
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                        />


                        <div className="time-picker-row">


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

                                    onChange={(e) =>
                                        setDepartureTime(
                                            e.target.value
                                        )
                                    }

                                    onPointerDown={(e) => {

                                        if (
                                            e.currentTarget.showPicker
                                        ) {

                                            e.currentTarget.showPicker();
                                        }
                                    }}
                                />

                            </div>


                            <div className="interval-group">

                                <span className="interval-label">
                                    Forecast Every
                                </span>


                                <div className="interval-chips">

                                    {[15, 30, 45, 60].map(
                                        minutes => (

                                            <button
                                                key={minutes}
                                                type="button"

                                                className={`interval-chip ${
                                                    inputInterval === minutes
                                                        ? "active"
                                                        : ""
                                                }`}

                                                onClick={() =>
                                                    setInterval(minutes)
                                                }
                                            >

                                                {minutes === 60
                                                    ? "1 hour"
                                                    : `${minutes} min`
                                                }

                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="action-buttons">


                            {/* SUBMIT BUTTON */}

                            <button
                                type="submit"
                                className="action-button primary"
                            >

                                <span>
                                    ➤
                                </span>

                                Let's Go!

                            </button>


                            <button
                                type="button"
                                className="action-button secondary"
                                onClick={resetFields}
                            >

                                <span>
                                    ↻
                                </span>

                                Reset

                            </button>

                        </div>


                        <div className="routes-scroll">

                            {!isLoading ? (

                                routes.map(
                                    (route, index) => (

                                        <RouteCard
                                            key={index}
                                            routeNumber={index + 1}
                                            forecastEntries={
                                                route.forecastEntries
                                            }
                                        />

                                    )
                                )

                            ) : (

                                <p className="loading-text">
                                    Loading Forecast ...
                                </p>
                            )}

                        </div>

                    </div>

                </Form>

            </div>

        </div>
    );
}