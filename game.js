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

// create the player's graphics
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.fillStyle = "#ADD8E6";
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();
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

var mapId = 0;
var maxX = [1000];
var minY = [30];
var maxY = [500];

var playerList = [];
var mapObjects = [];
var projectileList = [];
var flyTextList = [];
var notificationList = [];

var playerSprite = [];
var playerAttackSprite = [];
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
Entity = shareEntity.Entity;

var player;
var missions = [];
var achievements = [];

window.onload = function()
{
  document.body.appendChild(canvas);

	//get the player's username
	username = getUsername();

	spawnPlayer();
	loadMap(mapId);
	audio.play(); //must come after loadMap
	loadSprite("player");
	loadSprite("iceman");
	achievements.push(new Objective(0));
	achievements.push(new Objective(1));
	achievements.push(new Objective(2));

	frameTime = new Date().getTime();
	startTime = frameTime;
	step();

};

// create the player
function spawnPlayer()
{
	 player = new Player();
	 player.entity.display_name = username;
	 player.entity.xp = playerXP;
	 player.entity.updateLevel();
	 get_offset();
}

function loadMap(mapId)
{
	if (mapId == 0)
	{
		audio = new Audio("audio//track2.mp3");
		backgroundSprite.src = "img//grass1.png";
		backgroundSpriteTop.src = "img//grass1top.png";
	}
	else if (mapId == 1)
	{
		audio = new Audio("audio//track3.mp3");
		backgroundSprite.src = "img//grass1.png";
		backgroundSpriteTop.src = "img//grass1top.png";
	}
}

//load sprites
function loadSprite(spriteName)
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
	var a = [];

	for (var i = 0; i < 4; i++)
	{
		var s = [];

		for (var j = 0; j < 3; j++)
		{
			img = new Image();
			img.src = "img//" + spriteName + "Attack" + getDirName(i) + j + ".png";
			s[j] = img;
		}

		a[i] = s;
	}

	playerAttackSprite[spriteName] = a;
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
	//console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));
	setTimeout(step, 4);
}

function getUsername()
{
	var username;
	var c = decodeURIComponent(document.cookie).split(';');

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
function updateCollisionList()
{
	var collisionList = [];

	for (var i in playerList)
	{
		if (Math.abs(playerList[i].x - player.entity.x) <= 120 && Math.abs(playerList[i].y - player.entity.y) <= 120)
		{
			collisionList.push(playerList[i]);
		}
	}

	for (var j in mapObjects)
	{
		if (Math.abs(mapObjects[j].x - player.entity.x) <= 120 && Math.abs(mapObjects[j].y - player.entity.y) <= 120)
		{
			collisionList.push(mapObjects[j]);
		}
	}

	player.entity.collisionList = collisionList;
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
		spawnPlayer();
	}
	else
	{
		//update player object
		player.update();
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

//initialize an entity from a pre-existing entity
function copyEntity(old)
{
	var p = new Entity(old.x, old.y, old.spriteName);
	p.x = old.x; // X is the center of the sprite (in-game measurement units)
  p.y = old.y; // Y is the bottom of the sprite (in-game measurement units)
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
	p.attack_length = old.attack_length;
	p.lvl = old.lvl;
	p.allyState = old.allyState;
	p.initialize();
	return p;
}


//initialize the player
function Player()
{
  this.entity = new Entity(100,100,"player");
	this.entity.initialize();
	this.entity.allyState = "Player";
	this.healthRegenCounter = 0;
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
	updateCollisionList();

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
				{this.entity.createAttack(1);}
			}
			else if (value == attack2_key)
			{
				if (this.entity.attack_counter <= 1)
				{this.entity.createAttack(2);}
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

	socket.emit('movement', player.entity); // transmit new location to the server

	get_offset();
};

// check the offset used for screen scrolling
function get_offset()
{
	var left_offset = player.entity.x - (pixelWidth / 2);
	var right_offset = player.entity.x + (pixelWidth / 2);

	// check if the player is moving in the middle of the map and the screen needs to be moved
	if (left_offset > 0 && right_offset < maxX[mapId])
	{
		x_offset = left_offset;
	}
	else if (left_offset > 0 && right_offset >= maxX[mapId])
	{
		x_offset = maxX[mapId] - pixelWidth;
	}
	else
	{
		x_offset = 0;
	}

	var top_offset = player.entity.y - (pixelHeight / 2);
	var bot_offset = player.entity.y + (pixelHeight / 2);

	if (top_offset > 0 && bot_offset < maxY[mapId])
	{
		y_offset = top_offset;
	}
	else if (top_offset > 0 && bot_offset >= maxY[mapId])
	{
		y_offset = maxY[mapId] - pixelHeight;
	}
	else
	{
		y_offset = 0;
	}
}

// holds information about projectiles on-screen
function Projectile(p)
{
	this.x = p.x;
	this.y = p.y;
	//this.x = p.spawn_x;
	//this.y = p.spawn_y;
	this.z = p.z;
	this.x_speed = p.x_speed;
	this.y_speed = p.y_speed;
	this.spriteName = p.spriteName;
	this.spawn_time = p.spawn_time;
	this.sprite = new Image();
	this.sprite.src = "img//" + this.spriteName + ".png";

	this.render = function()
	{
		context.save();
		context.shadowColor = "rgba(80, 80, 80, .4)";
		context.shadowBlur = 15 + this.z;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = (3 + this.z) * graphics_scaling;

		var n = (new Date().getTime() - this.spawn_time)/(1000/60);

		context.drawImage(
			this.sprite, (this.x - (this.sprite.width/2) - x_offset) * graphics_scaling,
			(this.y - this.sprite.height - this.z - y_offset) * graphics_scaling,
			//(this.x + (n * this.x_speed) - (this.sprite.width/2) - x_offset) * graphics_scaling,
			//(this.y + (n * this.y_speed) - this.sprite.height - this.z - y_offset) * graphics_scaling,
			this.sprite.width * graphics_scaling,
			this.sprite.height * graphics_scaling);

		context.restore();
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
	else if ((maxX[mapId] - player.entity.x) / minimapScale < 25)
	{
		m_x_offset = (maxX[mapId] / minimapScale) -50;
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
	else if ((maxY[mapId] - player.entity.y) / minimapScale <= 25)
	{
		m_y_offset = (maxY[mapId] / minimapScale) - 50;
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
	for (var i in a)
	{
		p = new mapObject(a[i].x, a[i].y, a[i].spriteName);
		p.initialize();
		mapObjects.push(p);
	}
});

// update position of other players from the server
socket.on('players', function(players)
{
	playerList = [];

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

socket.emit('new player');
