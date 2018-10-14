(function(exports)
{

var itemList = ["money", "apple", "carrot", "leek", "pear", "crystal", "icebosscrystal", "sword", "bow", "knighthelmet", "ring"];
itemDetail = {};
for (var i in itemList)
{
	var item = {
		name: itemList[i]
	};
	if(typeof(module) === 'undefined')
	{
		item.sprite = new Image();
		item.sprite.src = "img//" + itemList[i] + ".png";
	}
	item.price = 10;
	item.defence = 0;
	item.attack = 0;
	itemDetail[item.name] = item;
}
itemDetail["money"].price = 1;
itemDetail["leek"].price = 20;
itemDetail["carrot"].price = 20;
itemDetail["crystal"].price = 50;
itemDetail["icebosscrystal"].price = 1000;
itemDetail["sword"].price = 1000;
itemDetail["bow"].price = 1000;
itemDetail["knighthelmet"].price = 500;
itemDetail["knighthelmet"].defence = 2;

exports.itemDetail = itemDetail;

}(typeof exports === 'undefined' ? this.shareItems = {} : exports));