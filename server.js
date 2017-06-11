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



function mapObject(x,y,name)
	{
		this.x = x; // X is the center of the sprite (in-game measurement units)
		this.y = y; // Y is the bottom of the sprite (in-game measurement units)
		this.name = name;
	}
	
var mapEntities = [];
var mapObjects = [];

function initializeMap()
{
	// load Map 1
	mapObjects.push(new mapObject(100,200,"rock1"));
	mapObjects.push(new mapObject(700,350,"bigrock"));
	mapObjects.push(new mapObject(400,400,"rock1"));
}

// retrieve data from the client
var connected = new Array();
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
	console.log(currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds() + " - " + n + " players connected");
}

