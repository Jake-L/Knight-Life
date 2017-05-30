var animate = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(callback) { window.setTimeout(callback, 1000/60) };

var canvas = document.createElement('canvas');
var width = window.innerWidth - 20;
var height = window.innerHeight - 20;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;

console.log("Width: " + width + " Height: " + height);

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var jump_key = 32;
var graphics_scaling = Math.ceil(height/250);

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

window.addEventListener("keydown", function(event) {
  keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function(event) {
  delete keysDown[event.keyCode];
});

Player.prototype.update = function() 
{
	//move the player based on user input
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
			console.log("Jump button pressed. z-position: " + this.entity.z + " z-speed: " + this.entity.z_speed);
			if (this.entity.z == 0 && this.entity.z_speed == 0) //can only jump if standing on the ground
			{
				console.log("Jump performed");
				this.entity.z_speed = 10;
			}
		}
		else
		{
      this.entity.move(0, 0);
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
}

Entity.prototype.move = function(x, y) 
{
  this.x += x;
  this.y += y;
  this.x_speed = x;
  this.y_speed = y;
	
	// check if the character has exceeded any boundries
  if(this.x <= 0) // at the left edge
	{ 
    this.x = 0;
    this.x_speed = 0;
  } 
	else if (this.x + this.width >= width) // at the right edge
	{ 
    this.x = width - this.width;
    this.x_speed = 0;
  }
	if (this.y <= 0) // at the top edge
	{
		this.y = 0;
		this.y_speed = 0;
	}
	else if (this.y + this.height >= height) // at the bottom edge
	{
		this.y = height - this.height;
		this.y_speed = 0;
	}
}




