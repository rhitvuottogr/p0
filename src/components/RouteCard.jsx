import React from "react"
import { Card,Button } from "react-bootstrap"; 
import ForecastCard from "./ForecastCard";



export default function RouteCard(props) {


    console.log(props)
    return (
    <Card style={{border: "1px solid transparent", background: "transparent"}}>
        <div className="forecast-columns">
                    <div className="forecast-column">
                        {props.forecastEntries.map((entry, index) => (
                            <ForecastCard key={index} {...entry} />
                        ))}
                    </div>
                </div>
    </Card>
);
}
