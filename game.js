'use strict';

// play background music
var audio;
var soundEffect = [];

// create the graphics canvas
var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
context.webkitImageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;
var graphics_scaling = Math.ceil(Math.min(height,width)/250);
console.log(graphics_scaling);
var pixelWidth = Math.ceil(width / graphics_scaling);
var pixelHeight = Math.ceil(height / graphics_scaling);
var x_offset = 0;
var y_offset = 0;

// retrieve data from the server
var socket = io();
var ping = 0;

// create the player's graphics
context.fillStyle = "#ADD8E6";
var healthBarSprite = new Image();
healthBarSprite.src = "img//healthbar.png";
var healthBarGreenSprite = new Image();
healthBarGreenSprite.src = "img//healthbargreen.png";
var minimapbox = new Image();
minimapbox.src = "img//minimapbox.png";
var itemSprite = [];
itemSprite["money"] = new Image();
itemSprite["money"].src = "img//money.png";
itemSprite["moneyIcon"] = new Image();
itemSprite["moneyIcon"].src = "img//moneyIcon.png";

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 49;
var attack_key = 50;
var attack2_key = 51;

var frameTime = 0;
var startTime = 0;

var maxX = {};
maxX[0] = 1000;
maxX[1] = 1000;
maxX[-1] = 127;
maxX[-2] = 127;
var minY = {};
minY[0] = 30;
minY[1] = 30;
minY[-1] = 0;
minY[-2] = 0;
var maxY = {};
maxY[0] = 500;
maxY[1] = 800;
maxY[-1] = 127;
maxY[-2] = 127;

var playerList = {};
var mapObjects = {};
var projectileList = [];
var flyTextList = [];
var notificationList = [];
var portalList = [];
var cutscene = null;
var effects = [];

var playerSprite = [];
var playerAttackSprite = [];
var weaponSprite = {};
var username = "";
var playerXP = 0;
var minimapScale = 16;
var displayQuests = false;
var displayInventory = false;

var clickCounter = 0;

var view = new View();

function getDirName(n)
{
	if (n == 0)
	{
		return "Left";
	}
	else if (n == 1)
	{
		return "Up";
	}
	else if (n == 2)
	{
		return "Right";
	}
	else if (n == 3)
	{
		return "Down";
	}

	return "";
}

function getDirNum(s)
{
	if (s == "Left")
	{
		return 0;
	}
	else if (s == "Up")
	{
		return 1;
	}
	else if (s == "Right")
	{
		return 2;
	}
	else if (s == "Down")
	{
		return 3;
	}
}

//functions from external files
var mapObject = share.mapObject;
var Attack = shareAttack.Attack;
var Entity = shareEntity.Entity;

var defaultmapId = 0;
var player;
var quests = {};
var completedQuests = {};
var achievements = {};
var completedAchievements = {};
var achievementCount = 5;

window.onload = function()
{
	document.body.appendChild(canvas);

	//get the player's username
	username = getUsername();

	if (username != "Player") // user progress not saved if they don't login
	{
		//check with the server for savedata
		socket.emit('load', username);
	}

	// load images and data that don't depend on player information while waiting for server response
	loadSprite("player",["Punch","Sword","Arrow"]);
	loadSprite("iceman",["Punch","Snowball"]);
	loadWeapons();

	if (username == "Player") // load a user who hasn't logged in
	{
		loadPlayer("false");
	}
};

// create the player
function respawn()
{
	var oldPlayer = player;
	player = new Player(oldPlayer.entity.mapId);
	player.entity.setLevel(oldPlayer.entity.lvl);
	player.entity.xp = oldPlayer.entity.xp;
	player.inventory = oldPlayer.inventory;
	get_offset();
}

var updateCounter = 0;

