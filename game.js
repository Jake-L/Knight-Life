// play background music
var audio;

// create the graphics canvas
var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
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
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.fillStyle = "#ADD8E6";
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();
var weatherSprite = [];
var healthBarSprite = new Image();
healthBarSprite.src = "img//healthbar.png";
var healthBarGreenSprite = new Image();
healthBarGreenSprite.src = "img//healthbargreen.png";
var minimapbox = new Image();
minimapbox.src = "img//minimapbox.png";

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

var maxX = [1000,1000];
var minY = [30,30];
var maxY = [500,800];

var playerList = {};
var mapObjects = {};
var projectileList = [];
var flyTextList = [];
var notificationList = [];
var portalList = [];

var playerSprite = [];
var playerAttackSprite = [];
var weaponSprite = {};
var username = "";
var playerXP = 0;
var minimapScale = 16;

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
mapObject = share.mapObject;
Attack = shareAttack.Attack;
Entity = shareEntity.Entity;

var defaultmapId = 0;
var player;
var missions = [];
var achievements = [];

window.onload = function()
{
	document.body.appendChild(canvas);
	loadMap(defaultmapId);
	loadSprite("player",["Punch","Arrow"]);
	loadSprite("iceman",["Punch","Snowball"]);
	loadWeapons();

	//get the player's username
	username = getUsername();
	spawnPlayer(defaultmapId);
	
	audio.play(); //must come after loadMap

	for (var i in initialize)
	{
		achievements.push(new Objective(i));
	}

	frameTime = new Date().getTime();
	startTime = frameTime;
	step();

};

// create the player
function spawnPlayer(mapId)
{
	player = new Player(mapId);
	player.entity.display_name = username;
	player.entity.xp = playerXP;
	player.entity.updateLevel();
	get_offset();
}

function loadMap(mapId)
{
	console.log("loading map " + mapId);
	backgroundSprite = new Image();
	backgroundSpriteTop = new Image();

	if (mapId == 0)
	{
		audio = new Audio("audio//track2.mp3");
		backgroundSprite.src = "img//grass1.png";
		backgroundSpriteTop.src = "img//grass1top.png";
		portalList[0] = new Portal(990, 300, 20, 20, 1, 10, 300, "Right");
		weatherSprite = [];
	}
	else if (mapId == 1)
	{
		audio = new Audio("audio//track1.mp3");
		backgroundSprite.src = "img//snow1.png";
		backgroundSpriteTop.src = "img//snow1top.png";
		portalList[0] = new Portal(10, 300, 20, 20, 0, 990, 300, "Left");
		weatherSprite = [];

		for (var i = 0; i < 4; i++)
		{
			weatherSprite[i] = new Image();
			weatherSprite[i].src = "img//snowfall" + i + ".png";
		}
	}
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
		console.log(attacks[k]);
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
	weaponSprite["Sword"][0][3].y_offset = 7;
}

var ucounter = 0;
var rcounter = 0;

// update's the time when a user re-opens the game window
window.addEventListener("focus", function()
{
	frameTime = new Date().getTime();
}
);

var rfps = 0;
var ufps = 0;

function step()
{
	if (new Date().getTime() > frameTime)
	{
		if (ucounter / 15 == 0)
		{
			updateNearbyObjects();
		}
		update();
		socket.emit('movement', player.entity); //send new location to server
		frameTime += 16.6;
		ucounter += 1;
		
	}
	context.fillStyle = "#ADD8E6";

  	render();
	rcounter += 1;
	//renderBackground();

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
	//console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));
	setTimeout(step, 4);
}

