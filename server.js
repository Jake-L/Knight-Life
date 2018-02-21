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

	// check if the users.txt file exists, and it create it if it does not
	fs.exists('C:\\Users\\ryand_000\\GitHub\\Knight Life\\users.txt', function(exists)
	{
		if (exists == false)
		{
			fs.writeFile('C:\\Users\\ryand_000\\GitHub\\Knight Life\\users.txt', '', function(err) 
			{
				if (err)
				{
					console.log("unable to create users.txt");
				}
				else
				{
					console.log("users.txt file created successfully!");
				}
			});
		}
	});
});

// Constants
global.maxX = [1000,1000];
global.minY = [30,30];
global.maxY = [500,800];

// other shared variables
global.projectileList = []; // keep track of all active projectiles
global.damageList = []; // keep track of all upcoming attacks

var mapObject = require('./mapobject.js').mapObject;
global.Attack = require('./attack.js').Attack; 
var Entity = require('./entity.js').Entity;
var sizeOf = require('image-size');
var fs = require('fs');

global.mapEntities = []; // all the CPUs
global.mapObjects = []; // non-moving map objects like rocks
global.connected = []; // connected players
var connection = []; 
var killParticipation = []; // keep track of players who recently attacked an enemy
var items = [];
var updateCounter = 0;
var updateTime = new Date().getTime();

function initializeMap()
{
	for (var mapId in maxX)
	{
		projectileList[mapId] = [];
		damageList[mapId] = [];
		mapObjects[mapId] = [];
		mapEntities[mapId] = [];
		killParticipation[mapId] = {};
		items[mapId] = [];
		connected[mapId] = {};
	}

	// load Map 0
	// load map objects (rocks, etc.)
	mapObjects[0].push(new mapObject(100,200,"rock1"));
	mapObjects[0].push(new mapObject(700,350,"bigrock"));
	mapObjects[0].push(new mapObject(400,400,"rock1"));

	// spawn knights
	for (var i = 0; i < 6; i++)
	{
		mapEntities[0][i] = new CPU(0, 0, "player", i, i+1, 0);    
		killParticipation[0][i] = [];
	}

	var n = mapEntities[0].length;

	// spawn icemen
	for (var i = n; i < n + 3; i++)
	{
		mapEntities[0][i] = new CPU(0, 0, "iceman", i, 5, 0);
		mapEntities[0][i].entity.faction = "iceman";
		mapEntities[0][i].targetType = "Aggressive";
		killParticipation[0][i] = [];
	}

	// load Map 1
	// load map objects (rocks, etc.)
	mapObjects[1].push(new mapObject(100,200,"snowman"));
	mapObjects[1].push(new mapObject(700,350,"snowman"));
	mapObjects[1].push(new mapObject(400,400,"snowman"));

	// spawn icemen
	for (var i = 0; i < 3; i++)
	{
		mapEntities[1][i] = new CPU(0, 0, "iceman", i, 5, 1);
		mapEntities[1][i].entity.faction = "iceman";
		mapEntities[1][i].targetType = "Aggressive";
		killParticipation[1][i] = [];
	}

	// ALL MAPS
	// set dimensions of map objects for each mapId
	for (var mapId in mapObjects)
	{
		for (var i in mapObjects[mapId])
		{
			mapObjects[mapId][i].width = sizeOf("img//" + mapObjects[mapId][i].spriteName + ".png").width;
			mapObjects[mapId][i].height = sizeOf("img//" + mapObjects[mapId][i].spriteName + ".png").height;
			mapObjects[mapId][i].depth = sizeOf("img//" + mapObjects[mapId][i].spriteName + ".png").height;
		}
	}
}

