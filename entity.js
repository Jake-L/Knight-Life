(function(exports)
{
//initialize an entity
exports.Entity = function(x,y,spriteName)
{
	this.x = x; // X is the center of the sprite (in-game measurement units)
	this.y = y; // Y is the bottom of the sprite (in-game measurement units)
	this.z = 0; // Z is the sprite's height off the ground (in-game measurement units)

	this.x_speed = 0;
	this.y_speed = 0;
	this.z_speed = 0;
	
	this.width = 0;
	this.depth = 0;
	this.height = 0;
	
	this.knockback = false;		
	this.direction = "Down";
	this.sprite;// = new Image();
	this.spriteName = spriteName;
	this.id;
	
	this.max_health = 100;
	this.current_health = 100;
	this.display_name = "CPU";
	this.xp = 0;
	this.lvl = 1;
	
	this.attack_counter = 0;
	this.attack1_frame_length = 60;
	this.attack2_frame_length = 60;
	this.attack1_damage_frame = 30;
	this.attack2_damage_frame = 30;
	this.attack = 0;
	this.attack1 = "punch";
	this.attack2 = "snowball";
	this.spawn_time = new Date().getTime();
	
	this.mapId = 0;
	this.allyState = "Neutral";

	//this.sprite.src;// = "img//" + spriteName + ".png";
	
	this.collisionList = [];
	
	this.initialize = function()
	{
		this.sprite = new Image();
		this.sprite.src = "img//" + this.spriteName + ".png";
	};
	
	this.updateLevel = function()
	{
		this.lvl = Math.floor(Math.sqrt(this.xp / 5)) + 1
	}
	
	this.move = function(x_direction, y_direction)
	{
		if (x_direction != 0 || y_direction != 0)
		{	
			this.knockback = false;
			
			// change direction even if they are blocked and can't move
			if (this.attack == 0)
			{
				if (this.x_speed != x_direction)
				{
					if (x_direction > 0) {this.direction = "Right";}
					else if (x_direction < 0) {this.direction = "Left";}
				}
				else if (this.y_speed != y_direction)
				{
					if (y_direction > 0) {this.direction = "Down";}
					else if (y_direction < 0) {this.direction = "Up";}
				}
				else if (this.y_speed == 0 && x_direction != 0)
				{
					if (x_direction > 0) {this.direction = "Right";}
					else if (x_direction < 0) {this.direction = "Left";}
				}
				else if (this.x_speed == 0 && y_direction != 0)
				{
					if (y_direction > 0) {this.direction = "Down";}
					else if (y_direction < 0) {this.direction = "Up";}
				}
			}
			
			// check if the character moves along the x-axis
			if(this.x + x_direction - (this.width/2) <= 0) // at the left edge
			{ 
				this.x = (this.width/2);
				this.x_speed = 0;
			} 
			else if ((this.x + x_direction + (this.width/2)) >= maxX[this.mapId]) // at the right edge
			{ 
				this.x = maxX[this.mapId] - (this.width/2);
				this.x_speed = 0;
			}
			else
			{
				this.x_speed = x_direction;
			}
			
			//check if the character moves along the y-axis
			if (this.y + y_direction - this.height <= minY[this.mapId]) // at the top edge
			{
				this.y = minY[this.mapId] + this.height;
				this.y_speed = 0;
			}
			else if (this.y + y_direction >= maxY[this.mapId]) // at the bottom edge
			{
				this.y = maxY[this.mapId];
				this.y_speed = 0;
			}
			else
			{
				this.y_speed = y_direction;
			}
		}
		else
		{
			this.x_speed = 0;
			this.y_speed = 0;
		}
		
		this.collisionCheck();
		
		if (this.y_speed == 0 && this.x_speed != 0)
		{
			if (x_direction > 0) {this.direction = "Right";}
			else if (x_direction < 0) {this.direction = "Left";}
		}
		else if (this.x_speed == 0 && this.y_speed != 0)
		{
			if (y_direction > 0) {this.direction = "Down";}
			else if (y_direction < 0) {this.direction = "Up";}
		}		
	};
};
	
//display the entity
exports.Entity.prototype.render = function() 
{	
	if (this.sprite == null)
	{
		this.sprite = new Image();
		this.sprite.src = "img//" + this.spriteName + ".png";
	}

	if (this.sprite.complete && this.sprite.naturalHeight !== 0)
	{
		context.save();
		context.shadowColor = "rgba(80, 80, 80, .4)";
		context.shadowBlur = 15 + this.z;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = (3 + this.z) * graphics_scaling;
		
		if (this.width == 0)
		{
			this.width = this.sprite.width;
			this.depth = this.sprite.height * 0.75;
			this.height = this.sprite.height / 2;
		}
		
		context.drawImage(
			this.sprite, 
			(this.x - (this.sprite.width/2) - x_offset) * graphics_scaling, 
			(this.y - this.sprite.height - this.z - y_offset) * graphics_scaling,
			this.sprite.width * graphics_scaling, 
			this.sprite.height * graphics_scaling);
		context.restore();
	}
};

// set the colour for an entity's nameplate or map icon
exports.Entity.prototype.setColour = function()
{
	// display the coloured text
	if (this.allyState == "Player")
	{
		context.fillStyle = "#1E90FF";	
	}
	else if (this.allyState == "Enemy")
	{
		context.fillStyle = "#FF0000";	
	}
	else
	{
		context.fillStyle = "#FFFF00";	
	}
};

// display the nameplate and health bar
exports.Entity.prototype.renderHealthBar = function()
{
	// draw the grey health box
	context.drawImage(
			healthBarSprite, 
			(this.x - x_offset - (healthBarSprite.width / 2)) * graphics_scaling, 
			(this.y - this.sprite.height - this.z - y_offset - (healthBarSprite.height * 1.5)) * graphics_scaling,
			healthBarSprite.width * graphics_scaling, 
			healthBarSprite.height * graphics_scaling);
	
	// draw the green showing current health
	context.drawImage(
			healthBarGreenSprite, 
			(this.x - x_offset - (healthBarSprite.width / 2) + 1) * graphics_scaling, 
			(this.y - this.sprite.height - this.z - y_offset - (healthBarSprite.height * 1.5) + 1) * graphics_scaling,
			Math.ceil((this.current_health / this.max_health) * (healthBarSprite.width - 2) * graphics_scaling), 
			(healthBarSprite.height - 2) * graphics_scaling);
			
	/* display the entity's name */
	context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
	
	// display the black outline
	context.strokeStyle = "#000000";
	context.lineWidth = 2;
	context.strokeText(this.display_name + " LVL" + this.lvl,
		((this.x - x_offset) * graphics_scaling) - (context.measureText(this.display_name).width/2), 
		(this.y - this.sprite.height - this.z - y_offset - (healthBarSprite.height * 2)) * graphics_scaling);
		
	// display the coloured text
	this.setColour();
	context.fillText(this.display_name + " LVL" + this.lvl,
		((this.x - x_offset) * graphics_scaling) - (context.measureText(this.display_name).width/2), 
		(this.y - this.sprite.height - this.z - y_offset - (healthBarSprite.height * 2)) * graphics_scaling);
};

// animate the entities sprite and change it based on their action
exports.Entity.prototype.updateSprite = function()
{
	this.sprite = new Image();
	
	if (this.attack_counter > 0)
	{
		this.sprite = playerAttackSprite[this.spriteName][getDirNum(this.direction)][Math.floor(this.attack_counter / 20)]
	}
	else if ((this.x_speed == 0 && this.y_speed == 0) || this.z_speed != 0)
	{
		this.sprite = playerSprite[this.spriteName][getDirNum(this.direction)][0];
	}
	else
	{
		this.sprite = playerSprite[this.spriteName][getDirNum(this.direction)][Math.floor(new Date().getMilliseconds() / 250) % 4];
	}
};

// check if the unit has collided with anything
// in the future, maintain a list of entities within 100 units of the entity for faster checking
exports.Entity.prototype.collisionCheck = function()
{
	for (var i in this.collisionList)
	{
		// if the entity isn't trying to move, stop checking for collisions
		if (Math.abs(this.x_speed) + Math.abs(this.y_speed) + Math.abs(this.z_speed) == 0)
		{
			break;
		}
		
		var c = this.collisionCheckAux(this, this.collisionList[i]);
		
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
			this.z = Math.floor(this.z);
		}
		else if (c[2] == -1 && this.z_speed > 0)
		{
			this.z_speed = 0;
			this.z = Math.floor(this.z);
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
exports.Entity.prototype.collisionCheckAux = function(e1, e2)
{
	var c = [0,0,0];
	
	// check what x-directions the player can move (left / right)
	if 
	(
		e1.x_speed != 0 //check that they are moving on the x-axis
		&& (e1.y + e1.y_speed > e2.y - e2.depth && e1.y - e1.depth + e1.y_speed < e2.y) // check for y-axis interception
		&& (Math.floor(e1.z) < Math.floor(e2.z) + Math.floor(e2.height * 0.5) 
			&& Math.floor(e1.z) + Math.floor(e1.height * 0.5) > Math.floor(e2.z)) // check for z-axis interception
		&& e1.x != e2.x //if they have the same x-position, don't restrict their movement on the x-axis
	)
		{
			// check if there is space to left of you to move
			if (e1.x - (e1.width / 2) + e1.x_speed >= e2.x - (e2.width / 2) && e1.x - (e1.width / 2) + e1.x_speed <= e2.x + (e2.width / 2))
			{
				c[0] = 1; //if there is no space to your left, you can only move right
			}
			// check if there is space to right of you to move
			if (e1.x + (e1.width / 2) + e1.x_speed >= e2.x - (e2.width / 2) && e1.x + (e1.width / 2) + e1.x_speed <= e2.x + (e2.width / 2))
			{
				c[0] = -1; //if there is no space to your right, you can only move left
			}
		}
	
	// check what y-directions the player can move (forward / backward)
	if 
	(
		e1.y_speed != 0 // check that they are actually moving on the y-axis
		&& (e1.x + (e1.width/2) + e1.x_speed > e2.x - (e2.width/2) && e1.x - (e1.width/2) + e1.x_speed < e2.x + (e2.width/2)) // check for x-axis interception
		&& (Math.floor(e1.z) < Math.floor(e2.z) + Math.floor(e2.height * 0.5) 
			&& Math.floor(e1.z) + Math.floor(e1.height * 0.5) > Math.floor(e2.z)) // check for z-axis interception
		&& e1.y != e2.y //if they have the same y-position, don't restrict their movement on the y-axis
	)	
		{
			// check if there is space behind you to move
			if (e1.y - e1.depth + e1.y_speed >= e2.y - e2.depth && e1.y - e1.depth + e1.y_speed <= e2.y) 
			{
				c[1] = 1; // if there is no space behind you, you can move downward but not upward
			}
			// check if there is space in front of you to move
			else if (e1.y + e1.y_speed >= e2.y - e2.depth && e1.y + e1.y_speed <= e2.y)
			{
				c[1] = -1; // if there is no space in front of you, you can move upward but not downward
			}
		}
	
	// check what z-directions the player can move (upward / downward)
	if
	(
		(e1.x + e1.width/2 > e2.x - e2.width/2 && e1.x - e1.width/2 < e2.x + e2.width/2) // check for x-axis interception
		&& (e1.y > e2.y - e2.depth && e1.y - e1.depth < e2.y) // check for y-axis interception
	)
		{
			console.log("e1: " + "( " + e1.x + "," + e1.y + "," + e1.z + ")" + "e2: " + "( " + e2.x + "," + e2.y + "," + e2.z + ")");

			// check if there is space below you to move
			if (Math.floor(e1.z) >= Math.floor(e2.z) && Math.floor(e1.z) <= Math.floor(e2.z) + Math.floor(e2.height * 0.8))
			{
				c[2] = 1;
			}
			// check if there is space above you to move
			else if (Math.floor(e1.z) + e1.height >= Math.floor(e2.z) && Math.floor(e1.z) + e1.height <= Math.floor(e2.z) + e2.height)
			{
				c[2] = -1;
			}
		}
	
	
	// return the result
	return c;
};

exports.Entity.prototype.update = function()
{
	// reduce the time before they can attack again
	if (this.attack_counter > 0)
	{
		//console.log(this.attack + " " + this.attack_counter + " " + this.attack1_damage_frame);
		
		if (this.attack == 1 && this.attack_counter == this.attack1_damage_frame + 2)
		{
			this.createAttack();
		}
		else if (this.attack == 2 && this.attack_counter == this.attack2_damage_frame + 2)
		{
			this.createAttack();
		}
		
		this.attack_counter--;
		
		if (this.attack_counter == 0)
		{
			this.attack = 0;
		}
	}
	
	// apply gravity if the player is jumping
	if (this.z > 0 || this.z_speed > 0)
	{
		this.z += this.z_speed;
		this.z_speed -= 0.15;
		//console.log(this.entity.z + " " + this.entity.z_speed);
	
		if (this.z <= 0) //if on the ground, no gravity
		{
			this.z = 0;
			this.z_speed = 0;
		}
	}
	
	// if the player has been knocked back by an attack, decrease their falling speed
	if (this.knockback)
	{
		if (this.x_speed != 0) 
		{
			this.x += this.x_speed;
			this.x_speed = (Math.abs(this.x_speed) - 0.5) * (this.x_speed / Math.abs(this.x_speed));
		}
		if (this.y_speed != 0)
		{
			this.y += this.y_speed;
			this.y_speed = (Math.abs(this.y_speed) - 0.5) * (this.y_speed / Math.abs(this.y_speed));
		}
		if (this.y_speed == 0 && this.x_speed == 0)
		{
			this.knockback = false;
		}
	}
	// if they are not being knockbacked, apply their movement normally
	else
	{
		/*
		if (this.attack == 0)
		{
			if (this.x_speed > 0) {this.direction = "Right";}
			else if (this.x_speed < 0) {this.direction = "Left";}
			else if (this.y_speed > 0) {this.direction = "Down";}
			else if (this.y_speed < 0) {this.direction = "Up";}
		}*/
				
		this.x += this.x_speed;
		this.y += this.y_speed;
		//this.x_speed = 0;
		//this.y_speed = 0;
	}
};

exports.Entity.prototype.takeDamage = function(x, y, damage)
{
	if (this.spawn_time + 100 < new Date().getTime()) // don't take damage in the first 0.1 seconds you're alive
	{
		this.current_health -= damage;

		if (this.current_health < 0)
		{
			this.current_health = 0;
		}
	}
	
	if(typeof(module) === 'undefined')
	{
	flyTextList.push(new flyText(this.x, this.y - (this.height * 1.5), "-" + damage + " health", "#C00000"));
	}
};

exports.Entity.prototype.createAttack = function()
{
		if (this.attack == 1)
		{
			this.createAttackAux();
		}
		else if (this.attack == 2)
		{
			this.createProjectileAux();
		}
		else
		{
			this.attack = 0;
		}
};

exports.Entity.prototype.createAttackAux = function()
{
	var x = 0;
	var y = 0;
	
	if (this.direction == "Down")
	{
		x = this.x;
		y = this.y + 2;
	}
	else if (this.direction == "Up")
	{
		x = this.x;
		y = this.y - this.depth - 2;
	}
	else if (this.direction == "Left")
	{
		x = this.x - (this.width/2) - 2;
		y = this.y - (this.depth/2)
	}
	else if (this.direction == "Right")
	{
		x = this.x + (this.width/2) + 2;
		y = this.y - (this.depth/2);
	}
	
	if(typeof(module) === 'undefined')
	{
		socket.emit('damageOut', x + (this.x_speed * 2), y + (this.y_speed * 2), new Date().getTime() + (2000/60), 10);
	}
	else
	{
		damageList.push(new Damage(x + (this.x_speed * 2), y + (this.y_speed * 2), this.id, new Date().getTime() + (2000/60), 10));
	}
}

exports.Entity.prototype.createProjectileAux = function()
{
	var x = 0;
	var y = 0;
	var x_speed = 0;
	var y_speed = 0;
	
	if (this.direction == "Down")
	{
		x = this.x;
		y = this.y; 
		x_speed = 0; 
		y_speed = 1.5; 
	}
	else if (this.direction == "Up")
	{
		x = this.x;
		y = this.y - (this.depth);
		x_speed = 0;
		y_speed = -1.5; 
	}
	else if (this.direction == "Left")
	{
		x = this.x - (this.width / 2);
		y = this.y;
		x_speed = -1.5; 
		y_speed = 0; 
	}
		else if (this.direction == "Right")
	{
		x = this.x + (this.width / 2);
		y = this.y;
		x_speed = 1.5; 
		y_speed = 0;
	}
	
	if(typeof(module) === 'undefined')
	{
		socket.emit('createProjectile', x + (this.x_speed * 2), y + (this.y_speed * 2), x_speed, y_speed, 
			 new Date().getTime() + (2000/60), 10, this.attack2);
	}
	else
	{
		projectileList.push(new Projectile(x + (this.x_speed * 2), y + (this.y_speed * 2), x_speed, y_speed, 
			this.id, new Date().getTime() + (2000/60), 10, this.attack2));
	}
};

}(typeof exports === 'undefined' ? this.shareEntity = {} : exports));