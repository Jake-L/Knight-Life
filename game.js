// play background music	
var audio; 

// create the graphics canvas
var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var graphics_scaling = Math.ceil(height/250);
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


window.onload = function() 
{
  document.body.appendChild(canvas);
	loadMap(mapId);
	audio.play();
	
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
	context.fillStyle = "#000000";
	context.fillText("FPS: " + rfps,10,10);
	//console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));

	setTimeout(step, 5);
};

//initialize an entity
	function Entity(x,y,spriteName)
	{
		this.x = x; // X is the center of the sprite (in-game measurement units)
		this.y = y; // Y is the bottom of the sprite (in-game measurement units)
		this.z = 0; // Z is the sprite's height off the ground (in-game measurement units)
		this.draw_x = 0; // the x position for displaying the image (graphics scaled units)
		this.draw_y = 0; // the y position for displaying the image (graphics scaled units)
		this.x_speed = 0;
		this.y_speed = 0;
		this.z_speed = 0;
		this.width;
		this.height;
		this.knockback = false;
		this.sprite = new Image();
		this.sprite.src = "img//" + spriteName + ".png";

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

//create the player
var player = new Player();



//initialize an entity from a pre-existing entity
function copyEntity(old)
{
	var p = new Entity(old.x, old.y, "playerDown0");
	p.x = old.x; // X is the center of the sprite (in-game measurement units)
  p.y = old.y; // Y is the bottom of the sprite (in-game measurement units)
	p.z = old.z; // Z is the sprite's height off the ground (in-game measurement units)
	p.draw_x = old.draw_x; // the x position for displaying the image (graphics scaled units)
	p.draw_y = old.draw_y; // the y position for displaying the image (graphics scaled units)
	p.width = old.width;
	p.height = old.height;
	p.knockback = old.knockback;
	return p;
}

//display the entity
Entity.prototype.render = function() 
{	
	if (this.sprite.complete && this.sprite.naturalHeight !== 0)
	{
		context.save();
		context.shadowColor = "rgba(80, 80, 80, .4)";
		context.shadowBlur = 15 + this.z;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = (3 + this.z) * graphics_scaling;
		
		//this.width = (this.sprite.width + (this.y * 0.1));
		//this.height = (this.sprite.height + (this.y * 0.1));
		this.width = this.sprite.width;
		this.height = this.sprite.height;
		this.draw_x = (this.x - (this.width/2) - x_offset) * graphics_scaling;
		this.draw_y = (this.y - this.height - this.z - y_offset) * graphics_scaling;
		context.drawImage(this.sprite, this.draw_x, this.draw_y, this.width * graphics_scaling, this.height * graphics_scaling);
		context.restore();
	}
};

//initialize the player
function Player() 
{
   this.entity = new Entity(100,100,"playerDown0");
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
	var renderList = new Array();
	
	renderList.push(player.entity); // add the player
	
	for (var i in playerList)
	{
		renderList.push(playerList[i]); // add all the other players
	}
	
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
	if (e1.y <= e2.y && e1.y > e2.y - (e2.width/3) && e1.z > e2.z) // if you're standing on top of them, you get drawn second
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
	// move the player based on user input
	// loops through every key currently pressed and performs an action
	if (!this.entity.knockback || (Maths.abs(y_speed) <= 3 && Math.abs(x_speed) <= 3))
	{		
		for(var key in keysDown) 
		{
			var value = Number(key);
			
			if(value == left_key) 
			{ 
				this.entity.move(-1, 0);
			} 
			else if (value == right_key) 
			{
				this.entity.move(1, 0);
			} 
			else if (value == up_key)
			{
				this.entity.move(0,-1);
			}
			else if (value == down_key)
			{
				this.entity.move(0,1)
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
	
	this.entity.collisionCheck();
	
	// apply gravity if the player is jumping
	if (this.entity.z > 0 || this.entity.z_speed > 0)
	{
		this.entity.z += this.entity.z_speed;
		this.entity.z_speed -= 0.15;
	
		if (this.entity.z + this.entity.z_speed <= 0) //if on the ground, no gravity
		{
			this.entity.z = 0;
			this.entity.z_speed = 0;
		}
	}
	
	// if the player has been knocked back by an attack, decrease their falling speed
	if (this.entity.knockback)
	{
		if (this.entity.x_speed != 0) 
		{
			this.entity.x += this.entity.x_speed;
			this.entity.x_speed = (Math.abs(this.entity.x_speed) - 0.5) * (this.entity.x_speed / Math.abs(this.entity.x_speed));
		}
		if (this.entity.y_speed != 0)
		{
			this.entity.y += this.entity.y_speed;
			this.entity.y_speed = (Math.abs(this.entity.y_speed) - 0.5) * (this.entity.y_speed / Math.abs(this.entity.y_speed));
		}
		if (this.entity.y_speed == 0 && this.entity.x_speed == 0)
		{
			this.entity.knockback = false;
		}
	}
	// if they are not being knockbacked, apply their movement normally
	else
	{
		this.entity.x += this.entity.x_speed;
		this.entity.y += this.entity.y_speed;
		this.entity.x_speed = 0;
		this.entity.y_speed = 0;
	}
	
	get_offset();
};

// check if the unit has collided with anything
// in the future, maintain a list of entities within 100 units of the entity for faster checking
Entity.prototype.collisionCheck = function()
{
	var collisionList = [];
	Array.prototype.push.apply(collisionList, playerList);
	Array.prototype.push.apply(collisionList, mapObjects);
	
	for (var i in collisionList)
	{
		
		// if the entity isn't trying to move, stop checking for collisions
		if (Math.abs(this.x_speed) + Math.abs(this.y_speed) + Math.abs(this.z_speed) == 0)
		{
			break;
		}
		
		var c = collisionCheckAux(this, collisionList[i]);
		
		// check if their movement is blocked on the x-axis
		if (c[0] == 1 && this.x_speed < 0)
		{
			this.x_speed = 0;
		}
		else if (c[0] == -1 && this.x_speed > 0)
		{
			this.x_speed = 0;
		}
		
		// check if their movement is blocked on the y-axis
		if (c[1] == 1 && this.y_speed < 0)
		{
			this.y_speed = 0;
		}
		else if (c[1] == -1 && this.y_speed > 0)
		{
			this.y_speed = 0;
		}
		
		// check if their movement is blocked on the z-axis
		if (c[2] == 1 && this.z_speed < 0)
		{
			this.z_speed = 0;
			this.z = Math.ceil(this.z);
		}
		else if (c[2] == -1 && this.z_speed > 0)
		{
			this.z_speed = 0;
			this.z = Math.ceil(this.z);
		}
	}	
};

/* checks for a collision between two entities
 * returns an array with three values, in the order {x,y,z}
 * possible return values:
 * 	0: can move in any direction along that axis
 * 	-1: can move in negative direction along axis
 * 	1: can move in positive direction along axis
 * a player can not be restricted from moving in either direction by a single entity
 * if two entities are standing at the exact same coordinates, they can move in any direction
 */
function collisionCheckAux(e1, e2)
{
	var c = [0,0,0];
	
	// check what x-directions the player can move (left / right)
	if 
	(
		e1.x_speed != 0 //check that they are moving on the x-axis
		&& (e1.y > e2.y - (e2.width/2) && e1.y - (e1.width/2) < e2.y) // check for y-axis interception
		&& (e1.z < e2.z + Math.floor(e2.height * 0.8) && e1.z + Math.floor(e1.height * 0.8) > e2.z) // check for z-axis interception
		&& e1.x != e2.x //if they have the same x-position, don't restrict their movement on the x-axis
	)
		{
			// check if there is space to left of you to move
			if (e1.x - (e1.width / 2) >= e2.x - (e2.width / 2) && e1.x - (e1.width / 2) <= e2.x + (e2.width / 2))
			{
				c[0] = 1; //if there is no space to your left, you can only move right
			}
			// check if there is space to right of you to move
			if (e1.x + (e1.width / 2) >= e2.x - (e2.width / 2) && e1.x + (e1.width / 2) <= e2.x + (e2.width / 2))
			{
				c[0] = -1; //if there is no space to your right, you can only move left
			}
		}
	
	// check what y-directions the player can move (forward / backward)
	if 
	(
		e1.y_speed != 0 // check that they are actually moving on the y-axis
		&& (e1.x + e1.width/2 > e2.x - e2.width/2 && e1.x - e1.width/2 < e2.x + e2.width/2) // check for x-axis interception
		&& (e1.z < e2.z + Math.floor(e2.height * 0.8) && e1.z + Math.floor(e1.height * 0.8) > e2.z) // check for z-axis interception
		&& e1.y != e2.y //if they have the same y-position, don't restrict their movement on the y-axis
	)	
		{
			// check if there is space behind you to move
			if (e1.y - Math.ceil(e1.width / 2) >= e2.y - Math.ceil(e2.width / 2) && e1.y - Math.ceil(e1.width / 2) <= e2.y) 
			{
				c[1] = 1; // if there is no space behind you, you can move downward but not upward
			}
			// check if there is space in front of you to move
			else if (e1.y >= e2.y - Math.ceil(e2.width / 2) && e1.y <= e2.y)
			{
				c[1] = -1; // if there is no space in front of you, you can move upward but not downward
			}
		}
	
	// check what z-directions the player can move (upward / downward)
	if
	(
		// check for x-axis interception
		(e1.z > 0 || e1.z_speed != 0)
		&& (e1.x + e1.width/2 > e2.x - e2.width/2 && e1.x - e1.width/2 < e2.x + e2.width/2) // check for x-axis interception
		&& (e1.y > e2.y - (e2.width/2) && e1.y - (e1.width/2) < e2.y) // check for y-axis interception
	)
		{
			// check if there is space below you to move
			if (Math.ceil(e1.z) >= Math.ceil(e2.z) && Math.ceil(e1.z) <= Math.ceil(e2.z) + Math.floor(e2.height * 0.8))
			{
				c[2] = 1;
			}
			// check if there is space above you to move
			else if (Math.ceil(e1.z) + e1.height >= Math.ceil(e2.z) && Math.ceil(e1.z) + e1.height <= Math.ceil(e2.z) + e2.height)
			{
				c[2] = -1;
			}
		}
	
	
	// return the result
	return c;
}

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

Entity.prototype.move = function(x, y) 
{
	this.knockback = false;
	
	// check if the character moves along the x-axis
  if(this.x + x - (this.width/2) <= 0) // at the left edge
	{ 
    this.x = (this.width/2);
    this.x_speed = 0;
  } 
	else if ((this.x + x + (this.width/2)) >= maxX[mapId]) // at the right edge
	{ 
    this.x = maxX[mapId] - (this.width/2);
    this.x_speed = 0;
  }
	else
	{
		this.x_speed += x;
	}
	
  //check if the character moves along the y-axis
	if (this.y + y - this.height <= minY[mapId]) // at the top edge
	{
		this.y = minY[mapId] + this.height;
		this.y_speed = 0;
	}
	else if (this.y + y >= maxY[mapId]) // at the bottom edge
	{
		this.y = maxY[mapId];
		this.y_speed = 0;
	}
	else
	{
		this.y_speed += y;
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
			mapObjects.push(new Entity(a[i].x, a[i].y, a[i].name));
		}
	}
)

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
