
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


// Adds an item into your inventory
Inventory.prototype.addItem = function(item)
{
	if (typeof(item.name) === 'undefined')
	{
		console.log("ERROR: item incorrect format");
		return;
	}
	if (typeof(item.quantity) === 'undefined' || item.quantity == null)
	{
		item.quantity = 1;
	}
	else if (item.quantity < 0)
	{
		item.quantity = 0;
	}

	if (item.name == "money" && item.quantity > 0)
	{
		playSoundEffect("coin.mp3");
		//flyTextList.push(new flyText(width/2, height/2, "+" + item.quantity + " money", "#00FF00"));
	}

	if (typeof(this.items[item.name]) !== 'undefined')
	{
		this.items[item.name].quantity += item.quantity;
	}
	else
	{
		this.items[item.name] = item;
	}

	updateDisplayWindow();
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
		// if the quantity is not specified, assume 1
		if (typeof(item.quantity) === 'undefined')
		{
			item.quantity = 1;
		}

		// if the quantity is greater than the quantity in your possession, it can be removed
		if (typeof(item.quantity) !== 'undefined' && item.quantity <= this.items[item.name].quantity)
		{
			this.items[item.name].quantity -= item.quantity;
			updateDisplayWindow();
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
