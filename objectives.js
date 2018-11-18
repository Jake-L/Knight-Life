


var initializeObjective = {};

initializeObjective[0] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 1, description: "Defeat one enemy"}];
	Objective.reward = {xp: 10};
	Objective.name = "First Blood";
}

initializeObjective[1] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 1, description: "Defeat an enemy at least three levels above you", levelDifference: 3}];
	Objective.reward = {xp: 25};
	Objective.name = "David and Goliath";
}

initializeObjective[2] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 5, description: "Defeat five icemen", faction: "iceman"}];
	Objective.reward = {xp: 25};
	Objective.name = "Defrosted";
}

initializeObjective[3] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 25, description: "Defeat 25 enemies"}];
	Objective.reward = {xp: 50};
	Objective.name = "Itchy Trigger Finger";
}

initializeObjective[4] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 100, description: "Defeat 100 enemies"}];
	Objective.reward = {xp: 100};
	Objective.name = "Punisher";
}

initializeObjective[5] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 1, description: "Defeat Frostbite", id: "iceboss"}];
	Objective.reward = {xp: 100};
	Objective.name = "Frostbite Slayer";
}

initializeObjective[1000] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 2, description: "Defeat {counter} icemen", faction: "iceman"}];
	Objective.tracker[1] = [{objectiveType: "cutscene", counter: 0, required: 1, description: "Return to Bob", id: 0}];
	Objective.reward = {xp: 50, items: [{name: "money", quantity: 100}]};
	Objective.name = "Cleaning the Streets";
}

initializeObjective[1001] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "cutscene", counter: 0, required: 1, description: "Give Brian an apple", id: 1}];
	Objective.reward = {xp: 25, items: [{name: "money", quantity: 50}]};
	Objective.name = "An Apple a day";
}

initializeObjective[1002] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "cutscene", counter: 0, required: 1, description: "Give Kraven 5 crystals", id: 2}];
	Objective.reward = {xp: 100, items: [{name: "money", quantity: 100}]};
	Objective.name = "Treasure Hunt";
}

initializeObjective[1003] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 0, required: 10, description: "Defeat {counter} icemen", faction: "iceman"}];
	Objective.tracker[1] = [{objectiveType: "cutscene", counter: 0, required: 1, description: "Return to Bob", id: 0}];
	Objective.reward = {xp: 100, items: [{name: "money", quantity: 100}]};
	Objective.name = "Cleaning the Streets II";
}

initializeObjective[1004] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemyItem", counter: 0, required: 1, description: "Kill icemen to recover the King's ring", faction: "iceman", probability: 0.2, item: "ring"}];
	Objective.tracker[1] = [{objectiveType: "cutscene", counter: 0, required: 1, description: "Return the King's ring", id: 5}];
	Objective.reward = {xp: 100, items: [{name: "money", quantity: 100}]};
	Objective.name = "Recover the Ring";
}

// create the objectives class
function Objective(id)
{
	this.id = id;
	this.tracker = [];
	this.reward;
	this.name;

	initializeObjective[id](this);

	this.totalRequired = 0;

	for (var i in this.tracker)
	{
		for (var j in this.tracker[i])
		{
			this.totalRequired += this.tracker[i][j].required;
		}
	}
}


Objective.prototype.enemyDefeated = function(entity)
{
	for (var i in this.tracker[0])
	{
		if (this.tracker[0][i].objectiveType == "enemy")
		{
			if (typeof(this.tracker[0][i].levelDifference) !== "undefined")
			{
				if (entity.lvl - player.entity.lvl >= 3)
				{
					this.tracker[0][i].counter++;
				}
			}
			else if (typeof(this.tracker[0][i].faction) !== "undefined")
			{
				if (this.tracker[0][i].faction == entity.faction)
				{
					this.tracker[0][i].counter++;
				}
			}
			else if (typeof(this.tracker[0][i].id) !== "undefined")
			{
				if (this.tracker[0][i].id == entity.id)
				{
					this.tracker[0][i].counter++;
				}
			}
			else
			{
				this.tracker[0][i].counter++;
			}
		}
		// if the mission requires the player to get special items from killing enemies
		// that aren't normally available
		else if (this.tracker[0][i].objectiveType == "enemyItem")
		{
			var drop = false;

			if (typeof(this.tracker[0][i].faction) !== "undefined")
			{
				if (this.tracker[0][i].faction == entity.faction)
				{
					drop = true;
				}
			}
			else if (typeof(this.tracker[0][i].id) !== "undefined")
			{
				if (this.tracker[0][i].id == entity.id)
				{
					drop = true;
				}
			}
			else
			{
				drop = true;
			}

			console.log(Math.random(), this.tracker[0][i].probability);

			// check to see if the item dropped, based on it's drop rate / proability
			if (Math.random() <= this.tracker[0][i].probability)
			{
				console.log("adding mission item");
				player.inventory.addItem({name:this.tracker[0][i].item, quantity:1});
				this.tracker[0][i].counter++;
			}
		}
	}

	this.taskComplete();
}

Objective.prototype.conversationCompleted = function(id)
{
	console.log("id = "  + id);
	console.log(this.tracker);
	for (var i in this.tracker[0])
	{
		if (this.tracker[0][i].objectiveType == "cutscene" && this.tracker[0][i].id == id)
		{
			this.tracker[0][i].counter = 1;
			this.taskComplete();
		}
	}
}

Objective.prototype.taskComplete = function()
{
	var deleteRow = true;
	if (this.tracker.length > 1)
	{
		for (var i in this.tracker[0])
		{
			if (this.tracker[0][i].counter < this.tracker[0][i].required) 
			{
				deleteRow = false;
			}
		}
	}
	else 
	{
		deleteRow = false;
	}

	if (deleteRow == true)
	{
		this.tracker.splice(0, 1);
		notificationList.push(new Notification("Quest Progress","You have unlocked new tasks in quest " + this.name));
	}

	updateDisplayWindow();
}

// returns true if the objective is complete
// game.js must call this any time the objective gets updated
Objective.prototype.isComplete = function()
{
	for (var i in this.tracker)
	{
		for (var j in this.tracker[i])
		{
			if (this.tracker[i][j].counter < this.tracker[i][j].required)
			{
				return false;
			}
		}
	}

	return true;
}