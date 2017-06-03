// play background music	
var audio; 

// create the graphics canvas
var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var graphics_scaling = Math.ceil(height/250);

// create the player's graphics and add a shadow
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.fillStyle = "#ADD8E6";
var backgroundSprite = new Image();

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 70;

var frameTime = 0;
var startTime = 0;

var mapId = 0;
var maxX = [400];
var minY = [30];
var maxY = [200];

var playerList = {};


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
		backgroundSprite.src = "img//grassbackground.png";
	}
	else if (mapId == 1)
	{
		audio = new Audio("audio//track3.mp3");
		backgroundSprite.src = "img//smw.png";
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
	
var step = function() 
{
	if (new Date().getTime() > frameTime)
	{
		update();
		frameTime += 16.6;
		ucounter += 1;
	}
	
	renderBackground();
  render();
	rcounter += 1;
	
	//console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));

	setTimeout(step, 1);
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
		var counter = Math.ceil((width / graphics_scaling) / backgroundSprite.width);
		
		for (i = 0; i <= counter; i++)
		{
			context.drawImage(backgroundSprite, (backgroundSprite.width * (i-1)) * graphics_scaling, height - (backgroundSprite.height * graphics_scaling) , backgroundSprite.width * graphics_scaling, backgroundSprite.height * graphics_scaling);
		}
	}

}

//create the player
var player = new Player();


//initialize an entity
function Entity(x, y) 
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
	this.sprite.src = "img//playerDown0.png";
}

//initialize an entity from a pre-existing entity
function copyEntity(old)
{
	var p = new Entity();
	p.x = old.x; // X is the center of the sprite (in-game measurement units)
  p.y = old.y; // Y is the bottom of the sprite (in-game measurement units)
	p.z = old.z; // Z is the sprite's height off the ground (in-game measurement units)
	p.draw_x = old.draw_x; // the x position for displaying the image (graphics scaled units)
	p.draw_y = old.draw_y; // the y position for displaying the image (graphics scaled units)
	p.width = old.width;
	p.height = old.height;
	p.knockback = old.knockback;
	p.sprite = new Image();
	p.sprite.src = "img//playerDown0.png";
	return p;
}

//display the entity
Entity.prototype.render = function() 
{	
	if (this.sprite.complete && this.sprite.naturalHeight !== 0)
	{
		context.save();
		context.shadowColor = "rgba(80, 80, 80, .4)";
		context.shadowBlur = 15 + (this.z / graphics_scaling);
		context.shadowOffsetX = graphics_scaling * 3 + (this.z * 0.2);
		context.shadowOffsetY = graphics_scaling * 2 + (this.z * 0.8);
		
		//this.width = (this.sprite.width + (this.y * 0.1));
		//this.height = (this.sprite.height + (this.y * 0.1));
		this.width = this.sprite.width;
		this.height = this.sprite.height;
		this.draw_x = (this.x - (this.width/2)) * graphics_scaling;
		this.draw_y = (this.y - this.height - (this.z * (this.height / this.sprite.height) * 0.2)) * graphics_scaling;
		context.drawImage(this.sprite, this.draw_x, this.draw_y, this.width * graphics_scaling, this.height * graphics_scaling);
		context.restore();
	}
};

//initialize the player
function Player() 
{
   this.entity = new Entity(100,100);
}

//display the player
Player.prototype.render = function() 
{
  this.entity.render();
};

//display graphics
var render = function() 
{
	player.render();
	for (var i in playerList)
	{
		playerList[i].render();
		console.log(playerList[i].x + " " + playerList[i].y);
	}
};

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
				console.log(this.entity.x_speed);
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
					this.entity.z_speed = 10;
				}
			}
		}
	}
	
	//console.log("x_speed: " + this.x_speed + "y_speed: " + this.y_speed);
	
	// apply gravity if the player is jumping
	if (this.entity.z > 0 || this.entity.z_speed > 0)
	{
		this.entity.z += this.entity.z_speed;
		this.entity.z_speed -= 0.5;
		//var c = collisionCheck(z);
	
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
};

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

// retrieve data from the server
var socket = io();

socket.on('players', function(players)
{
	// back up the old player list, so we can see who left
	var oldList = new Array();
	
	for (var n in playerList)
	{
		oldList[n] = true;
	}
	
	// if there is a player in the new list not in the current list, add them
	for(var i in players)
	{
		p = copyEntity(players[i].entity);
		playerList[i] = p;
		delete oldList[i];
	}
	
	// remove any players who disconnected
	for (var j in oldList)
	{
		delete playerList[j];
	}
});

// send data to the server
socket.emit('new player');
setInterval(function() 
{
	if (player != null)
	{
		socket.emit('movement', player);
	}
}, 1000 / 60);