function loadMap(mapId)
{
	console.log("loading map " + mapId);

	view.loadMap(mapId);
	// clear any entities or map objects from the previous map
	mapObjects = {};
	playerList = {};
	projectileList = [];

	/* mapID >= 0 means public maps with other users */
	if (mapId == 0)
	{
		audio = new Audio("audio//track2.mp3");

		// create the portal to the snow world
		portalList[0] = new Portal(992, 300, 20, 20, 1, 10, 300, "Right");
		var p = new mapObject(portalList[0].x, portalList[0].y + 4, "snowportal");
		p.initialize();
		mapObjects[p.id] = p;
		view.insertStatic(p);

		portalList[1] = new Portal(254, 360, 20, 20, -1, 64, 127, "Up");
		portalList[2] = new Portal(454, 260, 20, 20, -2, 64, 127, "Up");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		weatherSprite = [];
		for (var i = 0; i < 10; i++)
		{
			p = new mapObject(Math.floor(Math.random() * maxX[mapId]), Math.floor(Math.random() * (maxY[mapId] - minY[mapId]) + minY[mapId]), "bush1");
			p.initialize();
			mapObjects[p.id] = p;
			view.insertStatic(p);
		}
	}
	else if (mapId == 1)
	{
		audio = new Audio("audio//track1.mp3");

		// create portal to the grass world
		portalList[0] = new Portal(8, 300, 20, 20, 0, 990, 300, "Left");
		var p = new mapObject(portalList[0].x, portalList[0].y + 8, "grassportal");
		p.initialize();
		mapObjects[p.id] = p;
		view.insertStatic(p);
	}

	/* mapId <= 0 means private maps with no other users */
	else if (mapId == -1)
	{
		audio = new Audio("audio//track2.mp3");
		portalList[0] = new Portal(64, 127, 20, 20, 0, 254, 360, "Down");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		weatherSprite = [];
		var e = new Entity(64, 32, "player", -1);
		e.id = "-1p1";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].conversationId = 0; 
		playerList[e.id].display_name = "Bob";
	}

	else if (mapId == -2)
	{
		audio = new Audio("audio//track2.mp3");
		portalList[0] = new Portal(64, 127, 20, 20, 0, 454, 260, "Down");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		weatherSprite = [];
		var e = new Entity(64, 32, "player", -2);
		e.id = "-2p1";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].conversationId = 2; 
		playerList[e.id].display_name = "Kraven";
	}


	frameTime = new Date().getTime(); // reset update frame timer
}

//load sprites
function loadSprite(spriteName, attacks)
{
	// load player movement sprites
	var a = [];
	var img;

	for (var i = 0; i < 4; i++)
	{
		var s = [];

		for (var j = 0; j < 4; j++)
		{
			img = new Image();
			img.src = "img//" + spriteName + getDirName(i) + j + ".png";
			s[j] = img;
		}

		a[i] = s;
	}

	playerSprite[spriteName] = a;

	// load player attack sprites
	playerAttackSprite[spriteName] = {};

	for (var k in attacks)
	{
		var a = [];

		for (var i = 0; i < 4; i++)
		{
			var s = [];
			var n = 3;

			if (attacks[k] == "Sword")
			{
				n = 4;
			}

			for (var j = 0; j < n; j++)
			{
				img = new Image();
				img.src = "img//" + spriteName + "Attack" + attacks[k] + getDirName(i) + j + ".png";
				s[j] = img;
			}

			a[i] = s;
		}

		playerAttackSprite[spriteName][attacks[k]] = a;
	}
}

function loadWeapons()
{
	weaponSprite["Snowball"] = [];
	weaponSprite["Arrow"] = [];
	weaponSprite["Sword"] = [];

	// loop through all 4 directions
	for (var j = 0; j < 4; j++)
	{
		// create the blank array for each weapon
		for (var i in weaponSprite)
		{
			weaponSprite[i][j] = [];
		}

		// load snowball sprites
		weaponSprite["Snowball"][j][0] = new Image();
		weaponSprite["Snowball"][j][0].src = "img//attackSnowball" + getDirName(j) + "0.png";
		weaponSprite["Snowball"][j][1] = new Image();
		weaponSprite["Snowball"][j][1].src = "img//attackSnowball" + getDirName(j) + "1.png";

		// load arrow sprites
		weaponSprite["Arrow"][j][0] = new Image();
		weaponSprite["Arrow"][j][0].src = "img//attackArrow" + getDirName(j) + "0.png";
		weaponSprite["Arrow"][j][1] = new Image();
		weaponSprite["Arrow"][j][1].src = "img//attackArrow" + getDirName(j) + "1.png";

		// load sword sprites
		for (var k = 0; k < 4; k++)
		{
			weaponSprite["Sword"][j][k] = new Image();
			weaponSprite["Sword"][j][k].src = "img//attackSword" + getDirName(j) + k + ".png";
		}
	}

	// set sprite specific y-offsets, for images that need to be displayed below the entity
	weaponSprite["Arrow"][3][0].y_offset = 6;
	weaponSprite["Arrow"][3][1].y_offset = 3;
	weaponSprite["Sword"][0][3].y_offset = 7; //left attack last frame
	weaponSprite["Sword"][2][3].y_offset = 7; // right attack last frame
	weaponSprite["Sword"][3][2].y_offset = 10; // down attack second last frame
	weaponSprite["Sword"][3][3].y_offset = 11; // down attack last frame
}

var ucounter = 0;
var rcounter = 0;

// events triggered when a user re-opens the game window
window.addEventListener("focus", function()
{
	frameTime = new Date().getTime(); // ensures animations display properly
	keysDown = {}; 
}
);

// events triggered when a user leaves the game window (switches to another tab / focus' a different application)
window.addEventListener("blur", function()
{
	keysDown = {}; // player stops moving when game loses focus
}
);

