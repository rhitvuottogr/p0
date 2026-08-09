// i think we should create the weather / city / time as a component here
import React from "react"
import { Card,Button } from "react-bootstrap"; 



export default function ForecastCard(props) {


    // check here if its poor weather?
    // or in props determine if its night or day and include that?

    console.log(props)
    console.log(props.severity)
    return (
    <Card
        className={`forecast-result-card forecast-result-card--${props.severity}`}
    >
        <div className="forecast-card">

        {/* // do an "is daytime" guy here */}
        <div className="forecast-weather-icon">
        {props.icon}
        </div>

        <div className="forecast-details">
        <div className="forecast-condition">
            {props.weather}
        </div>

        <div className="forecast-location">
            {props.cityState}
        </div>

        {props.isPoorWeather && (
        <div className="forecast-warning">
          <span className="forecast-warning-icon">▲</span>
          Poor driving conditions
        </div>
        )}


        </div>

        <div className="forecast-time-block">
        <div className="forecast-time">
            {props.time}
        </div>
        </div>

    </div>
    </Card> 
);
}

// <Form>
//             <Form.Label htmlFor="startLocation">Starting Address</Form.Label>
//             <Form.Control id="startLocation"/>
//             <Form.Label htmlFor="finalLocation">Destination</Form.Label>
//             <Form.Control id="finalLocation"/>
//             <br />
//         </Form>


//         <div className="controls">
//         <div className="time-picker">
//         <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
//             {hours.map(hour => (
//             <option key={hour} value={hour}>
//                 {hour}
//             </option>
//             ))}
//         </select>

//         <span>:</span>

//         <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}>
//             {minutes.map(minute => (
//             <option key={minute} value={minute}>
//                 {String(minute).padStart(2, "0")}
//             </option>
//             ))}
//         </select>

//         <select value={ampm} onChange={(e) => setAmpm(e.target.value)}>
//             <option value="am">AM</option>
//             <option value="pm">PM</option>
//         </select>
//         </div>

//         <div className="button-row">
//             <button onClick={addTimes}>Add A New Time</button>
//             <button onClick={getRoute}>Let's Go!</button>
//             <button onClick={resetFields}>Reset</button>
//         </div>
//         </div>