import React, {useEffect} from "react";
import main from "../../scripts/game/main";

function GameWindow() {

    useEffect(() => {
     
        main();
    }, [])

    
    return (
        <div id="canavsContainer">
        <canvas id="canvasA" width="640" height="360"></canvas>
        <canvas id="canvasB" width="640" height="360"></canvas>
        </div>
    )
}

export default GameWindow;