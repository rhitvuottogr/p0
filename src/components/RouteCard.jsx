import React from "react";
import ForecastCard from "./ForecastCard";

export default function RouteCard(props) {

    function formatDepartureTime(time) {

        const [hourString, minute] =
            time.split(":");


        let hour =
            Number(hourString);


        const ampm =
            hour >= 12
                ? "PM"
                : "AM";


        hour =
            hour % 12;


        if (hour === 0) {
            hour = 12;
        }


        return `${hour}:${minute} ${ampm}`;
    }


    return (

        <div className="route-card">

            <div className="comparison-card-header">

                {props.comparisonType === "route" ? (

                    <>
                        <div className="comparison-card-label">
                            Alternative
                        </div>

                        <h3 className="comparison-card-time">
                            Route {props.routeNumber}
                        </h3>

                        <div className="comparison-card-subtitle">
                            Leave at{" "}
                            {formatDepartureTime(
                                props.departureTime
                            )}
                        </div>
                    </>

                ) : (

                    <>
                        <div className="comparison-card-label">
                            Leave at
                        </div>

                        <h3 className="comparison-card-time">
                            {formatDepartureTime(
                                props.departureTime
                            )}
                        </h3>
                    </>

                )}

            </div>


            <div className="forecast-scroll">

                {props.forecastEntries.map(
                    (entry, index) => (

                        <div
                            className="forecast-item"
                            key={index}
                        >

                            <ForecastCard
                                {...entry}
                            />

                        </div>
                    )
                )}

            </div>

        </div>
    );
}