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

app.set('port', 80);
app.use('/', express.static(__dirname + '/'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(80, function() {
  console.log('Starting server on port 5000');
	initializeMap();
});

// Constants
global.maxX = [1000];
global.minY = [30];
global.maxY = [500];

// other shared variables
global.projectileList = []; // keep track of all active projectiles
global.damageList = []; // keep track of all upcoming attacks 

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
		mapObjects[i].height = sizeOf("img//" + mapObjects[i].spriteName + ".png").height;
		mapObjects[i].depth = sizeOf("img//" + mapObjects[i].spriteName + ".png").height;
	}
	
	// load NPCs
	mapEntities.push(new CPU(300, 150, "playerDown"));
	mapEntities.push(new CPU(500, 60, "playerDown"));
	mapEntities.push(new CPU(200, 400, "playerDown"));
	mapEntities.push(new CPU(700, 250, "playerDown"));
	
	for (var i in mapEntities)
	{
		mapEntities[i].entity.id = i;
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
	p.id = old.id;
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
				c.push(copyEntity(mapEntities[j].entity));				
			}
		}
		
		for (var j in connected)
		{
			if (Math.abs(connected[j].x - mapEntities[i].entity.x) <= 120 && Math.abs(connected[j].y - mapEntities[i].entity.y) <= 120)
			{
				c.push(copyEntity(connected[j]));
			}
		}	
			
		for (var j in mapObjects)
		{			
			if (Math.abs(mapObjects[j].x - mapEntities[i].entity.x) <= 60 && Math.abs(mapObjects[j].y - mapEntities[i].entity.y) <= 60)
			{
				c.push(copyEntity(mapObjects[j]));
			}
		}
		
		mapEntities[i].entity.collisionList = c;
	}
}

var CPU = function(x, y, spriteName)
{
	//configure the entity
	this.entity = new Entity(x, y, spriteName);
	this.entity.width = sizeOf("img//" + this.entity.spriteName + ".png").width;
	this.entity.width -= this.entity.width % 2;
	this.entity.depth = Math.floor(sizeOf("img//" + this.entity.spriteName + ".png").height * 0.5);
	this.entity.height = sizeOf("img//" + this.entity.spriteName + ".png").height;
	
	//configure CPU specific attributes
	this.target = null;
	this.directionCounter = 0;
	this.x_direction = 0;
	this.y_direction = 0;
	console.log("entity created");
};

CPU.prototype.update = function()
{
	
	
	if (this.target != null)
	{
		var e = getEntity(this.target);
		
		this.x_direction = 0;
		this.y_direction = 0;
		
		// move along the x-axis toward your target
		if (this.entity.x < e.x - (e.width / 2))
		{
			this.x_direction = 1;
		}
		else if (this.entity.x > e.x + (e.width / 2))
		{
			this.x_direction = -1;
		}
		
		// move along the y-axis toward your target
		if (this.entity.y < e.y - (e.depth / 2))
		{
			this.y_direction = 1;
		}
		else if (this.entity.y - (this.entity.depth / 2) > e.y)
		{
			this.y_direction = -1;
		}
	}
	else
	{
		if (this.directionCounter <= 0)
		{
			this.x_direction = Math.round(Math.random() * 2)-1;
			this.y_direction = Math.round(Math.random() * 2)-1;
			this.directionCounter = Math.ceil(Math.random() * 60);
		}
	}
	
	this.directionCounter--;

	this.entity.move(this.x_direction * 0.5, this.y_direction * 0.5);
	this.entity.update();
};

CPU.prototype.setTarget = function(id)
{
	this.target = id;
};

// returns the entity with the given ID
// may be a player or CPU
function getEntity(id)
{
	if (id == null)
	{
		return null;
	}
	else if (typeof connected[id] !== 'undefined')
	{
		return connected[id];
	}
	else if (typeof mapEntities[id] !== 'undefined')
	{
		return mapEntities[id].entity;
	}
	else
	{
		return null;
	}
}

// move computer controlled NPCs
setInterval(function()
{
	updateCollisionList();
	
	checkDamage();
	
	for (var i in mapEntities)
	{
		/*
		if (mapEntities[i].target != null)
		{
			if (connected[mapEntities[i].target] == null)
			{
				mapEntities[i].target = null;
			}
			else 
			{
				x_direction[i] = 0;
				y_direction[i] = 0;
				
				if (connected[mapEntities[i].target].x < mapEntities[i].x - (mapEntities[i].width / 2))
				{
					x_direction[i] = -1;
					directionCounter[i] = Math.ceil(Math.random() * 60);
				}
			}
		}*/
		
		mapEntities[i].update();

	}
	
}, 1000/60);



// holds information about where damage will be applied
function Damage(x, y, source, damage_time, damage)
{
	this.x = x;
	this.y = y;
	this.source = source;
	this.damage_time = damage_time;
	this.damage = damage;
	
	console.log("will apply damage at position " + x + " " + y);
	
	this.collisionCheck = function(e)
	{
		if ((this.x + 1 >= e.x - (e.width / 2) && this.x - 1 <= e.x + (e.width / 2))
			&& (this.y + 1 >= e.y - e.depth && this.y - 1 <= e.y))
		{
			return true;
		}
		else
		{
			return false;
		}
	};
}