function getUsername()
{
	var username;
	var c = decodeURIComponent(document.cookie).split(';');
	console.log(c);

	// read username from a cookie
	if (c != null && c[0].substr(0,8) == "username" && c[0].length > 9)
	{
		username = c[0].substr(9,c[0].length - 1);
		console.log(username);
	}

	// get username from user
	else
	{
		username = prompt("Please enter your username:");
		if (username == null || username == "")
		{
			username = "Player";
		}
		else
		{
			// save username to cookie
			document.cookie = "username=" + username;
			notificationList.push(new Notification("Default Controls","Press 1 to jump;Press 2 for basic attack;Press 3 for ranged attack"));
		}
	}

	return username;
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
		if (Math.abs(mapObjects[j].x - player.entity.x) <= 120 && Math.abs(mapObjects[j].y - player.entity.y) <= 120)
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
	if (audio.currentTime + (8/60) > audio.duration)
	{
		audio.currentTime = 0;

		if (audio.ended == true)
		{
			audio.play();
		}
	}


	if (player.entity.current_health <= 0)
	{
		playerXP = player.entity.xp;
		socket.emit('death');
		spawnPlayer(player.entity.mapId);
	}
	else
	{
		//update player object
		player.update();
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
				player.entity.x = portalList[i].destination_x;
				player.entity.y = portalList[i].destination_y;
				player.entity.mapId = portalList[i].destination_mapId;
				loadMap(portalList[i].destination_mapId);
				player.portalCounter = 30;
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
		if (achievements[i].isComplete())
		{
			notificationList.push(new Notification("Achievement Complete","You completed the achievement " + achievements[i].name))
			r = achievements[i].reward;

			if (typeof(r) !== "undefined" && r != null)
			{
				if (typeof(r.xp) !== "undefined")
				{
					player.entity.addXP(r.xp);
				}
			}

			achievements.splice(i, 1);
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

		if (notificationList[0].counter <= 0)
		{
			notificationList.splice(0,1);
		}
	}

};

//displays the background image
function renderBackground()
{
	context.fillRect(0, 0, width, height);

	if (backgroundSprite.complete && backgroundSprite.naturalHeight !== 0)
	{
		var x_counter = Math.ceil((width / graphics_scaling) / backgroundSprite.width) + 1;
		var y_counter = Math.ceil((height / graphics_scaling) / backgroundSprite.height) + 1;

		for (i = 0; i <= x_counter; i++)
		{
			for (j = 0; j <= y_counter; j++)
			{
				// draw a different background rectangle at the very top of the screen
				if (j == 0 && y_offset < backgroundSpriteTop.height)
				{
					context.drawImage(backgroundSpriteTop,
					((backgroundSpriteTop.width * i) - (x_offset % backgroundSpriteTop.width)) * graphics_scaling, //x position
					((backgroundSpriteTop.height * j) - (y_offset % backgroundSpriteTop.height)) * graphics_scaling, //y position
					backgroundSpriteTop.width * graphics_scaling, //width
					backgroundSpriteTop.height * graphics_scaling); //height
				}
				// draw the usual background rectangle
				else
				{
					context.drawImage(backgroundSprite,
					((backgroundSprite.width * i) - (x_offset % backgroundSprite.width)) * graphics_scaling, //x position
					((backgroundSprite.height * j) - (y_offset % backgroundSprite.height)) * graphics_scaling, //y position
					backgroundSprite.width * graphics_scaling, //width
					backgroundSprite.height * graphics_scaling); //height
				}
			}
		}
	}
}

// display the current weather (snow, rain, etc.) if there is any
function renderWeather()
{
	if (typeof(weatherSprite) !== "undefined" && weatherSprite.length > 0)
	{
		var img = weatherSprite[Math.floor((new Date().getTime() % 400) / 100)];

		if (img.complete && img.naturalHeight !== 0)
		{
			var x_counter = Math.ceil((width / graphics_scaling) / img.width) + 1;
			var y_counter = Math.ceil((height / graphics_scaling) / img.height) + 1;

			for (i = 0; i <= x_counter; i++)
			{
				for (j = 0; j <= y_counter; j++)
				{
					// draw the usual background rectangle
					context.drawImage(img,
					((img.width * i) - (x_offset % img.width)) * graphics_scaling + Math.floor(((new Date().getTime() % (graphics_scaling * 100)) / 100) / graphics_scaling), //x position
					((img.height * j) - (y_offset % img.height)) * graphics_scaling + Math.floor(((new Date().getTime() % (graphics_scaling * 100)) / 100) / graphics_scaling), //y position
					img.width * graphics_scaling, //width
					img.height * graphics_scaling); //height
				}
			}
		}
	}
}

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
	return p;
}

//initialize the player
function Player(mapId)
{
  	this.entity = new Entity(100,100,"player",mapId);
	this.entity.initialize();
	this.entity.allyState = "Player";
	this.healthRegenCounter = 0;
	this.portalCounter = 0;
}

//display the player
Player.prototype.render = function()
{
  this.entity.render();
};

//display graphics
var render = function()
{
	renderBackground();

	//create a list of all the entities to be rendered
	var renderList = [];

	for (var i in playerList)
	{
		playerList[i].updateSprite();
		renderList.push(playerList[i]); // add all the other players
	}

	player.entity.updateSprite();
	renderList.push(player.entity); // add the player

	var entityList = [];
	Array.prototype.push.apply(entityList, renderList);

	for (var j in mapObjects)
	{
		renderList.push(mapObjects[j]);
	}

	for (var j in projectileList)
	{
		renderList.push(projectileList[j]);
	}

	// sort the list of players
	renderSort(renderList);

	for (var n in renderList)
	{
		renderList[n].render(); // render each player
	}

	//display weather if there is any
	renderWeather();

	for (var i in entityList)
	{
		entityList[i].renderHealthBar();
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
		e = array[i];
		j = i - 1;

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

	if (this.entity.sprite.complete && this.entity.sprite.naturalHeight !== 0)
	{
		 this.entity.width = Math.floor(this.entity.sprite.width * 0.8);
		 this.entity.width -= this.entity.width % 2;
		 this.entity.depth = Math.floor(this.entity.sprite.height * 0.5);
		 this.entity.height = this.entity.sprite.height;
	}

	/* move the player based on user input */
	var x_direction = 0;
	var y_direction = 0;

	// loops through every key currently pressed and performs an action
	if (!this.entity.knockback || (Maths.abs(y_speed) <= 3 && Math.abs(x_speed) <= 3))
	{
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
			else if (value == 67)
			{
				document.cookie = "username=";
				console.log(document.cookie);
			}
		}
	}

	this.entity.move(x_direction, y_direction);

	this.entity.update();

	get_offset();
};

