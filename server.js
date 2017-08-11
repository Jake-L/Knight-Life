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

// other shared variables
global.projectileList = []; // keep track of all active projectiles
global.damageList = []; // keep track of all upcoming attacks

var mapObject = require('./mapobject.js').mapObject;
var Entity = require('./entity.js').Entity;
var sizeOf = require('image-size');

var mapEntities = []; // all the CPUs
var mapObjects = []; // non-moving map objects like rocks
var connected = []; // connected players
var collisionList = [];
var killParticipation = []; // keep track of players who recently attacked an enemy

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

	// spawn knights
	for (var i = 0; i < 6; i++)
	{
		mapEntities.push(new CPU(0, 0, "player", i, i * i * 5));
		killParticipation[i] = null;
	}

  var n = mapEntities.length;

  // spawn icemen
  for (var i = n; i < n + 3; i++)
  {
    mapEntities.push(new CPU(0, 0, "iceman", i, 80));
    mapEntities[i].entity.faction = "iceman";
    mapEntities[i].targetType = "Aggressive";
    killParticipation[i] = null;
  }
}

// get x,y coordinates of a valid spawn point for an object of the given height and width
function getSpawn(h, w)
{
	var c = {x: 0, y: 0};
	var count = 0;

	while (c.x + c.y == 0 && count < 100)
	{
		c.x = Math.ceil(Math.random() * maxX[0]);
		c.y = Math.ceil((Math.random() * (maxY[0] - minY[0])) + minY[0]);
		count++;

		var blocked = false;

		for (var i in connected)
		{
			if (c.y > connected[i].y - connected[i].depth && c.y - h < connected[i].y
				&& c.x + (w/2) > connected[i].x - (connected[i].width/2) && c.x - (w/2) < connected[i].x + (connected[i].width/2))
			{
				blocked = true;
			}
		}

		for (var i in mapEntities)
		{
			if (c.y > mapEntities[i].y - mapEntities[i].depth && c.y - h < mapEntities[i].y
				&& c.x + (w/2) > mapEntities[i].x - (mapEntities[i].width/2) && c.x - (w/2) < mapEntities[i].x + (mapEntities[i].width/2))
			{
				blocked = true;
			}
		}

		if (blocked)
		{
			c.x = 0;
			c.y = 0;
		}
	}

	return c;
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

var CPU = function(x, y, spriteName, id, xp)
{
	var w = sizeOf("img//" + spriteName + "Down0.png").width;
	w -= w % 2;

	var h = sizeOf("img//" + spriteName + "Down0.png").height;

	if (x + y == 0)
	{
		var c = getSpawn(h, w);

		x = c.x;
		y = c.y;
	}

	//configure the entity
	this.entity = new Entity(x, y, spriteName);
	console.log("Spawning entity at (" + x + "," + y + ")");
	this.entity.width = w;
	this.entity.depth = Math.floor(h * 0.5);
	this.entity.height = h;
	this.entity.id = id;
	this.entity.xp = xp;
	this.entity.updateLevel();

	//configure CPU specific attributes
	this.target = null;
	this.targetType = "Neutral";
	this.directionCounter = 0;
	this.x_direction = 0;
	this.y_direction = 0;

  this.getTarget = function(targetList)
  {
    var nearest_target;
    for (var i in targetList)
    {
			// only target enemies not in your faction
			if (targetList[i].faction == null || targetList[i].faction != this.entity.faction)
			{
				// only target entities within 100 units
				if (nearest_target == null)
				{
					if(Math.max(Math.abs(targetList[i].x - this.entity.x), Math.abs(targetList[i].y - this.entity.y)) < 100)
					{
						nearest_target = i;
					}
				}
				
				else if (Math.abs(targetList[i].x - this.entity.x) + Math.abs(targetList[i].y - this.entity.y)
					< Math.abs(targetList[nearest_target].x - this.entity.x) + Math.abs(targetList[nearest_target].y - this.entity.y))
				{
					nearest_target = i;
				}
			}
    }
		if (nearest_target == null)
		{
			return null
		}
		else
		{
			return targetList[nearest_target].id;
		}
  };
};

CPU.prototype.update = function()
{
	// if an entity is aggressive, check once every 2 seconds if there are any nearby entities for them to fight
  if (new Date().getTime() % 2000 < 20 && this.targetType == "Aggressive")
  {
    var targetList = [];
    for (var i in connected)
    {
      if (connected[i].faction == null || connected[i].faction != this.entity.faction)
      {
        targetList.push(connected[i]);
      }
    }
    for (var i in mapEntities)
    {
      if (mapEntities[i].entity.faction == null || mapEntities[i].entity.faction != this.entity.function)
      {
        targetList.push(mapEntities[i].entity);
      }
    }
    this.target = this.getTarget(targetList);
  }

	var e = getEntity(this.target);

	if (e != null)
	{
		this.x_direction = 0;
		this.y_direction = 0;

		// move along the x-axis toward your target
		if (this.entity.x < e.x)
		{
			this.x_direction = 1;
		}
		else if (this.entity.x > e.x)
		{
			this.x_direction = -1;
		}

		// move along the y-axis toward your target
		if (this.entity.y < e.y)
		{
			this.y_direction = 1;
		}
		else if (this.entity.y > e.y)
		{
			this.y_direction = -1;
		}

		/* check if you can attack the target */
		if (this.entity.attack_counter <= 0)
		{
			// check if you should attack up or down
			if (this.entity.x <= e.x + (e.width / 2) && this.entity.x >= e.x - (e.width / 2))
			{
				if (Math.abs(this.entity.y - e.y) < this.entity.depth * 2)
				{
					this.entity.createAttack(1);
				}
				else
				{
					this.entity.createAttack(2);
				}
			}
			// check if you should attack left or right
			else if (this.entity.y > e.y - e.depth && this.entity.y - this.entity.depth < e.y)
			{
				if (Math.abs(this.entity.x - e.x) < this.entity.width * 2)
				{
					this.entity.createAttack(1);
				}
				else
				{
					this.entity.createAttack(2);
				}
			}
		}
	}
	else
	{
		if (this.directionCounter <= 0)
		{
			this.x_direction = Math.round(Math.random() * 2)-1;
			this.y_direction = Math.round(Math.random() * 2)-1;
			this.directionCounter = Math.ceil(Math.random() * 55) + 5;
		}
	}

	this.directionCounter--;

	this.entity.move(this.x_direction * 0.5, this.y_direction * 0.5);

	if (e != null && (this.entity.attack_counter <= 5
		|| (this.entity.attack_counter == this.entity.attack_length))) //let them change direction in the first attack frame
	{
		// check if you should face left / right
		if (Math.abs(e.x - this.entity.x) >= Math.abs(e.y - this.entity.y))
		{
			if (e.x > this.entity.x)
			{
				this.entity.direction = "Right";
			}
			else if (e.x < this.entity.x)
			{
				this.entity.direction = "Left";
			}
		}
		// face up / down
		else
		{
			if (e.y > this.entity.y)
			{
				this.entity.direction = "Down";
			}
			else if (e.y < this.entity.y)
			{
				this.entity.direction = "Up";
			}
		}
	}

	this.entity.update();
};

CPU.prototype.setTarget = function(id)
{
	var e = getEntity(id);
	
	// make sure the target is not on your side
	if (e.faction == null || e.faction != this.entity.faction)
	{
		// if you have no existing target, target the new entity
		if (this.target == null)
		{
			this.target = id;
		}
		// if you already have an existing target, target the closer entity
		else
		{
			var t = getEntity(this.target);
			
			if (Math.abs(e.x - this.entity.x) + Math.abs(e.y - this.entity.y) < Math.abs(t.x - this.entity.x) + Math.abs(e.y - this.entity.y))
			{
				this.target = id;
			}
		}
	}
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

// CPUs should stop targeting someone after they die
function clearAgro(id)
{
	for (var i in mapEntities)
	{
		if (mapEntities[i].target == id)
		{
			mapEntities[i].target = null;
		}
	}
}

// move computer controlled NPCs
setInterval(function()
{
	updateCollisionList();

	checkDamage();

// update all the entities on the map
	for (var i in mapEntities)
	{
		mapEntities[i].update();
		if (mapEntities[i].entity.current_health <= 0)
		{
			entityDeath(mapEntities[i].entity);
			var e = new CPU(0,0,mapEntities[i].entity.spriteName, mapEntities[i].entity.id, mapEntities[i].entity.xp);
			e.entity.faction = mapEntities[i].entity.faction;
			e.targetType = mapEntities[i].targetType;
			mapEntities[i] = e;
		}
	}

  // check if any players have been disconnected for 10 seconds
  for (var i in connected)
  {
    connected[i].disconnect_counter++;

    if (connected[i].disconnect_counter > 600)
    {
      // remove the disconnected player
      delete connected[i];
			clearAgro(i);
    }
  }

}, 1000/60);

// when a unit dies, divide EXP across anyone who damaged them in the past 30 seconds
function entityDeath(entity)
{
	var xp = 10 * entity.lvl;
	console.log(killParticipation[entity.id] + " killed " + entity.id + " and gained " + xp + " XP");

		if (killParticipation[entity.id] != null && !Number.isInteger(killParticipation[entity.id]))
		{
			io.to(killParticipation[entity.id]).emit('xpgain', xp, entity);
		}

	killParticipation[entity.id] = null;
	clearAgro(entity.id);
}

// holds information about where damage will be applied
global.Damage = function(x, y, source, damage_time, damage)
{
	this.x = x;
	this.y = y;
	this.source = source;
	this.damage_time = damage_time;
	this.damage = damage;

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
};

// holds information about projectiles on-screen
global.Projectile = function(x, y, x_speed, y_speed, source, spawn_time, damage, spriteName)
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
};

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

					// track most recent attackers
					killParticipation[connected[j].id] = damageList[i].source;

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

					// tell the CPU to target that entity
					mapEntities[j].setTarget(damageList[i].source);

					// track most recent attackers
					killParticipation[mapEntities[j].entity.id] = damageList[i].source;

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

						// track most recent attackers
						killParticipation[connected[j].id] = projectileList[i].source;

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

						// tell the CPU to target that entity
						mapEntities[j].setTarget(projectileList[i].source);

						// track most recent attackers
						killParticipation[mapEntities[j].entity.id] = projectileList[i].source;

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
			killParticipation[socket.id] = null;
		}
  );

  socket.on('movement', function(player)
	{
		if (player != null)// && player.entity.x != null)
		{
			player.id = socket.id;
			connected[socket.id] = player;
      connected[socket.id].disconnect_counter = 0;
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

	socket.on('death', function()
	{
		console.log("player died");
		entityDeath(connected[socket.id]);
	});

	socket.on('disconnect', function()
	{
    console.log(socket.id + " disconnected");
		delete connected[socket.id];
		clearAgro(socket.id);
		displayPlayerCount();
	});
});

// trasfer data to the client
setInterval(function()
{
	// send all entities on the map to the client
	for(var i in connected)
	{
		var players = new Array();

		// send the other connected players
		for(var j in connected)
		{
			if (j != i)
			{
				players.push(connected[j]);
			}
		}

		// send the CPUs
		for (var j in mapEntities)
		{
		    if (mapEntities[j].target == i)
		    {
		      	mapEntities[j].entity.allyState = "Enemy";
		    }
		    else
		    {
		      	mapEntities[j].entity.allyState = "Neutral";
		    }

			players.push(mapEntities[j].entity);
		}

		io.to(i).emit('players', players);
	}

  	// send all projectiles to the player
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