// get x,y coordinates of a valid spawn point for an object of the given height and width
function getSpawn(h, w, mapId)
{
	var c = {x: 0, y: 0};
	var count = 0;

	while (c.x + c.y == 0 && count < 100)
	{
		c.x = Math.ceil(Math.random() * maxX[mapId]);
		c.y = Math.ceil((Math.random() * (maxY[mapId] - minY[mapId])) + minY[mapId]);
		count++;

		var blocked = false;

		for (var i in connected[mapId])
		{
			if (c.y > connected[mapId][i].y - connected[mapId][i].depth && c.y - h < connected[mapId][i].y
				&& c.x + (w/2) > connected[mapId][i].x - (connected[mapId][i].width/2) && c.x - (w/2) < connected[mapId][i].x + (connected[mapId][i].width/2))
			{
				blocked = true;
			}
		}

		for (var i in mapEntities[mapId])
		{
			if (c.y > mapEntities[mapId][i].y - mapEntities[mapId][i].depth && c.y - h < mapEntities[mapId][i].y
				&& c.x + (w/2) > mapEntities[mapId][i].x - (mapEntities[mapId][i].width/2) && c.x - (w/2) < mapEntities[mapId][i].x + (mapEntities[mapId][i].width/2))
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
	var p = new Entity(old.x, old.y, old.spriteName, old.mapId);
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
function updateNearbyObjects()
{
	for (var mapId in mapEntities)
	{
		for (var i in mapEntities[mapId])
		{
			var c = [];

			// find nearby CPUs
			for (var j in mapEntities[mapId])
			{
				if (i != j)
				{
					c.push({id: j, type: "cpu"});
				}
			}

			// find nearby players
			for (var j in connected[mapId])
			{
				if (Math.abs(connected[mapId][j].x - mapEntities[mapId][i].entity.x) <= 120 && Math.abs(connected[mapId][j].y - mapEntities[mapId][i].entity.y) <= 120)
				{
					c.push({id: j, type: "player"});
				}
			}

			// find nearby map objects (rocks, etc.)
			for (var j in mapObjects[mapId])
			{
				if (Math.abs(mapObjects[mapId][j].x - mapEntities[mapId][i].entity.x) <= 60 && Math.abs(mapObjects[mapId][j].y - mapEntities[mapId][i].entity.y) <= 60)
				{
					c.push({id: j, type: "mapObject"});
				}
			}

			mapEntities[mapId][i].entity.nearbyObjects = c;
		}
	}
}

Entity.prototype.getNearbyObjects = function()
{
	var objectList = [];

	for (var i in this.nearbyObjects)
	{
		// retrive CPUs
		if (this.nearbyObjects[i].type == "cpu" && typeof(mapEntities[this.mapId][this.nearbyObjects[i].id]) !== 'undefined')
		{
			objectList.push(mapEntities[this.mapId][this.nearbyObjects[i].id].entity);
		}
		// retrieve players
		else if (this.nearbyObjects[i].type == "player" && typeof(connected[this.mapId][this.nearbyObjects[i].id]) !== 'undefined')
		{
			objectList.push(connected[this.mapId][this.nearbyObjects[i].id]);
		}
		// retrieve mapObjects
		else if (this.nearbyObjects[i].type == "mapObject" && typeof(mapObjects[this.mapId][this.nearbyObjects[i].id]) !== 'undefined')
		{
			objectList.push(mapObjects[this.mapId][this.nearbyObjects[i].id]);
		}
	}

	return objectList;
}

var CPU = function(x, y, spriteName, id, lvl, mapId)
{
	var w = sizeOf("img//" + spriteName + "Down0.png").width;
	w -= w % 2;

	var h = sizeOf("img//" + spriteName + "Down0.png").height;

	if (x + y == 0)
	{
		var c = getSpawn(h, w, mapId);

		x = c.x;
		y = c.y;
	}

	//configure the entity
	this.entity = new Entity(x, y, spriteName, mapId);
	console.log("Spawning entity at (" + x + "," + y + ") on map " + mapId);
	this.entity.width = w;
	this.entity.depth = Math.floor(h * 0.5);
	this.entity.height = h;
	this.entity.id = id;
	this.entity.setLevel(lvl);

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
		if (nearest_target == null || targetList[nearest_target].id == this.target)
		{
			// keep the same target
		}
		else
		{
			this.directionCounter = 0;
			this.target = targetList[nearest_target].id;
		}
	};
};

CPU.prototype.update = function()
{
	// if an entity is aggressive, check once every 2 seconds if there are any nearby entities for them to fight
	if (new Date().getTime() % 2000 < 20 && this.targetType == "Aggressive")
	{
		var targetList = [];
		for (var i in connected[this.entity.mapId])
		{
			if (connected[this.entity.mapId][i].faction == null || connected[this.entity.mapId][i].faction != this.entity.faction || connected[this.entity.mapId][i].id == this.target)
			{
				targetList.push(connected[this.entity.mapId][i]);
			}
		}
		for (var i in mapEntities[this.entity.mapId])
		{
			if (mapEntities[this.entity.mapId][i].entity.faction == null || mapEntities[this.entity.mapId][i].entity.faction != this.entity.faction || mapEntities[this.entity.mapId][i].id == this.target)
			{
				targetList.push(mapEntities[this.entity.mapId][i].entity);
			}
		}

		this.getTarget(targetList);
		
	}

	var e = getEntity(this.target, this.entity.mapId);

	if (new Date().getTime() % 2000 < 20 && e != null && (Math.max(Math.abs(e.x - this.entity.x), Math.abs(e.y - this.entity.y)) > 200))
	{
		e = null;
		this.target = null;
	}

	if (e != null)
	{

		if (this.directionCounter <= 0)
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
			if (this.entity.y < e.y - (e.depth / 2))
			{
				this.y_direction = 1;
			}
			else if (this.entity.y > e.y)
			{
				this.y_direction = -1;
			}
		}

		/* check if you can attack the target */
		if (this.entity.attack_counter <= 1)
		{
			// check if you should attack up or down
			if (this.entity.x <= e.x + (e.width / 2) && this.entity.x >= e.x - (e.width / 2))
			{
				if (Math.abs(this.entity.y - e.y) < this.entity.depth * 1.5)
				{
					this.entity.setAttack(0);
				}
				else
				{
					this.entity.setAttack(1);
				}
			}
			// check if you should attack left or right
			else if (this.entity.y > e.y - e.depth && this.entity.y - this.entity.depth < e.y)
			{
				if (Math.abs(this.entity.x - e.x) < this.entity.width * 1.5)
				{
					this.entity.setAttack(0);
				}
				else
				{
					this.entity.setAttack(1);
				}
			}
		}
	}
	else
	{
		this.target = null;
		if (this.directionCounter <= 0)
		{
			this.x_direction = Math.round(Math.random() * 2)-1;
			this.y_direction = Math.round(Math.random() * 2)-1;
			this.directionCounter = Math.ceil(Math.random() * 55) + 5;
		}
	}

	this.directionCounter--;

	var blocked_directions = this.entity.move(this.x_direction * 0.5, this.y_direction * 0.5);

	// check if something is blocking your path from reaching your target
	if (e != null && this.entity.y_speed == 0 && this.entity.x_speed == 0 && this.entity.attack != 1 && this.directionCounter <= 1)
	{
		// if you need to chase your target along the x-axis
		if (this.x_direction != 0 && this.y_direction == 0 && Math.abs(this.entity.x - e.x) >= this.entity.width * 1.5)
		{
			console.log("enhanced targeting on x-axis");
			// check if they should walk up
			if (blocked_directions[1] == 0 && blocked_directions[3] == 1)
			{
				this.y_direction = -1;
			}
			// check if they should walk down
			else if (blocked_directions[1] == 1 && blocked_directions[3] == 0)
			{
				this.y_direction = 1;
			}
			// check if they could move in either direction
			else if (blocked_directions[1] == 0 && blocked_directions[3] == 0)
			{
				if (this.directionCounter == 1)
				{
					this.y_direction *= -1;
					console.log("reversing direction");
				}
				else if (this.entity.y > e.y || e.y_speed > 0)
				{
					this.y_direction = 1;
				}
				else
				{
					this.y_direction = -1;
				}
			}
			// if they can't move up or down, then change x-directions
			else
			{
				this.x_direction *= -1;
			}

			this.directionCounter =  (Math.abs(this.entity.y - e.y) + this.entity.depth + (e.depth / 2)) * 2;
		}
		// if you need to chase your target along the y-axis
		else if (this.x_direction == 0 && this.y_direction != 0 && Math.abs(this.entity.y - e.y) >= this.entity.depth * 1.5)
		{
			console.log("enhanced targeting on y-axis");
			// check if they should walk left
			if (blocked_directions[0] == 0 && blocked_directions[2] == 1)
			{
				this.x_direction = -1;
			}
			// check if they should walk right
			else if (blocked_directions[0] == 1 && blocked_directions[2] == 0)
			{
				this.x_direction = 1;
			}
			// check if they could move in either direction
			else if (blocked_directions[0] == 0 && blocked_directions[2] == 0)
			{
				if (this.directionCounter == 1)
				{
					this.x_direction *= -1;
					console.log("reversing direction");
				}
				if (this.entity.x > e.x || e.x_speed > 0)
				{
					this.x_direction = 1;
				}
				else
				{
					this.x_direction = 1;
				}
			}
			// if they can't move up or down, then change x-directions
			else
			{
				this.y_direction *= -1;
				this.x_direction *= -1;
			}

			this.directionCounter = (Math.abs(this.entity.x - e.x) + this.entity.width + (e.width / 2)) * 2;
		}
		// need to chase them along both axis
		else if (Math.abs(this.entity.x - e.x) >= this.entity.width * 1.5 && Math.abs(this.entity.y - e.y) >= this.entity.depth * 1.5)
		{
			console.log("enhanced targeting on both axis");
			this.directionCounter = (Math.abs(this.entity.x - e.x) + Math.abs(this.entity.y - e.y) + (e.depth / 2) + (e.width / 2)) * 2;
		}

		if (this.directionCounter > 1)
		{
			this.entity.move(this.x_direction * 0.5, this.y_direction * 0.5);
		}
	}

	if (e != null && (this.entity.attack_counter <= 5 || (this.entity.current_attack >= 0 && this.entity.attack_counter == this.entity.attacks[this.entity.current_attack].frame_length))) //let them change direction in the first attack frame
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
	if (this.target != id)
	{
		var e = getEntity(id, this.entity.mapId);
		
		// make sure the target is not on your side
		if (e != null && (e.faction == null || e.faction != this.entity.faction))
		{
			// if you have no existing target, target the new entity
			if (this.target == null)
			{
				this.target = id;
				this.directionCounter = 0;
			}
			// if you already have an existing target, target the closer entity
			else
			{
				var t = getEntity(this.target, this.entity.mapId);

				if (t != null)
				{
					if (Math.abs(e.x - this.entity.x) + Math.abs(e.y - this.entity.y) < Math.abs(t.x - this.entity.x) + Math.abs(t.y - this.entity.y))
					{
						this.target = id;
						this.directionCounter = 0;
					}
				}
			}
		}
	}
};

// returns the entity with the given ID
// may be a player or CPU
function getEntity(id, mapId)
{

	if (id == null)
	{
		return null;
	}
	else if (typeof connected[mapId][id] !== 'undefined')
	{
		return connected[mapId][id];
	}
	else if (typeof mapEntities[mapId][id] !== 'undefined')
	{
		return mapEntities[mapId][id].entity;
	}
	else
	{
		return null;
	}
}

// CPUs should stop targeting someone after they die
function clearAgro(id, mapId)
{
	for (var i in mapEntities[mapId])
	{
		if (mapEntities[mapId][i].target == id)
		{
			mapEntities[mapId][i].target = null;
		}
	}

	killParticipation[mapId][id] = [];
}

// move computer controlled NPCs
setInterval(function()
{
	if (updateCounter % 15 == 0)
	{
		updateNearbyObjects();
	}
	checkDamage();

	// spawn money on the map
	if (new Date().getTime() % 1000 == 0)
	{
		items[0].push(new Item("money", Math.ceil(Math.random() * 5) + 1, Math.random() * maxX[0], Math.random() * maxY[0]));
	}

	// update all the entities on the map
	for (var mapId in mapEntities)
	{
		for (var i in mapEntities[mapId])
		{
			mapEntities[mapId][i].update();
			
			if (mapEntities[mapId][i].entity.current_health <= 0)
			{
				entityDeath(mapEntities[mapId][i].entity);
				var e = new CPU(0,0,mapEntities[mapId][i].entity.spriteName, mapEntities[mapId][i].entity.id, mapEntities[mapId][i].entity.lvl, mapId);
				e.entity.faction = mapEntities[mapId][i].entity.faction;
				e.targetType = mapEntities[mapId][i].targetType;
				mapEntities[mapId][i] = e;
			}
		}
	}

	// check if any players have picked up items
	for (var mapId in items)
	{
		for (var j in connected[mapId])
		{
			var i = 0;
			while (i < items[mapId].length)
			{
				if (items[mapId][i].collisionCheck(connected[mapId][j]))
				{
					// tell the client that they picked up the item
					io.to(connected[mapId][j].id).emit('itemreceived', items[mapId][i]);
					console.log(connected[mapId][j].display_name + " picked up " + items[mapId][i].quantity + " " + items[mapId][i].name);

					// remove the item from the list now that it's been picked up
					items[mapId].splice(i, 1);
				}
				else
				{
					i++;
				}
			}
		}
	}

  	// remove players who haven't updated their position in over 3 seconds
	for (var id in connection)
	{
		if (connection[id].last_update + 3000 < new Date().getTime())
		{
			console.log(id + " was kicked for inactivity");
			delete connected[connection[id].mapId][id];
			clearAgro(id, connection[id].mapId);
			delete connection[id];
		}
	}
	updateCounter++;

}, 1000/60);


// add the attacker to the list of people who have damaged the victim
function addKillParticipation(victim, attacker, mapId)
{
	if(getEntity(attacker, mapId) != null)
	{
		if (typeof(killParticipation[mapId][victim]) === "undefined" || killParticipation[mapId][victim] == null)
		{
			killParticipation[mapId][victim] = [];
		}
		
		// add the attacker to the list of people who have damaged the victim
		killParticipation[mapId][victim].unshift(attacker);

		// remove any previous instances of the attacker in the array
		var i = 1;
		while (i < killParticipation[mapId][victim].length)
		{
			if (killParticipation[mapId][victim][i] == attacker)
			{
				delete killParticipation[mapId][victim][i];
			}
			else
			{
				i++;
			}
		}
	}
}

// when a unit dies, divide EXP across anyone who damaged them in the past 30 seconds
function entityDeath(entity)
{
	if (typeof(killParticipation[entity.mapId][entity.id]) !== "undefined" && killParticipation[entity.mapId][entity.id] != null && killParticipation[entity.mapId][entity.id].length > 0)
	{
		// if others assisted in the kill they get a fraction of the XP
		if (killParticipation[entity.mapId][entity.id].length > 1)
		{
			var n = Math.min(4, killParticipation[entity.mapId][entity.id].length - 1);
			var xp = Math.ceil(5 * entity.lvl / n);

			for (i = 1; i < killParticipation[entity.mapId][entity.id].length; i++)
			{
				if (!Number.isInteger(killParticipation[entity.mapId][entity.id][i]))
				{
					io.to(killParticipation[entity.mapId][entity.id][i]).emit('xpgain', xp, entity);
					io.to(killParticipation[entity.mapId][entity.id][i]).emit('itemreceived', {name: "money", quantity: Math.ceil((Math.random() + 1) * entity.lvl)});
				}
			}

			// player who dealt the killing blow get half XP if others participated
			xp = 5 * entity.lvl;
		}

		// if only one person participated in the kill they get full XP
		else
		{
			var xp = 10 * entity.lvl;
		}

		console.log(killParticipation[entity.mapId][entity.id][0] + " killed " + entity.id + " and gained " + xp + " XP");

		if (!Number.isInteger(killParticipation[entity.mapId][entity.id][0]))
		{
			io.to(killParticipation[entity.mapId][entity.id][0]).emit('xpgain', xp, entity);
			io.to(killParticipation[entity.mapId][entity.id][0]).emit('itemreceived', {name: "money", quantity: Math.ceil((Math.random() + 1) * entity.lvl)});
		}
	}

	killParticipation[entity.mapId][entity.id] = [];
	clearAgro(entity.id, entity.mapId);
}

// holds information about where damage will be applied
global.Damage = function(x, y, source, damage_time, damage, mapId)
{
	this.x = x;
	this.y = y;
	this.source = source;
	this.damage_time = damage_time;
	this.damage = damage;
	this.mapId = mapId;

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
global.Projectile = function(x, y, x_speed, y_speed, source, update_time, damage, spriteName, mapId)
{
	this.x = x;
	this.y = y;
	this.spawn_x = x;
	this.spawn_y = y;
	this.z = 4;
	this.x_speed = x_speed;
	this.y_speed = y_speed;
	this.source = source;
	this.damage = damage;
	this.spriteName = spriteName;
	this.height = 8;
	this.width = 8;
	this.depth = 6;
	this.update_time = update_time;
	this.mapId = mapId;

	this.update = function()
	{
		if(new Date().getTime() > this.update_time)
		{
			var n = Math.floor((new Date().getTime() - this.update_time)/(1000/60));
			this.x = this.spawn_x + (n * this.x_speed);
			this.y = this.spawn_y + (n * this.y_speed);
		}
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
		if (this.x - this.width > maxX[this.mapId] || this.x + this.width < 0 || this.y < 0 || this.y - this.height > maxY[this.mapId])
		{
			return true;
		}
		else 
		{
			return false;
		}
	};
};


function Item(name, quantity, x, y)
{
	this.name = name;
	this.quantity = quantity;
	this.x = x;
	this.y = y;
	this.z = 2;
};

Item.prototype.collisionCheck = function(e)
{
	if (e.x - (e.width / 2) <= this.x && e.x + (e.width / 2) >= this.x 
		&& e.y - (e.depth / 2) <= this.y && e.y + (e.depth / 2) >= this.y)
	{
		return true;
	} 
	else
	{
		return false;
	}
};

// check if an attack damaged any entities
function checkDamage()
{
	var currentTime = new Date();
	for (var mapId in damageList)
	{
		var n = damageList[mapId].length;

		// go through every active attack
		for (var i = 0; i < n; i++)
		{
			// check if the animation reached the frame where it does damage
			if (currentTime.getTime() >= damageList[mapId][i].damage_time)
			{
				// check every connected player to see if they were hit
				for (var j in connected[mapId])
				{
					if (damageList[mapId][i].source != connected[mapId][j].id && damageList[mapId][i].collisionCheck(connected[mapId][j]))
					{
						// tell the client that they took damage
						io.to(connected[mapId][j].id).emit('damageIn', damageList[mapId][i].x, damageList[mapId][i].y, damageList[mapId][i].damage);

						// track most recent attackers
						addKillParticipation(connected[mapId][j].id, damageList[mapId][i].source, mapId);

						console.log(connected[mapId][j].display_name + " took " + damageList[mapId][i].damage + " damage");
					}
				}

				// check every cpu to see if they were hit
				for (var j in mapEntities[mapId])
				{
					if (damageList[mapId][i].source != mapEntities[mapId][j].entity.id && damageList[mapId][i].collisionCheck(mapEntities[mapId][j].entity))
					{
						// damage the entity
						mapEntities[mapId][j].entity.takeDamage(damageList[mapId][i].x, damageList[mapId][i].y, damageList[mapId][i].damage);

						// tell the CPU to target that entity
						mapEntities[mapId][j].setTarget(damageList[mapId][i].source);

						// track most recent attackers
						addKillParticipation(mapEntities[mapId][j].entity.id, damageList[mapId][i].source, mapId);

						console.log(mapEntities[mapId][j].entity.display_name + mapEntities[mapId][j].entity.id + " took " + damageList[mapId][i].damage + " damage");
					}
				}

			damageList[mapId].splice(i,1);
			i--;
			n--;
			}
		}
	}

	// go through every active projectile
	for (var mapId in projectileList)
	{
		n = projectileList[mapId].length;

		for (var i = 0; i < n; i++)
		{
			if (currentTime.getTime() >= projectileList[mapId][i].update_time)
			{
				projectileList[mapId][i].update();

				if (projectileList[mapId][i].offscreen())
				{
					projectileList[mapId].splice(i, 1);
					i--;
					n--;
				}

				else
				{
					var dmg = false;

					// check every connected player to see if they were hit
					for (var j in connected[mapId])
					{
						if (projectileList[mapId][i].source != connected[mapId][j].id && projectileList[mapId][i].collisionCheck(connected[mapId][j]))
						{
							// tell the client that they took damage
							io.to(connected[mapId][j].id).emit('damageIn', projectileList[mapId][i].x, projectileList[mapId][i].y, projectileList[mapId][i].damage);

							// track most recent attackers
							addKillParticipation(connected[mapId][j].id, projectileList[mapId][i].source, mapId);

							console.log(connected[mapId][j].display_name + " took " + projectileList[mapId][i].damage + " damage");
							dmg = true;
						}
					}

					// check every cpu to see if they were hit
					for (var j in mapEntities[mapId])
					{
						if (projectileList[mapId][i].source != mapEntities[mapId][j].entity.id && projectileList[mapId][i].collisionCheck(mapEntities[mapId][j].entity))
						{
							// damage the entity
							mapEntities[mapId][j].entity.takeDamage(projectileList[mapId][i].x, projectileList[mapId][i].y, projectileList[mapId][i].damage);

							// tell the CPU to target that entity
							mapEntities[mapId][j].setTarget(projectileList[mapId][i].source);

							// track most recent attackers
							addKillParticipation(mapEntities[mapId][j].entity.id, projectileList[mapId][i].source, mapId);

							console.log(mapEntities[mapId][j].entity.display_name + mapEntities[mapId][j].entity.id + " took " + projectileList[mapId][i].damage + " damage");
							dmg = true;
						}
					}

					if (dmg)
					{
						projectileList[mapId].splice(i, 1);
						i--;
						n--;
					}
				}
			}
		}

	}


}


// retrieve data from the client
io.on('connection', function(socket)
{
	console.log(socket.id + " connected");

	socket.on('new player', function(mapId)
		{
			console.log("new player on map " + mapId);
			connection[socket.id] = {mapId: mapId, last_update: new Date().getTime()};
			io.to(socket.id).emit('mapObjects', mapObjects[mapId]);
			killParticipation[mapId][socket.id] = [];
		}
  	);

  	socket.on('movement', function(player)
	{
		if (player != null)// && player.entity.x != null)
		{
			player.id = socket.id;
			connected[player.mapId][socket.id] = player;
			if (connection[socket.id] != null)
			{
				connection[socket.id].last_update = new Date().getTime();

				// update the player lists and kill participation lists if a player changes maps
				if (connection[socket.id].mapId != player.mapId)
				{
					console.log("player changed maps from " + connection[socket.id].mapId + " to " + player.mapId);
					clearAgro(socket.id, connection[socket.id].mapId);
					delete killParticipation[connection[socket.id].mapId][socket.id];
					killParticipation[player.mapId][socket.id] = [];
					delete connected[connection[socket.id].mapId][socket.id];
					connection[socket.id] = {mapId: player.mapId, last_update: new Date().getTime()};
					io.to(socket.id).emit('mapObjects', mapObjects[player.mapId]);
				}
			}
			else
			{
				connection[socket.id] = {mapId: player.mapId, last_update: new Date().getTime()};
				io.to(socket.id).emit('mapObjects', mapObjects[connection[socket.id].mapId]);
				killParticipation[connection[socket.id].mapId][socket.id] = [];
			}
		}
  	});

	socket.on('damageOut', function(x, y, damage_time, damage, mapId)
	{
		damageList[mapId].push(new Damage(x, y, socket.id, damage_time, damage, mapId));
	});

	socket.on('createProjectile', function(x, y, x_speed, y_speed, update_time, damage, spriteName, mapId)
	{
		projectileList[mapId].push(new Projectile(x, y, x_speed, y_speed, socket.id, Math.max(update_time, new Date().getTime()), damage, spriteName, mapId));
	});

	socket.on('death', function()
	{
		entityDeath(connected[connection[socket.id].mapId][socket.id]);
		connection[socket.id].last_update = new Date().getTime();
	});

	socket.on('disconnect', function()
	{
		console.log(socket.id + " disconnected");

		if (typeof(connection[socket.id]) !== "undefined")
		{
			console.log("Connection entry: " + connection[socket.id]);
			console.log("Connected entry: " + connected[connection[socket.id].mapId][socket.id]);
			clearAgro(socket.id, connection[socket.id].mapId);
			delete killParticipation[connection[socket.id].mapId][socket.id];
			delete connected[connection[socket.id].mapId][socket.id];
			delete connection[socket.id];
		}

		displayPlayerCount();
	});

	socket.on('login', function(username, password)
	{
		fs.readFile('C:\\Users\\ryand_000\\GitHub\\Knight Life\\users.txt', function(err, data) 
		{
		    if(err) 
		    {
		    	console.log("error reading from username file");
		    	io.to(socket.id).emit('loginresult', false);
			}
			//check if someone is already logged in with that username
			var success = true;
			for (var mapId in connected)
			{
				for (var j in connected[mapId])
				{
					if (connected[mapId][j].display_name == username)
					{
						success = false;
					}
				}
			}

			if (success == true)
			{
			    var array = data.toString().split("\n");
			    success = false;
			    for(i in array) 
			    {
			    	if(username == array[i].split(",")[0] && password == array[i].split(",")[1])
			    	{
			    		console.log("login successful for user " + username);
			    		io.to(socket.id).emit('loginresult', true, username);
			    		success = true;
			    	}
			    }
			}
		    if (success == false)
		    {
		    	io.to(socket.id).emit('loginresult', false);
		    }
		});
	});

	socket.on('register', function(username, password)
	{
		var valid = false;

		if (username != null && username.length >= 2 && password != null && password.length >= 4)
		{
			fs.readFile('C:\\Users\\ryand_000\\GitHub\\Knight Life\\users.txt', function(err, data) 
			{
			    if(err) 
			    {
			    	console.log("error reading from username file");
				}
				else
				{
					// check if the username is already in use
				    var array = data.toString().split("\n");
				    valid = true;
				    for(i in array) 
				    {
				    	if(username == array[i].split(",")[0])
				    	{
				    		// username is already in use, therefore not valid
				    		valid = false;
				    		break;
				    	}
				    }
				    // username is not already in use, so it is registered
				    if (valid == true)
				    {
				    	fs.appendFile('C:\\Users\\ryand_000\\GitHub\\Knight Life\\users.txt', username + "," + password + "\n", function(err) 
				    	{
						    if(err) 
						    {
						        console.log("error writing to username file");
						        valid = false;
						    }
						    else
						    {
							    console.log("User " + username + " was registered!");
							    io.to(socket.id).emit('registrationresult', true, username);
							}
					    });
				    }
				}
			});
		}

		if (valid == false)
		{
			io.to(socket.id).emit('registrationresult', false);
		}
	});
});

// trasfer data to the client
setInterval(function()
{
	for (var mapId in connected)
	{
		// send all active projectiles to the client
		var p = [];

		for (var i in projectileList[mapId])
		{
			if (new Date().getTime() >= projectileList[mapId][i].update_time)
			{
				p.push(projectileList[mapId][i]);
			}
		}

		// send all entities on the map to the client
		for(var i in connected[mapId])
		{
			var players = [];

			// send the other connected players
			for(var j in connected[mapId])
			{
				if (j != i)
				{
					players.push(connected[mapId][j]);
				}
			}

			// send the CPUs
			for (var j in mapEntities[mapId])
			{
			    if (mapEntities[mapId][j].target == i)
			    {
			      	mapEntities[mapId][j].entity.allyState = "Enemy";
			    }
			    else
			    {
			      	mapEntities[mapId][j].entity.allyState = "Neutral";
			    }

				players.push(mapEntities[mapId][j].entity);
			}

			io.to(i).emit('players', players);
			io.to(i).emit('viewOnly', p, items[mapId]);
		}
	}

}, 1000/60);

setInterval(function()
{
	io.emit('ping',new Date().getTime());
}, 1000);

// update server status every 30 seconds
setInterval(function()
{
	displayPlayerCount();
}, 30000);

// display current number of players connected
function displayPlayerCount()
{
	console.log("FPS: " + updateCounter / (new Date().getTime() - updateTime));
	updateTime = new Date().getTime();
	updateCounter = 0;
	for (var mapId in connected)
	{
		var n = 0;

		for (var i in connected[mapId])
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

		console.log(t + " - " + n + " players connected and " + mapEntities[mapId].length + " CPUs on map " + mapId);
	}
}
