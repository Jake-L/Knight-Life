(function(exports)
{

  exports.mapObject = function(x, y, spriteName)
	{
    	this.x = x;
		this.y = y;
		this.z = 0;
		this.x_speed = 0;
		this.y_speed = 0;
		this.z_speed = 0;
		this.spriteName = spriteName;
		this.width = 20;
		this.height = 20;
		this.depth = 20;
		this.priority = 0;

		if (spriteName == "snowportal" || spriteName == "grassportal")
		{
			this.priority = -1;
		}

		this.id = x + " " + y + spriteName + Math.ceil(new Date().getTime() * (Math.random() + 0.01));
  };
	
	exports.mapObject.prototype.initialize = function()
	{
		this.sprite = new Image();

		this.sprite.src = "img//" + this.spriteName + ".png";
	};
	
	exports.mapObject.prototype.render = function()
	{
		if (this.sprite.complete && this.sprite.naturalHeight !== 0)
		{
			this.width = this.sprite.width;
			this.depth = this.sprite.height * 0.75;
			this.height = this.sprite.height / 2;
			
			context.save();

			if (this.priority >= 0)
			{
				context.shadowColor = "rgba(80, 80, 80, .4)";
				context.shadowBlur = 15 + this.z;
				context.shadowOffsetX = 0;
				context.shadowOffsetY = (3 + this.z) * graphics_scaling;
			}
			
			context.drawImage(
				this.sprite, 
				(this.x - (this.sprite.width/2) - x_offset) * graphics_scaling, 
				(this.y - this.sprite.height - this.z - y_offset) * graphics_scaling,
				this.sprite.width * graphics_scaling, 
				this.sprite.height * graphics_scaling);
			context.restore();
		}
	};

}(typeof exports === 'undefined' ? this.share = {} : exports));