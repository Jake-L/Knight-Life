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
});

// retrieve data from the client
var connected = {};
io.on('connection', function(socket) 
{
	console.log(socket.id + " connected");
	
  socket.on('new player', function() 
	{

  });
	
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

