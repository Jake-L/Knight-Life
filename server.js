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
	fs.exists('users.txt', function(exists)
	{
		if (exists == false)
		{
			fs.writeFile('users.txt', '', function(err) 
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

	// create the saves directory if it does not exist
	fs.exists('saves', function(exists)
	{
		if (exists == false)
		{
			fs.mkdir('saves', function(err) 
			{
				if (err)
				{
					console.log("unable to create saves folder");
				}
				else
				{
					console.log("saves folder created successfully!");
				}
			});
		}
	});
});

// other shared variables
global.projectileList = []; // keep track of all active projectiles
global.damageList = []; // keep track of all upcoming attacks

var mapObject = require('./mapobject.js').mapObject;
global.Attack = require('./attack.js').Attack; 
global.itemDetail = require('./items.js').itemDetail;
var Entity = require('./entity.js').Entity;
global.maps = require('./maps.js').maps;
global.gridSize = require('./maps.js').gridSize;
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
	for (var mapId in maps)
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
	mapObjects[0].push(new mapObject(136,160,"castle"));
	mapObjects[0].push(new mapObject(200,200,"rock1"));
	mapObjects[0].push(new mapObject(700,350,"bigrock"));
	mapObjects[0].push(new mapObject(400,400,"rock1"));
	mapObjects[0].push(new mapObject(100,300,"treestump"));
	mapObjects[0].push(new mapObject(250,150,"treestump"));
	mapObjects[0].push(new mapObject(250,350,"loghouse"));
	mapObjects[0].push(new mapObject(450,250,"loghouse"));
	mapObjects[0].push(new mapObject(50,400,"pinetree"));
	mapObjects[0].push(new mapObject(75,425,"pinetree"));
	mapObjects[0].push(new mapObject(100,400,"pinetree"));
	mapObjects[0].push(new mapObject(125,425,"pinetree"));
	mapObjects[0].push(new mapObject(62,450,"pinetree"));
	mapObjects[0].push(new mapObject(87,475,"pinetree"));
	mapObjects[0].push(new mapObject(112,450,"pinetree"));
	mapObjects[0].push(new mapObject(137,475,"pinetree"));

	// spawn knights
	for (var i = 0; i < 6; i++)
	{
		mapEntities[0][i] = new CPU(0, 0, "player", i, i+1, 0);   
	}

	var e = new CPU(0, 0, "player", "0Gary", 6, 0)
	e.entity.targetType = "Aggressive"; 
	e.entity.display_name = "Gary"; 
	mapEntities[0][e.entity.id] = e;

	var e  = new CPU(0, 0, "player", "0Brian", 1, 0);
	e.entity.targetType = "Passive"; 
	e.entity.cutsceneId = 1; 
	e.entity.display_name = "Brian"; 
	mapEntities[0][e.entity.id] = e;

	var e  = new CPU(0, 0, "salesman", "0Patch", 1, 0);
	e.entity.targetType = "Passive"; 
	e.entity.cutsceneId = 4; 
	e.entity.display_name = "Patch"; 
	mapEntities[0][e.entity.id] = e;

	var e  = new CPU(0, 0, "player", "0Arthur", 3, 0);
	e.entity.targetType = "Passive"; 
	e.entity.cutsceneId = 8; 
	e.entity.display_name = "Arthur"; 
	mapEntities[0][e.entity.id] = e;

	var n = mapEntities[0].length;

	// spawn icemen
	for (var i = n; i < n + 3; i++)
	{
		mapEntities[0][i] = new CPU(0, 0, "iceman", i, 5, 0);
		mapEntities[0][i].entity.faction = "iceman";
		mapEntities[0][i].entity.targetType = "Aggressive";
	}

	// load Map 1
	// load map objects (rocks, etc.)
	mapObjects[1].push(new mapObject(100,200,"snowman"));
	mapObjects[1].push(new mapObject(700,350,"snowman"));
	mapObjects[1].push(new mapObject(400,400,"snowman"));
	mapObjects[1].push(new mapObject(200,500,"snowtreestump"));
	mapObjects[1].push(new mapObject(600,150,"snowtreestump"));
	mapObjects[1].push(new mapObject(400,500,"snowhouse"));
	mapObjects[1].push(new mapObject(600,600,"snowhouse"));

	// spawn icemen
	for (var i = 0; i < 3; i++)
	{
		mapEntities[1][i] = new CPU(0, 0, "iceman", i, 5, 1);
		mapEntities[1][i].entity.faction = "iceman";
		mapEntities[1][i].entity.targetType = "Aggressive";
	}

	var e = new CPU(0, 0, "player", "stevemap1", 6, 1); //last parameter is mapId, make sure it's correct
	e.entity.targetType = "Aggressive"; 
	e.entity.display_name = "Steve"; 
	mapEntities[1][e.entity.id] = e; //index must be equal to id

	var e  = new CPU(0, 0, "player", "1p1", 1, 1);
	e.entity.targetType = "Passive"; 
	e.entity.cutsceneId = 3; 
	e.entity.display_name = "Logan";
	e.entity.current_health = 1; 
	mapEntities[1][e.entity.id] = e;

	var e  = new CPU(0, 0, "salesman", "1p2", 1, 1);
	e.entity.targetType = "Passive"; 
	e.entity.cutsceneId = 4; 
	e.entity.display_name = "Pete";
	mapEntities[1][e.entity.id] = e;

	// load Map 2 (iceboss cave)
	mapObjects[2].push(new mapObject(10,10,"bones"));
	mapObjects[2].push(new mapObject(116,60,"bones"));

	// spawn boss in Map 2
	mapEntities[2]["iceboss"] = new CPU(0, 0, "iceboss", "iceboss", 50, 2);
	mapEntities[2]["iceboss"].entity.faction = "iceman";
	mapEntities[2]["iceboss"].entity.display_name = "Frostbite";
	//mapEntities[2]["iceboss"].entity.targetType = "Aggressive";

	// load first dungeon
	for (var i = 0; i < 3; i++)
	{
		mapEntities["da0"][i] = new CPU(0, 0, "iceman", i, 10, "da0");
		mapEntities["da0"][i].entity.faction = "iceman";
		mapEntities["da0"][i].entity.targetType = "Aggressive";

		mapEntities["da1"][i] = new CPU(0, 0, "iceman", i, 11, "da1");
		mapEntities["da1"][i].entity.faction = "iceman";
		mapEntities["da1"][i].entity.targetType = "Aggressive";

		mapEntities["da2"][i] = new CPU(0, 0, "iceman", i, 12, "da2");
		mapEntities["da2"][i].entity.faction = "iceman";
		mapEntities["da2"][i].entity.targetType = "Aggressive";
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

	// debug code to catch annoying mistakes
	for (var mapId in mapEntities)
	{
		for (var i in mapEntities[mapId])
		{
			if (mapEntities[mapId][i].entity.mapId != mapId)
			{
				console.log("ERROR: CPU " + mapEntities[mapId][i].entity.display_name + " " + mapEntities[mapId][i].entity.id + " has incorrect mapId");
			}
			if (mapEntities[mapId][i].entity.id != i)
			{
				console.log("ERROR: CPU " + mapEntities[mapId][i].entity.display_name + " " + mapEntities[mapId][i].entity.id + " has incorrect id");
			}
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
		c.x = Math.ceil(Math.random() * maps[mapId][0].length * gridSize);
		c.y = Math.ceil(((Math.random() * (maps[mapId].length * gridSize - (gridSize * 2) - h)) + (gridSize * 2) + (h/2)));
		count++;

		var blocked = false;

		// dont spawn CPUs inside of walls
		if (typeof(maps[mapId][Math.round(c.y / gridSize)]) === 'undefined'
			|| typeof(maps[mapId][Math.round(c.y / gridSize)][Math.round(c.x / gridSize)]) === 'undefined'
			|| maps[mapId][Math.round(c.y / gridSize)][Math.round(c.x / gridSize)].includes("Wall"))
		{
			blocked = true;
		}

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

		for (var i in mapObjects[mapId])
		{
			if (c.y > mapObjects[mapId][i].y - mapObjects[mapId][i].depth && c.y - h < mapObjects[mapId][i].y
				&& c.x + (w/2) > mapObjects[mapId][i].x - (mapObjects[mapId][i].width/2) && c.x - (w/2) < mapObjects[mapId][i].x + (mapObjects[mapId][i].width/2))
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
	console.log("Spawning entity " + spriteName + id + " at (" + x + "," + y + ") on map " + mapId);
	this.entity.width = w;
	this.entity.depth = Math.ceil(h * 0.5);
	this.entity.height = h;
	this.entity.id = id;
	this.entity.setLevel(lvl);
	killParticipation[mapId][id] = [];

	//configure CPU specific attributes
	this.target = null;
	this.directionCounter = 0;
	this.x_direction = 0;
	this.y_direction = 0;


	if (spriteName == "player")
	{
		this.entity.addClothing("defaulthair");
	}
	else if (spriteName == "salesman")
	{
		this.entity.spriteName = "player";
		this.entity.addClothing("salesman");
	}

	this.getTarget = function(targetList)
	{
	    var nearest_target;

	    if (typeof(targetList[this.target]) === 'undefined' || targetList[this.target].targetType == "Passive")
	    {
	    	this.target = null;
	    }

	    for (var i in targetList)
	    {
			// only target enemies not in your faction
			if ((targetList[i].faction == null || targetList[i].faction != this.entity.faction) && targetList[i].targetType != "Passive" && targetList[i].id != this.entity.id)
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
	// if an entity is aggressive, check once every second if there are any nearby entities for them to fight
	if (new Date().getTime() % 1000 < 20 && this.entity.targetType == "Aggressive")
	{
		var targetList = [];
		for (var i in connected[this.entity.mapId])
		{
			if (this.entity.faction == null || connected[this.entity.mapId][i].faction == null || connected[this.entity.mapId][i].faction != this.entity.faction || connected[this.entity.mapId][i].id == this.target)
			{
				targetList.push(connected[this.entity.mapId][i]);
			}
		}
		for (var i in mapEntities[this.entity.mapId])
		{
			if (this.entity.faction == null || mapEntities[this.entity.mapId][i].entity.faction == null || mapEntities[this.entity.mapId][i].entity.faction != this.entity.faction || mapEntities[this.entity.mapId][i].id == this.target)
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
	if (this.target != id && this.entity.targetType != "Passive")
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

// remove players from a map if they disconnect, change maps, etc
function removePlayer(id, mapId)
{
	clearAgro(id, mapId);
	delete killParticipation[mapId][id];
	delete connected[mapId][id];
	delete connection[id];

	// notify other players on the same map that the player has disconnected
	for (var i in connected[mapId])
	{
		io.to(i).emit('removePlayer', id);
	}
}

// move computer controlled NPCs
setInterval(function()
{
	if (updateCounter % 15 == 0)
	{
		updateNearbyObjects();
	}

	if (updateCounter % 30 == 0)
	{
		var playerOnMap = 0;
		for (var i in connected[2])
		{
			playerOnMap++;
			break;
		}
		if (playerOnMap > 0)
		{
			// spawn falling rocks on the map
			projectileList[2].push(new Projectile(Math.ceil(Math.random() * maps[2][0].length * gridSize) + 100, Math.ceil(Math.random() * maps[2].length * gridSize), 100, -1, 0, -1, "iceboss", new Date().getTime(), 10, "meteor", 1));
		}
	}

	checkDamage();

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
				e.entity.targetType = mapEntities[mapId][i].entity.targetType;
				e.entity.display_name = mapEntities[mapId][i].entity.display_name;
				mapEntities[mapId][i] = e;
			}
		}
	}

	// check if any players have picked up items
	for (var mapId in items)
	{
		// spawn money on the map
		if (items[mapId].length < 10 && new Date().getTime() % 2000 == 0)
		{
			var c = getSpawn(16,16,mapId);
			items[mapId].push(new Item("money", Math.ceil(Math.random() * 5) + 1, c.x, c.y, null, true));
		}

		for (var j in connected[mapId])
		{
			var i = 0;
			while (i < items[mapId].length)
			{
				if (items[mapId][i].collisionCheck(connected[mapId][j])
					&& (items[mapId][i].playerid == null || items[mapId][i].playerid.includes(j)))
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
			removePlayer(id, connection[id].mapId)
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
					awardKillRewards(killParticipation[entity.mapId][entity.id][i], xp, entity);
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
			awardKillRewards(killParticipation[entity.mapId][entity.id][0], xp, entity);
		}
	}

	for (var i in connected[entity.mapId])
	{
		if (entity.faction == "iceman")
		{
			io.to(connected[entity.mapId][i].id).emit('createEffect', "puddle", entity.x, entity.y, 180, entity.mapId);
		}
		else
		{
			io.to(connected[entity.mapId][i].id).emit('createEffect', "blood", entity.x, entity.y, 180, entity.mapId);
		}
	}

	clearAgro(entity.id, entity.mapId);
}

function awardKillRewards(id, xp, entity)
{
	// no need to give rewards to CPU players
	if (typeof(connection[id]) === 'undefined')
	{	
		return;
	}
	var mapId = connection[id].mapId;
	io.to(id).emit('xpgain', xp, entity);
	items[mapId].push(new Item("money", Math.ceil((Math.random() + 1) * entity.lvl), entity.x, entity.y, [id], false));

	if (entity.id == "iceboss")
	{
		items[mapId].push(new Item("icebosscrystal", 1, entity.x, entity.y, [id], false));
	}
	else if (Math.random() > 0.5 && entity.faction == "iceman")
	{
		items[mapId].push(new Item("crystal", 1, entity.x, entity.y, [id], false));
	}
	else if (entity.faction != "iceman")
	{
		if (Math.random() > 0.5) // 50% chance to get apple
		{
			items[mapId].push(new Item("apple", 1, entity.x, entity.y, [id], false));
		}
		if (Math.random() > 0.25) // 25% chance to get carrot
		{
			items[mapId].push(new Item("carrot", 1, entity.x, entity.y, [id], false));
		}
		if (Math.random() > 0.25) // 25% chance to get leek
		{
			items[mapId].push(new Item("leek", 1, entity.x, entity.y, [id], false));
		}
	}


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
		if (this.x + 1 >= e.x - (e.width / 2) && this.x - 1 <= e.x + (e.width / 2)
			&& this.y + 1 >= e.y - (e.depth / 2) && this.y - 1 <= e.y + (e.depth / 2))
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
global.Projectile = function(x, y, z, x_speed, y_speed, z_speed, source, update_time, damage, spriteName, mapId)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.spawn_x = x;
	this.spawn_y = y;
	this.spawn_z = z;
	this.x_speed = x_speed;
	this.y_speed = y_speed;
	this.z_speed = z_speed;
	this.source = source;
	this.damage = damage;
	this.spriteName = spriteName;
	this.height;
	this.width;
	this.depth;
	this.update_time = update_time;
	this.mapId = mapId;

	this.setSize = function()
	{
		var s = "";
		if (this.spriteName != "Snowball" && this.spriteName != "meteor")
		{
			if (this.x_speed > 0)
			{
				s = "Right";
			}
			else if (this.x_speed < 0)
			{
				s = "Left";
			}
			else if (this.y_speed > 0)
			{
				s = "Down";
			}
			else if (this.y_speed < 0)
			{
				s = "Up";
			}
		}

		this.height = sizeOf("img//" + this.spriteName + s + ".png").height;
		this.width = sizeOf("img//" + this.spriteName + s + ".png").width;
		this.depth = Math.min(this.height, this.width);
	}

	this.setSize();

	this.update = function()
	{
		if(new Date().getTime() > this.update_time)
		{
			var n = Math.floor((new Date().getTime() - this.update_time)/(1000/60));
			this.x = this.spawn_x + (n * this.x_speed);
			this.y = this.spawn_y + (n * this.y_speed);
			this.z = this.spawn_z + (n * this.z_speed);			
		}
	};

	this.collisionCheck = function(e)
	{
		if ((this.x + (this.width/2) >= e.x - (e.width / 2) && this.x - (this.width/2) <= e.x + (e.width / 2))
			&& (this.y + (this.depth/2) >= e.y - e.depth && this.y - (this.depth/2) <= e.y)
			&& this.z < e.z + e.height)
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
		if (this.x - this.width > maps[this.mapId][0].length * gridSize || this.x + this.width < 0 || this.y < 0 || this.y - this.height > maps[this.mapId].length * gridSize || this.z < 0)
		{
			return true;
		}
		else 
		{
			return false;
		}
	};
};

function Item(name, quantity, x, y, playerid, exact)
{
	this.name = name;
	this.quantity = quantity;
	this.playerid = playerid;
	this.x = x;
	this.y = y;
	this.z = 0;

	if (!exact)
	{
		this.x = this.x + Math.round(Math.random() * 30) - 15;
		this.y = this.y + Math.round(Math.random() * 30) - 15;
	}
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
				if (damageList[mapId][i].source == "iceboss")
				{
					var e = getEntity("iceboss",2);
					for (var j in connected[mapId])
					{
						if (e.direction == "Up")
						{
							io.to(connected[mapId][j].id).emit('createEffect', "groundcrack", e.x, e.y - e.depth, 600, mapId);
							//io.to(connected[mapId][j].id).emit('createEffect', "dust", e.x, e.y - e.depth, 30, mapId);
						}
						else if (e.direction == "Down")
						{
							io.to(connected[mapId][j].id).emit('createEffect', "groundcrack", e.x, e.y + e.depth, 600, mapId);
							//io.to(connected[mapId][j].id).emit('createEffect', "dust", e.x, e.y + e.depth, 30, mapId);
						}
						else if (e.direction == "Left")
						{
							io.to(connected[mapId][j].id).emit('createEffect', "groundcrack", e.x - e.width / 2, e.y, 600, mapId);
							//io.to(connected[mapId][j].id).emit('createEffect', "dust", e.x - e.width / 2, e.y, 30, mapId);
						}
						else if (e.direction == "Right")
						{
							io.to(connected[mapId][j].id).emit('createEffect', "groundcrack", e.x + e.width / 2, e.y, 600, mapId);
							//io.to(connected[mapId][j].id).emit('createEffect', "dust", e.x + e.width / 2, e.y, 30, mapId);
						}
					}
				}


				// check every connected player to see if they were hit
				for (var j in connected[mapId])
				{
					if (damageList[mapId][i].source != connected[mapId][j].id && connected[mapId][j].targetType != "Passive" && damageList[mapId][i].collisionCheck(connected[mapId][j]))
					{
						// tell the client that they took damage
						io.to(connected[mapId][j].id).emit('damageIn', damageList[mapId][i].x, damageList[mapId][i].y, Math.ceil(damageList[mapId][i].damage * Math.sqrt(damageList[mapId][i].damage / connected[mapId][j].defence)));

						// track most recent attackers
						addKillParticipation(connected[mapId][j].id, damageList[mapId][i].source, mapId);
					}
				}

				// check every cpu to see if they were hit
				for (var j in mapEntities[mapId])
				{
					if (damageList[mapId][i].source != mapEntities[mapId][j].entity.id && mapEntities[mapId][j].entity.targetType != "Passive"  && damageList[mapId][i].collisionCheck(mapEntities[mapId][j].entity))
					{
						// damage the entity
						mapEntities[mapId][j].entity.takeDamage(damageList[mapId][i].x, damageList[mapId][i].y, Math.ceil(damageList[mapId][i].damage * Math.sqrt(damageList[mapId][i].damage / mapEntities[mapId][j].entity.defence)));

						// tell the CPU to target that entity
						mapEntities[mapId][j].setTarget(damageList[mapId][i].source);

						// track most recent attackers
						addKillParticipation(mapEntities[mapId][j].entity.id, damageList[mapId][i].source, mapId);
					}
				}

			damageList[mapId].splice(i,1);
			i--;
			n--;
			}
		}
	}

	// update projectile and check if it has gone offscreen or hit someone
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
						if (projectileList[mapId][i].source != connected[mapId][j].id && connected[mapId][j].targetType != "Passive" && projectileList[mapId][i].collisionCheck(connected[mapId][j]))
						{
							// tell the client that they took damage
							io.to(connected[mapId][j].id).emit('damageIn', projectileList[mapId][i].x, projectileList[mapId][i].y, Math.ceil(projectileList[mapId][i].damage * Math.sqrt(projectileList[mapId][i].damage / connected[mapId][j].defence)));

							// track most recent attackers
							addKillParticipation(connected[mapId][j].id, projectileList[mapId][i].source, mapId);

							dmg = true;
						}
					}

					// check every cpu to see if they were hit
					for (var j in mapEntities[mapId])
					{
						if (projectileList[mapId][i].source != mapEntities[mapId][j].entity.id && mapEntities[mapId][j].entity.targetType != "Passive" && projectileList[mapId][i].collisionCheck(mapEntities[mapId][j].entity))
						{
							// damage the entity
							mapEntities[mapId][j].entity.takeDamage(projectileList[mapId][i].x, projectileList[mapId][i].y, Math.ceil(projectileList[mapId][i].damage * Math.sqrt(projectileList[mapId][i].damage / mapEntities[mapId][j].entity.defence)));

							// tell the CPU to target that entity
							mapEntities[mapId][j].setTarget(projectileList[mapId][i].source);

							// track most recent attackers
							addKillParticipation(mapEntities[mapId][j].entity.id, projectileList[mapId][i].source, mapId);

							dmg = true;
						}
					}

					// check every mapobject to see if it's hit a solid object
					for (var j in mapObjects[mapId])
					{
						if (projectileList[mapId][i].collisionCheck(mapObjects[mapId][j]))
						{
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

  	socket.on('movement', function(player)
	{
		if (player != null)
		{
			if (!(player.mapId < 0))
			{
				// set the player's ID to be it's socket ID
				player.id = socket.id;
				connected[player.mapId][socket.id] = player;

				// if the player was already connected
				if (connection[socket.id] != null)
				{
					// update the player lists and kill participation lists if a player changes maps
					if (connection[socket.id].mapId != player.mapId)
					{
						console.log("player changed maps from " + connection[socket.id].mapId + " to " + player.mapId);
						// remove the player from the old map
						removePlayer(socket.id, connection[socket.id].mapId);	
						connection[socket.id] = {mapId: player.mapId, last_update: new Date().getTime()};
						io.to(socket.id).emit('mapObjects', mapObjects[player.mapId]);
					}

					// set the last update time of the player
					connection[socket.id].last_update = new Date().getTime();
				}
				// if this is the players first connection
				else
				{
					connection[socket.id] = {mapId: player.mapId, last_update: new Date().getTime()};
					io.to(socket.id).emit('mapObjects', mapObjects[connection[socket.id].mapId]);
					io.to(socket.id).emit('leaderboards',leaderboards);
					killParticipation[connection[socket.id].mapId][socket.id] = [];
				}
			}
			// if the players are on a private map, the server doesn't need to store anything
			else
			{
				if (connection[socket.id] != null)
				{
					removePlayer(socket.id, connection[socket.id].mapId);
				}
			}
		}
  	});

	socket.on('damageOut', function(x, y, damage_time, damage, mapId)
	{
		damageList[mapId].push(new Damage(x, y, socket.id, damage_time, damage, mapId));
	});

	socket.on('createProjectile', function(x, y, z, x_speed, y_speed, z_speed, update_time, damage, spriteName, mapId)
	{
		projectileList[mapId].push(new Projectile(x, y, z, x_speed, y_speed, z_speed, socket.id, Math.max(update_time, new Date().getTime()), damage, spriteName, mapId));
	});

	socket.on('death', function()
	{
		if (typeof(connection[socket.id]) !== "undefined")
		{
			entityDeath(connected[connection[socket.id].mapId][socket.id]);
		}
	});

	// when a CPU is in a conversation, they should stop wandering the map and continue facing the player
	socket.on('freezeEntity', function(id, mapId, x, y, direction)
	{
		mapEntities[mapId][id].entity.x = x;
		mapEntities[mapId][id].entity.y = y;
		mapEntities[mapId][id].entity.direction = direction;
		mapEntities[mapId][id].directionCounter = 30;
		mapEntities[mapId][id].x_direction = 0;
		mapEntities[mapId][id].y_direction = 0;
	});

	socket.on('save', function(username, savedata)
	{
		if (username != "Player") // user progress not saved if they don't login
		{
			fs.writeFile('saves//' + username + '.txt', savedata, function(err) 
			{
				if (err)
				{
					console.log("unable to create save data for user " + username);
				}
				else
				{
					console.log("save data file created successfully for user " + username);
				}
			});
		}
	});

	socket.on('load', function(username)
	{
		if (username != "Player") // user progress not saved if they don't login
		{
			// check if the user has existing save data
			fs.exists('saves//' + username + '.txt', function(exists)
			{
				if (exists == true)
				{
					fs.readFile('saves//' + username + '.txt', function(err, data) 
					{
					    if(err) 
					    {
					    	console.log("error reading save data for user " + username);
					    	io.to(socket.id).emit('load', "false");
						}
						else
						{
							// check if the username is already in use
							console.log("save data read successfully for user " + username);
						    io.to(socket.id).emit('load', data.toString());
						}
					});
				}
				else
				{
					console.log("no save data exists for user " + username);
					io.to(socket.id).emit('load', "false");
				}
			});
		}
		else
		{
			io.to(socket.id).emit('load', "false");
		}
	});

	socket.on('disconnect', function()
	{
		console.log(socket.id + " disconnected");

		if (typeof(connection[socket.id]) !== "undefined")
		{
			removePlayer(socket.id, connection[socket.id].mapId);
		}
	});

	socket.on('login', function(username, password)
	{
		fs.readFile('users.txt', function(err, data) 
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
			fs.readFile('users.txt', function(err, data) 
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
				    	fs.appendFile('users.txt', username + "," + password + "\n", function(err) 
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
			var players = {};
			var count = 0;

			// send the other connected players
			for(var j in connected[mapId])
			{
				if (j != i)
				{
					players[j] = connected[mapId][j];
					count++;
				}
			}

			// send the CPUs
			for (var j in mapEntities[mapId])
			{
				count++;

			    if (mapEntities[mapId][j].target == i)
			    {
			      	mapEntities[mapId][j].entity.allyState = "Enemy";
			    }
			    else if (mapEntities[mapId][j].entity.targetType == "Passive")
			    {
			    	mapEntities[mapId][j].entity.allyState = "Ally";
			    }
			    else
			    {
			      	mapEntities[mapId][j].entity.allyState = "Neutral";
			    }

				players[j] = mapEntities[mapId][j].entity;
			}

			// some items on the map are visible to all players
			// but some can only be seen by a few players
			var visibleItems = [];
			for (var j in items[mapId])
			{
				if (items[mapId].playerid == null || items[mapId].playerid.includes(i))
				{
					visibleItems.push(items[mapId][j]);
				}
			}

			// only send players if there are any
			if (count > 0)
			{
				io.to(i).emit('players', players);
			}
			io.to(i).emit('viewOnly', p, visibleItems);
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

var leaderboards = {};
// update leaderboards once a minute
setInterval(function()
{
	// read the list of user save files
	var users = fs.readdirSync('saves//');
	leaderboards["Level"] = [];
	leaderboards["Money"] = [];
	leaderboards["Kills"] = [];

	for (var i in users)
	{		
		// add each user's statistics to the leaderboard
		readLeaderboardData(users[i].slice(0,-4));
	}

	// transmit the updated leaderboard to every connected user
	setTimeout(function()
		{
			console.log("updating leaderboards");
			io.emit('leaderboards',leaderboards);
		}, 5000);
}, 5000);

function readLeaderboardData(username)
{
	fs.readFile('saves//' + username + '.txt', function(err, data) 
	{
	    if(err) 
	    {
	    	console.log("error reading save data for user " + username);
		}
		else
		{
			// get the relevent attributes from the users save file
			try
			{
				var userdata = JSON.parse(data.toString());
			}
			// sometimes if client crashes the JSON data will be corrupt
			catch (err)
			{
				console.log(err);
				return;
			}
		    
		    // insert the player's level into the leaderboards in sorted order
		    var sort_counter = 0;
		    for (var i in leaderboards["Level"])
		    {
		    	if (leaderboards["Level"][i].counter > userdata.lvl)
		    	{
		    		sort_counter++;
		    	}
		    }
		    leaderboards["Level"].splice(sort_counter,0,{name:username, counter:userdata.lvl});

		    if (typeof(userdata.items["money"]) !== 'undefined')
		    {
		    	// insert the player's money into the leaderboards in sorted order
			    sort_counter = 0;
			    for (var i in leaderboards["Money"])
			    {
			    	if (leaderboards["Money"][i].counter > userdata.items["money"].quantity)
			    	{
			    		sort_counter++;
			    	}
			    }
			    leaderboards["Money"].splice(sort_counter,0,{name:username, counter:userdata.items["money"].quantity});
			}

			// insert the player's total number of kills into the leaderboards in sorted order
		    sort_counter = 0;
		    for (var i in leaderboards["Kills"])
		    {
		    	if (leaderboards["Kills"][i].counter > userdata.achievements[0].tracker[0][0].counter)
		    	{
		    		sort_counter++;
		    	}
		    }
			leaderboards["Kills"].splice(sort_counter,0,{name:username, counter:userdata.achievements[0].tracker[0][0].counter})
		}
	});
}

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
