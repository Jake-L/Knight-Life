var weatherSprite = [];
var backgroundSprite = new Image();
var backgroundSpriteTop = new Image();

var View = function()
{
	this.renderList = [];
	this.staticCounter = 0;
	this.referenceList = [];

	this.render = function()
	{
		for (var i in this.renderList)
		{
			if (typeof(this.renderList[i].render) !== 'undefined')
			{
				this.renderList[i].render();
			}
			else
			{
				this.genericRender(this.renderList[i]);
			}
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
	}

	//displays the background image
	this.renderBackground = function()
	{
		context.fillRect(0, 0, width, height);

		if (backgroundSprite.complete && backgroundSprite.naturalHeight !== 0)
		{
			var x_counter = Math.ceil((width / graphics_scaling) / backgroundSprite.width) + 1;
			var y_counter = Math.ceil((height / graphics_scaling) / backgroundSprite.height) + 1;

			for (i = 0; i <= x_counter; i++)
			{
				for (j = 0; j <= y_counter; j++)
				{
					// draw a different background rectangle at the very top of the screen
					if (j == 0 && y_offset < backgroundSpriteTop.height)
					{
						context.drawImage(backgroundSpriteTop,
						((backgroundSpriteTop.width * i) - (x_offset % backgroundSpriteTop.width)) * graphics_scaling, //x position
						((backgroundSpriteTop.height * j) - (y_offset % backgroundSpriteTop.height)) * graphics_scaling, //y position
						backgroundSpriteTop.width * graphics_scaling, //width
						backgroundSpriteTop.height * graphics_scaling); //height
					}
					// draw the usual background rectangle
					else
					{
						context.drawImage(backgroundSprite,
						((backgroundSprite.width * i) - (x_offset % backgroundSprite.width)) * graphics_scaling, //x position
						((backgroundSprite.height * j) - (y_offset % backgroundSprite.height)) * graphics_scaling, //y position
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

}