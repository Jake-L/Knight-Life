initializeCutscene = [];
initializeCutscene[0] = function(cutscene)
{
	if (typeof(completedQuests[1000]) !== 'undefined')
	{
		if (typeof(completedQuests[1003]) !== 'undefined')
		{
			cutscene.text = "Thanks for your help! I feel much safer now";
		}
		else if (typeof(quests[1003]) === 'undefined')
		{
			cutscene.text = "I still think there's too many icemen. Can you kill 10 more?";
			cutscene.addQuest = 1003;
		}
		else if (quests[1003].tracker.length == 1)
		{
			cutscene.text = "You did it again! You're very good at this. Here is a reward.";
			quests[1003].conversationCompleted(cutscene.cutsceneId); 
		}
		else
		{
			cutscene.text = "Good luck fighting those monsters, let me know when you're done!";
		}
	}
	else if (typeof(quests[1000]) === 'undefined')
	{
		cutscene.text = "Hello! The ice men scare me! Please kill two of them.";
		cutscene.addQuest = 1000;
	}
	else if (quests[1000].tracker.length == 1)
	{
		cutscene.text = "Wow, you did it! Thanks for your help. Here is a reward.";
		quests[1000].conversationCompleted(cutscene.cutsceneId); 
	}
	else
	{
		cutscene.text = "Good luck fighting those monsters, let me know when you're done!";
	}
};

initializeCutscene[1] = function(cutscene)
{
	if (typeof(completedQuests[1001]) !== 'undefined')
	{
		cutscene.text = "That apple was very tasty!";
	}
	else if (typeof(quests[1001]) === 'undefined')
	{
		cutscene.text = "I am so hungry... can you please get me an apple?";
		cutscene.addQuest = 1001;
	}
	else if (player.inventory.getItem("apple").quantity > 0)
	{
		cutscene.text = "Wow, you actually brought me an apple, thanks so much!";
		player.inventory.removeItem({name: "apple", quantity: 1});
		quests[1001].conversationCompleted(cutscene.cutsceneId);
	}
	else
	{
		cutscene.text = "So... hungry... need... apple...";
	}
};

initializeCutscene[2] = function(cutscene)
{
	if (typeof(completedQuests[1002]) !== 'undefined')
	{
		cutscene.text = "Thanks again for the crystals!";
	}
	else if (typeof(quests[1002]) === 'undefined')
	{
		cutscene.text = "Hey there young man, would you mind getting me some crystals? How does 5 sound?";
		cutscene.addQuest = 1002;
	}
	else if (player.inventory.getItem("crystal").quantity >= 5)
	{
		cutscene.text = "Thanks for the crystals! Maybe these will win my ex-wife back...";
		player.inventory.removeItem({name: "crystal", quantity: 5});
		quests[1002].conversationCompleted(cutscene.cutsceneId);
	}
	else
	{
		cutscene.text = "Some of the those vicious icemen might have crystals";
	}
};

initializeCutscene[3] = function(cutscene)
{
	cutscene.text = "Nearby there is a cave with a very dangerous creature inside. He nearly killed me, and will do the same to you if given the opportunity.";
};

initializeCutscene[4] = function(cutscene)
{
	displayWindow = null;
	cutscene.displayWindow = "CutsceneOption";
	cutscene.text = "Would you like to buy or sell?";
	cutscene.optionsArray = ["Buy", "Sell"];
	cutscene.optionsAction = {};
	cutscene.optionsAction["Buy"] = function(){
		displayWindow = null;
		cutscene.optionsArray = {};
		cutscene.optionsArray["Apple"] = {name:"Apple"};
		cutscene.displayWindow = "Buy";
		cutscene.text = "What would you like to buy?";
	};
	cutscene.optionsAction["Sell"] = function(){
		displayWindow = null;
		cutscene.optionsArray = null;
		cutscene.displayWindow = "Sell";
		cutscene.text = "What would you like to sell?";
	};

}

// holds items, and provides an interface to use them
function Cutscene(cutsceneId)
{
	this.cutsceneId = cutsceneId;
	this.text;
	this.node;
	this.addItem;
	this.removeItem;
	this.addQuest;
	this.removeQuest;
	initializeCutscene[cutsceneId](this);
	this.textCounter = 30;
	this.complete = false;
	this.displayWindow;
	this.optionsArray;
	this.optionsAction;
}

function CutsceneNode()
{
	this.text;
	this.nextNode;
	this.decisionOptions;
	this.decisionResult;
}

Cutscene.prototype.update = function()
{
	if (this.displayWindow != null)
	{
		view.renderOptions(this.displayWindow, this.optionsArray);
	}
	else if (this.textCounter > 0)
	{
		this.textCounter--;
	}
	else
	{
		for(var key in keysDown)
		{
			if (Number(key) == 13) // enter key
			{

				if (this.removeItem != null)
				{
					this.removeItem;
				}
				if (this.addItem != null)
				{
					this.addItem;
				}
				if (this.addQuest != null)
				{
					addQuest(this.addQuest);
				}
				this.complete = true;
			}
		}
	}
}

Cutscene.prototype.optionsResult = function(r)
{
	if (typeof(this.optionsAction[r]) !== "undefined")
	{
		this.optionsAction[r]();
	}
}

Cutscene.prototype.isComplete = function()
{
	return this.complete;
}

// Displays the cutscene
Cutscene.prototype.render = function()
{
	if (this.text != null)
	{
		view.renderText(this.text);
	}
};