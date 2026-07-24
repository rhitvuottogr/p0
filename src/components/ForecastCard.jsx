// i think we should create the weather / city / time as a component here
return 

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