var rfps = 0;
var ufps = 0;
var updateNearbyObjectsTimer = new Date().getTime(); 

function step()
{
	while (new Date().getTime() >= frameTime)
	{
		// update the list of nearby objects every second
		if (new Date().getTime() >= updateNearbyObjectsTimer)
		{
			updateNearbyObjects();
			updateNearbyObjectsTimer = new Date().getTime() + 500;
		}
		update();
		if (player.entity.mapId >= 0)
		{
			socket.emit('movement', player.entity); //send new location to server
		}
		frameTime += 16.6;
		ucounter += 1;
		
	}
	context.fillStyle = "#ADD8E6";

  	render();
	rcounter += 1;

	if (rcounter >= 100)
	{

		rfps = Math.round(rcounter / ((new Date().getTime() - startTime)/1000));
		ufps = Math.round(ucounter / ((new Date().getTime() - startTime)/1000));
		startTime = new Date().getTime();
		ucounter = 0;
		rcounter = 0;
	}
	context.font = "10px sans-serif";
	context.fillStyle = "#000000";
	context.fillText("FPS: " + rfps,10,10);
	context.fillText("FPS: " + ufps,10,20);
	context.fillText("Ping: " + ping,10,30);
	context.fillText("Position: " + player.entity.x + "," + player.entity.y,10,40);
	setTimeout(step, 4);
}

function getUsername()
{
	var c = decodeURIComponent(document.cookie).split(';');

	// read username from a cookie
	if (c != null && c[0].substr(0,8) == "username" && c[0].length > 9)
	{
		return c[0].substr(9,c[0].length - 1);
	}

	// otherwise give them default name
	else
	{
		notificationList.push(new Notification("Default Controls","Press 1 to jump;Press 2 for basic attack;Press 3 for ranged attack"));
		return "Player";
	}
}

// update the list of nearby entities once a second
function updateNearbyObjects()
{
	player.entity.nearbyObjects = [];

	for (var i in playerList)
	{
		if (Math.abs(playerList[i].x - player.entity.x) <= 120 && Math.abs(playerList[i].y - player.entity.y) <= 120)
		{
			player.entity.nearbyObjects.push({id: playerList[i].id, type: "player"});
		}
	}

	for (var j in mapObjects)
	{
		if (Math.min(Math.abs(mapObjects[j].x - (mapObjects[j].width / 2) - player.entity.x), Math.abs(player.entity.x - (mapObjects[j].x + (mapObjects[j].width / 2)))) <= 35 
			&& Math.min(Math.abs(mapObjects[j].y - mapObjects[j].depth - player.entity.y), Math.abs(player.entity.y - player.entity.depth - mapObjects[j].y)) <= 35)
		{
			player.entity.nearbyObjects.push({id: mapObjects[j].id, type: "mapObject"});
		}
	}
}

Entity.prototype.getNearbyObjects = function()
{
	var objectList = [];

	for (var i in this.nearbyObjects)
	{
		// retrieve players / CPUs
		if (this.nearbyObjects[i].type == "player") 
		{
			
			if (typeof(playerList[this.nearbyObjects[i].id]) !== 'undefined')
			{
				objectList.push(playerList[this.nearbyObjects[i].id]);
			}
			else
			{
				//delete player.entity.nearbyObjects[i];
			}
		}
		// retrieve mapObjects
		else if (this.nearbyObjects[i].type == "mapObject" && typeof(mapObjects[this.nearbyObjects[i].id]) !== 'undefined')
		{
			objectList.push(mapObjects[this.nearbyObjects[i].id]);
		}
	}

	return objectList;
}


