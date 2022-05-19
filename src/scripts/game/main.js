import createMap from './generateMap';

let keysPressed = [];
function main(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height
    const tileSize = 32;
    const COLORS = {
        wallDark: '#777777',
        wallLight: '#555555',
        floor: '#005500',
        ceiling: '#000055'

}
//createMap(dimensions, maxTunnels, maxLength)
    const {map,initX,initY} = createMap(25, 50, 15);
    //  imageData.data.set(imgArray);
    let player = {
        x: initX*tileSize,
        y: initY*tileSize,
        angle: 0,
        fov: toRadians(60),
        spd: 0,
        maxSpd: .8,
        acc: .05,
        size: 5
    }

     setInterval(() => {
        clearScreen();
        movePlayer();
        const rays = getRays();
        render(rays);
        renderMinimap(0, 0, .2, rays) //position x, y, scale and rays


    }, 16.667)

    function clearScreen() {
        ctx.fillStyle = 'grey';
        ctx.fillRect(0, 0, h, w);
    }
    //-------------Move Player---------------------/
    function movePlayer() {
        if (keysPressed.includes('arrowup')) {
            (player.spd >= player.maxSpd) ? player.spd = player.maxSpd : player.spd += player.acc;
        }

        if (keysPressed.includes('arrowdown')) {
            (player.spd <= -player.maxSpd) ? player.spd = -player.maxSpd : player.spd -= player.acc;
        }
        if (!keysPressed.includes('arrowup') && !keysPressed.includes('arrowdown')) player.spd = 0;
        if (keysPressed.includes('arrowleft')) player.angle -= .025;
        if (keysPressed.includes('arrowright')) player.angle += .025;
        (keysPressed.includes('shift')) ? player.maxSpd = 3 : player.maxSpd = 1;

        //move player in direction
        player.x += Math.cos(player.angle) * player.spd;
        player.y += Math.sin(player.angle) * player.spd;
    }
    //-------------Calculate Rays---------------------/
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
  };
    }

    //function getHcol(angle) { };
    function castRay(angle) {
        const vCol = getVcol(angle);
        const hCol = getHcol(angle);

        
        return (hCol.distance >= vCol.distance) ? vCol : hCol;
    }
    function getRays() {
        const initAngle = player.angle - player.fov / 2;
        const numberOfRays = w;
        const angleStep = player.fov / numberOfRays;

        return Array.from({ length: numberOfRays }, (_, i) => {

            const angle = initAngle + i * angleStep;
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
            const distance = fixFishEye(ray.distance, ray.angle, player.angle);
            const wallHeight = ((tileSize * 5)/distance)*277;
            ctx.fillStyle = ray.vertical ? COLORS.wallDark : COLORS.wallLight;
            ctx.fillRect(i, h/2 - wallHeight/2, 1, wallHeight);
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(
              i,
              h / 2 + wallHeight / 2,
              1,
              h / 2 - wallHeight / 2
            );
            ctx.fillStyle = COLORS.ceiling;
            ctx.fillRect(i, 0, 1, h / 2 - wallHeight / 2);
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
        const rayLength = player.size * 2;
        ctx.strokeStyle = 'red';
        ctx.beginPath()
        ctx.moveTo(player.x * scale + posX, player.y * scale + posY)
        ctx.lineTo(
            (player.x + Math.cos(player.angle) * rayLength) * scale,
            (player.y + Math.sin(player.angle) * rayLength) * scale,
        )
        ctx.closePath();
        ctx.stroke();


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