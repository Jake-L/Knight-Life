var initialize = [];
initialize[0] = function(){
	this.tracker[0] = {objectiveType: "enemy", counter: 1, description: "Defeat one enemy"};
	this.reward = {xp: 10};
	this.name = "First Blood";
}

initialize[1] = function(){
	this.tracker[0] = {objectiveType: "enemy", counter: 1, description: "Defeat an enemy at least three levels about you", levelDifference: 3};
	this.reward = {xp: 20};
	this.name = "David and Goliath";
}

initialize[2] = function(){
	this.tracker[0] = {objectiveType: "enemy", counter: 5, description: "Defeat five icemen", faction: "iceman"};
	this.reward = {xp: 20};
	this.name = "Defrosted";
}

// create the objectives class
function Objective(id)
{
	this.id = id;
	this.tracker = [];
	this.next_node;
	this.reward;
	this.name;

	this.initialize = initialize[id];
	this.initialize();
}

Objective.prototype.enemyDefeated = function(entity)
{
	for (var i in this.tracker)
	{
		if (this.tracker[i].objectiveType == "enemy")
		{
			if (typeof(this.tracker[i].levelDifference) !== "undefined")
			{
				if (entity.lvl - player.entity.lvl >= 3)
				{
					this.tracker[i].counter--;
				}
			}
			else if (typeof(this.tracker[i].faction) !== "undefined")
			{
				if (this.tracker[i].faction == entity.faction)
				{
					this.tracker[i].counter--;
				}
			}
			else
			{
				this.tracker[i].counter--;
			}
		}
	}
}

// returns true if the objective is complete
// game.js must call this any time the objective gets updated
Objective.prototype.isComplete = function()
{
	for (var i in this.tracker)
	{
		if (this.tracker[i].counter != 0)
		{
			return false;
		}
	}

	return true;
}