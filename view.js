var weatherSprite = [];
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();

var View = function()
{
	this.renderList = [];
	this.staticCounter = 0;
	this.referenceList = [];
	this.clickX;
	this.clickY;
	this.selection;

	this.render = function()
	{
		this.renderBackground();

		// a sorted list to hold all objects that must be rendered
		sortedIndexList = [];

		// add rocks, projectiles, etc to sorted render list
		for (var i in this.renderList)
		{
			var j = 0;
			while (j < sortedIndexList.length && this.renderList[i].y > sortedIndexList[j].y)
			{
				j++;
			}
			sortedIndexList.splice(j,0,{id: i, type: "renderList", y: this.renderList[i].y});
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

		if (displayQuests)
		{
			this.displayQuests();
		}
		else if (displayInventory)
		{
			this.displayInventory();
		}
		else
		{
			this.clickX = 0;
			this.clickY = 0;
			this.selection = "-1";
		}
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
			context.shadowColor = "rgba(80, 80, 80, .4)";
			context.shadowBlur = 15 + object.z;
			context.shadowOffsetX = 0;
			context.shadowOffsetY = (3 + object.z) * graphics_scaling;

			if (typeof(object.opacity) !== 'undefined')
			{
				context.globalAlpha = object.opacity;
			}

			// if the object keeps track of when it was spawned and it's speed
			if (typeof(object.update_time) !== 'undefined')
			{
				var n = (new Date().getTime() - object.update_time)/(1000/60);

				if (n >= 0)
				{
					context.drawImage(
						object.sprite, 
						(object.x + (n * object.x_speed) - (object.sprite.width/2) - x_offset) * graphics_scaling,
						(object.y + (n * object.y_speed) - object.sprite.height - object.z - y_offset) * graphics_scaling,
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

	this.clear = function()
	{
		this.renderList = [];
		this.staticCounter = 0;
	}

	// insert items that persist through frames, like rocks which do not move
	this.insertStatic = function(a)
	{
		for (var i in a)
		{
			this.renderList.push(a[i]);
			this.staticCounter += 1;
		}
	}

	// insert items that could change every frame, like a player or projectile
	// remove the previous dynamic items, so that each object is only included once
	this.insertDynamic = function(a)
	{
		this.renderList.splice(this.staticCounter, this.renderList.length - this.staticCounter);
		for (var i in a)
		{
			this.renderList.push(a[i]);
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

		if (mapId == 0)
		{
			backgroundSprite.src = "img//grass1.png";
			backgroundSpriteTop.src = "img//grass1top.png";
			weatherSprite = [];
		}
		else if (mapId == 1)
		{
			backgroundSprite.src = "img//snow1.png";
			backgroundSpriteTop.src = "img//snow1top.png";
			weatherSprite = [];

			for (var i = 0; i < 4; i++)
			{
				weatherSprite[i] = new Image();
				weatherSprite[i].src = "img//snowfall" + i + ".png";
			}
		}
		else if (mapId == -1)
		{
			backgroundSprite.src = "img//loghouseinside.png";
			backgroundSpriteTop.src = "img//loghouseinside.png";
			weatherSprite = [];
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

	this.displayQuests = function()
	{
		var x = width / 4;
		var y = height / 4;
		var w = width / 2;
		var h = height / 2;

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
		context.beginPath();
		context.moveTo(x + w / 3, y);
		context.lineTo(x + w / 3, y + h);
		context.stroke();

		context.font = "bold " + 8 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#000000";
		var line_counter = 0;

		// 	draw the headers
		context.fillText("Quests",
			x + (4 * graphics_scaling),
			y + (8 * graphics_scaling));

		context.fillText("Quest Tasks",
				x + (w/3) + (4 * graphics_scaling),
				y + (8 * graphics_scaling));

		context.font = "bold " + 4 * graphics_scaling + "px sans-serif";

		for (var i in quests)
		{
			if (this.clickX > x && this.clickX < x + (w/2) && this.clickY > y + ((4 + line_counter) * 4 * graphics_scaling) && this.clickY < y + ((4 + line_counter + 1) * 4 * graphics_scaling))
			{
				this.selection = i;
				console.log(this.selection);
			}
			else if (this.selection == "-1")
			{
				this.selection = i;
			}

			// 	draw the text
			context.fillText(quests[i].name,
				x + (4 * graphics_scaling),
				y + ((4 + line_counter) * 4 * graphics_scaling));

			line_counter++;
		}


		var task_counter = 0;

		for (var j in quests[this.selection].tracker[0])
		{
			context.fillText(quests[this.selection].tracker[0][j].description.replace("{counter}",quests[this.selection].tracker[0][j].counter),
				x + (w/3) + (4 * graphics_scaling),
				y + ((4 + task_counter) * 4 * graphics_scaling));
			task_counter++;
		}

		context.globalAlpha = 1;
	}

	this.displayInventory = function()
	{
		var w = Math.max(width * 0.2,250);
		var h = Math.max(height * 0.5,100);
		var x = (width / 2) - (w/2);
		var y = (height / 2) - (h/2);

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

		context.font = "bold " + 8 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#000000";
		var line_counter = 0;

		// 	draw the headers
		context.fillText("Items",
			x + (4 * graphics_scaling),
			y + (8 * graphics_scaling));

		context.fillText("Quantity",
				x + (w/2) + (4 * graphics_scaling),
				y + (8 * graphics_scaling));

		context.font = "bold " + Math.max(12, 4 * graphics_scaling) + "px sans-serif";

		for (var i in player.inventory.items)
		{
			if (player.inventory.items[i].quantity > 0)
			{
				if (this.clickX > x && this.clickX < x + (w/2) && this.clickY > y + ((1 + line_counter) * 20) + (8 * graphics_scaling) && this.clickY < y + ((2 + line_counter) * 20) + (8 * graphics_scaling))
				{
					console.log("user clicked " + player.inventory.items[i].name);
					this.selection = i;
				}

				if (typeof(player.inventory.items[i].sprite) !== "undefined" && player.inventory.items[i].sprite.complete)
				{
					context.drawImage(player.inventory.items[i].sprite,
						x + 16,
						y + ((1 + line_counter) * 20) + (8 * graphics_scaling) - player.inventory.items[i].sprite.height + 2,
						player.inventory.items[i].sprite.width,
						player.inventory.items[i].sprite.height);
				}

				// 	display the items name
				context.fillText(player.inventory.items[i].name,
					x + 48,
					y + ((1 + line_counter) * 20) + (8 * graphics_scaling));

				// 	display the items quantity
				context.fillText("x" + player.inventory.items[i].quantity,
					x + (w/2) + 16,
					y + ((1 + line_counter) * 20) + (8 * graphics_scaling));

				if (this.selection == i)
				{
					line_counter++;
				}
				line_counter++;
			}
		}

		context.globalAlpha = 1;
	}

	this.clickPosition = function(x, y)
	{
		this.clickX = x;
		this.clickY = y;
	}
}