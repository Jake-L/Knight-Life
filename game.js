var animate = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(callback) { window.setTimeout(callback, 1000/60) };

// play background music	
var audio = new Audio("audio//track1.mp3");
audio.play();

var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 70;
var graphics_scaling = Math.ceil(height/250);

context.shadowColor = "rgba(80, 80, 80, .4)";
context.shadowBlur = 15;
context.shadowOffsetX = graphics_scaling * 3;
context.shadowOffsetY = graphics_scaling * 2;

console.log("Width: " + width + " Height: " + height);



window.onload = function() 
{
  document.body.appendChild(canvas);
  animate(step);
};

var step = function() 
{
  update();
  render();
  animate(step);
};

var update = function() 
{
	//restart background music at the end of the song
	if (audio.currentTime + (8/60) > audio.duration)
	{
		audio.currentTime = 0;
	}
	
	//update player object
  player.update();
};

//create the player
var player = new Player();

//initialize an entity
function Entity(x, y, width, height) 
{
  this.x = x;
  this.y = y;
	this.z = 0;
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
	this.width = this.sprite.width * graphics_scaling;
	this.height = this.sprite.height * graphics_scaling;
  context.drawImage(this.sprite, this.x, this.y - this.z, this.sprite.width * graphics_scaling, this.sprite.height * graphics_scaling);
};

//initialize the player
function Player() 
{
   this.entity = new Entity(width / 2, height / 2, graphics_scaling * 4, graphics_scaling * 4);
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

window.addEventListener("keypress", function(event) 
{
	console.log("KeyPress keyCode" + event.keyCode);
}
);

window.addEventListener("keydown", function(event) 
{
  keysDown[event.keyCode] = true;
	console.log("KeyDown keyCode" + event.keyCode);
}
);

window.addEventListener("keyup", function(event) 
{
  delete keysDown[event.keyCode];
	console.log("KeyUp keyCode" + event.keyCode);
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
      this.entity.move(-1 * graphics_scaling, 0);
    } 
		else if (value == right_key) 
		{
      this.entity.move(graphics_scaling, 0);
    } 
		else if (value == up_key)
		{
			this.entity.move(0,-1 * graphics_scaling);
		}
		else if (value == down_key)
		{
			this.entity.move(0,graphics_scaling)
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
  if(this.x + x <= 0) // at the left edge
	{ 
    this.x = 0;
    this.x_speed = 0;
  } 
	else if (this.x + this.width + x >= width) // at the right edge
	{ 
    this.x = width - this.width;
    this.x_speed = 0;
  }
	else
	{
		this.x += x;
	}
	
  //check if the character moves along the y-axis
	if (this.y + y <= 0) // at the top edge
	{
		this.y = 0;
		this.y_speed = 0;
	}
	else if (this.y + this.height + y >= height) // at the bottom edge
	{
		this.y = height - this.height;
		this.y_speed = 0;
	}
	else
	{
		this.y += y;
	}
}




