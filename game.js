// play background music	
var audio; 

// create the graphics canvas
var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var graphics_scaling = Math.ceil(height/250);
console.log(graphics_scaling);
var pixelWidth = Math.ceil(width / graphics_scaling);
var pixelHeight = Math.ceil(height / graphics_scaling);
var x_offset = 0;
var y_offset = 0;

// create the player's graphics and add a shadow
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.fillStyle = "#ADD8E6";
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();
var healthBarSprite = new Image();
healthBarSprite.src = "img//healthbar.png";
var healthBarGreenSprite = new Image();
healthBarGreenSprite.src = "img//healthbargreen.png";

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 70;

var frameTime = 0;
var startTime = 0;

var mapId = 0;
var maxX = [1000];
var minY = [30];
var maxY = [500];

var playerList = [];
var mapObjects = [];

//functions from external files
mapObject = share.mapObject;
Entity = shareEntity.Entity;

//create the player
var player = new Player();

window.onload = function() 
{
  document.body.appendChild(canvas);
	loadMap(mapId);
	audio.play();
	
	//get the player's username
	player.entity.display_name = getUsername();
	
	frameTime = new Date().getTime();
	startTime = frameTime;
	step();
	
};

function loadMap(mapId)
{
	if (mapId == 0)
	{
		audio = new Audio("audio//track1.mp3");
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

var ucounter = 0;
var rcounter = 0;

// update's the time when a user re-opens the game window
window.addEventListener("focus", function()
{
	frameTime = new Date().getTime();
}
);

var rfps = 0;

var step = function() 
{
	if (new Date().getTime() > frameTime)
	{
		updateCollisionList();
		update();
		frameTime += 16.6;
		ucounter += 1;
	}
	context.fillStyle = "#ADD8E6";
	renderBackground();
  render();
	rcounter += 1;
	
	if (rcounter >= 100)
	{
		rfps = Math.round(rcounter / ((new Date().getTime() - startTime)/1000));
		startTime = new Date().getTime();
		rcounter = 0;
	}
	context.font = "10px sans-serif";
	context.fillStyle = "#000000";
	context.fillText("FPS: " + rfps,10,10);
	//console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));

	setTimeout(step, 5);
};

function getUsername()
{
	var username = prompt("Please enter your username:");
	if (username == null || username == "")
	{
		username = "Player";
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
};


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
	
	//update player object
  player.update();
	
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
	var p = new Entity(old.x, old.y, "playerDown0");
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
	p.initialize();
	return p;
}


//initialize the player
function Player() 
{
  this.entity = new Entity(100,100,"playerDown0");	 
	this.entity.initialize();
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
	//create a list of all the entities to be rendered
	var renderList = [];
	
	renderList.push(player.entity); // add the player
	
	for (var i in playerList)
	{
		renderList.push(playerList[i]); // add all the other players
	}
	
	var entityList = [];
	Array.prototype.push.apply(entityList, renderList);
	
	for (var j in mapObjects)
	{
		renderList.push(mapObjects[j]);
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
		console.log(this.entity.current_health);
	
		if (this.healthRegenCounter >= 300)
		{
			this.entity.current_health ++;
			this.healthRegenCounter = 0;
		}
	}
	
	this.entity.x_speed = 0;
	this.entity.y_speed = 0;
	
	var x_direction = 0;
	var y_direction = 0;
	
	if (this.entity.sprite.complete && this.entity.sprite.naturalHeight !== 0)
	{
		 this.entity.width = Math.floor(this.entity.sprite.width * 0.8);
		 this.entity.width -= this.entity.width % 2;
		 this.entity.depth = Math.floor(this.entity.sprite.height * 0.5);
		 this.entity.height = this.entity.sprite.height;
	}
	
	// move the player based on user input
	// loops through every key currently pressed and performs an action
	if (!this.entity.knockback || (Maths.abs(y_speed) <= 3 && Math.abs(x_speed) <= 3))
	{		
		for(var key in keysDown) 
		{
			var value = Number(key);
			
			if(value == left_key) 
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



// check if the user clicks the mouse
function printMousePos(event) {
  console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);
}

document.addEventListener("click", printMousePos);
//window.addEventListener("resize", myFunction);

// retrieve data from the server
var socket = io();

socket.on('mapObjects', function(a)
{
	for (var i in a)
	{
		p = new mapObject(a[i].x, a[i].y, a[i].spriteName);
		p.initialize();
		mapObjects.push(p);
		
	}
});


socket.on('players', function(players)
{
	// back up the old player list, so we can see who left
	var oldList = new Array();
	
	for (var n in playerList)
	{
		oldList[n] = false;
	}
	
	// if there is a player in the new list not in the current list, add them
	for(var i in players)
	{
		p = copyEntity(players[i]);
		playerList[i] = p;
		oldList[i] = true;
	}
	
	// remove any players who disconnected
	for (var j in oldList)
	{
		if (oldList[j] == false)
		{
			delete playerList[j];
		}
	}
});

// send current location to the server
setInterval(function() 
{
	if (player != null)
	{
		socket.emit('movement', player.entity);
	}
}, 1000 / 60);

socket.emit('new player');
