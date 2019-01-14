(function(exports)
{

//initialize an entity
exports.Entity = function(x,y,spriteName,mapId)
{
	this.x = x; // X is the center of the sprite (in-game measurement units)
	this.y = y; // Y is the bottom of the sprite (in-game measurement units)
	this.z = 0; // Z is the sprite's height off the ground (in-game measurement units)
	this.mapId = mapId;	

	this.x_speed = 0;
	this.y_speed = 0;
	this.z_speed = 0;

	this.width = 0;
	this.depth = 0;
	this.height = 0;

	this.knockback = false;
	this.direction = "Down";
	this.sprite;
	this.spriteName = spriteName;
	this.healthBarHeight = 0;

		//hold all the clothing or armor the player is currently wearing
	// format: {name: "hat", sprite: new Image()};
	this.clothing = []; 

	this.weaponSprite;
	this.id = Math.ceil(new Date().getTime() * (Math.random() + 0.01));

	// stats
	this.max_health = 100;
	this.current_health = 100;
	this.display_name = "CPU";
	this.xp = 0;
	this.lvl = 1;
	this.attack_damage = 10;
	this.attack_speed = 1; // attack speed of 1 means one attack takes standard number of frames
	this.defence = 10;

	// variables for performing attacks
	this.attack_counter = 0;
	this.current_attack = -1;
	this.attacks = [];
	this.spawn_time = new Date().getTime();

	this.allyState = "Neutral";
	this.cutsceneId;
	this.faction;
	this.targetType = "Neutral";

	this.nearbyObjects = [];
	//this.checkOverlap = false;

	this.addXP = function(xp)
	{
		var old_lvl = this.lvl;
		this.xp += xp;
		this.lvl = Math.floor(Math.pow(this.xp / 5, 4/10)) + 1;

		if (old_lvl < this.lvl)
		{
			this.updateStats();
			this.current_health = this.max_health;
		}

		while (old_lvl < this.lvl)
		{
			old_lvl++;
			//if(typeof(module) === 'undefined')
			//{
				notificationList.push(new Notification("Level Up!","You reached level " + old_lvl)); 
			//}
		}
		flyTextList.push(new flyText(this.x, this.y - (this.height * 1.5), "+" + xp + " XP", "#0080FF"));
	};

	this.setLevel = function(lvl)
	{
		this.xp = Math.ceil(Math.pow(lvl-1, 10/4) * 5);
		this.lvl = Math.floor(Math.pow(this.xp / 5, 4/10)) + 1;
		this.updateStats();
	}

	this.loadAttacks = function()
	{
		if (spriteName == "iceman" || spriteName == "iceboss")
		{
			this.attacks.push(new Attack("Punch", [], this.attack_speed));
			this.attacks.push(new Attack("Snowball", [{name:"Snowball",damage:0}], this.attack_speed));
		}
		else
		{
			this.attacks.push(new Attack("Punch", [], this.attack_speed));
			//this.attacks.push(new Attack("Sword", [{name:"Sword",damage:1}], this.attack_speed));
			this.attacks.push(new Attack("Arrow", [{name:"Bow",damage:0},{name:"Arrow",damage:0}], this.attack_speed));
		}
	};

	this.loadAttacks();
};

exports.Entity.prototype.updateStats = function()
{
	this.defence = 10 + this.lvl;
	this.attack_damage = 10 + this.lvl;
	this.attack_speed = 2 - Math.pow(0.99,this.lvl);
	this.max_health = 100 + 5 * this.lvl;
	this.current_health = this.max_health;

	for (var i in this.clothing)
	{
		//console.log(itemDetail[this.clothing[i].name]);
		if (typeof(itemDetail[this.clothing[i].name]) !== 'undefined')
		{
			this.defence += itemDetail[this.clothing[i].name].defence;
			this.attack += itemDetail[this.clothing[i].name].attack;
		}
	}
}

exports.Entity.prototype.initialize = function()
{
	if (typeof(Image) !== "undefined")
	{
		this.sprite = new Image();
		this.weaponSprite = new Image();
	}
};

exports.Entity.prototype.move = function(x_direction, y_direction)
{
	var blocked_directions;

	if (x_direction != 0 || y_direction != 0)// || this.checkOverlap)
	{
		this.knockback = false;

		// change direction even if they are blocked and can't move
		if (this.attack_counter <= 5)
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

		this.x_speed = x_direction;
		this.y_speed = y_direction;
		/*if (this.checkOverlap && this.x_speed == 0 && this.y_speed == 0)
		{
			blocked_directions = this.collisionCheck();
			console.log("extra collision check");
		}
		console.log(this.x_speed. this.y_speed);*/

		// check if the character moves along the x-axis
		var x_check = Math.floor((this.x + this.x_speed + (Math.sign(this.x_speed) * this.width / 2)) / gridSize);
		if(maps[this.mapId].length <= Math.floor((this.y - (this.height)) / gridSize)
			|| typeof(maps[this.mapId][Math.floor((this.y - (this.height)) / gridSize)][x_check]) === 'undefined'
			|| maps[this.mapId][Math.floor((this.y - (this.height)) / gridSize)][x_check].includes("Wall")
			|| maps[this.mapId].length <= Math.floor(this.y / gridSize)
			|| typeof(maps[this.mapId][Math.floor(this.y / gridSize)][x_check]) === 'undefined'
			|| maps[this.mapId][Math.floor(this.y / gridSize)][x_check].includes("Wall"))
		{
			//this.x = Math.ceil((this.x + this.x_speed - (this.width / 2))
			this.x_speed = 0;
		}

		//check if the character moves along the y-axis
		if (this.y_speed > 0)
		{
			var y_check = Math.floor((this.y + this.y_speed) / gridSize);
		}
		else if (this.y_speed < 0)
		{
			var y_check = Math.floor((this.y + this.y_speed - this.height) / gridSize);
		}

		if (typeof(maps[this.mapId][y_check]) === 'undefined'
			|| typeof(maps[this.mapId][y_check][Math.floor((this.x + (this.width / 2)) / gridSize)]) === 'undefined'
			|| maps[this.mapId][y_check][Math.floor((this.x + (this.width / 2)) / gridSize)].includes("Wall")
			|| typeof(maps[this.mapId][y_check][Math.floor((this.x - (this.width / 2)) / gridSize)]) === 'undefined'
			|| maps[this.mapId][y_check][Math.floor((this.x - (this.width / 2)) / gridSize)].includes("Wall"))
		{
			this.y_speed = 0;
		}
	}
	else
	{
		this.x_speed = 0;
		this.y_speed = 0;
	}

	blocked_directions = this.collisionCheck();

	if (this.attack_counter <= 5)
	{
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
	}

	return blocked_directions;
};

//display the entity
exports.Entity.prototype.render = function()
{
	if (this.sprite == null)
	{
		this.sprite = new Image();
		this.sprite.src = "img//" + this.spriteName + "Down0.png";
	}

	this.updateSprite();

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
			this.depth = Math.ceil(this.sprite.height * 0.5);
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


	// if they are facing up render their weapons first, otherwise render their clothing first
	if (this.direction == "Up")
	{
		if (this.current_attack >= 0)
		{
			for (var i in this.attacks[this.current_attack].weapons)
			{
				this.renderWeapon(this.attacks[this.current_attack].name, this.attacks[this.current_attack].weapons[i].name);
			}
		}

		for (var i in this.clothing)
		{
			context.drawImage(
				this.clothing[i].sprite,
				(this.x - (this.clothing[i].sprite.width/2) - x_offset) * graphics_scaling,
				(this.y - this.clothing[i].sprite.height - this.z - y_offset) * graphics_scaling,
				this.clothing[i].sprite.width * graphics_scaling,
				this.clothing[i].sprite.height * graphics_scaling);
		}
	}
	else
	{
		for (var i in this.clothing)
		{
			context.drawImage(
				this.clothing[i].sprite,
				(this.x - (this.clothing[i].sprite.width/2) - x_offset) * graphics_scaling,
				(this.y - this.clothing[i].sprite.height - this.z - y_offset) * graphics_scaling,
				this.clothing[i].sprite.width * graphics_scaling,
				this.clothing[i].sprite.height * graphics_scaling);
		}

		if (this.current_attack >= 0)
		{
			for (var i in this.attacks[this.current_attack].weapons)
			{
				this.renderWeapon(this.attacks[this.current_attack].name, this.attacks[this.current_attack].weapons[i].name);
			}
		}
	}


};

// display the entities current weapon
exports.Entity.prototype.renderWeapon = function(attack_name, weapon_name)
{
	var x;
	var y;

	if (typeof(weaponSprite[weapon_name]) !== "undefined" && weaponSprite[weapon_name][getDirNum(this.direction)][0].complete)
	{
		var n = Math.floor((this.attacks[this.current_attack].frame_length - this.attack_counter) / (this.attacks[this.current_attack].frame_length / playerAttackSprite[this.spriteName][attack_name][0].length)) % playerAttackSprite[this.spriteName][attack_name][0].length;

		if (n < weaponSprite[weapon_name][getDirNum(this.direction)].length)
		{
			var img = weaponSprite[weapon_name][getDirNum(this.direction)][n];
			
			if (typeof(img.y_offset) !== "undefined" && img.y_offset != null)
			{
				context.drawImage(
				img,
				(this.x - (img.width / 2) - x_offset) * graphics_scaling,
				(this.y - img.height + img.y_offset - y_offset - this.z) * graphics_scaling,
				img.width * graphics_scaling,
				img.height * graphics_scaling);
			}
			else
			{
				context.drawImage(
					img,
					(this.x - (img.width / 2) - x_offset) * graphics_scaling,
					(this.y - img.height - y_offset - this.z) * graphics_scaling,
					img.width * graphics_scaling,
					img.height * graphics_scaling);
			}
		}
	}
}


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
	else if (this.allyState == "Ally")
	{
		context.fillStyle = "#00FF00";
	}
	else
	{
		context.fillStyle = "#FFFF00";
	}
};

// display the nameplate and health bar
exports.Entity.prototype.renderHealthBar = function()
{
	if (this.healthBarHeight == 0)
	{
		// setting the height once prevents the health bar from jumping around if the height changes during animations
		this.healthBarHeight = this.sprite.height;

		for (var i in this.clothing)
		{
			this.healthBarHeight = Math.max(this.healthBarHeight, this.clothing[i].sprite.height);
		}
	}

	// draw the grey health box
	context.drawImage(
			healthBarSprite,
			(this.x - x_offset - (healthBarSprite.width / 2)) * graphics_scaling,
			(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 1.5)) * graphics_scaling,
			healthBarSprite.width * graphics_scaling,
			healthBarSprite.height * graphics_scaling);

	// draw the green showing current health
	context.drawImage(
			healthBarGreenSprite,
			(this.x - x_offset - (healthBarSprite.width / 2) + 1) * graphics_scaling,
			(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 1.5) + 1) * graphics_scaling,
			Math.ceil((this.current_health / this.max_health) * (healthBarSprite.width - 2) * graphics_scaling),
			(healthBarSprite.height - 2) * graphics_scaling);

	/* display the entity's name */
	// show coloured nameplates on most screens
	if (graphics_scaling > 1)
	{
		context.font = "bold " + 4 * graphics_scaling + "px serif";

		// display the black outline of their name
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		context.strokeText(this.display_name,
			((this.x - x_offset) * graphics_scaling) - (context.measureText(this.display_name).width/2),
			(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 1.75)) * graphics_scaling);

		// display the coloured text of their name
		this.setColour();
		context.fillText(this.display_name,
			((this.x - x_offset) * graphics_scaling) - (context.measureText(this.display_name).width/2),
			(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 1.75)) * graphics_scaling);

		// display their level
		context.font = "bold " + 3 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#000000";
		context.fillText("LV" + this.lvl,
			(this.x - x_offset + (healthBarSprite.width / 2) + 1) * graphics_scaling,
			(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 0.75)) * graphics_scaling);
	}
	// show only black text on tiny screens
	else
	{
		context.font = "bold " + 6 + "px sans-serif";
		context.fillStyle = "#000000";
		context.fillText(this.display_name + " LVL" + this.lvl,
		((this.x - x_offset) * graphics_scaling) - (context.measureText(this.display_name).width/2),
		(this.y - this.healthBarHeight - this.z - y_offset - (healthBarSprite.height * 2)) * graphics_scaling);
	}
};

