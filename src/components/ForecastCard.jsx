// i think we should create the weather / city / time as a component here
import React from "react"
import { Card,Button } from "react-bootstrap"; 



export default function ForecastCard(props) {


    console.log(props)
    return (
    <Card
        style={{
            margin: "0.5rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}
    >
        <div>
            <h5 style={{ margin: 0 }}>
                {props.cityState}
            </h5>
        </div>

        <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "1.1rem" }}>
                {props.weather}
            </p>
        </div>

        <div style={{ fontSize: "2.5rem" }}>
            {props.icon}
        </div>
        <div style={{ fontSize: "2.5rem" }}>
            {props.time}
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