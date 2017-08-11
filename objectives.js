var description = [];
description[0] = "Defeat one enemy";

var initialize = [];
initialize[0] = function(){
	this.tracker[0] = {objectiveType: "enemy", counter: 1};
	this.reward = {xp: 10};
}
/*
var defeatEnemy = [];
defeatEnemy[0] = function(enemy){
	this.tracker[0]--;
}

var getItem = [];

getItem[0] = function(itemId, quantity)
{
	if 
}

var getConversation = [];

getConverstation[0] = function(conversationId)
{

}*/

// create the objectives class
function Objective(id)
{
	this.id = id;
	this.tracker = [];
	this.description = [];
	this.next_node;
	this.reward;

	this.initialize = initialize[id];
	this.initialize();
/*
	if (typeof(getItem[id]) !== "undefined" && getItem[id] != null)
	{
		this.getItem = getItem[id];
	}

	if (typeof(defeatEnemy[id]) !== "undefined" && defeatEnemy[id] != null)
	{
		this.defeatEnemy = defeatEnemy[id];
	}*/
}

Objective.prototype.defeatEnemy = function(enemy)
{
	for (var i in this.tracker)
	{
		if (this.tracker[i].objectiveType == "enemy")
		{
			this.tracker[0].counter--;
		}
	}
}

// returns true if the objective is complete
// game.js must call this any time the objective gets updated
Objective.prototype.isComplete = function()
{
	for (var i in this.tracker)
	{
		if (this.tracker[i] != 0)
		{
			return false;
		}
	}

	return true;
}