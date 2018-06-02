// holds items, and provides an interface to use them
function Inventory()
{
	this.items = {};
}

Inventory.prototype.loadInventory = function(items)
{
	for (var i in items)
	{
		this.addItem(items[i]);
	}
}

Inventory.prototype.jsonString = function()
{
	var s = "[";
	var counter = 0;

	for (var i in this.items)
	{
		if (counter > 0)
		{
			s+= ","; // add commas between any elements after the first element
		}

		// add the item to the json list
		s += "{\"name\": \"" + this.items[i].name + "\", \"quantity\": " + this.items[i].quantity + "}";  

		counter++;
	}
}

// Displays the inventory view
Inventory.prototype.render = function(x, y, width, height)
{
	for (var i in this.items)
	{

	}
};

// Adds an item into your inventory
Inventory.prototype.addItem = function(item)
{
	if (typeof(item.quantity) === 'undefined' || item.quantity == null)
	{
		item.quantity = 1;
	}
	else if (item.quantity < 0)
	{
		item.quantity = 0;
	}

	if (typeof(this.items[item.name]) !== 'undefined')
	{
		this.items[item.name].quantity += item.quantity;
	}
	else
	{
		this.items[item.name] = item;
	}
};

// get an item, such as for the displaying the amount of money a player has
Inventory.prototype.getItem = function(itemName)
{
	if (typeof(this.items[itemName]) !== 'undefined')
	{
		return this.items[itemName];
	}
	else
	{
		return {name: itemName, quantity: 0};
	}

};

// Consumes an item from the inventory (if applicable)
// takes item as a parameter so it knows the quantity of the item used 
Inventory.prototype.removeItem = function(item)
{
	console.log("attemping to remove " + item.quantity + " " + item.name);

	if (typeof(item.name) !== 'undefined' && typeof(this.items[item.name]) !== 'undefined')
	{
		// if the quantity was specified and is less than the quantity in your possession
		if (typeof(item.quantity) !== 'undefined' && item.quantity <= this.items[item.name].quantity)
		{
			this.items[item.name].quantity -= item.quantity;
			return true;
		} 
		else if (typeof(item.quantity) === 'undefined')
		{
			this.items[item.name].quantity -= 1;
			return true;
		}
		else
		{
			return false;
		}
	}
	else
	{
		console.log("faled to remove item");
		return false;
	}
};

// Removes an item from the inventory
// returns true if it is removed and false if it was not in your inventory
/*
Inventory.removeItem = function(item)
{
	var n = this.getIndex(item);

	if (n == -1 || typeof(item.quantity) === 'undefined' || item.quantity == null || item.quantity <= 0)
	{
		return null
	}
	else if (item.quantity >= this.items[n].quantity)
	{
		this.items.splice(n, 1);
	}
	else
	{
		this.items[n].quantity -= item.quantity;
	}
};

// gets the index of an item in your inventory, or -1 if it's not in your inventory
Inventory.getIndex = function(item)
{
	if (typeof(item.spriteName) === 'undefined' || item.spriteName == null)
	{
		return -1;
	}

	for (var i in this.items)
	{
		if (this.items[i].spriteName == item.spriteName)
		{
			return i;
		}
	}

	return -1;
}*/

// an item to be used by the player, such as food or a weapon
function Item(spriteName, quantity, type)
{
	this.spriteName = spriteName;
	this.type = type;
	this.quantity = 1;

	if (quantity != null)
	{
		this.quantity = quantity;
	}
};

