function createArray(num, dimensions) {
  var array = [];
  for (var i = 0; i < dimensions; i++) {
    array.push([]);
    for (var j = 0; j < dimensions; j++) {
      array[i].push(num + (Math.round(Math.random())));
    }
  }
  return array;
}

//lets create a randomly generated map for our dungeon crawler
function createMap(dimensions, maxTunnels, maxLength) {

  const map = createArray(1, dimensions) // create a 2d array full of 1's
  const hor = Array.from({ length: dimensions + 2 }, () => 1);
  const initX = Math.floor(Math.random()*dimensions) // our current row - start at a random spot
  const initY = Math.floor(Math.random()*dimensions) // our current column - start at a random spot
  let currentRow = initY // our current row - start at a random spot
  let currentColumn = initX // our current column - start at a random spot
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] // array to get a random direction from (left,right,up,down)
  let lastDirection = [] // save the last direction we went
  let randomDirection; // next turn/direction - holds a value from directions

  // lets create some tunnels - while maxTunnels, dimentions, and maxLength  is greater than 0.
  while (maxTunnels && dimensions && maxLength) {

    // lets get a random direction - until it is a perpendicular to our lastDirection
    // if the last direction = left or right,
    // then our new direction has to be up or down,
    // and vice versa
    do {
      randomDirection = directions[Math.floor(Math.random() * directions.length)];
    } while ((randomDirection[0] === -lastDirection[0] && randomDirection[1] === -lastDirection[1]) || (randomDirection[0] === lastDirection[0] && randomDirection[1] === lastDirection[1]));

    var randomLength = Math.ceil(Math.random() * maxLength), //length the next tunnel will be (max of maxLength)
      tunnelLength = 0; //current length of tunnel being created

    // lets loop until our tunnel is long enough or until we hit an edge
    while (tunnelLength < randomLength) {

      //break the loop if it is going out of the map
      if (((currentRow === 0) && (randomDirection[0] === -1)) ||
        ((currentColumn === 0) && (randomDirection[1] === -1)) ||
        ((currentRow === dimensions - 1) && (randomDirection[0] === 1)) ||
        ((currentColumn === dimensions - 1) && (randomDirection[1] === 1))) {
        currentRow = initY //reset to initail position to try again
        currentColumn = initX
        break;
      } else {
        map[currentRow][currentColumn] = 0; //set the value of the index in map to 0 (a tunnel, making it one longer)
        currentRow += randomDirection[0]; //add the value from randomDirection to row and col (-1, 0, or 1) to update our location
        currentColumn += randomDirection[1];
        tunnelLength++; //the tunnel is now one longer, so lets increment that variable
      }
    }

    if (tunnelLength) { // update our variables unless our last loop broke before we made any part of a tunnel
      lastDirection = randomDirection; //set lastDirection, so we can remember what way we went
      maxTunnels--; // we created a whole tunnel so lets decrement how many we have left to create
    }
  }
  //create border around map
  //add 1's to the start and end of each arrray
  map.map(line => {
    line.push(1)
    line.unshift(1)
    return true;
  })
  //add a line of 1 to the top and bottom
  map.push(hor);
  map.unshift(hor);
  return { map, initX: initX, initY }; // all our tunnels have been created and our map is complete, so lets return it to our render()
};

export default createMap;