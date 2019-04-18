(function(exports)
{

var frame_length = {};
frame_length["Punch"] = 60;
frame_length["Sword"] = 60;
frame_length["Snowball"] = 39;
frame_length["Arrow"] = 39;

var damage_frame = {};
damage_frame["Punch"] = 30;
damage_frame["Sword"] = 30;
damage_frame["Snowball"] = 27;
damage_frame["Arrow"] = 27;

var damage_factor = {};
damage_factor["Punch"] = 0.8;
damage_factor["Sword"] = 1;
damage_factor["Snowball"] = 0.4;
damage_factor["Arrow"] = 0.4;

var knockback = {};
knockback["Punch"] = 5;
knockback["Sword"] = 6;
knockback["Snowball"] = 3;
knockback["Arrow"] = 3;


// create the attack object to track information relating to the attack, such as the number of frames in its animation or the amount of damage it does
// NOTE: for a projectile attack, weapons[0].name must be the name of the projectile's sprite
exports.Attack = function(name, weapons, attack_speed)
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

	this.bonus_damage = 0;

	this.knockback = knockback[this.name];

	this.frame_length = Math.ceil(frame_length[this.name] / attack_speed);
	this.damage_frame =  Math.ceil(damage_frame[this.name] / attack_speed);
	this.damage_factor = damage_factor[this.name];

	for (var i in this.weapons)
	{
		this.bonus_damage += this.weapons[i].damage;
	}
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