// animate the entities sprite and change it based on their action
exports.Entity.prototype.updateSprite = function()
{
	var frame = 0;

	//this.sprite = new Image();
	if (this.attack_counter > 0 && this.current_attack >= 0)
	{
		frame = Math.floor((this.attacks[this.current_attack].frame_length - this.attack_counter) / (this.attacks[this.current_attack].frame_length / playerAttackSprite[this.spriteName][this.attacks[this.current_attack].name][getDirNum(this.direction)].length));
		
		this.sprite = playerAttackSprite[this.spriteName][this.attacks[this.current_attack].name][getDirNum(this.direction)][frame];
	}
	else if ((this.x_speed == 0 && this.y_speed == 0) || this.z_speed != 0)
	{
		frame = 0;

		this.sprite = playerSprite[this.spriteName][getDirNum(this.direction)][frame];
	}
	else
	{
		frame = Math.floor(new Date().getMilliseconds() / 250) % playerSprite[this.spriteName][getDirNum(this.direction)].length;

		this.sprite = playerSprite[this.spriteName][getDirNum(this.direction)][frame];
	}

	for (var i in this.clothing)
	{
		if (this.attack_counter > 0 && this.current_attack >= 0)
		{
			this.clothing[i].sprite = clothingSprite[this.clothing[i].name]["attack"][this.attacks[this.current_attack].name][getDirNum(this.direction)][0];
		}
		else
		{
			this.clothing[i].sprite = clothingSprite[this.clothing[i].name]["movement"][getDirNum(this.direction)][frame % 2];
		}
		
	}
};