// run the main functions that must be updated based on time events
// when the tab is inactive assume this function runs at 1 fps
var update = function()
{
	//restart background music at the end of the song
	/*if (audio.currentTime + (8/60) > audio.duration)
	{
		audio.currentTime = 0;

		if (audio.ended == true)
		{
			audio.play();
		}
	}*/


	if (cutscene != null)
	{
		cutscene.update();

		if (cutscene.isComplete())
		{
			cutscene = null;
			player.conversationCounter = 30;
		}
	}
	// only update the player if they aren't in a conversation
	else
	{
		if (player.conversationCounter > 0)
		{
			player.conversationCounter--;
		}
		if (player.entity.current_health <= 0)
		{
			playerXP = player.entity.xp;
			socket.emit('death');
			respawn();
		}
		else
		{
			//update player object
			player.update();
		}
	}


	// check if you are standing on a portal and need to switch maps
	if (player.portalCounter == 0)
	{
		for (var i in portalList)
		{
			if (portalList[i].collisionCheck(player.entity))
			{
				console.log(portalList);
				console.log("moving to map " + portalList[i].destination_mapId)
				view.clear();
				player.entity.x = portalList[i].destination_x;
				player.entity.y = portalList[i].destination_y;
				player.entity.mapId = portalList[i].destination_mapId;
				player.entity.nearbyObjects = [];
				effects = [];
				loadMap(portalList[i].destination_mapId);
				player.portalCounter = 30;
				if (player.entity.mapId < 0)
				{
					socket.emit('movement', player.entity); //send new location to server
				}
				break;
			}
		}
	}
	else if (player.portalCounter > 0)
	{
		player.portalCounter--;
	}

	// check if any achievements have been completed
	for (var i in achievements)
	{
		if (achievements[i].isComplete() && typeof(completedAchievements[i]) === 'undefined')
		{
			notificationList.push(new Notification("Achievement Complete","You completed the achievement " + achievements[i].name))
			var r = achievements[i].reward;

			if (typeof(r) !== "undefined" && r != null)
			{
				if (typeof(r.xp) !== "undefined")
				{
					player.entity.addXP(r.xp);
				}
				if (typeof(r.items) !== "undefined")
				{
					for (var j in r.items)
					{
						player.inventory.addItem(r.items[j]);
					}
				}
			}

			completedAchievements[i] = true;
		}
	}

	// check if any quests have been completed
	for (var i in quests)
	{
		if (quests[i].isComplete())
		{
			notificationList.push(new Notification("Quest Complete","You completed the quest " + quests[i].name))
			var r = quests[i].reward;

			if (typeof(r) !== "undefined" && r != null)
			{
				if (typeof(r.xp) !== "undefined")
				{
					player.entity.addXP(r.xp);
				}
				if (typeof(r.items) !== "undefined")
				{
					for (var j in r.items)
					{
						player.inventory.addItem(r.items[j]);
					}
				}
			}

			completedQuests[i] = true;
			delete quests[i];
		}
	}



	// update flytext and remove any that expired
	var n = flyTextList.length;
	for (var i = 0; i < n; i++)
	{
		if (i == 0 || flyTextList[i].counter > flyTextList[i-1].counter + 30)
		{
			flyTextList[i].update();

			if (flyTextList[i].counter <= 0)
			{
				flyTextList.splice(i,1);
				i--;
				n--;
			}
		}
	}

	// update current notifcation and check if it expired
	if (notificationList[0] != null)
	{
		notificationList[0].update();

		if (notificationList[0].counter <= 0 && cutscene == null) // only start new notifications outside of cutscenes
		{
			notificationList.splice(0,1);
		}
	}

	updateCounter++;

	// animated footprints in the snow
	if (updateCounter % 15 == 1)
	{
		for (var i in playerList)
		{
			if ((player.entity.mapId == 1 || playerList[i].faction == "iceman") && (playerList[i].x_speed != 0 || playerList[i].y_speed != 0))
			{
				playerList[i].createFootPrint();
			}
		}

		if (player.entity.mapId == 1 && (player.entity.x_speed != 0 || player.entity.y_speed != 0))
		{
			player.entity.createFootPrint();
		}
	}

	// adds a delay to prevent instant double clicking
	clickCounter++;

	// update visual effects
	for (var i in effects)
	{
		effects[i].update();
		if (effects[i].counter <= 0)
		{
			effects.splice(i,1); // delete effect if it's animation has ended
		}
	}

};

//initialize an entity from a pre-existing entity
function copyEntity(old)
{
	var p = new Entity(old.x, old.y, old.spriteName, old.mapId);//create a new entity object
	p.z = old.z; // Z is the sprite's height off the ground (in-game measurement units)
	p.width = old.width;
	p.depth = old.depth;
	p.height = old.height;
	p.knockback = old.knockback;
	p.x_speed = old.x_speed;
	p.y_speed = old.y_speed;
	p.direction = old.direction;
	p.display_name = old.display_name;
	p.max_health = old.max_health;
	p.current_health = old.current_health;
	p.attack_counter = old.attack_counter;
	p.current_attack = old.current_attack;
	p.attacks = old.attacks
	p.lvl = old.lvl;
	p.allyState = old.allyState;
	p.id = old.id;
	p.conversationId = old.conversationId;
	p.faction = old.faction;
	return p;
}

//initialize the player
function Player(mapId)
{
  	this.entity = new Entity(100,100,"player",mapId);
	this.entity.initialize();
	this.entity.allyState = "Player";
	this.entity.updateSprite();
	this.healthRegenCounter = 0;
	this.portalCounter = 0;
	this.conversationCounter = 0;
	this.entity.display_name = username;
	this.inventory = new Inventory();
}

//display the player
Player.prototype.render = function()
{
  this.entity.render();
};

//display graphics
var render = function()
{
	view.renderBackground();

	// render mapObjects: rocks, snowmen, etc
	// render items
	// render projectiles
	view.render();

	//display weather if there is any
	view.renderWeather();

	if (cutscene != null)
	{
		cutscene.render();
	}

	for (var i in flyTextList)
	{
		if (flyTextList[i].counter < 100)
		{
			flyTextList[i].render();
		}
	}

	if (notificationList[0] != null)
	{
		notificationList[0].render();
	}

	renderMinimap();
};

