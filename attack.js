(function(exports)
{

var frame_length = {};
frame_length["Punch"] = 60;
frame_length["Sword"] = 60;
frame_length["Snowball"] = 60;
frame_length["Arrow"] = 60;

var damage_frame = {};
damage_frame["Punch"] = 30;
damage_frame["Sword"] = 30;
damage_frame["Snowball"] = 40;
damage_frame["Arrow"] = 40;

var damage_factor = {};
damage_factor["Punch"] = 0.8;
damage_factor["Sword"] = 1;
damage_factor["Snowball"] = 0.2;
damage_factor["Arrow"] = 0.2;


// create the attack object to track information relating to the attack, such as the number of frames in its animation or the amount of damage it does
// NOTE: for a projectile attack, weapons[0].name must be the name of the projectile's sprite
exports.Attack = function(name, weapons, entity)
{
	this.name = name;
	this.weapons = weapons;

	if (this.name == "Punch" || this.name == "Sword")
	{
		this.attack_type = 0;
	}
	else
	{
		this.attack_type = 1;
	}

	this.frame_length;
	this.damage_frame;
	this.damage_factor;
	this.damage = 0;

	this.loadStats = function(entity)
	{
		this.frame_length = frame_length[this.name];
		this.damage_frame = damage_frame[this.name];
		this.damage_factor = damage_factor[this.name];

		this.frame_length = Math.ceil(this.frame_length / entity.attack_speed);
		this.damage_frame = Math.ceil(this.damage_frame / entity.attack_speed);

		for (var i in this.weapons)
		{
			this.damage += this.weapons[i].damage;
		}

		this.damage += entity.attack_damage * this.damage_factor; 
	}

	this.loadStats(entity);
};

// returns true if the the counter is at the damage frame and the damage / projectile object should be created
exports.Attack.prototype.checkDamageFrame = function(counter)
{
	if (this.frame_length - counter == this.damage_frame - 2)
	{
		return true;
	}
	else
	{
		return false;
	}
};

}(typeof exports === 'undefined' ? this.shareAttack = {} : exports));
