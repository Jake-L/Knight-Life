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

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var graphics_scaling = Math.ceil(Math.min(width,height)/250);

window.onload = function() {
  document.body.appendChild(canvas);
  animate(step);
};

var step = function() {
  update();
  render();
  animate(step);
};

function Entity(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.x_speed = 0;
  this.y_speed = 0;
	this.width;
	this.height;
	this.sprite = new Image();
	this.sprite.src = "img//playerDown0.png";
}

Entity.prototype.render = function() {
	//context.fillStyle = "#808080";
  //context.fillRect(this.x, this.y, this.width, this.height);
	this.width = this.sprite.width * graphics_scaling;
	this.height = this.sprite.height * graphics_scaling;
  context.drawImage(this.sprite, this.x, this.y, this.sprite.width * graphics_scaling, this.sprite.height * graphics_scaling);
};

function Player() {
   this.entity = new Entity(width / 2, height / 2, graphics_scaling * 4, graphics_scaling * 4);
}

Player.prototype.render = function() {
  this.entity.render();
};

var player = new Player();

var render = function() {
  context.fillStyle = "#ADD8E6";
  context.fillRect(0, 0, width, height);
  player.render();
};

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
		else
		{
      this.entity.move(0, 0);
    }
  }
};

Entity.prototype.move = function(x, y) 
{
  this.x += x;
  this.y += y;
  this.x_speed = x;
  this.y_speed = y;
	
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

var update = function() 
{
  player.update();
};