// sort a list of entities by their y-position, so that they are overlap properly
function renderSort(array)
{
	var n = array.length;

	for (var i = 1; i < n; i++)
	{
		var e = array[i];
		var j = i - 1;

		while (j >= 0 && renderSortAux(array[j],e))
		{
			array[j + 1] = array[j];
			j -= 1;
		}

		array[j+1] = e;
	}
}

// check what order two entities should be drawn in
function renderSortAux(e1, e2)
{
	if (e1.y <= e2.y && e1.y > e2.y - Math.floor(e1.height * 0.8) && e1.z > e2.z) // if you're standing on top of them, you get drawn second
	{
		return true;
	}
	else if (e1.y > e2.y) // if you're standing in front of them, you get drawn second
	{
		return true;
	}
	else // otherwise, you're behind them and get drawn first
	{
		return false;
	}
}

//event listeners for the keyboard
var keysDown = {};

window.addEventListener("keydown", function(event)
{
  keysDown[event.keyCode] = true;
}
);

window.addEventListener("keyup", function(event)
{
  delete keysDown[event.keyCode];
}
);

Player.prototype.update = function()
{
	// slowly regenerate health over time
	if (this.entity.current_health < this.entity.max_health)
	{
		this.healthRegenCounter ++;

		if (this.healthRegenCounter >= 300)
		{
			this.entity.current_health ++;
			this.healthRegenCounter = 0;
		}
	}

	/* move the player based on user input */
	var x_direction = 0;
	var y_direction = 0;

	// loops through every key currently pressed and performs an action
	if (!this.entity.knockback || (Maths.abs(y_speed) <= 3 && Math.abs(x_speed) <= 3))
	{
		displayQuests = false;
		displayInventory = false;

		for(var key in keysDown)
		{
			var value = Number(key);

			if (value == attack_key)
			{
				if (this.entity.attack_counter <= 1)
				{this.entity.setAttack(0);}
			}
			else if (value == attack2_key)
			{
				if (this.entity.attack_counter <= 1)
				{this.entity.setAttack(1);}
			}
			else if(value == left_key)
			{
				x_direction += -1;
			}
			else if (value == right_key)
			{
				x_direction += 1;
			}
			else if (value == up_key)
			{
				y_direction += -1;
			}
			else if (value == down_key)
			{
				y_direction += 1;
			}
			else if (value == jump_key)
			{
				if (this.entity.z == 0 && this.entity.z_speed == 0) //can only jump if standing on the ground
				{
					this.entity.z_speed = 3;
				}
			}
			else if (value == 13)
			{
				if (cutscene == null && player.conversationCounter <= 0)
				{
					initiateConversation();
				}

			}
			else if (value == 81 && !displayInventory)
			{
				displayQuests = true;
			}
			else if (value == 73 && !displayQuests)
			{
				displayInventory = true;
			}
		}
	}

	if (cutscene == null) // don't let the player move themselves during cutscenes
	{
		this.entity.move(x_direction, y_direction);
	}

	this.entity.update();

	get_offset();
};

// check the offset used for screen scrolling
function get_offset()
{
	var left_offset = player.entity.x - (pixelWidth / 2);
	var right_offset = player.entity.x + (pixelWidth / 2);

	// if the map doesn't fill the whole screen, center it
	if (maxX[player.entity.mapId] <= pixelWidth)
	{
		x_offset = -(pixelWidth / 2) + (maxX[player.entity.mapId] / 2);
	} 
	// check if the player is moving in the middle of the map and the screen needs to be moved
	else if (left_offset > 0 && right_offset < maxX[player.entity.mapId])
	{
		x_offset = left_offset;
	}
	else if (left_offset > 0 && right_offset >= maxX[player.entity.mapId])
	{
		x_offset = maxX[player.entity.mapId] - pixelWidth;
	}
	else
	{
		x_offset = 0;
	}

	var top_offset = player.entity.y - (pixelHeight / 2);
	var bot_offset = player.entity.y + (pixelHeight / 2);

	// if the map doesn't fill the whole screen, center it
	if (maxY[player.entity.mapId] <= pixelHeight)
	{
		y_offset = -(pixelHeight / 2) + (maxY[player.entity.mapId] / 2);
	}
	else if (top_offset > 0 && bot_offset < maxY[player.entity.mapId])
	{
		y_offset = top_offset;
	}
	else if (top_offset > 0 && bot_offset >= maxY[player.entity.mapId])
	{
		y_offset = maxY[player.entity.mapId] - pixelHeight;
	}
	else
	{
		y_offset = 0;
	}
}

