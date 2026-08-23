import { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

import "./ForecastLane.css";

import weatherCodes from "../data/WeatherCodes";
import RouteCard from "./RouteCard";
import RouteMap from "./RouteMap";
import ForecastDaySelector from "./ForecastDaySelector";


export default function ForecastLane() {

    const MAPBOX_TOKEN =
        import.meta.env.VITE_MAPBOX_TOKEN;


    // ============================================================
    // MAIN STATE
    // ============================================================

    const [routes, setRoutes] =
        useState([]);

    const [inputInterval, setInterval] =
        useState(30);

    const [isLoading, setIsLoading] =
        useState(false);


    // ============================================================
    // DATE / TIME HELPERS
    // ============================================================

    const getTodayValue = () => {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    const getCurrentTimeValue = () => {

        const current =
            new Date();

        /*
            Always round UP to the next
            5-minute interval.

            3:57 -> 4:00
            4:01 -> 4:05
            4:05 -> 4:10
        */

        current.setSeconds(0);
        current.setMilliseconds(0);

        const minutes =
            current.getMinutes();

        const minutesToAdd =
            5 - (minutes % 5);

        current.setMinutes(
            minutes + minutesToAdd
        );

        const hour =
            String(
                current.getHours()
            ).padStart(2, "0");

        const minute =
            String(
                current.getMinutes()
            ).padStart(2, "0");

        return `${hour}:${minute}`;
    };


    const [
        selectedDate,
        setSelectedDate
    ] =
        useState(
            getTodayValue()
        );


    // ============================================================
    // COMPARISON MODE
    // ============================================================

    const [
        comparisonMode,
        setComparisonMode
    ] =
        useState("times");


    const [
        routeCount,
        setRouteCount
    ] =
        useState(2);


    // ============================================================
    // DEPARTURE TIMES
    // ============================================================

    const [
        departureTimes,
        setDepartureTimes
    ] =
        useState([
            getCurrentTimeValue()
        ]);


    const MAX_DEPARTURE_TIMES =
        4;


    function updateDepartureTime(
        index,
        newTime
    ) {

        setDepartureTimes(
            prev =>
                prev.map(
                    (
                        time,
                        i
                    ) =>
                        i === index
                            ? newTime
                            : time
                )
        );
    }


    function addDepartureTime() {

        if (
            departureTimes.length >=
            MAX_DEPARTURE_TIMES
        ) {
            return;
        }


        const lastTime =
            departureTimes[
                departureTimes.length - 1
            ];


        const [
            hour,
            minute
        ] =
            lastTime
                .split(":")
                .map(Number);


        const date =
            new Date();

        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(0);

        date.setHours(
            date.getHours() + 1
        );


        const nextHour =
            String(
                date.getHours()
            ).padStart(2, "0");


        const nextMinute =
            String(
                date.getMinutes()
            ).padStart(2, "0");


        setDepartureTimes(
            prev => [
                ...prev,
                `${nextHour}:${nextMinute}`
            ]
        );
    }


    function removeDepartureTime(
        index
    ) {

        if (
            departureTimes.length === 1
        ) {
            return;
        }


        setDepartureTimes(
            prev =>
                prev.filter(
                    (
                        _,
                        i
                    ) =>
                        i !== index
                )
        );
    }


    // ============================================================
    // START / END
    // ============================================================

    const [
        startLocation,
        setStartLocation
    ] =
        useState("");


    const [
        finalLocation,
        setFinalLocation
    ] =
        useState("");


    const [
        selectedStart,
        setSelectedStart
    ] =
        useState(null);


    const [
        selectedFinal,
        setSelectedFinal
    ] =
        useState(null);


    const [
        startSuggestions,
        setStartSuggestions
    ] =
        useState([]);


    const [
        finalSuggestions,
        setFinalSuggestions
    ] =
        useState([]);


    const [
        startActiveIndex,
        setStartActiveIndex
    ] =
        useState(-1);


    const [
        finalActiveIndex,
        setFinalActiveIndex
    ] =
        useState(-1);


    // ============================================================
    // STOPS
    // ============================================================

    const MAX_STOPS =
        3;


    const [
        stops,
        setStops
    ] =
        useState([]);


    const stopTimersRef =
        useRef({});


    function createStop(
        location = "",
        selected = null
    ) {

        return {

            id:
                `${Date.now()}-${Math.random()}`,

            location,

            selected,

            suggestions:
                [],

            activeIndex:
                -1
        };
    }


    function addStop() {

        if (
            stops.length >=
            MAX_STOPS
        ) {
            return;
        }


        setStops(
            prev => [
                ...prev,
                createStop()
            ]
        );
    }


    function removeStop(
        id
    ) {

        if (
            stopTimersRef.current[id]
        ) {

            clearTimeout(
                stopTimersRef.current[id]
            );

            delete stopTimersRef.current[id];
        }


        setStops(
            prev =>
                prev.filter(
                    stop =>
                        stop.id !== id
                )
        );
    }


    function updateStopState(
        id,
        updates
    ) {

        setStops(
            prev =>
                prev.map(
                    stop =>
                        stop.id === id
                            ? {
                                ...stop,
                                ...updates
                            }
                            : stop
                )
        );
    }


    // ============================================================
    // DRAG / DROP ROUTE ORDER
    // ============================================================

    const [
        draggedWaypointIndex,
        setDraggedWaypointIndex
    ] =
        useState(null);


    const [
        dragOverWaypointIndex,
        setDragOverWaypointIndex
    ] =
        useState(null);


    /*
        Build one visual ordered list from the
        separate start / stops / destination state.

        First item = Start
        Last item = End
        Anything between = Stops
    */

    function getWaypointItems() {

        return [

            {
                key:
                    "start",

                location:
                    startLocation,

                selected:
                    selectedStart
            },

            ...stops.map(
                stop => ({

                    key:
                        stop.id,

                    location:
                        stop.location,

                    selected:
                        stop.selected
                })
            ),

            {
                key:
                    "end",

                location:
                    finalLocation,

                selected:
                    selectedFinal
            }
        ];
    }


    function handleWaypointDragStart(
        event,
        index
    ) {

        setDraggedWaypointIndex(
            index
        );

        event.dataTransfer.effectAllowed =
            "move";


        /*
            Edge / Chrome behave more reliably
            when some drag data is supplied.
        */

        event.dataTransfer.setData(
            "text/plain",
            String(index)
        );
    }


    function handleWaypointDragOver(
        event,
        index
    ) {

        event.preventDefault();

        event.dataTransfer.dropEffect =
            "move";

        setDragOverWaypointIndex(
            index
        );
    }


    function handleWaypointDrop(
        event,
        dropIndex
    ) {

        event.preventDefault();


        if (
            draggedWaypointIndex === null ||
            draggedWaypointIndex === dropIndex
        ) {

            setDraggedWaypointIndex(
                null
            );

            setDragOverWaypointIndex(
                null
            );

            return;
        }


        const ordered =
            getWaypointItems();


        const [
            moved
        ] =
            ordered.splice(
                draggedWaypointIndex,
                1
            );


        ordered.splice(
            dropIndex,
            0,
            moved
        );


        /*
            Position defines the role.

            ordered[0]             -> START
            ordered[last]          -> END
            everything in between  -> STOPS
        */

        const newStart =
            ordered[0];


        const newEnd =
            ordered[
                ordered.length - 1
            ];


        const newStops =
            ordered
                .slice(
                    1,
                    -1
                )
                .map(
                    waypoint =>
                        createStop(
                            waypoint.location,
                            waypoint.selected
                        )
                );


        setStartLocation(
            newStart.location
        );

        setSelectedStart(
            newStart.selected
        );


        setFinalLocation(
            newEnd.location
        );

        setSelectedFinal(
            newEnd.selected
        );


        setStops(
            newStops
        );


        /*
            Close any stale dropdowns after
            changing the route order.
        */

        setStartSuggestions([]);
        setFinalSuggestions([]);

        setStartActiveIndex(-1);
        setFinalActiveIndex(-1);


        setDraggedWaypointIndex(
            null
        );

        setDragOverWaypointIndex(
            null
        );
    }


    function handleWaypointDragEnd() {

        setDraggedWaypointIndex(
            null
        );

        setDragOverWaypointIndex(
            null
        );
    }


    // ============================================================
    // MAPBOX AUTOCOMPLETE
    // ============================================================

    async function getAddressSuggestions(
        query
    ) {

        if (
            query.trim().length < 3
        ) {

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

            const response =
                await fetch(url);


            if (
                !response.ok
            ) {

                console.error(
                    "Autocomplete request failed:",
                    response.status,
                    response.statusText
                );

                return [];
            }


            const data =
                await response.json();


            return (
                data.features ||
                []
            );

        } catch (error) {

            console.error(
                "Autocomplete request failed:",
                error
            );

            return [];
        }
    }


    // ============================================================
    // START AUTOCOMPLETE
    // ============================================================

    useEffect(
        () => {

            if (
                selectedStart
            ) {
                return;
            }


            if (
                startLocation.trim().length < 3
            ) {

                setStartSuggestions([]);
                setStartActiveIndex(-1);

                return;
            }


            const timer =
                setTimeout(
                    async () => {

                        const suggestions =
                            await getAddressSuggestions(
                                startLocation
                            );

                        setStartSuggestions(
                            suggestions
                        );

                        setStartActiveIndex(
                            -1
                        );
                    },
                    300
                );


            return () =>
                clearTimeout(timer);

        },
        [
            startLocation,
            selectedStart
        ]
    );


    // ============================================================
    // END AUTOCOMPLETE
    // ============================================================

    useEffect(
        () => {

            if (
                selectedFinal
            ) {
                return;
            }


            if (
                finalLocation.trim().length < 3
            ) {

                setFinalSuggestions([]);
                setFinalActiveIndex(-1);

                return;
            }


            const timer =
                setTimeout(
                    async () => {

                        const suggestions =
                            await getAddressSuggestions(
                                finalLocation
                            );

                        setFinalSuggestions(
                            suggestions
                        );

                        setFinalActiveIndex(
                            -1
                        );
                    },
                    300
                );


            return () =>
                clearTimeout(timer);

        },
        [
            finalLocation,
            selectedFinal
        ]
    );


    // ============================================================
    // STOP AUTOCOMPLETE
    // ============================================================

    function handleStopChange(
        id,
        value
    ) {

        updateStopState(
            id,
            {

                location:
                    value,

                selected:
                    null,

                activeIndex:
                    -1
            }
        );


        if (
            stopTimersRef.current[id]
        ) {

            clearTimeout(
                stopTimersRef.current[id]
            );
        }


        if (
            value.trim().length < 3
        ) {

            updateStopState(
                id,
                {
                    suggestions:
                        []
                }
            );

            return;
        }


        stopTimersRef.current[id] =
            setTimeout(
                async () => {

                    const suggestions =
                        await getAddressSuggestions(
                            value
                        );


                    updateStopState(
                        id,
                        {
                            suggestions
                        }
                    );
                },
                300
            );
    }


    useEffect(
        () => {

            return () => {

                Object
                    .values(
                        stopTimersRef.current
                    )
                    .forEach(
                        timer =>
                            clearTimeout(
                                timer
                            )
                    );
            };

        },
        []
    );


    // ============================================================
    // SELECT AUTOCOMPLETE
    // ============================================================

    function selectStartSuggestion(
        suggestion
    ) {

        setStartLocation(
            suggestion.place_name
        );

        setSelectedStart(
            suggestion
        );

        setStartSuggestions([]);
        setStartActiveIndex(-1);
    }


    function selectFinalSuggestion(
        suggestion
    ) {

        setFinalLocation(
            suggestion.place_name
        );

        setSelectedFinal(
            suggestion
        );

        setFinalSuggestions([]);
        setFinalActiveIndex(-1);
    }


    function selectStopSuggestion(
        id,
        suggestion
    ) {

        updateStopState(
            id,
            {

                location:
                    suggestion.place_name,

                selected:
                    suggestion,

                suggestions:
                    [],

                activeIndex:
                    -1
            }
        );
    }


    // ============================================================
    // KEYBOARD AUTOCOMPLETE
    // ============================================================

    function handleStartKeyDown(
        event
    ) {

        if (
            event.key === "ArrowDown" &&
            startSuggestions.length > 0
        ) {

            event.preventDefault();

            setStartActiveIndex(
                prev =>
                    prev <
                    startSuggestions.length - 1
                        ? prev + 1
                        : 0
            );

            return;
        }


        if (
            event.key === "ArrowUp" &&
            startSuggestions.length > 0
        ) {

            event.preventDefault();

            setStartActiveIndex(
                prev =>
                    prev > 0
                        ? prev - 1
                        : startSuggestions.length - 1
            );

            return;
        }


        if (
            event.key === "Enter" &&
            startActiveIndex >= 0
        ) {

            event.preventDefault();

            selectStartSuggestion(
                startSuggestions[
                    startActiveIndex
                ]
            );

            return;
        }


        if (
            event.key === "Tab" &&
            startActiveIndex >= 0
        ) {

            selectStartSuggestion(
                startSuggestions[
                    startActiveIndex
                ]
            );
        }


        if (
            event.key === "Escape"
        ) {

            setStartSuggestions([]);
            setStartActiveIndex(-1);
        }
    }


    function handleFinalKeyDown(
        event
    ) {

        if (
            event.key === "ArrowDown" &&
            finalSuggestions.length > 0
        ) {

            event.preventDefault();

            setFinalActiveIndex(
                prev =>
                    prev <
                    finalSuggestions.length - 1
                        ? prev + 1
                        : 0
            );

            return;
        }


        if (
            event.key === "ArrowUp" &&
            finalSuggestions.length > 0
        ) {

            event.preventDefault();

            setFinalActiveIndex(
                prev =>
                    prev > 0
                        ? prev - 1
                        : finalSuggestions.length - 1
            );

            return;
        }


        if (
            event.key === "Enter" &&
            finalActiveIndex >= 0
        ) {

            event.preventDefault();

            selectFinalSuggestion(
                finalSuggestions[
                    finalActiveIndex
                ]
            );

            return;
        }


        if (
            event.key === "Tab" &&
            finalActiveIndex >= 0
        ) {

            selectFinalSuggestion(
                finalSuggestions[
                    finalActiveIndex
                ]
            );
        }


        if (
            event.key === "Escape"
        ) {

            setFinalSuggestions([]);
            setFinalActiveIndex(-1);
        }
    }


    function handleStopKeyDown(
        event,
        stop
    ) {

        const suggestions =
            stop.suggestions;


        if (
            event.key === "ArrowDown" &&
            suggestions.length > 0
        ) {

            event.preventDefault();

            updateStopState(
                stop.id,
                {

                    activeIndex:
                        stop.activeIndex <
                        suggestions.length - 1
                            ? stop.activeIndex + 1
                            : 0
                }
            );

            return;
        }


        if (
            event.key === "ArrowUp" &&
            suggestions.length > 0
        ) {

            event.preventDefault();

            updateStopState(
                stop.id,
                {

                    activeIndex:
                        stop.activeIndex > 0
                            ? stop.activeIndex - 1
                            : suggestions.length - 1
                }
            );

            return;
        }


        if (
            event.key === "Enter" &&
            stop.activeIndex >= 0
        ) {

            event.preventDefault();

            selectStopSuggestion(
                stop.id,
                suggestions[
                    stop.activeIndex
                ]
            );

            return;
        }


        if (
            event.key === "Tab" &&
            stop.activeIndex >= 0
        ) {

            selectStopSuggestion(
                stop.id,
                suggestions[
                    stop.activeIndex
                ]
            );
        }


        if (
            event.key === "Escape"
        ) {

            updateStopState(
                stop.id,
                {

                    suggestions:
                        [],

                    activeIndex:
                        -1
                }
            );
        }
    }


    // ============================================================
    // FRIENDLY TIMEZONES
    // ============================================================

    function getFriendlyTimeZone(
        timeZone
    ) {

        if (
            !timeZone
        ) {
            return "";
        }


        const easternZones = [
            "America/New_York",
            "America/Detroit",
            "America/Indiana/Indianapolis",
            "America/Indiana/Marengo",
            "America/Indiana/Vevay",
            "America/Indiana/Vincennes",
            "America/Indiana/Winamac",
            "America/Kentucky/Louisville",
            "America/Kentucky/Monticello"
        ];


        const centralZones = [
            "America/Chicago",
            "America/Indiana/Knox",
            "America/Indiana/Tell_City",
            "America/Menominee",
            "America/North_Dakota/Center",
            "America/North_Dakota/New_Salem",
            "America/North_Dakota/Beulah"
        ];


        const mountainZones = [
            "America/Denver",
            "America/Boise",
            "America/Phoenix"
        ];


        const pacificZones = [
            "America/Los_Angeles"
        ];


        if (
            easternZones.includes(
                timeZone
            )
        ) {
            return "ET";
        }


        if (
            centralZones.includes(
                timeZone
            )
        ) {
            return "CT";
        }


        if (
            mountainZones.includes(
                timeZone
            )
        ) {
            return "MT";
        }


        if (
            pacificZones.includes(
                timeZone
            )
        ) {
            return "PT";
        }


        if (
            [
                "America/Anchorage",
                "America/Juneau",
                "America/Sitka",
                "America/Nome"
            ].includes(timeZone)
        ) {
            return "AKT";
        }


        if (
            timeZone ===
            "Pacific/Honolulu"
        ) {
            return "HT";
        }


        return "";
    }


    // ============================================================
    // DEPARTURE TIME VALIDATION
    // ============================================================

    function departureTimesAreValid() {

        const now =
            new Date();


        const timesToValidate =
            comparisonMode === "times"
                ? departureTimes
                : [
                    departureTimes[0]
                ];


        for (
            const departureTime
            of timesToValidate
        ) {

            const selectedDT =
                new Date(
                    `${selectedDate}T${departureTime}:00`
                );


            if (
                selectedDT < now
            ) {

                alert(
                    "Departure times can't be in the past."
                );

                return false;
            }
        }


        return true;
    }


    // ============================================================
    // TIMEZONE CALCULATIONS
    // ============================================================

    function getDepartureUtc(
        departureTime,
        originTimeZone
    ) {

        return fromZonedTime(
            `${selectedDate}T${departureTime}:00`,
            originTimeZone
        );
    }


    function getArrivalUtc(
        secondsFromStart,
        departureTime,
        originTimeZone
    ) {

        const departureUtc =
            getDepartureUtc(
                departureTime,
                originTimeZone
            );


        return new Date(
            departureUtc.getTime() +
            secondsFromStart * 1000
        );
    }


    function calculateCurrentTime(
        point,
        comparisonTime,
        originTimeZone
    ) {

        const arrivalUtc =
            getArrivalUtc(
                point.secondsFromStart,
                comparisonTime,
                originTimeZone
            );


        const pointTimeZone =
            point.weatherData.timezone;


        const localTime =
            formatInTimeZone(
                arrivalUtc,
                pointTimeZone,
                "h:mm a"
            );


        const friendlyTimeZone =
            getFriendlyTimeZone(
                pointTimeZone
            );


        return friendlyTimeZone
            ? `${localTime} ${friendlyTimeZone}`
            : localTime;
    }


    function getWeatherIndex(
        point,
        comparisonTime,
        originTimeZone
    ) {

        const arrivalUtc =
            getArrivalUtc(
                point.secondsFromStart,
                comparisonTime,
                originTimeZone
            );


        const targetHour =
            formatInTimeZone(
                arrivalUtc,
                point.weatherData.timezone,
                "yyyy-MM-dd'T'HH:00"
            );


        return point
            .weatherData
            .hourly
            .time
            .findIndex(
                time =>
                    time === targetHour
            );
    }


    // ============================================================
    // GET ROUTE
    // ============================================================

    async function getRoute(
        event
    ) {

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


        const emptyStop =
            stops.find(
                stop =>
                    stop.location.trim() === ""
            );


        if (
            emptyStop
        ) {

            alert(
                "Please enter an address for every stop or remove the empty stop."
            );

            return;
        }


        if (
            !departureTimesAreValid()
        ) {
            return;
        }


        setIsLoading(
            true
        );

        setRoutes(
            []
        );


        try {

            // ====================================================
            // START COORDINATE
            // ====================================================

            const startAdd =
                selectedStart?.center
                    ? selectedStart.center
                    : await geocode(
                        startLocation
                    );


            if (
                startAdd === "NoAddress"
            ) {

                alert(
                    "Unable to find starting address"
                );

                return;
            }


            // ====================================================
            // STOP COORDINATES
            // ====================================================

            const stopCoordinates =
                [];


            for (
                let i = 0;
                i < stops.length;
                i++
            ) {

                const stop =
                    stops[i];


                const coordinates =
                    stop.selected?.center
                        ? stop.selected.center
                        : await geocode(
                            stop.location
                        );


                if (
                    coordinates === "NoAddress"
                ) {

                    alert(
                        `Unable to find Stop ${i + 1}`
                    );

                    return;
                }


                stopCoordinates.push(
                    coordinates
                );
            }


            // ====================================================
            // DESTINATION COORDINATE
            // ====================================================

            const finalAdd =
                selectedFinal?.center
                    ? selectedFinal.center
                    : await geocode(
                        finalLocation
                    );


            if (
                finalAdd === "NoAddress"
            ) {

                alert(
                    "Unable to find destination"
                );

                return;
            }


            // ====================================================
            // ROUTE COORDINATES
            // ====================================================

            const routeCoordinates =
                [
                    startAdd,
                    ...stopCoordinates,
                    finalAdd
                ];


            const coordinateString =
                routeCoordinates
                    .map(
                        (
                            [
                                lng,
                                lat
                            ]
                        ) =>
                            `${lng},${lat}`
                    )
                    .join(";");


            // ====================================================
            // MAPBOX DIRECTIONS
            // ====================================================

            let directionsUrl =
                `https://api.mapbox.com/directions/v5/mapbox/driving/` +
                `${coordinateString}` +
                `?geometries=geojson` +
                `&overview=full` +
                `&access_token=${MAPBOX_TOKEN}`;


            if (
                comparisonMode === "routes" &&
                routeCount > 1
            ) {

                directionsUrl +=
                    `&alternatives=true`;
            }


            const response =
                await fetch(
                    directionsUrl
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                data.code === "NoRoute" ||
                !data.routes?.length
            ) {

                alert(
                    "Unable to find a route"
                );

                return;
            }


            // ====================================================
            // COMPARE DEPARTURE TIMES
            // ====================================================

            if (
                comparisonMode === "times"
            ) {

                const route =
                    data.routes[0];


                const basePoints =
                    await getWeatherPoints(
                        route,
                        inputInterval
                    );


                const originTimeZone =
                    basePoints[0]
                        ?.weatherData
                        ?.timezone;


                if (
                    !originTimeZone
                ) {

                    throw new Error(
                        "Unable to determine starting timezone."
                    );
                }


                const basePointsWithNames =
                    await Promise.all(

                        basePoints.map(
                            async point => ({

                                ...point,

                                cityState:
                                    await reverseGeocode(
                                        point.lng,
                                        point.lat
                                    )
                            })
                        )
                    );


                const timeComparisons =
                    departureTimes.map(
                        departureTime => {

                            const forecastEntries =
                                basePointsWithNames.map(
                                    point => {

                                        const weatherIndex =
                                            getWeatherIndex(
                                                point,
                                                departureTime,
                                                originTimeZone
                                            );


                                        return {

                                            ...point,

                                            timezone:
                                                point
                                                    .weatherData
                                                    .timezone,

                                            timezoneAbbreviation:
                                                getFriendlyTimeZone(
                                                    point
                                                        .weatherData
                                                        .timezone
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
                                                    point,
                                                    departureTime,
                                                    originTimeZone
                                                ),

                                            severity:
                                                getWeatherSeverity(
                                                    point,
                                                    weatherIndex
                                                )
                                        };
                                    }
                                );


                            return {

                                comparisonType:
                                    "time",

                                departureTime,

                                originTimeZone,

                                geometry:
                                    route.geometry,

                                distance:
                                    route.distance,

                                duration:
                                    route.duration,

                                waypoints:
                                    routeCoordinates,

                                forecastEntries
                            };
                        }
                    );


                setRoutes(
                    timeComparisons
                );
            }


            // ====================================================
            // COMPARE ALTERNATIVE ROUTES
            // ====================================================

            else {

                const departureTime =
                    departureTimes[0];


                const routesToCompare =
                    data.routes.slice(
                        0,
                        routeCount
                    );


                const routeComparisons =
                    await Promise.all(

                        routesToCompare.map(
                            async (
                                route,
                                routeIndex
                            ) => {

                                const points =
                                    await getWeatherPoints(
                                        route,
                                        inputInterval
                                    );


                                const originTimeZone =
                                    points[0]
                                        ?.weatherData
                                        ?.timezone;


                                if (
                                    !originTimeZone
                                ) {

                                    throw new Error(
                                        "Unable to determine starting timezone."
                                    );
                                }


                                const forecastEntries =
                                    await Promise.all(

                                        points.map(
                                            async point => {

                                                const weatherIndex =
                                                    getWeatherIndex(
                                                        point,
                                                        departureTime,
                                                        originTimeZone
                                                    );


                                                return {

                                                    ...point,

                                                    cityState:
                                                        await reverseGeocode(
                                                            point.lng,
                                                            point.lat
                                                        ),

                                                    timezone:
                                                        point
                                                            .weatherData
                                                            .timezone,

                                                    timezoneAbbreviation:
                                                        getFriendlyTimeZone(
                                                            point
                                                                .weatherData
                                                                .timezone
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
                                                            point,
                                                            departureTime,
                                                            originTimeZone
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

                                    comparisonType:
                                        "route",

                                    routeNumber:
                                        routeIndex + 1,

                                    departureTime,

                                    originTimeZone,

                                    geometry:
                                        route.geometry,

                                    distance:
                                        route.distance,

                                    duration:
                                        route.duration,

                                    waypoints:
                                        routeCoordinates,

                                    forecastEntries
                                };
                            }
                        )
                    );


                setRoutes(
                    routeComparisons
                );
            }

        } catch (error) {

            console.error(
                "Unable to retrieve route:",
                error
            );


            alert(
                "Unable to retrieve route."
            );

        } finally {

            setIsLoading(
                false
            );
        }
    }


    // ============================================================
    // WEATHER HELPERS
    // ============================================================

    function getWeatherText(
        data,
        index
    ) {

        if (
            index < 0
        ) {

            return "Forecast unavailable";
        }


        const code =
            data
                .weatherData
                .hourly
                .weather_code[index];


        return (
            weatherCodes[code]?.text ||
            "Unknown"
        );
    }


    function getWeatherIcon(
        data,
        index
    ) {

        if (
            index < 0
        ) {

            return "❓";
        }


        const code =
            data
                .weatherData
                .hourly
                .weather_code[index];


        const weatherCode =
            weatherCodes[code];


        if (
            !weatherCode
        ) {

            return "❓";
        }


        return data
            .weatherData
            .hourly
            .is_day[index]
                ? weatherCode.dayIcon
                : weatherCode.nightIcon;
    }


    function getWeatherSeverity(
        data,
        index
    ) {

        if (
            index < 0
        ) {

            return "normal";
        }


        const code =
            data
                .weatherData
                .hourly
                .weather_code[index];


        return (
            weatherCodes[code]?.severity ||
            "normal"
        );
    }


    // ============================================================
    // WEATHER POINTS
    // ============================================================

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


        const weatherPoints =
            [];


        for (
            let i = 0;
            i < numPoints;
            i++
        ) {

            const secondsFromStart =
                Math.min(
                    i * intervalSeconds,
                    durationSeconds
                );


            const fraction =
                Math.min(
                    secondsFromStart /
                        durationSeconds,
                    1
                );


            const index =
                Math.floor(
                    fraction *
                    (
                        coords.length - 1
                    )
                );


            const [
                lng,
                lat
            ] =
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


    async function fetchWeather(
        lng,
        lat
    ) {

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lng}` +
            `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day` +
            `&timezone=auto`;


        const response =
            await fetch(url);


        if (
            !response.ok
        ) {

            throw new Error(
                "Unable to retrieve weather forecast"
            );
        }


        return await response.json();
    }


    // ============================================================
    // GEOCODING
    // ============================================================

    async function reverseGeocode(
        lng,
        lat
    ) {

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
            data.features?.find(
                feature =>
                    feature
                        .place_type
                        .includes(
                            "place"
                        )
            );


        const state =
            data.features?.find(
                feature =>
                    feature
                        .place_type
                        .includes(
                            "region"
                        )
            );


        return `${
            city?.text ||
            "Unknown city"
        }, ${
            state?.text ||
            "Unknown state"
        }`;
    }


    async function geocode(
        address
    ) {

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


            if (
                !response.ok
            ) {

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


            return (
                data.features[0].center
            );

        } catch {

            return "NoAddress";
        }
    }


    // ============================================================
    // RECOMMENDATION
    // ============================================================

    function getSeverityScore(
        severity
    ) {

        const scores = {

            normal:
                0,

            caution:
                1,

            poor:
                4,

            severe:
                10
        };


        return (
            scores[severity] ??
            0
        );
    }


    function getComparisonScore(
        comparison
    ) {

        return comparison
            .forecastEntries
            .reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    getSeverityScore(
                        entry.severity
                    ),
                0
            );
    }


    function getWorstSeverity(
        comparison
    ) {

        const order = {

            normal:
                0,

            caution:
                1,

            poor:
                2,

            severe:
                3
        };


        let worst =
            "normal";


        comparison
            .forecastEntries
            .forEach(
                entry => {

                    if (
                        (
                            order[
                                entry.severity
                            ] ??
                            0
                        ) >
                        order[worst]
                    ) {

                        worst =
                            entry.severity;
                    }
                }
            );


        return worst;
    }


    function getRecommendation() {

        if (
            routes.length === 0
        ) {

            return null;
        }


        const scoredOptions =
            routes.map(
                (
                    option,
                    index
                ) => ({

                    ...option,

                    originalIndex:
                        index,

                    score:
                        getComparisonScore(
                            option
                        ),

                    worstSeverity:
                        getWorstSeverity(
                            option
                        )
                })
            );


        const lowestScore =
            Math.min(
                ...scoredOptions.map(
                    option =>
                        option.score
                )
            );


        const bestOptions =
            scoredOptions.filter(
                option =>
                    option.score ===
                    lowestScore
            );


        if (
            bestOptions.length ===
            scoredOptions.length
        ) {

            return {

                type:
                    "tie",

                options:
                    bestOptions
            };
        }


        if (
            bestOptions.length > 1
        ) {

            return {

                type:
                    "bestTie",

                options:
                    bestOptions
            };
        }


        return {

            type:
                "winner",

            option:
                bestOptions[0]
        };
    }


    function formatDisplayTime(
        time
    ) {

        if (
            !time
        ) {
            return "";
        }


        const [
            hourString,
            minute
        ] =
            time.split(":");


        let hour =
            Number(
                hourString
            );


        const ampm =
            hour >= 12
                ? "PM"
                : "AM";


        hour =
            hour % 12;


        if (
            hour === 0
        ) {

            hour = 12;
        }


        return `${hour}:${minute} ${ampm}`;
    }


    function getRecommendationDescription(
        option
    ) {

        if (
            !option
        ) {
            return "";
        }


        switch (
            option.worstSeverity
        ) {

            case "normal":

                return (
                    "This option has the best overall weather conditions along the trip."
                );


            case "caution":

                return (
                    "This option has the fewest weather concerns, although some caution may still be needed."
                );


            case "poor":

                return (
                    "Weather may be challenging, but this option has fewer concerns than the alternatives."
                );


            case "severe":

                return (
                    "Severe weather may affect the trip. This is currently the least severe option."
                );


            default:

                return (
                    "This option has the best overall weather conditions."
                );
        }
    }


    // ============================================================
    // TIMEZONE NOTICE
    // ============================================================

    function getTimeZoneNotice() {

        if (
            routes.length === 0
        ) {
            return null;
        }


        const zones =
            routes[0]
                .forecastEntries
                ?.map(
                    entry =>
                        entry.timezoneAbbreviation
                )
                .filter(Boolean) ||
            [];


        const uniqueZones =
            [
                ...new Set(
                    zones
                )
            ];


        if (
            uniqueZones.length <= 1
        ) {

            return null;
        }


        return {

            startZone:
                uniqueZones[0],

            endZone:
                uniqueZones[
                    uniqueZones.length - 1
                ]
        };
    }


    // ============================================================
    // RESET
    // ============================================================

    function resetFields() {

        setStartLocation("");
        setFinalLocation("");

        setSelectedStart(null);
        setSelectedFinal(null);

        setStartSuggestions([]);
        setFinalSuggestions([]);

        setStartActiveIndex(-1);
        setFinalActiveIndex(-1);

        setStops([]);

        setSelectedDate(
            getTodayValue()
        );

        setDepartureTimes([
            getCurrentTimeValue()
        ]);

        setComparisonMode(
            "times"
        );

        setRouteCount(
            2
        );

        setInterval(
            30
        );

        setRoutes([]);
    }


    // ============================================================
    // DERIVED VALUES
    // ============================================================

    const recommendation =
        getRecommendation();


    const timeZoneNotice =
        getTimeZoneNotice();


    const waypointItems =
        getWaypointItems();


    // ============================================================
    // JSX
    // ============================================================

    return (

        <div className="route-radar-page">

            <div className="forecast-form-card">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="route-radar-header">

                    <div className="route-radar-icon-wrap">

                        <img
                            src={
                                `${import.meta.env.BASE_URL}header_icon.png`
                            }

                            alt="Route Radar"

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


                <Form
                    className="route-form"

                    onSubmit={
                        getRoute
                    }
                >


                    {/* ==================================================
                        YOUR ROUTE
                    ================================================== */}

                    <section className="route-builder">

                        <div className="route-builder-header">

                            <div>

                                <h3 className="route-builder-title">
                                    Your Route
                                </h3>

                                {
                                    stops.length > 0
                                && (

                                    <p className="route-builder-help">
                                        Drag to reorder. The first location is your start and the last is your destination.
                                    </p>

                                )}

                            </div>


                            <button
                                type="button"

                                className="route-builder-add-stop"

                                onClick={
                                    addStop
                                }

                                disabled={
                                    stops.length >=
                                    MAX_STOPS
                                }
                            >
                                <span aria-hidden="true">
                                    ＋
                                </span>

                                Add Stop
                            </button>

                        </div>


                        <div className="route-builder-list">

                            {
                                waypointItems.map(
                                    (
                                        waypoint,
                                        index
                                    ) => {

                                        const isStart =
                                            index === 0;


                                        const isEnd =
                                            index ===
                                            waypointItems.length - 1;


                                        const stopNumber =
                                            !isStart &&
                                            !isEnd
                                                ? index
                                                : null;


                                        const rowLabel =
                                            isStart
                                                ? "Start"
                                                : isEnd
                                                    ? "End"
                                                    : `Stop ${stopNumber}`;


                                        const rowClassName =
                                            `route-builder-row ${
                                                draggedWaypointIndex ===
                                                index
                                                    ? "dragging"
                                                    : ""
                                            } ${
                                                dragOverWaypointIndex ===
                                                index &&
                                                draggedWaypointIndex !==
                                                index
                                                    ? "drag-over"
                                                    : ""
                                            }`;


                                        return (

                                            <div
                                                key={
                                                    waypoint.key
                                                }

                                                className={
                                                    rowClassName
                                                }

                                                onDragOver={(event) =>
                                                    handleWaypointDragOver(
                                                        event,
                                                        index
                                                    )
                                                }

                                                onDrop={(event) =>
                                                    handleWaypointDrop(
                                                        event,
                                                        index
                                                    )
                                                }
                                            >


                                                {/* DRAG HANDLE */}

                                                <div
                                                    className="route-builder-drag-handle"

                                                    draggable

                                                    aria-hidden="true"

                                                    title="Drag to reorder"

                                                    onDragStart={(event) =>
                                                        handleWaypointDragStart(
                                                            event,
                                                            index
                                                        )
                                                    }

                                                    onDragEnd={
                                                        handleWaypointDragEnd
                                                    }
                                                >

                                                    <span />
                                                    <span />
                                                    <span />
                                                    <span />
                                                    <span />
                                                    <span />

                                                </div>


                                                {/* ROW CONTENT */}

                                                <div className="route-builder-row-content">

                                                    <div className="route-builder-row-label">

                                                        {
                                                            rowLabel
                                                        }

                                                    </div>


                                                    {/* START FIELD */}

                                                    {
                                                        isStart
                                                    && (

                                                        <div className="autocomplete-container">

                                                            <div className="route-input-wrapper">

                                                                <div className="route-input-icon">

                                                                    <img
                                                                        src="/p0/starting_icon.png"
                                                                        alt=""
                                                                    />

                                                                </div>


                                                                <Form.Control
                                                                    id="startLocation"

                                                                    className="route-input"

                                                                    placeholder="Enter starting address"

                                                                    value={
                                                                        startLocation
                                                                    }

                                                                    autoComplete="off"

                                                                    onChange={(event) => {

                                                                        setStartLocation(
                                                                            event.target.value
                                                                        );

                                                                        setSelectedStart(
                                                                            null
                                                                        );

                                                                        setStartActiveIndex(
                                                                            -1
                                                                        );
                                                                    }}

                                                                    onKeyDown={
                                                                        handleStartKeyDown
                                                                    }
                                                                />


                                                                <button
                                                                    type="button"

                                                                    className="route-clear-button"

                                                                    tabIndex={
                                                                        -1
                                                                    }

                                                                    aria-label="Clear starting address"

                                                                    onClick={() => {

                                                                        setStartLocation(
                                                                            ""
                                                                        );

                                                                        setSelectedStart(
                                                                            null
                                                                        );

                                                                        setStartSuggestions(
                                                                            []
                                                                        );

                                                                        setStartActiveIndex(
                                                                            -1
                                                                        );
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>

                                                            </div>


                                                            {
                                                                startSuggestions.length >
                                                                0
                                                            && (

                                                                <div className="address-suggestions">

                                                                    {
                                                                        startSuggestions.map(
                                                                            (
                                                                                suggestion,
                                                                                suggestionIndex
                                                                            ) => (

                                                                                <button
                                                                                    key={
                                                                                        suggestion.id
                                                                                    }

                                                                                    type="button"

                                                                                    tabIndex={
                                                                                        -1
                                                                                    }

                                                                                    className={
                                                                                        `address-suggestion ${
                                                                                            suggestionIndex ===
                                                                                            startActiveIndex
                                                                                                ? "active"
                                                                                                : ""
                                                                                        }`
                                                                                    }

                                                                                    onMouseEnter={() =>
                                                                                        setStartActiveIndex(
                                                                                            suggestionIndex
                                                                                        )
                                                                                    }

                                                                                    onClick={() =>
                                                                                        selectStartSuggestion(
                                                                                            suggestion
                                                                                        )
                                                                                    }
                                                                                >

                                                                                    <span className="suggestion-icon">
                                                                                        📍
                                                                                    </span>


                                                                                    <span className="suggestion-text">

                                                                                        {
                                                                                            suggestion.place_name
                                                                                        }

                                                                                    </span>

                                                                                </button>

                                                                            )
                                                                        )
                                                                    }

                                                                </div>

                                                            )}

                                                        </div>

                                                    )}


                                                    {/* END FIELD */}

                                                    {
                                                        isEnd
                                                    && (

                                                        <div className="autocomplete-container">

                                                            <div className="route-input-wrapper">

                                                                <div className="route-input-icon">

                                                                    <img
                                                                        src="/p0/dest_icon.png"
                                                                        alt=""
                                                                    />

                                                                </div>


                                                                <Form.Control
                                                                    id="finalLocation"

                                                                    className="route-input"

                                                                    placeholder="Enter destination"

                                                                    value={
                                                                        finalLocation
                                                                    }

                                                                    autoComplete="off"

                                                                    onChange={(event) => {

                                                                        setFinalLocation(
                                                                            event.target.value
                                                                        );

                                                                        setSelectedFinal(
                                                                            null
                                                                        );

                                                                        setFinalActiveIndex(
                                                                            -1
                                                                        );
                                                                    }}

                                                                    onKeyDown={
                                                                        handleFinalKeyDown
                                                                    }
                                                                />


                                                                <button
                                                                    type="button"

                                                                    className="route-clear-button"

                                                                    tabIndex={
                                                                        -1
                                                                    }

                                                                    aria-label="Clear destination"

                                                                    onClick={() => {

                                                                        setFinalLocation(
                                                                            ""
                                                                        );

                                                                        setSelectedFinal(
                                                                            null
                                                                        );

                                                                        setFinalSuggestions(
                                                                            []
                                                                        );

                                                                        setFinalActiveIndex(
                                                                            -1
                                                                        );
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>

                                                            </div>


                                                            {
                                                                finalSuggestions.length >
                                                                0
                                                            && (

                                                                <div className="address-suggestions">

                                                                    {
                                                                        finalSuggestions.map(
                                                                            (
                                                                                suggestion,
                                                                                suggestionIndex
                                                                            ) => (

                                                                                <button
                                                                                    key={
                                                                                        suggestion.id
                                                                                    }

                                                                                    type="button"

                                                                                    tabIndex={
                                                                                        -1
                                                                                    }

                                                                                    className={
                                                                                        `address-suggestion ${
                                                                                            suggestionIndex ===
                                                                                            finalActiveIndex
                                                                                                ? "active"
                                                                                                : ""
                                                                                        }`
                                                                                    }

                                                                                    onMouseEnter={() =>
                                                                                        setFinalActiveIndex(
                                                                                            suggestionIndex
                                                                                        )
                                                                                    }

                                                                                    onClick={() =>
                                                                                        selectFinalSuggestion(
                                                                                            suggestion
                                                                                        )
                                                                                    }
                                                                                >

                                                                                    <span className="suggestion-icon">
                                                                                        📍
                                                                                    </span>


                                                                                    <span className="suggestion-text">

                                                                                        {
                                                                                            suggestion.place_name
                                                                                        }

                                                                                    </span>

                                                                                </button>

                                                                            )
                                                                        )
                                                                    }

                                                                </div>

                                                            )}

                                                        </div>

                                                    )}


                                                    {/* STOP FIELD */}

                                                    {
                                                        !isStart &&
                                                        !isEnd
                                                    && (() => {

                                                        const stop =
                                                            stops[
                                                                index - 1
                                                            ];


                                                        return (

                                                            <div className="autocomplete-container">

                                                                <div className="route-input-wrapper">

                                                                    <div className="route-input-icon route-stop-input-icon">

                                                                        <span>
                                                                            {
                                                                                stopNumber
                                                                            }
                                                                        </span>

                                                                    </div>


                                                                    <input
                                                                        id={
                                                                            `stop-${stop.id}`
                                                                        }

                                                                        type="text"

                                                                        className="route-input"

                                                                        placeholder="Enter stop address"

                                                                        autoComplete="off"

                                                                        value={
                                                                            stop.location
                                                                        }

                                                                        onChange={(event) =>
                                                                            handleStopChange(
                                                                                stop.id,
                                                                                event.target.value
                                                                            )
                                                                        }

                                                                        onKeyDown={(event) =>
                                                                            handleStopKeyDown(
                                                                                event,
                                                                                stop
                                                                            )
                                                                        }
                                                                    />


                                                                    <button
                                                                        type="button"

                                                                        className="route-clear-button"

                                                                        tabIndex={
                                                                            -1
                                                                        }

                                                                        aria-label={
                                                                            `Remove stop ${stopNumber}`
                                                                        }

                                                                        title={
                                                                            `Remove stop ${stopNumber}`
                                                                        }

                                                                        onClick={() =>
                                                                            removeStop(
                                                                                stop.id
                                                                            )
                                                                        }
                                                                    >
                                                                        ×
                                                                    </button>

                                                                </div>


                                                                {
                                                                    stop.suggestions.length >
                                                                    0
                                                                && (

                                                                    <div className="address-suggestions">

                                                                        {
                                                                            stop.suggestions.map(
                                                                                (
                                                                                    suggestion,
                                                                                    suggestionIndex
                                                                                ) => (

                                                                                    <button
                                                                                        key={
                                                                                            suggestion.id
                                                                                        }

                                                                                        type="button"

                                                                                        tabIndex={
                                                                                            -1
                                                                                        }

                                                                                        className={
                                                                                            `address-suggestion ${
                                                                                                suggestionIndex ===
                                                                                                stop.activeIndex
                                                                                                    ? "active"
                                                                                                    : ""
                                                                                            }`
                                                                                        }

                                                                                        onMouseEnter={() =>
                                                                                            updateStopState(
                                                                                                stop.id,
                                                                                                {
                                                                                                    activeIndex:
                                                                                                        suggestionIndex
                                                                                                }
                                                                                            )
                                                                                        }

                                                                                        onClick={() =>
                                                                                            selectStopSuggestion(
                                                                                                stop.id,
                                                                                                suggestion
                                                                                            )
                                                                                        }
                                                                                    >

                                                                                        <span className="suggestion-icon">
                                                                                            📍
                                                                                        </span>


                                                                                        <span className="suggestion-text">

                                                                                            {
                                                                                                suggestion.place_name
                                                                                            }

                                                                                        </span>

                                                                                    </button>

                                                                                )
                                                                            )
                                                                        }

                                                                    </div>

                                                                )}

                                                            </div>

                                                        );

                                                    })()}

                                                </div>

                                            </div>

                                        );
                                    }
                                )
                            }

                        </div>

                    </section>


                    {/* ==================================================
                        TRIP TIMING
                    ================================================== */}

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

                            selectedDate={
                                selectedDate
                            }

                            onSelectDate={
                                setSelectedDate
                            }

                        />


                        {/* ==================================================
                            COMPARE BY
                        ================================================== */}

                        <div className="comparison-mode-section">

                            <span className="comparison-mode-label">
                                Compare By
                            </span>


                            <div className="comparison-mode-toggle">

                                <button
                                    type="button"

                                    className={
                                        `comparison-mode-button ${
                                            comparisonMode ===
                                            "times"
                                                ? "active"
                                                : ""
                                        }`
                                    }

                                    onClick={() => {

                                        setComparisonMode(
                                            "times"
                                        );

                                        setRoutes([]);
                                    }}
                                >

                                    <span aria-hidden="true">
                                        ◷
                                    </span>

                                    Departure Times

                                </button>


                                <button
                                    type="button"

                                    className={
                                        `comparison-mode-button ${
                                            comparisonMode ===
                                            "routes"
                                                ? "active"
                                                : ""
                                        }`
                                    }

                                    onClick={() => {

                                        setComparisonMode(
                                            "routes"
                                        );

                                        setRoutes([]);
                                    }}
                                >

                                    <span aria-hidden="true">
                                        ⇆
                                    </span>

                                    Alternative Routes

                                </button>

                            </div>

                        </div>


                        {/* ==================================================
                            DEPARTURE TIMES
                        ================================================== */}

                        {
                            comparisonMode ===
                            "times"
                        ? (

                            <div className="departure-times-section">

                                <div className="departure-times-header">

                                    <div>

                                        <div className="departure-times-label">
                                            Compare Departure Times
                                        </div>


                                        <div className="departure-times-help">
                                            Add up to 4 times to compare weather conditions.
                                        </div>

                                    </div>


                                    <button
                                        type="button"

                                        className="add-departure-time-button"

                                        onClick={
                                            addDepartureTime
                                        }

                                        disabled={
                                            departureTimes.length >=
                                            MAX_DEPARTURE_TIMES
                                        }
                                    >
                                        ＋ Add Time
                                    </button>

                                </div>


                                <div className="departure-time-list">

                                    {
                                        departureTimes.map(
                                            (
                                                departureTime,
                                                index
                                            ) => (

                                                <div
                                                    className="departure-time-option"

                                                    key={
                                                        index
                                                    }
                                                >

                                                    <span className="departure-time-number">

                                                        {
                                                            index + 1
                                                        }

                                                    </span>


                                                    <input
                                                        type="time"

                                                        step="300"

                                                        className="comparison-time-input"

                                                        value={
                                                            departureTime
                                                        }

                                                        onChange={(event) =>
                                                            updateDepartureTime(
                                                                index,
                                                                event.target.value
                                                            )
                                                        }
                                                    />


                                                    {
                                                        departureTimes.length >
                                                        1
                                                    && (

                                                        <button
                                                            type="button"

                                                            className="remove-departure-time"

                                                            aria-label={
                                                                `Remove departure time ${index + 1}`
                                                            }

                                                            onClick={() =>
                                                                removeDepartureTime(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            ×
                                                        </button>

                                                    )}

                                                </div>

                                            )
                                        )
                                    }

                                </div>

                            </div>

                        ) : (

                            /* ==================================================
                                ALTERNATIVE ROUTES
                            ================================================== */

                            <div className="route-comparison-controls">

                                <div className="time-field-group">

                                    <label htmlFor="routeComparisonTime">
                                        Departure Time
                                    </label>


                                    <input
                                        id="routeComparisonTime"

                                        type="time"

                                        step="300"

                                        className="departure-time-input"

                                        value={
                                            departureTimes[0]
                                        }

                                        onChange={(event) =>
                                            updateDepartureTime(
                                                0,
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="route-count-group">

                                    <span className="route-count-label">
                                        Routes to Compare
                                    </span>


                                    <div className="route-count-options">

                                        {
                                            [
                                                1,
                                                2,
                                                3
                                            ].map(
                                                count => (

                                                    <button
                                                        key={
                                                            count
                                                        }

                                                        type="button"

                                                        className={
                                                            `route-count-button ${
                                                                routeCount ===
                                                                count
                                                                    ? "active"
                                                                    : ""
                                                            }`
                                                        }

                                                        onClick={() =>
                                                            setRouteCount(
                                                                count
                                                            )
                                                        }
                                                    >
                                                        {
                                                            count
                                                        }
                                                    </button>

                                                )
                                            )
                                        }

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* ==================================================
                            FORECAST INTERVAL
                        ================================================== */}

                        <div className="comparison-interval-section">

                            <span className="interval-label">
                                Forecast Every
                            </span>


                            <div className="interval-chips">

                                {
                                    [
                                        15,
                                        30,
                                        45,
                                        60
                                    ].map(
                                        minutes => (

                                            <button
                                                key={
                                                    minutes
                                                }

                                                type="button"

                                                className={
                                                    `interval-chip ${
                                                        inputInterval ===
                                                        minutes
                                                            ? "active"
                                                            : ""
                                                    }`
                                                }

                                                onClick={() =>
                                                    setInterval(
                                                        minutes
                                                    )
                                                }
                                            >

                                                {
                                                    minutes === 60
                                                        ? "1 hour"
                                                        : `${minutes} min`
                                                }

                                            </button>

                                        )
                                    )
                                }

                            </div>

                        </div>


                        {/* ==================================================
                            ACTIONS
                        ================================================== */}

                        <div className="action-buttons">

                            <button
                                type="submit"

                                className="action-button primary"

                                disabled={
                                    isLoading
                                }
                            >

                                <span aria-hidden="true">
                                    ➤
                                </span>


                                {
                                    isLoading
                                        ? "Loading..."
                                        : "Let's Go!"
                                }

                            </button>


                            <button
                                type="button"

                                className="action-button secondary"

                                onClick={
                                    resetFields
                                }
                            >

                                <span aria-hidden="true">
                                    ↻
                                </span>

                                Reset

                            </button>

                        </div>


                        {/* ==================================================
                            RECOMMENDATION
                        ================================================== */}

                        {
                            recommendation &&
                            !isLoading
                        && (

                            <div className="route-recommendation">

                                <div className="recommendation-icon">
                                    ★
                                </div>


                                <div className="recommendation-content">

                                    <div className="recommendation-title">

                                        {
                                            recommendation.type ===
                                            "winner"
                                                ? (
                                                    comparisonMode ===
                                                    "routes"
                                                        ? `Route ${recommendation.option.routeNumber} looks best`
                                                        : `${formatDisplayTime(
                                                            recommendation.option.departureTime
                                                        )} looks like the best time to leave`
                                                )
                                                : "Conditions look similar"
                                        }

                                    </div>


                                    <div className="recommendation-description">

                                        {
                                            recommendation.type ===
                                            "winner"
                                                ? getRecommendationDescription(
                                                    recommendation.option
                                                )
                                                : (
                                                    comparisonMode ===
                                                    "routes"
                                                        ? "The available routes have similar weather conditions."
                                                        : "The selected departure times have similar weather conditions."
                                                )
                                        }

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* ==================================================
                            TIMEZONE NOTICE
                        ================================================== */}

                        {
                            timeZoneNotice &&
                            !isLoading
                        && (

                            <div className="timezone-notice">

                                <div className="timezone-notice-icon">
                                    ◷
                                </div>


                                <div>

                                    <div className="timezone-notice-title">
                                        Time Zone Change
                                    </div>


                                    <div className="timezone-notice-text">

                                        This trip crosses from{" "}

                                        <strong>
                                            {
                                                timeZoneNotice.startZone
                                            }
                                        </strong>

                                        {" "}to{" "}

                                        <strong>
                                            {
                                                timeZoneNotice.endZone
                                            }
                                        </strong>

                                        . Forecast times are shown in local time at each point along your route.

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* ==================================================
                            MAP
                        ================================================== */}

                        {
                            routes.length > 0 &&
                            !isLoading
                        && (

                            <RouteMap

                                routes={
                                    routes
                                }

                                comparisonMode={
                                    comparisonMode
                                }

                                recommendedIndex={
                                    recommendation?.type ===
                                    "winner"
                                        ? recommendation
                                            .option
                                            .originalIndex
                                        : null
                                }

                            />

                        )}


                        {/* ==================================================
                            RESULTS
                        ================================================== */}

                        <div className="routes-scroll">

                            {
                                !isLoading
                            ? (

                                routes.map(
                                    (
                                        comparison,
                                        index
                                    ) => (

                                        <RouteCard

                                            key={
                                                `${comparison.comparisonType}-${index}-${comparison.departureTime}`
                                            }

                                            comparisonType={
                                                comparison.comparisonType
                                            }

                                            routeNumber={
                                                comparison.routeNumber
                                            }

                                            departureTime={
                                                comparison.departureTime
                                            }

                                            forecastEntries={
                                                comparison.forecastEntries
                                            }

                                            isRecommended={
                                                recommendation?.type ===
                                                "winner" &&
                                                recommendation
                                                    .option
                                                    .originalIndex ===
                                                    index
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