exports.Entity.prototype.addClothing = function(name)
{
	var c = {name: name, sprite: null};
	this.clothing.push(c);
	this.updateStats();
}

exports.Entity.prototype.removeClothing = function(name)
{
	for (var i in this.clothing)
	{
		if (this.clothing[i].name == name)
		{
			this.clothing.splice(i,1);
		}
	}

	this.updateStats();
}

// check if the unit has collided with anything
// in the future, maintain a list of entities within 100 units of the entity for faster checking
exports.Entity.prototype.collisionCheck = function()
{
	var blocked_directions = [0,0,0,0];
	var collisionList = this.getNearbyObjects();
	//this.checkOverlap = false;

	for (var i in collisionList)
	{
		// if the entity isn't trying to move, stop checking for collisions
		if (Math.abs(this.x_speed) + Math.abs(this.y_speed) + Math.abs(this.z_speed) == 0)
		{
			break;
		}

		var c = this.collisionCheckAux(this, collisionList[i]);

		// check if their movement is blocked on the x-axis
		if (c[0] == 1 && this.x_speed < 0)
		{
			this.x_speed = 0;
			blocked_directions[0] = 1;
		}
		else if (c[0] == -1 && this.x_speed > 0)
		{
			this.x_speed = 0;
			blocked_directions[2] = 1;
		}

		// check if their movement is blocked on the y-axis
		if (c[1] == 1 && this.y_speed < 0)
		{
			this.y_speed = 0;
			blocked_directions[1] = 1;
		}
		else if (c[1] == -1 && this.y_speed > 0)
		{
			this.y_speed = 0;
			blocked_directions[3] = 1;
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

	return blocked_directions;
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

	// check for overlap, treating the first entity as a circle and the second as a square
	var angle = Math.atan(Math.abs(e1.y - (e1.depth/2) - (e2.y - (e2.depth/2))) / Math.abs(e1.x - e2.x));
	if	((e1.x + e1.x_speed + Math.ceil((e1.width/2) * Math.cos(angle)) > e2.x - (e2.width/2) && e1.x + e1.x_speed - Math.ceil((e1.width/2) * Math.cos(angle)) < e2.x + (e2.width/2)) &&// check for x-axis interception
		(e1.y + e1.y_speed - Math.ceil(e1.depth/2) + Math.ceil((e1.depth/2) * Math.sin(angle)) > e2.y - e2.depth && e1.y + e1.y_speed - Math.ceil(e1.depth/2) - Math.ceil((e1.depth/2) * Math.sin(angle)) < e2.y)) // check for y-axis interception
	{
		var x_overlap = Math.min(Math.abs(e1.x + (e1.width/2) - (e2.x - (e2.width / 2))), Math.abs(e1.x - (e1.width/2) - (e2.x + (e2.width / 2))));
		var y_overlap = Math.min(Math.abs(e1.y - (e2.y - e2.depth)), Math.abs(e1.y - e1.depth - e2.y));

		if(typeof(module) === 'undefined')
		{
			console.log(x_overlap, y_overlap);
		}

		if (y_overlap >= x_overlap)
		{
			if (e1.x < e2.x)
			{
				// you can't move right
				c[0] = -1;

				// TODO: MOVE this code out side of IF y_overlap >= x_overlap ??

				if (x_overlap > 0)
				{
					if (e1.x < e2.x - (e2.width / 2))
					{
						this.x_speed = -1;
					}
					else if (e1.y - (e1.depth / 2) < e2.y - e2.depth)
					{
						this.y_speed = -1;
					}
					else if (e1.y - (e1.depth / 2) > e2.y)
					{
						this.y_speed = 1;
					}
				}
			}
			else if (e1.x > e2.x)
			{
				// you can't move left
				c[0] = 1;

				if (x_overlap > 0)
				{
					if (e1.x > e2.x + (e2.width / 2))
					{
						this.x_speed = 1;
						console.log("shifting player");
					}
					if (e1.y - (e1.depth / 2) < e2.y - e2.depth)
					{
						this.y_speed = -1;
						console.log("shifting player");
					}
					else if (e1.y - (e1.depth / 2) > e2.y)
					{
						this.y_speed = 1;
						console.log("shifting player");
					}
				}
			}
		}
		if (y_overlap <= x_overlap)
		{
			if (e1.y <= e2.y)
			{
				// you cant move down
				c[1] = -1;

				if (y_overlap > 0 && this.x_speed == 0)
				{
					if (e1.x > e2.x + (e2.width / 2))
					{
						this.x_speed = 1;
						console.log("shifting player");
					}
					else if (e1.x < e2.x - (e2.width / 2))
					{
						this.x_speed = -1;
						console.log("shifting player");
					}
				}
			}
			else if (e1.y > e2.y)
			{
				// you can't move up
				c[1] = 1;

				if (y_overlap > 0 && this.x_speed == 0)
				{
					if (e1.x > e2.x + (e2.width / 2))
					{
						this.x_speed = 1;
						console.log("shifting player");
					}
					else if (e1.x < e2.x - (e2.width / 2))
					{
						this.x_speed = -1;
						console.log("shifting player");
					}
				}
			}
		}
/*
		if (e1.x < e2.x)
		{
			var x_overlap = (e1.x + e1.x_speed + (e1.width / 2)) - (e2.x - (e2.width / 2));
		}
		else if (e1.x > e2.x)
		{
			var x_overlap =  (e1.x + e1.x_speed - (e1.width / 2)) - (e2.x + (e2.width / 2));
		}
		if (e1.y < e2.y)
		{
			// you cant move down
			c[1] = -1;
		}
		else if (e1.y > e2.y)
		{
			// you can't move up
			c[1] = 1;
		}*/
	}

	/*
	// check what x-directions the player can move (left / right)
	if
	(
		//e1.x_speed != 0 //check that they are moving on the x-axis
		(e1.y + e1.y_speed > e2.y - e2.depth && e1.y - e1.depth + e1.y_speed < e2.y) // check for y-axis interception
		&& (Math.floor(e1.z) < Math.floor(e2.z) + Math.floor(e2.height * 0.5)
			&& Math.floor(e1.z) + Math.floor(e1.height * 0.5) > Math.floor(e2.z)) // check for z-axis interception
		&& e1.x != e2.x //if they have the same x-position, don't restrict their movement on the x-axis
	)
		{
			// check if there is space to left of you to move
			if (e1.x - (e1.width / 2) >= e2.x - (e2.width / 2) && e1.x - (e1.width / 2) <= e2.x + (e2.width / 2))
			{
				c[0] = 1; //if there is no space to your left, you can only move right
				//console.log("blocked on x");
			}
			// check if there is space to right of you to move
			if (e1.x + (e1.width / 2)  >= e2.x - (e2.width / 2) && e1.x + (e1.width / 2) <= e2.x + (e2.width / 2))
			{
				c[0] = -1; //if there is no space to your right, you can only move left
				//console.log("blocked on x");
			}
		}

	// check what y-directions the player can move (forward / backward)
	if
	(
		//e1.y_speed != 0 // check that they are actually moving on the y-axis
		(e1.x + (e1.width/2) + e1.x_speed > e2.x - (e2.width/2) && e1.x - (e1.width/2) + e1.x_speed < e2.x + (e2.width/2)) // check for x-axis interception
		&& (Math.floor(e1.z) < Math.floor(e2.z) + Math.floor(e2.height * 0.5)
			&& Math.floor(e1.z) + Math.floor(e1.height * 0.5) > Math.floor(e2.z)) // check for z-axis interception
		&& e1.y != e2.y //if they have the same y-position, don't restrict their movement on the y-axis
	)
		{
			// check if there is space behind you to move
			if (e1.y - e1.depth >= e2.y - e2.depth && e1.y - e1.depth <= e2.y)
			{
				c[1] = 1; // if there is no space behind you, you can move downward but not upward
				//console.log("blocked on y");
			}
			// check if there is space in front of you to move
			else if (e1.y >= e2.y - e2.depth && e1.y <= e2.y)
			{
				c[1] = -1; // if there is no space in front of you, you can move upward but not downward
				//console.log("blocked on y");
			}
		}
*/
	// check what z-directions the player can move (upward / downward)
	if
	(
		(e1.x + e1.width/2 > e2.x - e2.width/2 && e1.x - e1.width/2 < e2.x + e2.width/2) // check for x-axis interception
		&& (e1.y > e2.y - e2.depth && e1.y - e1.depth < e2.y) // check for y-axis interception
	)
		{
			//console.log("e1: " + "( " + e1.x + "," + e1.y + "," + e1.z + ")" + "e2: " + "( " + e2.x + "," + e2.y + "," + e2.z + ")");

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
	if (this.attack_counter > 0 && this.current_attack >= 0)
	{
		if (this.attacks[this.current_attack].checkDamageFrame(this.attack_counter))
		{
			this.createAttack(this.attacks[this.current_attack]);
		}

		this.attack_counter--;

		if (this.attack_counter <= 0)
		{
			this.current_attack = -1;
		}
	}

	// if they were standing on top of another entity, check if they still are so they can be moved
	/*if (this.checkOverlap)
	{
		this.move(0,0);
		console.log("forced collision check due to overlapping players", this.x_speed, this.y_speed);
	}*/

	// apply gravity if the player is jumping
	if (this.z > 0 || this.z_speed > 0)
	{
		this.z += this.z_speed;
		this.z_speed -= 0.15;

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
		this.x += this.x_speed;
		this.y += this.y_speed;
	}
};

exports.Entity.prototype.createFootPrint = function()
{
	if (this.x_speed != 0 && this.y_speed != 0)
	{
		if (this.x_speed * this.y_speed > 0)
		{
			if (Math.floor(new Date().getMilliseconds() / 250) % 2 == 0)
			{
				var e = new Effect("footprintslopedown", this.x - 2, this.y, 180);
			}
			else
			{
				var e = new Effect("footprintslopedown", this.x + 2, this.y, 180);
			}
		}
		else
		{
			if (Math.floor(new Date().getMilliseconds() / 250) % 2 == 0)
			{
				var e = new Effect("footprintslopeup", this.x - 2, this.y, 180);
			}
			else
			{
				var e = new Effect("footprintslopeup", this.x + 2, this.y, 180);
			}
		}
	}
	else if (this.direction == "Up" || this.direction == "Down")
	{
		if (Math.floor(new Date().getMilliseconds() / 250) % 2 == 0)
		{
			var e = new Effect("footprinty", this.x - 2, this.y, 180);
		}
		else
		{
			var e = new Effect("footprinty", this.x + 2, this.y, 180);
		}			
	}
	else
	{
		if (Math.floor(new Date().getMilliseconds() / 250) % 2 == 0)
		{
			var e = new Effect("footprintx", this.x, this.y - 1, 180);
		}
		else
		{
			var e = new Effect("footprintx", this.x, this.y, 180);
		}
	}
	effects.push(e);
}

exports.Entity.prototype.takeDamage = function(x, y, damage)
{
	if (this.spawn_time + 100 < new Date().getTime()) // don't take damage in the first 0.1 seconds you're alive
	{
		var damage_reduction = Math.max((-1 * Math.pow(0.5,(0.05 * (this.defence - 123))) + 67), 0);

		this.current_health -= damage;

		if (this.current_health < 0)
		{
			this.current_health = 0;
		}
	}

	if(typeof(module) === 'undefined')
	{
		flyTextList.push(new flyText(x, y - this.height, "-" + damage + " health", "#FF0000"));
	}
};

exports.Entity.prototype.setAttack = function(attack)
{
	if (attack >= 0 && typeof(this.attacks[attack]) !== 'undefined')
	{
		this.current_attack = attack;
		this.attack_counter = this.attacks[this.current_attack].frame_length;
	}
	else
	{
		console.log("error creating attack");
	}
}

exports.Entity.prototype.createAttack = function(attack)
{
	var x = 0;
	var y = 0;

	// create a melee attack
	if (attack.attack_type == 0)
	{
		if (this.direction == "Down")
		{
			x = this.x;
			y = this.y + (this.depth / 2) + 2;
		}
		else if (this.direction == "Up")
		{
			x = this.x;
			y = this.y - (this.depth / 2) - 2;
		}
		else if (this.direction == "Left")
		{
			x = this.x - (this.width/2) - 2;
			y = this.y;
		}
		else if (this.direction == "Right")
		{
			x = this.x + (this.width/2) + 2;
			y = this.y;
		}

		if(typeof(module) === 'undefined')
		{
			if (this.mapId >= 0)
			{
				socket.emit('damageOut', x + (this.x_speed * 2), y + (this.y_speed * 2), new Date().getTime() + (2000/60), (attack.bonus_damage + this.attack_damage) * attack.damage_factor, this.mapId);
			}
		}
		else
		{
			damageList[this.mapId].push(new Damage(x + (this.x_speed * 2), y + (this.y_speed * 2), this.id, new Date().getTime() + (2000/60), (attack.bonus_damage + this.attack_damage) * attack.damage_factor, this.mapId));
		}
	}

	// create a ranged attack (projectile)
	else if (attack.attack_type == 1)
	{
		var x_speed = 0;
		var y_speed = 0;

		if (this.direction == "Down")
		{
			x = this.x - (this.width / 4);
			y = this.y;
			x_speed = 0;
			y_speed = 3;
		}
		else if (this.direction == "Up")
		{
			x = this.x + (this.width / 4);
			y = this.y - (this.depth);
			x_speed = 0;
			y_speed = -3;
		}
		else if (this.direction == "Left")
		{
			x = this.x - (this.width / 2);
			y = this.y;
			x_speed = -3;
			y_speed = 0;
		}
			else if (this.direction == "Right")
		{
			x = this.x + (this.width / 2);
			y = this.y;
			x_speed = 3;
			y_speed = 0;
		}

		if(typeof(module) === 'undefined')
		{
			if (this.mapId >= 0)
			{
				socket.emit('createProjectile', x + (this.x_speed * 2), y + (this.y_speed * 2), 4, x_speed, y_speed, 0,
					 new Date().getTime() + (2000/60), (attack.bonus_damage + this.attack_damage) * attack.damage_factor, attack.name, this.mapId);
			}
		}
		else
		{
			projectileList[this.mapId].push(new Projectile(x + (this.x_speed * 2), y + (this.y_speed * 2), 4, x_speed, y_speed, 0,
				this.id, new Date().getTime() + (2000/60), (attack.bonus_damage + this.attack_damage) * attack.damage_factor, attack.name, this.mapId));
		}
	}
	else
	{
		console.log("entity.createAttack(): invalid attack type");
	}
};


}(typeof exports === 'undefined' ? this.shareEntity = {} : exports));