// check the offset used for screen scrolling
function get_offset()
{
	var left_offset = player.entity.x - (pixelWidth / 2);
	var right_offset = player.entity.x + (pixelWidth / 2);

	// check if the player is moving in the middle of the map and the screen needs to be moved
	if (left_offset > 0 && right_offset < maxX[player.entity.mapId])
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

	if (top_offset > 0 && bot_offset < maxY[player.entity.mapId])
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
function Projectile(p)
{
	//this.x = p.x;
	//this.y = p.y;
	this.x = p.spawn_x;
	this.y = p.spawn_y;
	this.z = p.z;
	this.x_speed = p.x_speed;
	this.y_speed = p.y_speed;
	this.spriteName = p.spriteName;
	this.spawn_time = p.spawn_time;
	this.sprite = new Image();

	if (this.spriteName == "Snowball")
	{
		this.sprite.src = "img//" + this.spriteName + ".png";
	}
	else
	{
		if (this.x_speed > 0)
		{
			this.sprite.src = "img//" + this.spriteName + "Right.png";
		}
		else if (this.x_speed < 0)
		{
			this.sprite.src = "img//" + this.spriteName + "Left.png";
		}
		else if (this.y_speed > 0)
		{
			this.sprite.src = "img//" + this.spriteName + "Down.png";
		}
		else if (this.y_speed < 0)
		{
			this.sprite.src = "img//" + this.spriteName + "Up.png";
		}
	}

	this.render = function()
	{
		var n = (new Date().getTime() - this.spawn_time)/(1000/60);

		if (n > 0)
		{
			context.save();
			context.shadowColor = "rgba(80, 80, 80, .4)";
			context.shadowBlur = 15 + this.z;
			context.shadowOffsetX = 0;
			context.shadowOffsetY = (3 + this.z) * graphics_scaling;

			context.drawImage(
				this.sprite, 
				//(this.x - (this.sprite.width/2) - x_offset) * graphics_scaling,
				//(this.y - this.sprite.height - this.z - y_offset) * graphics_scaling,
				(this.x + (n * this.x_speed) - (this.sprite.width/2) - x_offset) * graphics_scaling,
				(this.y + (n * this.y_speed) - this.sprite.height - this.z - y_offset) * graphics_scaling,
				this.sprite.width * graphics_scaling,
				this.sprite.height * graphics_scaling);

			context.restore();
		}
	};
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
		context.fillStyle = this.colour;
		context.font = "bold" + 4 * graphics_scaling + "px sans-serif";
		context.globalAlpha = this.counter / 100;
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

	// draw the minimap outline
	context.drawImage(minimapbox, x - (2 * graphics_scaling), y - (2 * graphics_scaling), 54 * graphics_scaling, 54 * graphics_scaling);
}

// check if the user clicks the mouse
function printMousePos(event) {
  console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
}

document.addEventListener("click", printMousePos);
window.addEventListener("resize", setScreenSize);
//document.addEventListener("fullscreenchange", setScreenSize);



function setScreenSize(event)
{
	canvas = document.createElement('canvas');
	width = window.innerWidth - 20;
	height = window.innerHeight - 20;
	canvas.width = width;
	canvas.height = height;
  	graphics_scaling = Math.ceil(Math.min(height,width)/250);
	pixelWidth = Math.ceil(width / graphics_scaling);
	pixelHeight = Math.ceil(height / graphics_scaling);
};

socket.on('mapObjects', function(a)
{
	mapObjects = {};

	for (var i in a)
	{
		p = new mapObject(a[i].x, a[i].y, a[i].spriteName);
		p.initialize();
		mapObjects[p.id] = p;
	}
});

// update position of other players from the server
socket.on('players', function(players)
{
	playerList = {};

	for (var i in players)
	{
		playerList[i] = copyEntity(players[i]);
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
	player.entity.addXP(xp);
});

// server sends all the projectiles currently on screen
socket.on('projectiles', function(p)
{
	projectileList = [];

	for (var i in p)
	{
		projectileList.push(new Projectile(p[i]));
	}
});

// check current ping
socket.on('ping', function(serverTime)
{
	ping = new Date().getTime() - serverTime;
});

