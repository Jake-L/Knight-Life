// create the portal class
function Portal(x, y, height, width, destination_mapId, destination_x, destination_y, direction)
{
	this.x = x;
	this.y = y;
	this.height = height;
	this.width = width;
	this.destination_x = destination_x;
	this.destination_y = destination_y;
	this.destination_mapId = destination_mapId;
	this.direction = direction;

	if (height == null)
	{
		this.height = 20;
	}
	if (width == null)
	{
		this.width = 20;
	}
}

Portal.prototype.collisionCheck = function(e)
{
	if (e.x < this.x + (this.width / 2) 
		&& e.x > this.x - (this.width / 2) 
		&& e.y > this.y - (this.height / 2) 
		&& e.y < this.y + (this.height / 2) 
		&& (this.direction == null || e.direction == this.direction))
	{
		return true;
	}
	else
	{
		return false;
	}
}