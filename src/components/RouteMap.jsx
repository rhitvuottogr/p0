import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import "./RouteMap.css";


export default function RouteMap({
    routes = [],
    comparisonMode = "times",
    recommendedIndex = null
}) {

    const mapContainerRef =
        useRef(null);

    const mapRef =
        useRef(null);


    const MAPBOX_TOKEN =
        import.meta.env.VITE_MAPBOX_TOKEN;


    const routeColors = [
        "#0b61f7",
        "#f97316",
        "#16a34a"
    ];


    useEffect(
        () => {

            if (
                !mapContainerRef.current ||
                routes.length === 0
            ) {
                return;
            }


            mapboxgl.accessToken =
                MAPBOX_TOKEN;


            if (
                mapRef.current
            ) {

                mapRef.current.remove();

                mapRef.current =
                    null;
            }


            const map =
                new mapboxgl.Map({

                    container:
                        mapContainerRef.current,

                    style:
                        "mapbox://styles/mapbox/streets-v12",

                    center: [
                        -89.4012,
                        43.0731
                    ],

                    zoom:
                        5,

                    attributionControl:
                        true
                });


            mapRef.current =
                map;


            map.addControl(
                new mapboxgl.NavigationControl({
                    showCompass:
                        false
                }),
                "top-right"
            );


            map.on(
                "load",
                () => {

                    const routesToDraw =
                        comparisonMode ===
                        "times"
                            ? routes.slice(
                                0,
                                1
                            )
                            : routes;


                    const bounds =
                        new mapboxgl.LngLatBounds();


                    routesToDraw.forEach(
                        route => {

                            route
                                .geometry
                                ?.coordinates
                                ?.forEach(
                                    coordinate => {

                                        bounds.extend(
                                            coordinate
                                        );
                                    }
                                );
                        }
                    );


                    /*
                        Reverse draw order so Route 1
                        remains visually on top.
                    */

                    const routesInDrawOrder =
                        routesToDraw
                            .map(
                                (
                                    route,
                                    originalIndex
                                ) => ({

                                    route,
                                    originalIndex
                                })
                            )
                            .reverse();


                    routesInDrawOrder.forEach(
                        ({
                            route,
                            originalIndex
                        }) => {

                            if (
                                !route.geometry
                            ) {
                                return;
                            }


                            const sourceId =
                                `route-source-${originalIndex}`;


                            const routeColor =
                                routeColors[
                                    originalIndex %
                                    routeColors.length
                                ];


                            const isRecommended =
                                comparisonMode ===
                                "times" ||
                                recommendedIndex ===
                                originalIndex;


                            map.addSource(
                                sourceId,
                                {

                                    type:
                                        "geojson",

                                    data: {

                                        type:
                                            "Feature",

                                        properties:
                                            {},

                                        geometry:
                                            route.geometry
                                    }
                                }
                            );


                            map.addLayer({

                                id:
                                    `route-outline-${originalIndex}`,

                                type:
                                    "line",

                                source:
                                    sourceId,

                                layout: {

                                    "line-join":
                                        "round",

                                    "line-cap":
                                        "round"
                                },

                                paint: {

                                    "line-color":
                                        "#ffffff",

                                    "line-width":
                                        isRecommended
                                            ? 10
                                            : 8,

                                    "line-opacity":
                                        0.85
                                }
                            });


                            map.addLayer({

                                id:
                                    `route-layer-${originalIndex}`,

                                type:
                                    "line",

                                source:
                                    sourceId,

                                layout: {

                                    "line-join":
                                        "round",

                                    "line-cap":
                                        "round"
                                },

                                paint: {

                                    "line-color":
                                        routeColor,

                                    "line-width":
                                        isRecommended
                                            ? 7
                                            : 5,

                                    "line-opacity":
                                        isRecommended
                                            ? 1
                                            : 0.9
                                }
                            });
                        }
                    );


                    // ====================================================
                    // WAYPOINT MARKERS
                    // ====================================================

                    const waypoints =
                        routesToDraw[0]
                            ?.waypoints;


                    if (
                        waypoints &&
                        waypoints.length >=
                        2
                    ) {

                        waypoints.forEach(
                            (
                                waypoint,
                                index
                            ) => {

                                const isStart =
                                    index ===
                                    0;


                                const isDestination =
                                    index ===
                                    waypoints.length -
                                    1;


                                const element =
                                    document.createElement(
                                        "div"
                                    );


                                if (
                                    isStart
                                ) {

                                    element.className =
                                        "route-map-marker route-map-marker-start";


                                    new mapboxgl.Marker({
                                        element
                                    })
                                        .setLngLat(
                                            waypoint
                                        )
                                        .setPopup(

                                            new mapboxgl.Popup({
                                                offset:
                                                    18
                                            })
                                                .setText(
                                                    "Starting Point"
                                                )
                                        )
                                        .addTo(
                                            map
                                        );


                                    return;
                                }


                                if (
                                    isDestination
                                ) {

                                    element.className =
                                        "route-map-marker route-map-marker-destination";


                                    new mapboxgl.Marker({
                                        element
                                    })
                                        .setLngLat(
                                            waypoint
                                        )
                                        .setPopup(

                                            new mapboxgl.Popup({
                                                offset:
                                                    18
                                            })
                                                .setText(
                                                    "Destination"
                                                )
                                        )
                                        .addTo(
                                            map
                                        );


                                    return;
                                }


                                /*
                                    Stop marker.
                                */

                                element.className =
                                    "route-map-stop-marker";


                                element.textContent =
                                    String(
                                        index
                                    );


                                new mapboxgl.Marker({
                                    element
                                })
                                    .setLngLat(
                                        waypoint
                                    )
                                    .setPopup(

                                        new mapboxgl.Popup({
                                            offset:
                                                18
                                        })
                                            .setText(
                                                `Stop ${index}`
                                            )
                                    )
                                    .addTo(
                                        map
                                    );
                            }
                        );

                    } else {

                        /*
                            Fallback for any old route data
                            without waypoints.
                        */

                        const coordinates =
                            routesToDraw[0]
                                ?.geometry
                                ?.coordinates;


                        if (
                            coordinates?.length
                        ) {

                            const startElement =
                                document.createElement(
                                    "div"
                                );


                            startElement.className =
                                "route-map-marker route-map-marker-start";


                            new mapboxgl.Marker({
                                element:
                                    startElement
                            })
                                .setLngLat(
                                    coordinates[
                                        0
                                    ]
                                )
                                .addTo(
                                    map
                                );


                            const destinationElement =
                                document.createElement(
                                    "div"
                                );


                            destinationElement.className =
                                "route-map-marker route-map-marker-destination";


                            new mapboxgl.Marker({
                                element:
                                    destinationElement
                            })
                                .setLngLat(
                                    coordinates[
                                        coordinates.length -
                                        1
                                    ]
                                )
                                .addTo(
                                    map
                                );
                        }
                    }


                    if (
                        !bounds.isEmpty()
                    ) {

                        map.fitBounds(
                            bounds,
                            {

                                padding: {

                                    top:
                                        55,

                                    right:
                                        55,

                                    bottom:
                                        55,

                                    left:
                                        55
                                },

                                duration:
                                    700,

                                maxZoom:
                                    12
                            }
                        );
                    }
                }
            );


            return () => {

                if (
                    mapRef.current
                ) {

                    mapRef.current.remove();

                    mapRef.current =
                        null;
                }
            };

        },
        [
            routes,
            comparisonMode,
            recommendedIndex,
            MAPBOX_TOKEN
        ]
    );


    function formatDistance(
        meters
    ) {

        if (
            meters == null
        ) {
            return null;
        }


        return `${
            (
                meters /
                1609.344
            ).toFixed(
                1
            )
        } mi`;
    }


    function formatDuration(
        seconds
    ) {

        if (
            seconds == null
        ) {
            return null;
        }


        const totalMinutes =
            Math.round(
                seconds /
                60
            );


        const hours =
            Math.floor(
                totalMinutes /
                60
            );


        const minutes =
            totalMinutes %
            60;


        if (
            hours ===
            0
        ) {

            return `${minutes} min`;
        }


        if (
            minutes ===
            0
        ) {

            return `${hours} hr`;
        }


        return `${hours} hr ${minutes} min`;
    }


    if (
        routes.length ===
        0
    ) {
        return null;
    }


    return (

        <div className="route-map-section">

            <div className="route-map-header">

                <div>

                    <div className="route-map-title">
                        Route Preview
                    </div>

                    <div className="route-map-subtitle">

                        {
                            comparisonMode ===
                            "routes"
                                ? "Compare the available routes below."
                                : "Preview the route used for your departure-time comparison."
                        }

                    </div>

                </div>


                {
                    routes[0]
                        ?.distance !=
                        null &&
                    routes[0]
                        ?.duration !=
                        null
                && (

                    <div className="route-map-trip-info">

                        <span>

                            {
                                formatDistance(
                                    routes[0].distance
                                )
                            }

                        </span>

                        <span className="route-map-info-divider">
                            •
                        </span>

                        <span>

                            {
                                formatDuration(
                                    routes[0].duration
                                )
                            }

                        </span>

                    </div>

                )}

            </div>


            <div
                ref={
                    mapContainerRef
                }

                className="route-map"
            />


            {
                comparisonMode ===
                "routes" &&
                routes.length >
                1
            && (

                <div className="route-map-legend">

                    {
                        routes.map(
                            (
                                route,
                                index
                            ) => (

                                <div
                                    className="route-map-legend-item"

                                    key={
                                        index
                                    }
                                >

                                    <span
                                        className={
                                            `route-map-legend-line ${
                                                recommendedIndex ===
                                                index
                                                    ? "recommended"
                                                    : ""
                                            }`
                                        }

                                        style={{
                                            backgroundColor:
                                                routeColors[
                                                    index %
                                                    routeColors.length
                                                ]
                                        }}
                                    />

                                    <span>

                                        Route{" "}

                                        {
                                            route.routeNumber ??
                                            index + 1
                                        }

                                    </span>


                                    {
                                        recommendedIndex ===
                                        index
                                    && (

                                        <span className="route-map-legend-best">
                                            Recommended
                                        </span>

                                    )}

                                </div>

                            )
                        )
                    }

                </div>

            )}

        </div>
    );
}