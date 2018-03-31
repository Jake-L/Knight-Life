initializeCutscene = [];
initializeCutscene[0] = function(cutscene)
{
	console.log(quests);
	if (typeof(completedQuests[1000]) !== 'undefined')
	{
		cutscene.text = "Thanks for your help! I feel much safer now";
	}
	else if (typeof(quests[1000]) === 'undefined')
	{
		cutscene.text = "Hello! The ice men scare me! Please kill two of them.";
		cutscene.addQuest = 1000;
	}
	else if (quests[1000].isComplete())
	{
		cutscene.text = "Thanks for your help."
	}
	else if (quests[1000].tracker.length == 1)
	{
		cutscene.text = "Wow, you did it! Thanks for your help. Here is a reward.";
		quests[1000].conversationCompleted(0); //chatId = 0
	}
	else
	{
		cutscene.text = "Good luck fighting those monsters, let me know when you're done!";
	}
}


// holds items, and provides an interface to use them
function Cutscene(chatId)
{
	this.chatId = chatId;
	this.text;
	this.node;
	this.addItem;
	this.removeItem;
	this.addQuest;
	this.removeQuest;
	initializeCutscene[chatId](this);
	this.textCounter = 30;
	this.complete = false;
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
	if (this.textCounter > 0)
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

Cutscene.prototype.isComplete = function()
{
	return this.complete;
}

// Displays the cutscene
Cutscene.prototype.render = function()
{
	view.renderText(this.text);
};