// holds information about projectiles on-screen
function InitializeProjectile(p)
{
	p.sprite = new Image();
	p.x = p.spawn_x;
	p.y = p.spawn_y;

	if (p.spriteName == "Snowball")
	{
		p.sprite.src = "img//" + p.spriteName + ".png";
	}
	else
	{
		if (p.x_speed > 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Right.png";
		}
		else if (p.x_speed < 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Left.png";
		}
		else if (p.y_speed > 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Down.png";
		}
		else if (p.y_speed < 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Up.png";
		}
	}
}

function flyText(x, y, s, colour)
{
	this.msg = s;
	this.colour = colour;
	this.counter = 100;

	this.update = function()
	{
		if (this.counter > 0)
		{
			this.counter--;
		}
	}

	this.render = function()
	{
		context.globalAlpha = this.counter / 100;
		context.font = "bold " + (4 * graphics_scaling) + "px sans-serif";

		// display a black outline of the text
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		context.strokeText(this.msg,
			((x - x_offset) * graphics_scaling) - (context.measureText(this.msg).width/2),
			(y - y_offset - ((100-this.counter) / 10)) * graphics_scaling);

		// display the text in colour
		context.fillStyle = this.colour;
		context.fillText(this.msg,
			((x - x_offset) * graphics_scaling) - (context.measureText(this.msg).width/2),
			(y - y_offset - ((100-this.counter) / 10)) * graphics_scaling);
		context.globalAlpha = 1;
	}
}

function Notification(header, body)
{
	this.header = header;
	this.body = body.split(';');
	this.counter = 300;
	this.x = pixelWidth / 2;
	this.y = pixelHeight;

	this.update = function()
	{
		if (this.counter > 240)
		{
			this.y -= 0.5;
		}
		else if (this.counter <= 60)
		{
			this.y += 0.5;
		}
		this.counter--;
	}

	this.render = function()
	{
		// display the header
		context.font = "bold " + 5 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#FFFFFF";
		context.fillText(this.header,
			(this.x * graphics_scaling) - (context.measureText(this.header).width / 2),
			(this.y + 10) * graphics_scaling);

		// display the body
		context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
		for (var i in this.body)
		{
			context.fillText(this.body[i],
				(this.x * graphics_scaling) - (context.measureText(this.body[i]).width / 2),
				(this.y + 15 + (5 * i)) * graphics_scaling);
		}
	}
}

function initiateConversation()
{
	var collisionList = player.entity.getNearbyObjects();

	for (var i in collisionList)
	{
		// check that the entity is not fighting the player, and that they have a conversation
		if (collisionList[i].conversationId != null)// && cutscene == null) //make sure you can't be in multiple conversations
		{
			if (player.entity.direction == "Left"
				&& player.entity.y > collisionList[i].y - (collisionList[i].depth / 2)
				&& player.entity.y - (player.entity.depth / 2) < collisionList[i].y
				&& player.entity.x - (player.entity.width / 2) - 3 < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x)
			{
				collisionList[i].direction = "Right";
				cutscene = new Cutscene(collisionList[i].conversationId);
				break;
			}
			else if (player.entity.direction == "Right"				
				&& player.entity.y > collisionList[i].y - (collisionList[i].depth / 2)
				&& player.entity.y - (player.entity.depth / 2) < collisionList[i].y
				&& player.entity.x < collisionList[i].x
				&& player.entity.x + (player.entity.width / 2) + 3 > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Left";
				cutscene = new Cutscene(collisionList[i].conversationId);
				break;
			}
			else if (player.entity.direction == "Up" 
				&& player.entity.y - player.entity.depth - 3 < collisionList[i].y
				&& player.entity.y > collisionList[i].y
				&& player.entity.x < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Down";
				cutscene = new Cutscene(collisionList[i].conversationId);
				break;
			}
			else if (player.entity.direction == "Down"
				&& player.entity.y < collisionList[i].y
				&& player.entity.y + 3 > collisionList[i].y - collisionList[i].y 
				&& player.entity.x < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Up";
				cutscene = new Cutscene(collisionList[i].conversationId);
				break;
			}
		}
	}
}

function addQuest(id)
{
	if (typeof(completedQuests[id]) === 'undefined' && typeof(quests[id]) === 'undefined')
	{
		quests[id] = new Objective(id);
		notificationList.push(new Notification("Quest received!","You received the quest " + quests[id].name))
	}
	else
	{
		console.log("Already have quest " + id);
	}
}

