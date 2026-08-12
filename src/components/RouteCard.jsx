import React from "react";
import ForecastCard from "./ForecastCard";

export default function RouteCard(props) {
    return (
        <div className="route-card">
            <h3>Route {props.routeNumber}</h3>

            <div className="forecast-scroll">
                {props.forecastEntries.map((entry, index) => (
                    <div className="forecast-item" key={index}>
                        <ForecastCard {...entry} />
                    </div>
                ))}
            </div>
        </div>
    );
}