import { useState } from "react";
import { Button, Card, Table } from "react-bootstrap";

export default function FeaturedItem(props) {

    const [facts, setFacts] = useState("Show Nutrition Facts");

    function handleFacts() {
        if (facts == "Show Nutrition Facts"){
            setFacts("Hide Nutrition Facts")
        } else {
            setFacts("Show Nutrition Facts")
        }
    }

    return <Card style={{margin: "auto", marginTop: "1rem", maxWidth: "40rem"}}>
        {
            Object.keys(props).length > 0 ? <>
                <img src={props.img} alt={props.name}/>
                <h1>{props.name}</h1>
                <h2>{props.price} per unit</h2>
                <p>{props.description}</p>
                <h2>Nutrition Facts</h2>
                { facts == "Hide Nutrition Facts" &&
                // show missing information
                <Table>
                    <thead>
                    <tr>
                        <th>Calories</th>
                        <th>Fat</th>
                        <th>Carbohydrates</th>
                        <th>Protein</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            {props.nutrition.calories ? props.nutrition.calories : '0g'}
                        </td>
                        <td>
                            {props.nutrition.fat ? props.nutrition.fat : '0g'}
                        </td>
                        <td>
                            {props.nutrition.carbohydrates ? props.nutrition.carbohydrates : '0g'}
                        </td> 
                        <td>
                            {props.nutrition.protein ? props.nutrition.protein : '0g'}
                        </td>
                    </tr>
                    </tbody>
                </Table>
                }
                <Button onClick={handleFacts}>{facts}</Button>
            </> : <p>Loading...</p>
        }
    </Card>

}