var View = function()
{
	this.renderList = [];
	this.staticCounter = 0;
	this.referenceList = [];
	this.clickX;
	this.clickY;
	this.selection = -1;

	var weatherSprite = [];
	var backgroundSprite = [];	

	this.loadBackgroundSprite = function()
	{
		const backgroundNames = ["grass1", "grass2", "grass1top", "snow1", "snow1top", "loghouseinside", "cobblestonefloor", "stairsleft", "stairs", "stairsright", "stairsdown", "stairsdownleft", "stairsdownright"];

		for (let i in backgroundNames)
		{	
			spriteName = backgroundNames[i];
			backgroundSprite[spriteName] = new Image();
			backgroundSprite[spriteName].src = `img//${spriteName}.png`;
		}
	}

	this.loadBackgroundSprite();

	this.render = function()
	{
		this.get_offset();

		// make the screen a little transparent when the player is moving
		if (player.entity.x_speed != 0 || player.entity.y_speed != 0)
		{
			document.getElementById("formwindow").style.opacity = 0.7;
		}
		else
		{
			document.getElementById("formwindow").style.opacity = 1;
		}

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
		this.get_offset();

		weatherSprite = [];

		if (mapId == 1)
		{
			for (var i = 0; i < 4; i++)
			{
				weatherSprite[i] = new Image();
				weatherSprite[i].src = "img//snowfall" + i + ".png";
			}
		}
	}

	//displays the background image
	this.renderBackground = function()
	{
		context.fillRect(0, 0, width, height);

		const x_counter = Math.ceil(Math.min(((width / graphics_scaling) / gridSize) + 1, maps[player.entity.mapId][0].length));
		const y_counter = Math.ceil(Math.min(((height / graphics_scaling) / gridSize) + 1, maps[player.entity.mapId].length));

		const grid_x_offset = Math.max(Math.floor(x_offset / gridSize), 0);
		const grid_y_offset = Math.max(Math.floor(y_offset / gridSize), 0);

		const background_x_offset = x_offset - (grid_x_offset * gridSize);
		const background_y_offset = y_offset - (grid_y_offset * gridSize);

		for (i = 0; i < x_counter; i++)
		{
			for (j = 0; j < y_counter; j++)
			{
				// draw the usual background rectangle
				if (typeof(maps[player.entity.mapId][j + grid_y_offset][i + grid_x_offset]) !== 'undefined')
				{
					context.drawImage(
						backgroundSprite[maps[player.entity.mapId][j + grid_y_offset][i + grid_x_offset]],
						((gridSize * i) - background_x_offset) * graphics_scaling, //x position
						((gridSize * j) - background_y_offset) * graphics_scaling, //y position
						gridSize * graphics_scaling, //width
						gridSize * graphics_scaling //height
					);
				}
			}
		}
	}

	// check the offset used for screen scrolling
	this.get_offset = function()
	{
		var left_offset = player.entity.x - (pixelWidth / 2);
		var right_offset = player.entity.x + (pixelWidth / 2);

		// if the map doesn't fill the whole screen, center it
		if (maps[player.entity.mapId][0].length * gridSize <= pixelWidth)
		{
			x_offset = ((maps[player.entity.mapId][0].length * gridSize) - (width / graphics_scaling)) / 2;
		}
		// check if the player is moving in the middle of the map and the screen needs to be moved
		else if (left_offset > 0 && right_offset < maps[player.entity.mapId][0].length * gridSize)
		{
			x_offset = left_offset;
		}
		else if (left_offset > 0 && right_offset >= maps[player.entity.mapId][0].length * gridSize)
		{
			x_offset = maps[player.entity.mapId][0].length * gridSize - pixelWidth;
		}
		else
		{
			x_offset = 0;
		}

		var top_offset = player.entity.y - (pixelHeight / 2);
		var bot_offset = player.entity.y + (pixelHeight / 2);

		// if the map doesn't fill the whole screen, center it
		if (maps[player.entity.mapId].length * gridSize <= pixelHeight)
		{
			y_offset = ((maps[player.entity.mapId].length * gridSize) - (height / graphics_scaling)) / 2;
		}
		else if (top_offset > 0 && bot_offset < maps[player.entity.mapId].length * gridSize)
		{
			y_offset = top_offset;
		}
		else if (top_offset > 0 && bot_offset >= maps[player.entity.mapId].length * gridSize)
		{
			y_offset = maps[player.entity.mapId].length * gridSize - pixelHeight;
		}
		else
		{
			y_offset = 0;
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

	this.selectOption = function(type, id)
	{
		// remove any data already in the table
		var table = document.getElementById("detailtable");
		while (table.firstChild) 
		{
			table.removeChild(table.firstChild);
		}

		if (type == "Quests")
		{
			var selection = quests[id];
		}
		else if (type == "Achievements")
		{
			var selection = achievements[id];
		}
		else if (type == "Leaderboards")
		{
			var selection = leaderboards[id];
		}
		else
		{
			console.log("view.selectOption, type=" + type + " id=" + id);
		}
		if (typeof(selection) === "undefined")
		{
			console.log("view.selectOption undefined, type=" + type + " id=" + id);
			return;
		}

		var row = document.createElement("tr");
		var title = document.createElement("th");
		var subtitle = document.createElement("th");
		row.appendChild(title);
		row.appendChild(subtitle);
		table.appendChild(row);		

		if (type == "Achievements" || type == "Quests")
		{
			title.textContent = selection.name + " Tasks";

			// display the various tasks required for the mission
			for (var j in selection.tracker[0])
			{
				var row = document.createElement("tr");
				table.appendChild(row);
				var cell = document.createElement("td");
				row.appendChild(cell);


				if (selection.tracker[0][j].counter >= selection.tracker[0][j].required)
				{
					// colour the text gold if they completed the task
					row.className = row.className + " emphasizetext";
				}

				cell.textContent = selection.tracker[0][j].description.replace("{counter}",selection.tracker[0][j].required);
				
				var cell = document.createElement("td");
				row.appendChild(cell);
				cell.textContent = selection.tracker[0][j].counter + " / " + selection.tracker[0][j].required;
			}

			var row = document.createElement("tr");
			var title = document.createElement("th");
			title.textContent = "Rewards";
			row.appendChild(title);
			table.appendChild(row);

			// display the XP reward for completing the mission
			var row = document.createElement("tr");
			var cell = document.createElement("td");
			cell.textContent = selection.reward.xp + " XP";
			row.appendChild(cell);
			table.appendChild(row);

			// display the item rewards for completing the mission
			for (var j in selection.reward.items)
			{
				var row = document.createElement("tr");
				var cell = document.createElement("td");
				var item = selection.reward.items[j];
				cell.appendChild(item.sprite);
				var textNode = document.createTextNode(item.name + " x" + item.quantity);
				cell.appendChild(textNode);
				row.appendChild(cell);
			}
		}
		else if (type == "Leaderboards")
		{
			title.textContent = "Username";
			subtitle.textContent = id;

			for (var j in selection)
			{
				var row = document.createElement("tr");

				// display the user's name
				var cell = document.createElement("td");
				row.appendChild(cell);
				cell.textContent = selection[j].name;

				// display the user's stats
				var cell = document.createElement("td");
				row.appendChild(cell);
				cell.textContent = selection[j].counter;

				table.appendChild(row);
			}
		}
	}

	this.renderOptions = function(type, a)
	{
		// display the table
		document.getElementById("formwindow").style.display = "flex";

		// remove any list items already in the table
		var table = document.getElementById("listtable");		
		while (table.firstChild) 
		{
			table.removeChild(table.firstChild);
		}

		var row = document.createElement("tr");
		var title = document.createElement("th");
		var subtitle = document.createElement("th");
		row.appendChild(title);
		row.appendChild(subtitle);
		table.appendChild(row);

		if (type == "Quests")
		{
			a = quests;
			title.textContent = "Quests";
		}
		else if (type == "Achievements")
		{
			a = achievements;
			title.textContent = "Achievements";
		}
		else if (type == "Leaderboards")
		{
			a = leaderboards;
			title.textContent = "Leaderboards";
		}
		else if (type == "Inventory" || type == "Sell")
		{
			a = {};
			for (var i in player.inventory.items)
			{
				if (player.inventory.items[i].quantity > 0 && (type == "Inventory" || !["money", "ring"].includes(player.inventory.items[i].name)))
				{
					a[i] = player.inventory.items[i];
				}
			}

			title.textContent = "Item Name";
			subtitle.textContent = "Quantity";
		}
		else if (type == "Buy")
		{
			// the array is already provided, so no need to set a 
			title.textContent = "Item Name";
			subtitle.textContent = "Quantity";
		}
		else //display plaintext
		{

		} 

		var index = null;

		// add the new list items
		for (var i in a)
		{
			row = document.createElement("tr");
			table.appendChild(row);

			if (type == "CutsceneOption")
			{
				var s = a[i];
			}
			else if (type == "Leaderboards")
			{
				var s = i;
			}
			else
			{
				var s = a[i].name;
			}

			if (index == null)
			{
				index = i;
			}

			// create the text element
			var cell = document.createElement("td");
			row.appendChild(cell);
			var textNode = document.createTextNode(s);
			
			// for showing inventory, add an icon of the item
			if (type == "Inventory" || type == "Sell" || type == "Buy")
			{
				var img = document.createElement("img");
				img.src = itemDetail[s].sprite.src;
				cell.appendChild(img);
			}

			// add the text after the inventory image icon is added
			cell.appendChild(textNode);

			// add text to the second column of the first part, for example the quantity of an item or the % complete of a quest
			var cell = document.createElement("td");
			row.appendChild(cell);

			// 	display the items quantity
			if (type == "Inventory" || type == "Sell")
			{				
				cell.textContent = a[i].quantity;

				//set onclick event
				if (type == "Inventory")
				{
					row.setAttribute("onclick", "useItem('" + s + "')");
				}
				else if (type == "Sell")
				{
					row.setAttribute("onclick", "sellItem('" + s + "')");
					if (updateCounter % 3 == 0)
					{
						cutscene.text = "Thanks for selling me this " + s + ".";
					}
					else if (updateCounter % 3 == 1)
					{
						cutscene.text = "I was just thinking I needed another " + s + ".";
					}
					else
					{
						cutscene.text = "I'm always in the market for another " + s + ".";
					}
				}
			}
			// display the completion rate of a quest or achievement
			else if (type == "Quests" || type == "Achievements")
			{
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
					row.className = row.className + " emphasizetext";
				}

				// show the % complete for the objective
				cell.textContent = Math.floor(counter * 100.00 / a[i].totalRequired) + "%";

				//set onclick event
				row.setAttribute("onclick", "view.selectOption('" + type + "','" + i + "')");
			}
			else if (type == "Leaderboards")
			{
				//set onclick event
				row.setAttribute("onclick", "view.selectOption('" + type + "','" + i + "')");
			}
			else if (type == "CutsceneOption")
			{
				//set onclick event
				row.setAttribute("onclick", "cutscene.optionsResult(" + i + ")");
			}

		}

		if (["Quests", "Achievements", "Leaderboards"].includes(type) && index != null)
		{
			document.getElementById("formdetail").style.display = "flex";
			this.selectOption(type, index);
		}
		else
		{
			document.getElementById("formdetail").style.display = "none";
		}
	}
}