// display the minimap
function renderMinimap()
{
	var x = width - (52 * graphics_scaling);
	var y = height - (52 * graphics_scaling);
	var m_x_offset = 0;
	var m_y_offset = 0;

	// get x-offset
	if (player.entity.x / minimapScale < 25 || maxX / minimapScale <= 50)
	{
		m_x_offset = 0;
	}
	else if ((maxX[player.entity.mapId] - player.entity.x) / minimapScale < 25)
	{
		m_x_offset = (maxX[player.entity.mapId] / minimapScale) -50;
	}
	else
	{
		m_x_offset = (player.entity.x / minimapScale) - 25;
	}

	// get y-offset
	if (player.entity.y / minimapScale <= 25 || maxY / minimapScale <= 50)
	{
		m_y_offset = 0;
	}
	else if ((maxY[player.entity.mapId] - player.entity.y) / minimapScale <= 25)
	{
		m_y_offset = (maxY[player.entity.mapId] / minimapScale) - 50;
	}
	else
	{
		m_y_offset = (player.entity.y / minimapScale) - 25;
	}

	// draw the minimap background
	context.globalAlpha = 0.7;
	context.fillStyle = "#C0C0C0";
	context.fillRect(x, y, 50 * graphics_scaling, 50 * graphics_scaling);

	// draw the NPCs
	for (var i in playerList)
	{
		// only draw if they are currently on the map
		if ((playerList[i].x / minimapScale) - m_x_offset - 1.5 >= -2 && (playerList[i].x / minimapScale) - m_x_offset + 1.5 <= 52
			&& (playerList[i].y / minimapScale) - m_y_offset - 1.5 >= -2 && (playerList[i].y / minimapScale) - m_y_offset + 1.5 <= 52)
		{
			playerList[i].setColour();
			context.beginPath();
			context.arc(
				x + ((playerList[i].x / minimapScale) - m_x_offset) * graphics_scaling,
				y + ((playerList[i].y - 1.5) * graphics_scaling / minimapScale),
				1.5 * graphics_scaling,
				0, Math.PI * 2, false);
			context.fill();
		}
	}

	// draw the player
	context.fillStyle = "#1E90FF";
	context.beginPath();
	context.arc(
		x + (((player.entity.x / minimapScale) - m_x_offset) * graphics_scaling),
		y + ((player.entity.y - m_y_offset - 1.5) * graphics_scaling / minimapScale),
		1.5 * graphics_scaling,
		0, Math.PI * 2, false);
	context.fill();
	context.globalAlpha = 1;

	// draw the minimap outline
	context.drawImage(minimapbox, x - (2 * graphics_scaling), y - (2 * graphics_scaling), 54 * graphics_scaling, 54 * graphics_scaling);

	// draw the user's current money
	context.fillStyle = "#000000";
	context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
	context.fillText(player.inventory.getItem("money").quantity,x + graphics_scaling + Math.ceil(itemSprite["moneyIcon"].width * graphics_scaling / 2), y - (3 * graphics_scaling));
	context.drawImage(itemSprite["moneyIcon"], x, y - ((3 + Math.ceil(itemSprite["moneyIcon"].height / 2 )) * graphics_scaling), Math.ceil(itemSprite["moneyIcon"].width * graphics_scaling / 2), Math.ceil(itemSprite["moneyIcon"].height * graphics_scaling / 2))
}

// check if the user clicks the mouse
function printMousePos(event) {
	if (clickCounter > 15)
	{
	  console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
	  view.clickPosition(event.clientX, event.clientY);
	  clickCounter = 0;
	}
}

document.addEventListener("click", printMousePos);
window.addEventListener("resize", setScreenSize);
//document.addEventListener("fullscreenchange", setScreenSize);

function useItem(itemName)
{
	if (player.inventory.getItem(itemName).quantity > 0)
	{
		if (itemName == "apple")
		{
			player.entity.current_health = Math.min(player.entity.max_health, player.entity.current_health + 10);
			player.inventory.removeItem({name: itemName, quantity: 1});
			flyTextList.push(new flyText(player.entity.x, player.entity.y - (player.entity.height * 1.5), "+10 health", "#00FF00"));
		}
		else 
		{
			console.log("cannot use item " + itemName)
		}
	}
	else
	{
		console.log("failed to use item " + item.name);
	}
}

function setScreenSize(event)
{
	//canvas = document.createElement('canvas');
	width = window.innerWidth - 20;
	height = window.innerHeight - 20;
	canvas.width = width;
	canvas.height = height;
	context = canvas.getContext('2d');
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;
  	graphics_scaling = Math.ceil(Math.min(height,width)/250);
	pixelWidth = Math.ceil(width / graphics_scaling);
	pixelHeight = Math.ceil(height / graphics_scaling);
};

function playSoundEffect(path)
{
	var i = 0;
	while (i < soundEffect.length && !soundEffect[i].ended)
	{
		i++;
	}
	if (i < soundEffect.length)
	{
		soundEffect[i] = new Audio("audio//" + path);
		
	}
	else
	{
		soundEffect.push(new Audio("audio//" + path));
	}
	soundEffect[i].play();
}

