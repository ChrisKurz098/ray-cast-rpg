import createMap from './generateMap';
import floorWorker from './floorCeil.worker.js';
let keysPressed = [];

const wallTextureA = new Image();
wallTextureA.src = require('../../img/wallA.png');
const wallTextureB = new Image();
wallTextureB.src = require('../../img/wallB.png');
const wallTextureC = new Image();
wallTextureC.src = require('../../img/wallC.png');
const wallTextureD = new Image();
wallTextureD.src = require('../../img/wallD.png');
const floorTexture = new Image();
floorTexture.src = require('../../img/floor.png');
const ceilTexture = new Image();
ceilTexture.src = require('../../img/ceil.png');

const chestA = new Image();
chestA.src = require('../../img/chestA.png');





function main(canvas) {
    const workerA = new floorWorker();

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 32;
    floorCanvas.height = 32;
    const fctx = floorCanvas.getContext('2d');


    const osctx = canvas.getContext('2d');
    osctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;

    const osCanvas = document.createElement('canvas');
    osCanvas.width = w;
    osCanvas.height = h;
    const ctx = osCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tileSize = 32;

    const mapSize = 20;
    //createMap(dimensions, maxTunnels, maxLength)
    const { map, initX, initY } = createMap(mapSize, 50, 15);


    let player = {
        x: (initX + 1) * tileSize + (tileSize / 2),
        y: (initY + 1) * tileSize + (tileSize / 2),
        z: tileSize / 2,
        angle: toRadians(Math.floor(Math.random() * 360)),
        fov: toRadians(65),
        spd: 0,
        maxSpd: .8,
        acc: .05,
        size: 5
    }
    //find distance from player to  projection plane

    player.projDist = (w / 2) / Math.tan(player.fov / 2);
    //each object hs {x,y,sprite}
    // x & y should be (0 to dimentions)* tileSize
    const { x: xx, y: yy } = randomCoord();
    const objects = [{ x: xx, y: yy, z: 1, sprite: chestA }];

    var startTime = Date.now();

    let frame = 0;

    const strips = ctx.createImageData(w, h);
    fctx.drawImage(floorTexture, 0, 0);
    const tileData = fctx.getImageData(0, 0, 32, 32).data
    fctx.drawImage(ceilTexture, 0, 0);
    const tileData2 = fctx.getImageData(0, 0, 32, 32).data

    let screenScale = window.innerWidth / w;
    let screenSize = 0;

    //------------------//
    //-----GAME LOOP----//
    //------------------//
    function loop() {
        let time = Date.now();
        frame++;
        if (time - startTime > 1000) {
            console.clear();
            console.log('FPS:', (frame / ((time - startTime) / 1000)).toFixed(1));
            startTime = time;
            frame = 0;
        }

        if (screenSize !== window.innerWidth) {
            screenScale = window.innerWidth / w;
            screenSize = w * screenScale;
            canvas.style.transform = `scale(${screenScale})`;
        }

        clearScreen();
        movePlayer();
        let zBuffer = getRays(w); //put all rays in z-buffer
        getObjectsDistance(objects); //find the distance, angle and scale of each object
        zBuffer = [...zBuffer, ...objects]; //add objects to zBuffer
        zBuffer.sort((a, b) => (b.distance - a.distance)); //sort zBuffer to render farthest parts first

        const buffer = JSON.parse(JSON.stringify(zBuffer));//cinvert array into something passable through postMessage
        workerA.postMessage({ player, buffer, strips, tileData, tileData2, tileSize, h, w });
        render(zBuffer); //render the zBuffered

        workerA.onmessage = function (e) {
            window.requestAnimationFrame(() => {
                osctx.putImageData(e.data, 0, 0);
                osctx.drawImage(osCanvas, 0, 0);
                //renderMinimap(0, 0, .25, zBuffer); //position x, y, scale and rays
                loop()
            });
        }


    }
    //----inital call for loop----//
    loop();
    //---FUNCTIONS---//
    function clearScreen() {
        ctx.clearRect(0, 0, w, h)
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
            //move player in direction if no WIDE collision

            if (collisionRays[0].distance >= 2 && collisionRays[0].distance >= 2) {

                (collisionRays[1].distance <= 8 && collisionRays[1].vertical) ? player.x = x : player.x += Math.cos(player.angle) * player.spd;

                (collisionRays[1].distance <= 8 && !collisionRays[1].vertical) ? player.y = y : player.y += Math.sin(player.angle) * player.spd;

            }
        }
    }
    //-------------Render Objects---------------------//
    function getObjectsDistance(objs) {
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
            const objScale = ((tileSize) / objDist) * player.projDist;

            obj.objAngle = objAngle;
            obj.objScale = objScale;
            obj.distance = objDist
        });
    };

    function renderObject(obj) {
        if (Math.abs(obj.objAngle) <= (player.fov + 0.5) / 2) {
            ctx.drawImage(obj.sprite,
                w / 2 - (w * obj.objAngle + obj.objScale / 2),
                h / 2 - obj.objScale / 2,
                obj.objScale,
                obj.objScale,
            );
        }

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


    function getVcol(angle, floor) {
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
        if (floor) {
            while (wall) {
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
        } else {
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

    function getHcol(angle, floor) {
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
        if (floor) {
            while (wall) {
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
        } else {
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
            ray.sx = i;
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

    function render(zBuffer) {

        zBuffer.forEach((e, i) => {

            //if the current element has a 'sprite' key, its an object
            if (e.sprite) {
                renderObject(e); //render the object
            } else {
                //if not an object render the slice of wall
                const wallIndex = e.wallIndex;
                const distance = fixFishEye(e.distance, e.angle, player.angle);
                const d = distance / 9;
                const wallHeight = Math.floor((tileSize / distance) * player.projDist);
                let textureOffset = (e.vertical) ? e.endY : e.endX;
                textureOffset = Math.floor(textureOffset - Math.floor(textureOffset / tileSize) * tileSize);
                //test if wall index number is 2
                let texture;
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
                    default: texture = wallTextureA;
                }

                const xPos = e.sx;
                const yPos = Math.floor(h / 2 - wallHeight / 2);

                ctx.drawImage(texture,
                    textureOffset,
                    0,
                    1,
                    tileSize,
                    xPos,
                    yPos,
                    1,
                    wallHeight
                );
                //-----Shading------/
                //potential here for lighting effects
                if (e.vertical) {
                    // draw color
                    ctx.fillStyle = "rgba(00,00,00,.42)";
                    ctx.fillRect(e.sx, yPos, 1, wallHeight);
                }

                //fade to dark in distance
                ctx.fillStyle = `rgba(00,00,00,${(d / 70)})`;
                ctx.fillRect(e.sx, yPos, 1, wallHeight);
            }

        })
    }
    //-------------Render Mini Map---------------------/
    function renderMinimap(posX = 0, posY = 0, scale = 1, rays) {
        const tileSizeMM = scale * tileSize;
        //render map
        map.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile) {
                    osctx.fillStyle = 'blue';
                    osctx.fillRect(
                        posX + x * tileSizeMM,
                        posY + y * tileSizeMM,
                        tileSizeMM, tileSizeMM)
                }
            })
        })
        //render rays
        // ctx.strokeStyle = 'yellow';
        // rays.forEach(ray => {

        //     ctx.beginPath()
        //     ctx.moveTo(player.x * scale + posX, player.y * scale + posY)
        //     ctx.lineTo(
        //         (player.x + Math.cos(ray.angle) * ray.distance) * scale,
        //         (player.y + Math.sin(ray.angle) * ray.distance) * scale,
        //     )
        //     ctx.closePath();
        //     ctx.stroke();

        // })
        //render player
        osctx.fillStyle = 'green'
        osctx.fillRect(
            posX + player.x * scale - player.size / 2,
            posY + player.y * scale - player.size / 2,
            player.size, player.size
        )
        //render player direction
        const rayLength = player.size * 20;
        osctx.strokeStyle = 'red';
        osctx.beginPath()
        osctx.moveTo(player.x * scale + posX, player.y * scale + posY)
        osctx.lineTo(
            (player.x + Math.cos(player.angle) * rayLength) * scale,
            (player.y + Math.sin(player.angle) * rayLength) * scale,
        )
        osctx.closePath();
        osctx.stroke();

        //render objects
        const objSize = 5;
        objects.forEach(obj => {
            osctx.fillStyle = 'lightgreen'
            osctx.fillRect(
                posX + (obj.x) * scale - objSize / 2,
                posY + (obj.y) * scale - objSize / 2,
                objSize, objSize
            )
        })


    }
    function randomCoord() {
        let x = 0;
        let y = 0;
        while (map[y][x]) {
            x = Math.floor(Math.random() * mapSize)
            y = Math.floor(Math.random() * mapSize)
        }
        x = x * tileSize + (tileSize / 2);
        y = y * tileSize + (tileSize / 2);
        return { x, y };
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