var weatherSprite = [];
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();
var itemSprite = {};


var View = function()
{
	this.renderList = [];
	this.staticCounter = 0;
	this.referenceList = [];
	this.clickX;
	this.clickY;
	this.selection = -1;
	this.oldDisplayWindow;

	itemSprite["money"] = new Image();
	itemSprite["money"].src = "img//money.png";
	itemSprite["apple"] = new Image();
	itemSprite["apple"].src = "img//apple.png";
	itemSprite["crystal"] = new Image();
	itemSprite["crystal"].src = "img//crystal.png";

	this.render = function()
	{
		this.renderBackground();

		for (var i in effects)
		{
			this.genericRender(effects[i]);
		}

		// a sorted list to hold all objects that must be rendered
		sortedIndexList = [];

		// add rocks, projectiles, etc to sorted render list
		for (var i in this.renderList)
		{
			// if it is a background image that should always be behind all other objects
			if (this.renderList[i].priority == -1)
			{
				this.renderAux(this.renderList[i]);
			}
			else
			{
				var j = 0;
				while (j < sortedIndexList.length && this.renderList[i].y > sortedIndexList[j].y)
				{
					j++;
				}
				sortedIndexList.splice(j,0,{id: i, type: "renderList", y: this.renderList[i].y});
			}
		}

		// add other entities to the sorted render list
		for (var i in playerList)
		{
			var j = 0;
			while (j < sortedIndexList.length && playerList[i].y > sortedIndexList[j].y)
			{
				j++;
			}
			sortedIndexList.splice(j,0,{id: i, type: "playerList", y: playerList[i].y});
		}

		// add the player to the sorted render list
		var j = 0;
		while (j < sortedIndexList.length && player.entity.y > sortedIndexList[j].y)
		{
			j++;
		}
		sortedIndexList.splice(j,0,{id: i, type: "player", y: player.entity.y});

		// render every element in the sorted render list
		for (var i in sortedIndexList)
		{
			if (sortedIndexList[i].type == "renderList")
			{
				this.renderAux(this.renderList[sortedIndexList[i].id]);
			}
			else if (sortedIndexList[i].type == "playerList")
			{
				this.renderAux(playerList[sortedIndexList[i].id]);
			}
			else if (sortedIndexList[i].type == "player")
			{
				//player.entity.updateSprite();
				player.entity.render();
			}
		}

		this.renderWeather();

		for (var i in sortedIndexList)
		{
			 if (sortedIndexList[i].type == "playerList")
			{
				playerList[sortedIndexList[i].id].renderHealthBar();
			}
		}

		player.entity.renderHealthBar();

		if (displayWindow != null)
		{
			if (displayWindow != this.oldDisplayWindow)
			{
				this.selection = "-1";
			}

			this.renderOptions(displayWindow);

			this.oldDisplayWindow = displayWindow;
		}
		else
		{
			this.selection = "-1";
		}

		this.clickX = null;
		this.clickY = null;
	}

	this.renderAux = function(e)
	{
		if (typeof(e.render) !== 'undefined')
		{
			e.render();
		}
		else
		{
			this.genericRender(e);
		}
	}

	// display an object which does not have a specific render function
	this.genericRender = function(object)
	{
		if (typeof(object.sprite) !== 'undefined' && object.sprite.complete && object.sprite.naturalHeight !== 0)
		{
			context.save();

			if (typeof(object.alpha) !== 'undefined')
			{
				context.globalAlpha = object.alpha;
			}
			else
			{
				context.shadowColor = "rgba(80, 80, 80, .4)";
				context.shadowBlur = 15 + object.z;
				context.shadowOffsetX = 0;
				context.shadowOffsetY = (3 + object.z) * graphics_scaling;
			}

			// if the object keeps track of when it was spawned and it's speed
			if (typeof(object.update_time) !== 'undefined')
			{
				var n = (new Date().getTime() - object.update_time)/(1000/60);

				context.shadowOffsetY = (3 + object.z + (n * object.z_speed)) * graphics_scaling;
				context.shadowBlur = 15 + object.z + (n * object.z_speed);

				if (n >= 0)
				{
					context.drawImage(
						object.sprite, 
						(object.x + (n * object.x_speed) - (object.sprite.width/2) - x_offset) * graphics_scaling,
						(object.y + (n * object.y_speed) - object.sprite.height - object.z - (n * object.z_speed) - y_offset) * graphics_scaling,
						object.sprite.width * graphics_scaling,
						object.sprite.height * graphics_scaling);
				}
			}
			// if the object's movement is not calculated
			else
			{
				context.drawImage(
					object.sprite, 
					(object.x - (object.sprite.width/2) - x_offset) * graphics_scaling, 
					(object.y - object.sprite.height - object.z - y_offset) * graphics_scaling,
					object.sprite.width * graphics_scaling, 
					object.sprite.height * graphics_scaling);
			}

			context.restore();
		}
	}

	// remove all objects, even those that are static
	this.clear = function()
	{
		this.renderList = [];
		this.staticCounter = 0;
	}

	// insert a signle item that persist through frames, like rocks which do not move
	this.insertStatic = function(a)
	{
		this.renderList.unshift(a); // add to start of list, so it does not matter if there are already dynamic elements included
		this.staticCounter += 1;
	}

	// insert items that could change every frame, like a player or projectile
	// remove the previous dynamic items, so that each object is only included once
	this.insertDynamic = function(array)
	{
		this.renderList.splice(this.staticCounter, this.renderList.length - this.staticCounter);
		for (var i in array)
		{
			this.renderList.push(array[i]);
		}
	}

	this.insertReference = function(f)
	{
		this.referenceList.push(f);
	}

	this.loadMap = function(mapId)
	{
		backgroundSprite = new Image();
		backgroundSpriteTop = new Image();
		weatherSprite = [];

		if (mapId == 0)
		{
			backgroundSprite.src = "img//grass1.png";
			backgroundSpriteTop.src = "img//grass1top.png";
		}
		else if (mapId == 1)
		{
			backgroundSprite.src = "img//snow1.png";
			backgroundSpriteTop.src = "img//snow1top.png";

			for (var i = 0; i < 4; i++)
			{
				weatherSprite[i] = new Image();
				weatherSprite[i].src = "img//snowfall" + i + ".png";
			}
		}
		else if (mapId == 2)
		{
			backgroundSprite.src = "img//snow1.png";
			backgroundSpriteTop.src = "img//snow1.png";
		}
		else if (mapId < 0)
		{
			backgroundSprite.src = "img//loghouseinside.png";
			backgroundSpriteTop.src = "img//loghouseinside.png";
		}
	}

	//displays the background image
	this.renderBackground = function()
	{
		context.fillRect(0, 0, width, height);

		if (backgroundSprite.complete && backgroundSprite.naturalHeight !== 0)
		{
			var x_counter = Math.ceil(Math.min(((width / graphics_scaling) / backgroundSprite.width) + 1,maxX[player.entity.mapId] / backgroundSprite.width));
			var y_counter = Math.ceil(Math.min(((height / graphics_scaling) / backgroundSprite.height) + 1,maxY[player.entity.mapId] / backgroundSprite.width));

			var background_x_offset = x_offset;
			var background_y_offset = y_offset;

			if (maxX[player.entity.mapId] > pixelWidth)
			{
				background_x_offset = x_offset % backgroundSprite.width;
			}
			if (maxY[player.entity.mapId] > pixelHeight)
			{
				background_y_offset = y_offset % backgroundSprite.height;
			}

			for (i = 0; i < x_counter; i++)
			{
				for (j = 0; j < y_counter; j++)
				{
					// draw a different background rectangle at the very top of the screen
					if (j == 0 && y_offset < backgroundSpriteTop.height)
					{
						context.drawImage(backgroundSpriteTop,
						((backgroundSpriteTop.width * i) - background_x_offset) * graphics_scaling, //x position
						((backgroundSpriteTop.height * j) - background_y_offset) * graphics_scaling, //y position
						backgroundSpriteTop.width * graphics_scaling, //width
						backgroundSpriteTop.height * graphics_scaling); //height
					}
					// draw the usual background rectangle
					else
					{
						context.drawImage(backgroundSprite,
						((backgroundSprite.width * i) - background_x_offset) * graphics_scaling, //x position
						((backgroundSprite.height * j) - background_y_offset) * graphics_scaling, //y position
						backgroundSprite.width * graphics_scaling, //width
						backgroundSprite.height * graphics_scaling); //height
					}
				}
			}
		}
	}

	// display the current weather (snow, rain, etc.) if there is any
	this.renderWeather = function()
	{
		if (typeof(weatherSprite) !== "undefined" && weatherSprite.length > 0)
		{
			var img = weatherSprite[Math.floor((new Date().getTime() % 400) / 100)];

			if (img.complete && img.naturalHeight !== 0)
			{
				var x_counter = Math.ceil((width / graphics_scaling) / img.width) + 1;
				var y_counter = Math.ceil((height / graphics_scaling) / img.height) + 1;

				for (i = 0; i <= x_counter; i++)
				{
					for (j = 0; j <= y_counter; j++)
					{
						// draw the usual background rectangle
						context.drawImage(img,
						((img.width * i) - (x_offset % img.width)) * graphics_scaling + Math.floor(((new Date().getTime() % (graphics_scaling * 100)) / 100) / graphics_scaling), //x position
						((img.height * j) - (y_offset % img.height)) * graphics_scaling + Math.floor(((new Date().getTime() % (graphics_scaling * 100)) / 100) / graphics_scaling), //y position
						img.width * graphics_scaling, //width
						img.height * graphics_scaling); //height
					}
				}
			}
		}
	}

	this.renderText = function(text)
	{
		var x = 54 * graphics_scaling;
		var y = (pixelHeight - 53) * graphics_scaling;
		var w = (pixelWidth - (2 * 54)) * graphics_scaling;
		var h = 52 * graphics_scaling;

		//var pos_x = Math.min(Math.max(e.x - x_offset, x),x + w);
		//var pos_y = e.y - y_offset;

		// draw the textbox
		context.fillStyle = "#FFFFFF";
		context.fillRect(x, y, w, h);
		/*context.beginPath();
		context.moveTo(Math.max(pos_x - 30,x) * graphics_scaling, y * graphics_scaling);
		context.lineTo(pos_x  * graphics_scaling, pos_y * graphics_scaling);
		context.lineTo(Math.min(pos_x + 30,x + w) * graphics_scaling, y * graphics_scaling);
		context.stroke();
		context.fill();*/

		context.lineWidth = graphics_scaling * 2;
		context.strokeStyle = "#000000";
		context.beginPath();		
		context.moveTo(x, y);
		context.lineTo(x + w, y);
		context.lineTo(x + w, y + h);
		context.lineTo(x, y + h);
		context.lineTo(x, y);
		context.stroke();

		context.font = "bold " + 8 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#000000";
		var textArray = text.split(" ");
		var line_counter = 0;
		var i = 0;

		while (i < textArray.length)
		{
			var renderText = "";

			while (i < textArray.length && context.measureText(renderText).width + context.measureText(textArray[i]).width + (8 * graphics_scaling) < w)
			{
				renderText += textArray[i] + " ";
				i++;
			}

			// 	draw the text
			context.fillText(renderText,
				x + (4 * graphics_scaling),
				(y + (h / 4) + (line_counter * 8 * graphics_scaling)));
			line_counter++;
		}
	}

	this.renderOptions = function(type, a)
	{
		if (type == "Quests")
		{
			a = quests;
			var w = Math.max(width * 0.5,250);
			var h = Math.max(height * 0.5,100);
			var x = (width / 2) - (w/2);
			var y = (height / 2) - (h/2);
		}
		else if (type == "Achievements")
		{
			a = achievements;
			var w = Math.max(width * 0.5,250);
			var h = Math.max(height * 0.5,100);
			var x = (width / 2) - (w/2);
			var y = (height / 2) - (h/2);
		}
		else if (type == "Inventory")
		{
			a = player.inventory.items;
			var w = Math.max(width * 0.2,250);
			var h = Math.max(height * 0.5,100);
			var x = (width / 2) - (w/2);
			var y = (height / 2) - (h/2);
		}
		else
		{		
			var w = Math.max(width * 0.2,250);
			var h = Math.max(height * 0.5,100);
			var x = (width / 2) - (w/2);
			var y = (height / 2) - (h/2);
		}
		// other: type == "DialogOption"

		//var textSpacing = 

		if (player.entity.x_speed != 0 || player.entity.y_speed != 0)
		{
			context.globalAlpha = 0.7;
		}

		// draw the textbox
		context.fillStyle = "#FFFFFF";
		context.fillRect(x, y, w, h);
		context.lineWidth = graphics_scaling * 2;
		context.strokeStyle = "#000000";
		context.beginPath();		
		context.moveTo(x, y);
		context.lineTo(x + w, y);
		context.lineTo(x + w, y + h);
		context.lineTo(x, y + h);
		context.lineTo(x, y);
		context.stroke();

		
		context.fillStyle = "#000000";
		var line_counter = 0;
		var TEXTSIZE = Math.max(12, 4 * graphics_scaling);
		context.font = "bold " + TEXTSIZE + "px sans-serif";



		for (var i in a)
		{
			if (this.clickX > x && this.clickX < x + (w/2) && this.clickY > y + (line_counter + 3 - 0.5) * (TEXTSIZE + graphics_scaling) && this.clickY <= y + (line_counter + 3 + 0.5) * (TEXTSIZE + graphics_scaling))
			{
				this.selection = i;
			}

			if (type != "DialogOption")
			{
				var s = a[i].name;
			}
			else
			{
				var s = a[i];
			}

						// 	display the items name
			context.fillText(s,
				x + 52,
				y + (line_counter + 3) * (TEXTSIZE + graphics_scaling));
			
			

			if (type == "Inventory")
			{
				// display the item's sprite
				if (typeof(itemSprite[s]) !== "undefined" && itemSprite[s].complete)
				{
					context.drawImage(itemSprite[s],
						x + 20,
						y + (line_counter + 3) * (TEXTSIZE + graphics_scaling) - itemSprite[s].height + graphics_scaling,
						itemSprite[s].width,
						itemSprite[s].height);
				}

				// 	display the items quantity
				context.fillText("x" + a[i].quantity,
					x + (w/2) + 16,
					y + (line_counter + 3) * (TEXTSIZE + graphics_scaling));

				if (this.selection == i)
				{
					line_counter++;

					// 	display the option to use the item
					if (this.clickX > x && this.clickX < x + (w/2) && this.clickY > y + (line_counter + 3 - 0.5) * (TEXTSIZE + graphics_scaling) && this.clickY < y + (line_counter + 3 + 0.5) * (TEXTSIZE + graphics_scaling))
					{
						console.log("user clicked use" + s);
						useItem(s);
					}

					context.fillText("use item",
						x + 48,
						y + (line_counter + 3) * (TEXTSIZE + graphics_scaling));
				}
			}
			else if (type == "Achievements" || type == "Quests")
			{
				// achievement or quest view always has the first item selected by default
				if (this.selection == "-1")
				{
					this.selection = i;
				}

				var counter = 0;
				for (var j in a[i].tracker)
				{
					for (var k in a[i].tracker[j])
					{
						counter += Math.min(a[i].tracker[j][k].counter, a[i].tracker[j][k].required);
					}
				}

				if (counter == a[i].totalRequired)
				{
					// colour the text gold if they completed the achievement
					context.fillStyle = "#F39C12";	
				}

				// show the % complete for the objective
				context.fillText(Math.floor(counter * 100.00 / a[i].totalRequired) + "%",
					x + 10,
					y + (line_counter + 3) * (TEXTSIZE + graphics_scaling));	
				context.fillStyle = "#000000";		
			}
			
			line_counter++;
		}

		if (line_counter > 0 && (type == "Achievements" || type == "Quests"))
		{
			var task_counter = 0;

			// display the various tasks required for the mission
			for (var j in a[this.selection].tracker[0])
			{
				if (a[this.selection].tracker[0][j].counter >= a[this.selection].tracker[0][j].required)
				{
					// colour the text gold if they completed the achievement
					context.fillStyle = "#F39C12";	
				}

				// display the task description
				context.fillText(a[this.selection].tracker[0][j].description.replace("{counter}",a[this.selection].tracker[0][j].counter),
					x + (w/3) + (4 * graphics_scaling),
					y + (task_counter + 3) * (TEXTSIZE + graphics_scaling));

				// display the user's progress
				context.fillText(a[this.selection].tracker[0][j].counter + " / " + a[this.selection].tracker[0][j].required,
					x + w - (30 * graphics_scaling),
					y + (task_counter + 3) * (TEXTSIZE + graphics_scaling));

				task_counter++;
				context.fillStyle = "#000000";	
			}

			// display the XP reward for completing the mission
			context.fillText(a[this.selection].reward.xp + " XP",
					x + (w/3) + (4 * graphics_scaling),
					y + (h/2) + (TEXTSIZE + graphics_scaling));

			// display the item rewards for completing the mission
			for (var j in a[this.selection].reward.items)
			{
				var item = a[this.selection].reward.items[j];

				context.drawImage(itemSprite[item.name],
					x + (w/3) + (4 * graphics_scaling),
					y + (h/2) + (j + 2) * (TEXTSIZE + graphics_scaling) - itemSprite[item.name].height + graphics_scaling,
					itemSprite[item.name].width,
					itemSprite[item.name].height);

				context.fillText(item.name + " x" + item.quantity,
					x + (w/3) + (4 * graphics_scaling) + itemSprite[item.name].width,
					y + (h/2) + (j + 2) * (TEXTSIZE + graphics_scaling));


			}
		}	

		// 	draw the headers
		context.font = "bold " + TEXTSIZE * 2 + "px sans-serif";
		if (type == "Achievements" || type == "Quests")
		{
			if (type == "Achievements")
			{
				var title = "Achievement";
				context.fillText("Achievements",
					x + (4 * graphics_scaling),
					y + TEXTSIZE * 2);
			}
			else if (type == "Quests")
			{
				var title = "Quest";
				context.fillText("Quests",
					x + (4 * graphics_scaling),
					y + TEXTSIZE * 2);
			}
			if (this.selection != "-1")
			{
				// if a quest or achievemnt has been selected, use it's name for the headers
				var title = a[this.selection].name;
			}

			context.fillText(title + " Tasks",
				x + (w/3) + (4 * graphics_scaling),
				y + TEXTSIZE * 2);

			context.fillText(title + " Rewards",
				x + (w/3) + (4 * graphics_scaling),
				y + (h/2) - (2 * graphics_scaling));

			// draw an extra box to hold the objective's details
			context.beginPath();
			context.moveTo(x + w / 3, y);
			context.lineTo(x + w / 3, y + h);
			context.stroke();
		}
		else if (type == "Inventory")
		{
			context.fillText("Items",
				x + (4 * graphics_scaling),
				y + TEXTSIZE * 2);

			context.fillText("Quantity",
				x + (w/2) + (4 * graphics_scaling),
				y + TEXTSIZE * 2);
		}	

		context.globalAlpha = 1;
	}

	this.clickPosition = function(x, y)
	{
		this.clickX = x;
		this.clickY = y;
	}


}


