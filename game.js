// play background music	
var audio = new Audio("audio//track1.mp3");
audio.play();

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
context.shadowColor = "rgba(80, 80, 80, .4)";
context.shadowBlur = 15;
context.shadowOffsetX = graphics_scaling * 3;
context.shadowOffsetY = graphics_scaling * 2;

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 70;

var frameTime = 0;
var startTime = 0;
;

window.onload = function() 
{
  document.body.appendChild(canvas);
	frameTime = new Date().getTime();
	startTime = frameTime;
	step();
//  animate(step);
};

var ucounter = 0;
var rcounter = 0;
	
var step = function() 
{
	if (new Date().getTime() > frameTime)
	{
		update();
		frameTime += 16.6;
		ucounter += 1;
	}
	
  render();
	rcounter += 1;
	
	console.log("Render FPS: " + Math.round(rcounter / ((new Date().getTime() - startTime)/1000)) + " Update FPS: " + Math.round(ucounter / ((new Date().getTime() - startTime)/1000)));

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
	this.sprite = new Image();
	this.sprite.src = "img//playerDown0.png";
}

//display the entity
Entity.prototype.render = function() 
{
	this.width = (this.sprite.width + (this.y * 0.1));
	this.height = (this.sprite.height + (this.y * 0.1));
	this.draw_x = (this.x - (this.width/2)) * graphics_scaling;
	this.draw_y = (this.y - this.height - (this.z * (this.height / this.sprite.height) * 0.2)) * graphics_scaling;
  context.drawImage(this.sprite, this.draw_x, this.draw_y, this.width * graphics_scaling, this.height * graphics_scaling);
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
  context.fillStyle = "#ADD8E6";
  context.fillRect(0, 0, width, height);
  player.render();
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
				this.entity.z_speed = 10;
			}
		}
  }
	
	// apply gravity if the player is jumping
	if (this.entity.z > 0 || this.entity.z_speed > 0)
	{
		this.entity.gravity();
	}
};

// gravity physics
Entity.prototype.gravity = function()
{
	this.z += this.z_speed;
	this.z_speed -= 0.5;
	
	if (this.z + this.z_speed <= 0) //if on the ground, no gravity
	{
		this.z = 0;
		this.z_speed = 0;
	}
	
	if (this.x_speed != 0) //apply the speed and decrease it
	{
		this.x += this.x_speed;
		this.x_speed = (Math.abs(this.x_speed) - 0.5) * (this.x_speed / Math.abs(this.x_speed));
	}
	
	if (this.y_speed != 0) //apply the speed and decrease it
	{
		this.y += this.y_speed;
		this.y_speed = (Math.abs(this.y_speed) - 0.5) * (this.y_speed / Math.abs(this.y_speed));
	}
	
	context.shadowBlur = 15 + (this.z / graphics_scaling);
	context.shadowOffsetX = graphics_scaling * 3 + (this.z * 0.2);
	context.shadowOffsetY = graphics_scaling * 2 + (this.z * 0.8);
}

Entity.prototype.move = function(x, y) 
{
	// check if the character moves along the x-axis
  if(this.x + x - (this.width/2) <= 0) // at the left edge
	{ 
    this.x = (this.width/2);
    this.x_speed = 0;
  } 
	else if ((this.x + x + (this.width/2)) * graphics_scaling >= width) // at the right edge
	{ 
    this.x = (width / graphics_scaling) - (this.width/2);
    this.x_speed = 0;
  }
	else
	{
		this.x += x;
	}
	
  //check if the character moves along the y-axis
	if (this.y + y - this.height <= (height * 0.1 / graphics_scaling)) // at the top edge
	{
		this.y = this.height + (height * 0.1 / graphics_scaling);
		this.y_speed = 0;
	}
	else if (this.y + y >= (height / graphics_scaling)) // at the bottom edge
	{
		this.y = (height / graphics_scaling);
		this.y_speed = 0;
	}
	else
	{
		this.y += y;
	}
}




