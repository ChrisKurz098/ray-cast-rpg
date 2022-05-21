import createMap from './generateMap';

let keysPressed = [];

const wallTextureA = new Image();
wallTextureA.src = require('../../img/wallA.png');
const wallTextureB = new Image();
wallTextureB.src = require('../../img/wallB.png');
const wallTextureC = new Image();
wallTextureC.src = require('../../img/wallC.png');
const wallTextureD = new Image();
wallTextureD.src = require('../../img/wallD.png');

const chestA = new Image();
chestA.src = require('../../img/chestA.png');



function main(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height
    const tileSize = 32;
    const mapSize = 20;
    //createMap(dimensions, maxTunnels, maxLength)
    const { map, initX, initY } = createMap(mapSize, 50, 15);
    console.log(map)
    // {
    //     map: [
    //     [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

    //     ], initX: 2, initY: 2
    // };

    //createMap(mapSize, 50, 15);
    let player = {
        x: (initX + 1) * tileSize + (tileSize / 2),
        y: (initY + 1) * tileSize + (tileSize / 2),
        angle: toRadians(Math.floor(Math.random() * 360)),
        fov: toRadians(60),
        spd: 0,
        maxSpd: .8,
        acc: .05,
        size: 5
    }
    //each object hs {x,y,sprite}
    // x & y should be (0 to dimentions)* tileSize
    const {x: xx, y: yy} = randomCoord();
    const objects = [{ x: xx, y: yy, z: 1, sprite: chestA }];
    //-----GAME LOOP----//
    setInterval(() => {
        clearScreen();
        movePlayer();
        const rays = getRays(w);
        render(rays);
        renderObjects(objects);
        renderMinimap(0, 0, .5, rays) //position x, y, scale and rays

    }, 16.667)

    function clearScreen() {
        const grd = ctx.createLinearGradient(0, 0, 0, h / 2);;
        grd.addColorStop(1, "black");
        grd.addColorStop(0, "grey");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h / 2);
        const grd2 = ctx.createLinearGradient(0, h / 2, 0, h);;
        grd2.addColorStop(0, "black");
        grd2.addColorStop(1, "grey");
        ctx.fillStyle = grd2;
        ctx.fillRect(0, h / 2, w, h);

    }
    //-------------Move Player---------------------/
    function movePlayer() {
        const { x, y } = player;
        if (keysPressed.includes('arrowup')) {
            player.spd = player.maxSpd;
            collisionCheck(0);
        }

        if (keysPressed.includes('arrowdown')) {
            player.spd = -player.maxSpd;
            collisionCheck(Math.PI);
        }

        if (!keysPressed.includes('arrowup') && !keysPressed.includes('arrowdown')) player.spd = 0;

        if (keysPressed.includes('arrowleft')) {
            player.angle = (player.angle - .05 <= 0) ? 2 * Math.PI : player.angle - 0.05;

        }

        if (keysPressed.includes('arrowright')) {
            player.angle = (player.angle + .05 > 2 * Math.PI) ? 0 : player.angle + 0.05;
        }

        (keysPressed.includes('shift')) ? player.maxSpd = 4 : player.maxSpd = 2;

        function collisionCheck(dir) {
            const collisionRays = getCollisionRays(3, dir);
            //move player in direction
            if (collisionRays[0].distance >= 2 && collisionRays[0].distance >= 2) {
                (collisionRays[1].distance <= 8 && collisionRays[1].vertical) ? player.x = x : player.x += Math.cos(player.angle) * player.spd;
                (collisionRays[1].distance <= 8 && !collisionRays[1].vertical) ? player.y = y : player.y += Math.sin(player.angle) * player.spd;
            }
        }
    }
    //-------------Render Objects---------------------//
    function renderObjects(objs) {
        objs.forEach(obj => {
            // get distance from player
            const objDist = distance(player.x, player.y, obj.x, obj.y);
            //check if obj is in FOV
            const vecX = obj.x - player.x;
            const vecY = obj.y - player.y;
          
            let objAngle = player.angle - Math.atan2(vecY, vecX)
            if (objAngle < -3.14159)
                objAngle += 2.0 * 3.14159;
            if (objAngle > 3.14159)
                objAngle -= 2.0 * 3.14159;
                //find the scale of the object just as we found it for the walls
            const objScale = ((tileSize * 5) / objDist) * 277;

            if (Math.abs(objAngle) <= (player.fov + 0.5) / 2) {
                ctx.drawImage(obj.sprite,
                    w / 2 - (w * objAngle + objScale / 2),
                    h / 2 - objScale / 2,
                    objScale,
                    objScale,
                );
            }
        })
    }
    //-------------Calculate Rays---------------------//
    function toRadians(deg) {
        return (deg * Math.PI) / 180;
    }

    function outOfBounds(x, y) {
        return (x < 0 || x >= map[0].length || y < 0 || y >= map.length)
    }
    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }


    function getVcol(angle) {
        const right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2);

        const firstX = right
            ? Math.floor(player.x / tileSize) * tileSize + tileSize
            : Math.floor(player.x / tileSize) * tileSize;

        const firstY = player.y + (firstX - player.x) * Math.tan(angle);

        const xA = right ? tileSize : -tileSize;
        const yA = xA * Math.tan(angle);

        let wall;
        let nextX = firstX;
        let nextY = firstY;
        while (!wall) {
            const tileX = right
                ? Math.floor(nextX / tileSize)
                : Math.floor(nextX / tileSize) - 1;
            const tileY = Math.floor(nextY / tileSize);

            if (outOfBounds(tileX, tileY)) {
                break;
            }
            wall = map[tileY][tileX];
            if (!wall) {
                nextX += xA;
                nextY += yA;
            } else {
            }
        }
        return {
            angle,
            distance: distance(player.x, player.y, nextX, nextY),
            vertical: true,
            endX: nextX,
            endY: nextY,
            wallIndex: wall
        };
    }

    function getHcol(angle) {
        const up = Math.abs(Math.floor(angle / Math.PI) % 2);
        const firstY = up
            ? Math.floor(player.y / tileSize) * tileSize
            : Math.floor(player.y / tileSize) * tileSize + tileSize;
        const firstX = player.x + (firstY - player.y) / Math.tan(angle);

        const yA = up ? -tileSize : tileSize;
        const xA = yA / Math.tan(angle);

        let wall;
        let nextX = firstX;
        let nextY = firstY;
        while (!wall) {
            const tileX = Math.floor(nextX / tileSize);
            const tileY = up
                ? Math.floor(nextY / tileSize) - 1
                : Math.floor(nextY / tileSize);

            if (outOfBounds(tileX, tileY)) {
                break;
            }

            wall = map[tileY][tileX];
            if (!wall) {
                nextX += xA;
                nextY += yA;
            }
        }
        return {
            angle,
            distance: distance(player.x, player.y, nextX, nextY),
            vertical: false,
            endX: nextX,
            endY: nextY,
            wallIndex: wall
        };
    }

    //function getHcol(angle) { };
    function castRay(angle) {
        const vCol = getVcol(angle);
        const hCol = getHcol(angle);


        return (hCol.distance >= vCol.distance) ? vCol : hCol;
    }
    function getRays(numberOfRays) {
        const initAngle = player.angle - player.fov / 2;

        const angleStep = player.fov / numberOfRays;

        return Array.from({ length: numberOfRays }, (_, i) => {

            const angle = initAngle + i * angleStep;
            const ray = castRay(angle);
            return ray;
        })
    }

    function getCollisionRays(numberOfRays, dir) {
        const initAngle = (player.angle + dir) - player.fov / 2;

        const angleStep = player.fov / 2;

        return Array.from({ length: numberOfRays }, (_, i) => {

            const angle = initAngle + angleStep;
            const ray = castRay(angle);
            return ray;
        })
    }
    //-------------Render Scene---------------------/
    function fixFishEye(distance, angle, playerAngle) {
        const diff = angle - playerAngle;
        return distance * Math.cos(diff);
    }

    function render(rays) {
        rays.forEach((ray, i) => {
            const wallIndex = ray.wallIndex;
            const distance = fixFishEye(ray.distance, ray.angle, player.angle);
            const d = distance / 9;

            const wallHeight = ((tileSize * 5) / distance) * 277;
            let textureOffset = (ray.vertical) ? ray.endY : ray.endX;
            textureOffset = Math.floor(textureOffset - Math.floor(textureOffset / tileSize) * tileSize);
            //test if wall index number is 2
            let texture = wallTextureA;
            switch (true) {
                case (wallIndex === 2): 
                texture = wallTextureB;
                break;
                case (wallIndex === 3): 
                texture = wallTextureC;
                break;
                case (wallIndex === 4): 
                texture = wallTextureD;
                break;
            }
            ctx.drawImage(texture,
                textureOffset,
                0,
                1,
                tileSize,
                i,
                h / 2 - wallHeight / 2,
                1,
                wallHeight
            );
            //fade to dark in distance
            ctx.fillStyle = `rgba(00,00,00,${d / 70})`;
            ctx.fillRect(i, h / 2 - wallHeight / 2, 1, wallHeight);

        })
    }
    //-------------Render Mini Map---------------------/
    function renderMinimap(posX = 0, posY = 0, scale = 1, rays) {
        const tileSizeMM = scale * tileSize;
        //render map
        map.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile) {
                    ctx.fillStyle = 'blue';
                    ctx.fillRect(
                        posX + x * tileSizeMM,
                        posY + y * tileSizeMM,
                        tileSizeMM, tileSizeMM)
                }
            })
        })
        //render rays
        ctx.strokeStyle = 'yellow';
        rays.forEach(ray => {

            ctx.beginPath()
            ctx.moveTo(player.x * scale + posX, player.y * scale + posY)
            ctx.lineTo(
                (player.x + Math.cos(ray.angle) * ray.distance) * scale,
                (player.y + Math.sin(ray.angle) * ray.distance) * scale,
            )
            ctx.closePath();
            ctx.stroke();

        })
        //render player
        ctx.fillStyle = 'green'
        ctx.fillRect(
            posX + player.x * scale - player.size / 2,
            posY + player.y * scale - player.size / 2,
            player.size, player.size
        )
        //render player direction
        const rayLength = player.size * 20;
        ctx.strokeStyle = 'red';
        ctx.beginPath()
        ctx.moveTo(player.x * scale + posX, player.y * scale + posY)
        ctx.lineTo(
            (player.x + Math.cos(player.angle) * rayLength) * scale,
            (player.y + Math.sin(player.angle) * rayLength) * scale,
        )
        ctx.closePath();
        ctx.stroke();

        //render objects
        const objSize = 10;
        objects.forEach(obj => {
            ctx.fillStyle = 'lightgreen'
            ctx.fillRect(
                posX + (obj.x) * scale - objSize / 2,
                posY + (obj.y) * scale - objSize / 2,
                objSize, objSize
            )
        })


    }
function randomCoord() {
    let x = 0;
    let y = 0;
    while(map[y][x]) {
        x = Math.floor(Math.random()* mapSize)
        y = Math.floor(Math.random()* mapSize)
    }
    x=x*tileSize+(tileSize/2);
    y=y*tileSize+(tileSize/2);
    return {x,y};
}

    ///EVENT LISTENERS///
    document.addEventListener("keyup", logKeyUp);
    document.addEventListener("keydown", logKeyDown);
    //document.addEventListener("mousemove", (e) => player.angle += toRadians(e.movementX) * Math.PI);
}

/////////////Key inputs///////////////////
const logKeyDown = (e) => {
    if (!keysPressed.includes(e.key)) keysPressed = [...keysPressed, e.key.toLowerCase()];
    //console.log(keysPressed)

};

const logKeyUp = (e) => {
    const newKeys = keysPressed.filter((key) => key !== e.key.toLowerCase());
    if (newKeys !== keysPressed) keysPressed = newKeys;
    //console.log(keysPressed)
};






export default main;