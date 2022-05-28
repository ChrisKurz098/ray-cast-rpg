

onmessage = function renderFloorCeil(e) {

    let {player, buffer, strips, tileData, tileSize,  h, w } = e.data;

    buffer.forEach((e) => {
        //if the current element has a 'sprite' key, its an object
        if (e.sprite) {
            return false; //render the object
        } else {
            //if not an object render the slice of wall
            const distance = fixFishEye(e.distance, e.angle, player.angle);
            const wallHeight = Math.floor((tileSize / distance) * player.projDist);
            const xPos = e.sx;
            const yPos = Math.floor(h / 2 - wallHeight / 2);

            //----draw floor?----//
            const Beta = Math.abs((e.angle - player.angle));
            const yRow = yPos + wallHeight;

            for (let row = yRow; row <= h; row++) {
                const r = row - h / 2;
                const sld = (player.z) / r * player.projDist;
                const dist = sld / Math.cos(Beta);
                let x = (player.x + Math.cos(e.angle) * dist)
                let y = (player.y + Math.sin(e.angle) * dist);
                x = x & (tileSize - 1);
                y = y & (tileSize - 1);

                //get teature positions
                let inx = (((row) * w + xPos) * 4);
                const tnx = (((x) * 32 + y) * 4);
         
                const shade = dist/3 ;
                //floor
                strips.data[inx] = tileData[tnx]-shade;
                strips.data[inx + 1] = tileData[tnx + 1]-shade;
                strips.data[inx + 2] = tileData[tnx + 2]-shade;
                strips.data[inx + 3] = 255;
                //ceilings
                inx = (((h - row) * w + xPos) * 4);
                strips.data[inx] = tileData[tnx]-shade;
                strips.data[inx + 1] = tileData[tnx + 1]-shade;
                strips.data[inx + 2] = tileData[tnx + 2]-shade;
                strips.data[inx + 3] = 255;
            }
        }

    })
    postMessage(strips);
}



function fixFishEye(distance, angle, playerAngle) {
    const diff = angle - playerAngle;
    return distance * Math.cos(diff);
}