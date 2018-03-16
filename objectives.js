


var initializeObjective = {};

initializeObjective[0] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 1, description: "Defeat one enemy"}];
	Objective.reward = {xp: 10};
	Objective.name = "First Blood";
}

initializeObjective[1] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 1, description: "Defeat an enemy at least three levels about you", levelDifference: 3}];
	Objective.reward = {xp: 20};
	Objective.name = "David and Goliath";
}

initializeObjective[2] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 5, description: "Defeat five icemen", faction: "iceman"}];
	Objective.reward = {xp: 25};
	Objective.name = "Defrosted";
}

initializeObjective[3] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 25, description: "Defeat 25 enemies"}];
	Objective.reward = {xp: 50};
	Objective.name = "Itchy Trigger Finger";
}

initializeObjective[4] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 100, description: "Defeat 100 enemies"}];
	Objective.reward = {xp: 100};
	Objective.name = "Punisher";
}

initializeObjective[1000] = function(Objective){
	Objective.tracker[0] = [{objectiveType: "enemy", counter: 1, description: "Defeat one enemy"}];
	Objective.tracker[1] = [{objectiveType: "cutscene", counter: 1, description: "Return to Bob", id: "0"}];
	Objective.reward = {xp: 50, items: [{name: "money", quantity: 100}]};
	Objective.name = "Cleaning the Streets";
}

// create the objectives class
function Objective(id)
{
	this.id = id;
	this.tracker = [];
	this.next_node;
	this.reward;
	this.name;
	this.completionDescription; //for missions that require a conversation at the end

	initializeObjective[id](this);
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
					this.tracker[0][i].counter--;
				}
			}
			else if (typeof(this.tracker[0][i].faction) !== "undefined")
			{
				if (this.tracker[0][i].faction == entity.faction)
				{
					this.tracker[0][i].counter--;
				}
			}
			else
			{
				this.tracker[0][i].counter--;
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
			this.tracker[0][i].counter = 0;
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
			if (this.tracker[0][i].counter != 0) 
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
		this.tracker.splice(0, 1);;
		notificationList.push(new Notification("Quest Progress","You have unlocked new tasks in quest " + this.name))
	}
}

// returns true if the objective is complete
// game.js must call this any time the objective gets updated
Objective.prototype.isComplete = function()
{
	for (var i in this.tracker)
	{
		for (var j in this.tracker[i])
		{
			if (this.tracker[i][j].counter != 0)
			{
				return false;
			}
		}
	}

	return true;
}