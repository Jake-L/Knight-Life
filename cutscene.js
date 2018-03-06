var initialize = [];
initialize[0] = function()
{
	console.log(this);
	this.text = "Hello! The ice men scare me! Please kill two of them.";
}


// holds items, and provides an interface to use them
function Cutscene(chatId)
{
	this.text;
	this.nextNode;
	this.addItem;
	this.removeItem;
	this.addObjective;
	this.removeObjective;
	this.initialize = initialize[chatId];
	this.initialize();
	this.textCounter = 60;
	this.complete = false;
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
				this.complete = true;
			}
		}
	}
}

Cutscene.prototype.isComplete = function()
{
	return this.complete;
}

Cutscene.prototype.updateObjective = function()
{

}

// Displays the cutscene
Cutscene.prototype.render = function()
{
	context.fillStyle = "#000000";
	context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
	context.fillText(this.text,
		(width / 2) - (context.measureText(this.text).width / 2),
		height * 3 / 4);
	console.log(this.text, (width * graphics_scaling / 2), height * graphics_scaling * 3 / 4);
};