socket.on('mapObjects', function(a)
{
	if (player.entity.mapId >= 0)
	{
		mapObjects = {};

		for (var i in a)
		{
			var p = new mapObject(a[i].x, a[i].y, a[i].spriteName);
			p.initialize();
			mapObjects[p.id] = p;
			view.insertStatic(p);
		}

		console.log(mapObjects);
	}

	updateNearbyObjects();
});

var Effect = function(spriteName, x, y, counter)
{
	this.spriteName = spriteName;
	this.x = x;
	this.y = y;
	this.z = 0;
	this.totalCounter = counter;
	this.counter = counter;
	this.height;
	this.width;
	this.alpha = 1;
	this.sprite = new Image();
	/*this.sprite.onload = function()
	{
		this.width = this.sprite.width;
		this.height = this.sprite.height / 2;
	}*/
	this.sprite.src = "img//" + this.spriteName + ".png";
};

Effect.prototype.update = function()
{
	this.counter--;
	this.alpha = this.counter * 1.000 / this.totalCounter;
};

socket.on('createEffect', function(spriteName, x, y, counter)
{
	var e = new Effect(spriteName, x, y, counter);
	effects.push(e);
});

// update position of other players from the server
socket.on('players', function(players)
{
	if (players[0].mapId == player.entity.mapId) // make sure the data is relevant, for example not something the server sent as the player changed maps
	{
		var needUpdate = false;
		if (playerList.length == 0)
		{
			needUpdate = true;
		}
		playerList = {};

		for (var i in players)
		{
			playerList[players[i].id] = copyEntity(players[i]);
		}
		if (needUpdate == true)
		{
			updateNearbyObjects();
		}
	}
});

// server notifies that the player has taken damage
socket.on('damageIn', function(x, y, damage)
{
	player.entity.takeDamage(x, y, damage);
	player.healthRegenCounter = 0;
});

// server notifies that the player has gained xp
socket.on('xpgain', function(xp, entity)
{
	for (var i in achievements)
	{
		achievements[i].enemyDefeated(entity);
	}
	for (var i in quests)
	{
		quests[i].enemyDefeated(entity);
	}
	player.entity.addXP(xp);
});

socket.on('itemreceived', function(item)
{
	console.log(item);
	player.inventory.addItem(item);
	playSoundEffect("coin.mp3");
});

// server sends all the projectiles currently on screen

socket.on('viewOnly', function(p, items)
{
	if (player.entity.mapId >= 0)
	{
		var array = [];

		for (var i in p)
		{
			InitializeProjectile(p[i]);
			array.push(p[i]);
		}

		for (var i in items)
		{
			items[i].sprite = new Image();
			items[i].sprite.src = "img//" + items[i].name + ".png";
			array.push(items[i]);
		}

		view.insertDynamic(array);
	}
});


socket.on('load', function(savedata)
	{
		loadPlayer(savedata);
	});

function loadPlayer(savedata)
{
	if (savedata == "false")
	{
		console.log("no load data received");
		player = new Player(defaultmapId);
		for (var i = 0; i < achievementCount; i++)
		{
			achievements[i] = new Objective(i);
		}
	}
	else
	{
		var data = JSON.parse(savedata);
		player = new Player(data.mapId);
		player.inventory.loadInventory(data.items);
		player.entity.setLevel(data.lvl);
		player.entity.xp = data.xp;
		player.entity.current_health = data.current_health;
		quests = loadObjective(data.quests);
		completedQuests = data.completedQuests;
		achievements = loadObjective(data.achievements);
		completedAchievements = data.completedAchievements;

		// save your data every 5 seconds
		setInterval(function()
		{
			socket.emit('save',player.entity.display_name,
				"{" + 
				"\"mapId\": \"" + player.entity.mapId + "\", " + 
				"\"items\": " + JSON.stringify(player.inventory.items) + "," + 
				"\"xp\": " + player.entity.xp + "," +
				"\"lvl\": " + player.entity.lvl + "," +
				"\"current_health\": " + player.entity.current_health + "," +
				"\"quests\": " + JSON.stringify(quests) + "," + 
				"\"completedQuests\": " + JSON.stringify(completedQuests) + "," + 
				"\"achievements\": " + JSON.stringify(achievements) + "," + 
				"\"completedAchievements\": " + JSON.stringify(completedAchievements) +  
				"}");
		}, 5000);
	}

	loadMap(player.entity.mapId);
	
	//audio.play(); //must come after loadMap
	frameTime = new Date().getTime();
	startTime = frameTime;
	step();
};

function loadObjective(data)
{
	var objectives = {};

	for (var i in data)
	{
		objectives[i] = new Objective(i);
		objectives[i].tracker = data[i].tracker;
	}

	return objectives;
}

// check current ping
socket.on('ping', function(serverTime)
{
	ping = new Date().getTime() - serverTime;
});

