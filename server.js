/* Server.js
 * Created by Jake Loftus
 *
 * The server connects multiple players and controls the spawning of enemies on the map. It determines when a player has damaged another player. 
 */

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/', express.static(__dirname + '/'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
	initializeMap();
});

// Constants
global.maxX = [1000];
global.minY = [30];
global.maxY = [500];

var mapObject = require('./mapobject.js').mapObject;
var Entity = require('./entity.js').Entity;
var sizeOf = require('image-size');
	
var mapEntities = [];
var directionCounter = [];
var x_direction = [];
var y_direction = [];
var mapObjects = [];
var connected = [];
var collisionList = [];

function initializeMap()
{
	// load Map 1
	// load map objects (rocks, etc.)
	mapObjects.push(new mapObject(100,200,"rock1"));
	mapObjects.push(new mapObject(700,350,"bigrock"));
	mapObjects.push(new mapObject(400,400,"rock1"));
	
	for (var i in mapObjects)
	{
		mapObjects[i].width = sizeOf("img//" + mapObjects[i].spriteName + ".png").width;
		mapObjects[i].width = sizeOf("img//" + mapObjects[i].spriteName + ".png").width;
		console.log(mapObjects[i].width);
	}
	
	// load NPCs
	mapEntities.push(new Entity(300, 150, "playerDown"));
	mapEntities.push(new Entity(500, 60, "playerDown"));
	mapEntities.push(new Entity(200, 400, "playerDown"));
	mapEntities.push(new Entity(700, 250, "playerDown"));
	
	for (var i in mapEntities)
	{
		mapEntities[i].width = sizeOf("img//" + mapEntities[i].spriteName + ".png").width;
		mapEntities[i].width -= mapEntities[i].width % 2;
		mapEntities[i].depth = Math.floor(sizeOf("img//" + mapEntities[i].spriteName + ".png").height * 0.5);
		mapEntities[i].height = sizeOf("img//" + mapEntities[i].spriteName + ".png").height
		console.log(mapEntities[i]);
		directionCounter[i] = 0;
		x_direction[i] = 0;
		y_direction[i] = 0;
	}
}

//initialize an entity from a pre-existing entity
// output is only used for collision detection, so visual attributes don't matter
function copyEntity(old)
{
	var p = new Entity(old.x, old.y, old.spriteName);
	p.x = old.x; // X is the center of the sprite (in-game measurement units)
  p.y = old.y; // Y is the bottom of the sprite (in-game measurement units)
	p.z = old.z; // Z is the sprite's height off the ground (in-game measurement units)
	p.width = old.width;
	p.depth = old.depth;
	p.height = old.height;
	return p;
}

// update the NPC collision lists (nearby enemies)
function updateCollisionList()
{
	for (var i in mapEntities)
	{
		var c = [];
		
	
		for (var j in mapEntities)
		{
			if (i != j)
			{
				c.push(copyEntity(mapEntities[j]));
				
			}
		}
		
		for (var j in connected)
		{
			if (Math.abs(connected[j].x - mapEntities[i].x) <= 120 && Math.abs(connected[j].y - mapEntities[i].y) <= 120)
			{
				c.push(copyEntity(connected[j]));
			}
		}	
			
		for (var j in mapObjects)
		{			
			if (Math.abs(mapObjects[j].x - mapEntities[i].x) <= 60 && Math.abs(mapObjects[j].y - mapEntities[i].y) <= 60)
			{
				c.push(copyEntity(mapObjects[j]));
			}
		}
		
		mapEntities[i].collisionList = c;
	}
}


// move computer controlled NPCs
setInterval(function()
{
	updateCollisionList();
	
	for (var i in mapEntities)
	{
		if (directionCounter[i] <= 0)
		{
			x_direction[i] = Math.round(Math.random() * 2)-1;
			y_direction[i] = Math.round(Math.random() * 2)-1;
			directionCounter[i] = Math.ceil(Math.random() * 60);
		}
		directionCounter[i]--;
		mapEntities[i].move(x_direction[i], y_direction[i]);
		mapEntities[i].update();
		//console.log(mapEntities[i].x + " " + mapEntities[i].y);
	}
}, 1000/30);

// retrieve data from the client
io.on('connection', function(socket) 
{
	console.log(socket.id + " connected");
	
	socket.on('new player', function() 
		{
			io.to(socket.id).emit('mapObjects', mapObjects);
		}
  );
	
  socket.on('movement', function(player) 
	{
		if (player != null)// && player.entity.x != null)
		{
			connected[socket.id] = player;
		}
  });
	
	socket.on('disconnect', function()
	{
    console.log(socket.id + " disconnected");
		delete connected[socket.id];
		displayPlayerCount();
	});
});

// trasfer data to the client
setInterval(function() 
{
	for(var i in connected)
	{
		var players = new Array();
		for(var j in connected)
		{
			if (j != i)
			{
				players.push(connected[j]);
			}
		}
		
		Array.prototype.push.apply(players, mapEntities);
		io.to(i).emit('players', players); 
	}
	
	//io.emit('players', connected);
  
}, 1000/60);

// update server status every 5 seconds
setInterval(function()
{
	displayPlayerCount();
}, 30000);

// display current number of players connected
function displayPlayerCount()
{
	var n = 0;
	
	for (var i in connected)
	{
		n++;
	}
	
	var currentTime = new Date();
	var t = ""
	
	if (currentTime.getHours() < 10)
	{
		t = "0";
	}
	
	t += currentTime.getHours() + ":";
	
	if (currentTime.getMinutes() < 10)
	{
		t += "0";
	}
	
	t += currentTime.getMinutes() + ":";
	
	if (currentTime.getSeconds() < 10)
	{
		t += "0";
	}
	
	t += currentTime.getSeconds();
	
	console.log(t + " - " + n + " players connected");
}