// holds information about projectiles on-screen
function Projectile(x, y, x_speed, y_speed, source, spawn_time, damage, spriteName)
{
	this.x = x;
	this.y = y;
	this.spawn_x = x;
	this.spawn_y = y;
	this.z = 5;
	this.x_speed = x_speed;
	this.y_speed = y_speed;
	this.source = source; 
	this.damage = damage;
	this.spriteName = spriteName;
	this.height = sizeOf("img//" + this.spriteName + ".png").height;
	this.width = sizeOf("img//" + this.spriteName + ".png").width;
	this.depth = 6;
	this.spawn_time = spawn_time;
	
	this.update = function()
	{
		this.x += this.x_speed;
		this.y += this.y_speed;
	};
	
	this.collisionCheck = function(e)
	{
		if ((this.x + (this.width/2) >= e.x - (e.width / 2) && this.x - (this.width/2) <= e.x + (e.width / 2))
			&& (this.y + (this.depth/2) >= e.y - e.depth && this.y - (this.depth/2) <= e.y))
		{
			return true;
		}
		else
		{
			return false;
		}
	};
	
	this.offscreen = function()
	{
		if (this.x - this.width > maxX[0] || this.x + this.width < 0 || this.y < 0 || this.y - this.height > maxY[0])
		{
			return true;
		}
		else false;
	};
}

/* check if an attack damaged any entities */
function checkDamage()
{
	var currentTime = new Date();
	var n = damageList.length;
	
	// go through every active attack
	for (var i = 0; i < n; i++)
	{
		// check if the animation reached the frame where it does damage
		if (currentTime.getTime() >= damageList[i].damage_time)
		{
			// check every connected player to see if they were hit
			for (var j in connected)
			{
				if (damageList[i].source != connected[j].id && damageList[i].collisionCheck(connected[j]))
				{
					// tell the client that they took damage
					io.to(connected[j].id).emit('damageIn', damageList[i].x, damageList[i].y, damageList[i].damage);
					console.log(connected[j].display_name + " took " + damageList[i].damage + " damage");
				}
			}
			
			// check every cpu to see if they were hit
			for (var j in mapEntities)
			{
				if (damageList[i].source != mapEntities[j].entity.id && damageList[i].collisionCheck(mapEntities[j].entity))
				{
					// damage the entity
					mapEntities[j].entity.takeDamage(damageList[i].x, damageList[i].y, damageList[i].damage);
					mapEntities[j].setTarget(damageList[i].source);
					console.log(mapEntities[j].entity.display_name + mapEntities[j].entity.id + " took " + damageList[i].damage + " damage");
				}
			}		
		
		damageList.splice(i,1);
		i--;
		n--;
		}
	}
	
	// go through every active projectile
	n = projectileList.length;
	
	for (var i = 0; i < n; i++)
	{
		if (currentTime.getTime() >= projectileList[i].spawn_time)
		{
			if (projectileList[i].x == projectileList[i].spawn_x && projectileList[i].y == projectileList[i].spawn_y)
			{
				projectileList[i].spawn_time = currentTime.getTime();
			}
			
			projectileList[i].update();
			
			if (projectileList[i].offscreen())
			{
				projectileList.splice(i, 1);
				i--;
				n--;
			}
			
			else
			{
				var dmg = false;
				
				// check every connected player to see if they were hit
				for (var j in connected)
				{
					if (projectileList[i].source != connected[j].id && projectileList[i].collisionCheck(connected[j]))
					{
						// tell the client that they took damage
						io.to(connected[j].id).emit('damageIn', projectileList[i].x, projectileList[i].y, projectileList[i].damage);
						console.log(connected[j].display_name + " took " + projectileList[i].damage + " damage");
						dmg = true;
					}
				}
				
				// check every cpu to see if they were hit
				for (var j in mapEntities)
				{
					if (projectileList[i].source != mapEntities[j].entity.id && projectileList[i].collisionCheck(mapEntities[j].entity))
					{
						// damage the entity
						mapEntities[j].entity.takeDamage(projectileList[i].x, projectileList[i].y, projectileList[i].damage);
						mapEntities[j].setTarget(projectileList[i].source);
						console.log(mapEntities[j].entity.display_name + mapEntities[j].entity.id + " took " + projectileList[i].damage + " damage");
						dmg = true;
					}
				}		
				
				if (dmg)
				{
					projectileList.splice(i, 1);
					i--;
					n--;
				}
			}
		}
	}	
}

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
			player.id = socket.id;
			connected[socket.id] = player;
		}
  });
	
	socket.on('damageOut', function(x, y, damage_time, damage)
	{
		damageList.push(new Damage(x, y, socket.id, damage_time, damage));
	});
	
	socket.on('createProjectile', function(x, y, x_speed, y_speed, spawn_time, damage, spriteName)
	{
		projectileList.push(new Projectile(x, y, x_speed, y_speed, socket.id, spawn_time, damage, spriteName));
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
		
		for (var j in mapEntities)
		{
			players.push(mapEntities[j].entity);
		}
		
		io.to(i).emit('players', players); 	
	}  
	
	var p = [];
	
	for (var i in projectileList)
	{
		if (new Date().getTime() >= projectileList[i].spawn_time)
		{
			p.push(projectileList[i]);
		}
	}
	
	io.emit('projectiles', p);
	
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
	var t = "";
	
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

