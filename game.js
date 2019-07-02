// play background music
var audio;
var soundEffect = [];

// create the graphics canvas
var canvas = document.getElementById('canvas');
var width;
var height;
var context;
var graphics_scaling;
setScreenSize();
var x_offset = 0;
var y_offset = 0;

// retrieve data from the server
var socket = io();
var ping = 0;

// create the player's graphics
context.fillStyle = "#ADD8E6";
var healthBarSprite = new Image();
healthBarSprite.src = "img//healthbar.png";
var healthBarGreenSprite = new Image();
healthBarGreenSprite.src = "img//healthbargreen.png";
var minimapbox = new Image();
minimapbox.src = "img//minimapbox.png";
var itemSprite = [];
itemSprite["money"] = new Image();
itemSprite["money"].src = "img//money.png";
itemSprite["moneyIcon"] = new Image();
itemSprite["moneyIcon"].src = "img//moneyIcon.png";

//key mappings
var left_key = 37;
var up_key = 38;
var right_key = 39;
var down_key = 40;
var attack_key = 50;
var attack2_key = 51;

var frameTime = 0;
var startTime = 0;

var playerList = {};
var mapObjects = {};
var projectileList = [];
var flyTextList = [];
var notificationList = [];
var portalList = [];
var cutscene = null;
var effects = [];

var playerSprite = [];
var playerAttackSprite = [];
var clothingSprite = {};
var weaponSprite = {};
var username = "";
var playerXP = 0;
var minimapScale = 16;

var view = new View();

function getDirName(n)
{
	if (n == 0)
	{
		return "Left";
	}
	else if (n == 1)
	{
		return "Up";
	}
	else if (n == 2)
	{
		return "Right";
	}
	else if (n == 3)
	{
		return "Down";
	}

	return "";
}

function getDirNum(s)
{
	if (s == "Left")
	{
		return 0;
	}
	else if (s == "Up")
	{
		return 1;
	}
	else if (s == "Right")
	{
		return 2;
	}
	else if (s == "Down")
	{
		return 3;
	}
}

//functions from external files
const itemDetail = shareItems.itemDetail;
var mapObject = share.mapObject;
var Attack = shareAttack.Attack;
var Entity = shareEntity.Entity;
const maps = shareMap.maps;
const gridSize = shareMap.gridSize;
const mapTheme = shareMap.mapTheme;

const defaultmapId = -3;
var player;
var quests = {};
var completedQuests = {};
var achievements = {};
var completedAchievements = {};
var achievementCount = 6;

window.onload = function()
{
	document.body.appendChild(canvas);

	//get the player's username
	username = getUsername();

	if (username != "Player") // user progress not saved if they don't login
	{
		//check with the server for savedata
		socket.emit('load', username);

		// update the cookie to last 2 more days
		var date = new Date();
		date.setTime(date.getTime()+(2*24*60*60*1000)); // cookie lasts for 2 days
		document.cookie = "username=" + username + "; expires="+date.toGMTString();
	}

	// load images and data that don't depend on player information while waiting for server response
	loadSprite("player",["Punch","Sword","Arrow"]);
	loadSprite("iceman",["Punch","Snowball"]);
	loadSprite("iceboss",["Punch","Snowball"]);
	loadWeapons();
	loadClothing();

	if (username == "Player") // load a user who hasn't logged in
	{
		loadPlayer("false");
	}
};

// create the player
function respawn()
{
	var oldPlayer = player;
	if (oldPlayer.entity.mapId == 2 || (oldPlayer.entity.mapId + " ").substr(0,2) == "da")
	{
		view.clear();
		loadMap(1);
		player = new Player(1);
	}
	else
	{
		player = new Player(oldPlayer.entity.mapId);
	}

	player.entity.setLevel(oldPlayer.entity.lvl);
	player.entity.xp = oldPlayer.entity.xp;
	player.inventory = oldPlayer.inventory;
	player.entity.attacks = oldPlayer.entity.attacks;
	player.entity.clothing = oldPlayer.entity.clothing;
	player.playTime = oldPlayer.playTime;
}

var updateCounter = 0;

function loadMap(mapId)
{
	console.log("loading map " + mapId);
	effects = [];
	flyTextList = [];

	view.loadMap(mapId);
	mapObjects = {};
	playerList = {};
	projectileList = [];
	portalList = []

	playMusic(mapTheme[mapId]);

	/* mapID >= 0 means public maps with other users */
	if (mapId == 0)
	{
		// create the portal to the snow world
		portalList[0] = new Portal(992, 300, 20, 20, 1, 10, 300, "Right");
		var p = new mapObject(portalList[0].x, portalList[0].y + 4, "snowportal");
		p.initialize();
		view.insertStatic(p);
		// create doors to enter log cabins
		portalList[1] = new Portal(278, 309, 20, 20, -1, 64, 127, "Up");
		portalList[2] = new Portal(486, 309, 20, 20, -2, 64, 127, "Up");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		// create door to enter castle
		portalList[3] = new Portal(136, 164, 20, 20, -3, 127, 191, "Up");

		// create flowers and bushes in random spots
		for (var i = 0; i < 10; i++)
		{
			p = new mapObject(Math.floor(Math.random() * maps[0][0].length * gridSize), Math.floor(Math.random() * (maps[0][0].length * gridSize - (gridSize * 2)) + (gridSize * 2)), "bush1");
			p.initialize();
			view.insertStatic(p);

			p = new mapObject(Math.floor(Math.random() * maps[0][0].length * gridSize), Math.floor(Math.random() * (maps[0][0].length * gridSize - (gridSize * 2)) + (gridSize * 2)), "flower" + (i % 2));
			p.initialize();
			view.insertStatic(p);
		}
		// create rows of trees
		for (var i = 0; i < 32; i++)
		{
			p = new mapObject(i * 32 + 16, 64 * gridSize, "pinetree");
			p.initialize();
			view.insertStatic(p);

			p = new mapObject(i * 32, 62 * gridSize, "pinetree");
			p.initialize();
			view.insertStatic(p);
		}
	}
	else if (mapId == 1)
	{
		// create portal to the grass world
		portalList[0] = new Portal(8, 300, 20, 20, 0, 990, 300, "Left");
		// create portal to ice cave
		portalList[1] = new Portal(404, 510, 20, 20, 2, 64, 127, "Up");
		// create portal to dungeon
		portalList[2] = new Portal(604, 610, 20, 20, "da0", 64, 127, "Up");
		var p = new mapObject(portalList[0].x, portalList[0].y + 8, "grassportal");
		p.initialize();
		view.insertStatic(p);
	}
	else if (mapId == 2)
	{
		// create portal to the ice world
		portalList[1] = new Portal(64, 127, 20, 20, 1, 404, 510, "Down");

		// show a light at the entrance
		p = new mapObject(63, 128, "doorlight");
		p.initialize();
		view.insertStatic(p);
	}

	/* mapId <= 0 means private maps with no other users */
	else if (mapId == -1)
	{
		portalList[0] = new Portal(64, 127, 20, 20, 0, 278, 309, "Down");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		var e = new Entity(64, 32, "player", -1);
		e.id = "-1p1";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].cutsceneId = 0; 
		playerList[e.id].display_name = "Bob";
		playerList[e.id].addClothing("defaulthair");

		// show a light at the entrance
		p = new mapObject(63, 128, "doorlight");
		p.initialize();
		view.insertStatic(p);
	}

	else if (mapId == -2)
	{
		portalList[0] = new Portal(64, 127, 20, 20, 0, 486, 309, "Down");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		var e = new Entity(64, 32, "player", -2);
		e.id = "-2p1";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].cutsceneId = 2; 
		playerList[e.id].display_name = "Kraven";
		playerList[e.id].addClothing("defaulthair");

		// show a light at the entrance
		p = new mapObject(63, 128, "doorlight");
		p.initialize();
		view.insertStatic(p);
	}
	// first floor of castle
	else if (mapId == -3)
	{
		// create portal to grass world
		portalList[0] = new Portal(127, 192, 20, 20, 0, 136, 164, "Down");
		// create portal to floor 2
		portalList[1] = new Portal(32, 16, 16, 64, -4, 32, 176, "Up");
		portalList[2] = new Portal(224, 16, 16, 64, -4, 224, 176, "Up");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		var e = new Entity(128, 96, "player", -3);
		e.id = "-3king";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].cutsceneId = 5;  
		playerList[e.id].display_name = "King";
		playerList[e.id].addClothing("defaulthair");

		// show a light at the entrance
		p = new mapObject(127, 192, "doorlight");
		p.initialize();
		view.insertStatic(p);
	}
	// second floor of castle
	else if (mapId == -4)
	{
		// create portal to floor 1
		portalList[0] = new Portal(32, 192, 16, 64, -3, 32, 16, "Down");
		portalList[1] = new Portal(224, 192, 16, 64, -3, 224, 16, "Down");
		// create portal to mail room
		portalList[2] = new Portal(32, 16, 16, 16, -5, 63, 127, "Up");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		var e = new Entity(64, 32, "player", -4);
		e.id = "-4knight1";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].cutsceneId = 6;  
		playerList[e.id].display_name = "Arnold";
		playerList[e.id].addClothing("knighthelmet");
		// show a door to the mailroom
		p = new mapObject(32, 0, "castledoor");
		p.initialize();
		view.insertStatic(p);
	}
	// mail room in castle
	else if (mapId == -5)
	{
		// create portal to floor 2
		portalList[0] = new Portal(63, 127, 16, 16, -4, 32, 16, "Down");
		//x, y, height, width, destination_mapId, destination_x, destination_y, direction
		var e = new Entity(64, 32, "player", -4);
		e.id = "-5newton";
		playerList[e.id] = e; 
		playerList[e.id].targetType = "Passive"; 
		playerList[e.id].allyState = "Ally";
		playerList[e.id].cutsceneId = 7;  
		playerList[e.id].display_name = "Newton";
		playerList[e.id].addClothing("defaulthair");
		// show a light at the entrance
		p = new mapObject(63, 128, "doorlight");
		p.initialize();
		view.insertStatic(p);
	}
	// first floor of dungeon A
	else if (mapId == "da0")
	{
		// create portal to floor 2
		portalList[0] = new Portal(5 * gridSize + 8, 27 * gridSize, 16, 16, "da1", 64, 64, null);
	}
	// second floor of dungeon A
	else if (mapId == "da1")
	{
		// create portal to floor 2
		portalList[0] = new Portal(5 * gridSize + 8, 27 * gridSize, 16, 16, "da2", 64, 64, null);
	}

	frameTime = new Date().getTime(); // reset update frame timer
}

//load sprites
function loadSprite(spriteName, attacks)
{
	// load player movement sprites
	var a = [];
	var img;

	for (var i = 0; i < 4; i++)
	{
		var s = [];

		for (var j = 0; j < 4; j++)
		{
			img = new Image();
			img.src = "img//" + spriteName + getDirName(i) + j + ".png";
			s[j] = img;
		}

		a[i] = s;
	}

	playerSprite[spriteName] = a;

	// load player attack sprites
	playerAttackSprite[spriteName] = {};

	for (var k in attacks)
	{
		var a = [];

		for (var i = 0; i < 4; i++)
		{
			var s = [];
			var n = 3;

			if (attacks[k] == "Sword")
			{
				n = 4;
			}
			else if (spriteName == "iceboss")
			{
				n = 8;
			}

			for (var j = 0; j < n; j++)
			{
				img = new Image();
				if (spriteName == "iceboss")
				{
					img.src = "img//" + spriteName + "Attack" + getDirName(i) + j + ".png";
				}
				else
				{
					img.src = "img//" + spriteName + "Attack" + attacks[k] + getDirName(i) + j + ".png";
				}
				s[j] = img;
			}

			a[i] = s;
		}

		playerAttackSprite[spriteName][attacks[k]] = a;
	}
}

function loadWeapons()
{
	weaponSprite["Snowball"] = [];
	weaponSprite["Arrow"] = [];
	weaponSprite["Bow"] = [];
	weaponSprite["Sword"] = [];

	// loop through all 4 directions
	for (var j = 0; j < 4; j++)
	{
		// create the blank array for each weapon
		for (var i in weaponSprite)
		{
			weaponSprite[i][j] = [];
		}

		// load snowball sprites
		weaponSprite["Snowball"][j][0] = new Image();
		weaponSprite["Snowball"][j][0].src = "img//attackSnowball" + getDirName(j) + "0.png";
		weaponSprite["Snowball"][j][1] = new Image();
		weaponSprite["Snowball"][j][1].src = "img//attackSnowball" + getDirName(j) + "1.png";

		// load arrow sprites
		weaponSprite["Arrow"][j][0] = new Image();
		weaponSprite["Arrow"][j][0].src = "img//attackArrow" + getDirName(j) + "0.png";
		weaponSprite["Arrow"][j][1] = new Image();
		weaponSprite["Arrow"][j][1].src = "img//attackArrow" + getDirName(j) + "1.png";

		for (var k = 0; k < 3; k++)
		{
			// load bow sprites
			weaponSprite["Bow"][j][k] = new Image();
			weaponSprite["Bow"][j][k].src = "img//attackBow" + getDirName(j) + k + ".png";
		}

		// load sword sprites
		for (var k = 0; k < 4; k++)
		{
			weaponSprite["Sword"][j][k] = new Image();
			weaponSprite["Sword"][j][k].src = "img//attackSword" + getDirName(j) + k + ".png";
		}
	}

	// set sprite specific y-offsets, for images that need to be displayed below the entity
	weaponSprite["Arrow"][3][0].y_offset = 6;
	weaponSprite["Arrow"][3][1].y_offset = 3;
	weaponSprite["Sword"][0][3].y_offset = 7; //left attack last frame
	weaponSprite["Sword"][2][3].y_offset = 7; // right attack last frame
	weaponSprite["Sword"][3][2].y_offset = 10; // down attack second last frame
	weaponSprite["Sword"][3][3].y_offset = 11; // down attack last frame
}

// load clothing sprites
function loadClothing()
{
	clothingSprite["salesman"] = {};
	clothingSprite["defaulthair"] = {};
	clothingSprite["knighthelmet"] = {};

	for (var i in clothingSprite)
	{
		clothingSprite[i]["attack"] = {};
		clothingSprite[i]["attack"]["Punch"] = [];
		clothingSprite[i]["attack"]["Arrow"] = [];
		clothingSprite[i]["attack"]["Sword"] = [];
		clothingSprite[i]["movement"] = [];

		for (var j = 0; j < 4; j++)
		{
			clothingSprite[i]["movement"][j] = [];

			// if type == hat, only 2 movement frames are needed
			for (var k = 0; k < 2; k++)
			{
				clothingSprite[i]["movement"][j][k] = new Image();
				clothingSprite[i]["movement"][j][k].src = "img//" + i + getDirName(j) + (k % 2) + ".png";
			}
		}

		for (var attack in clothingSprite[i]["attack"])
		{
			for (var j = 0; j < 4; j++)
			{
				clothingSprite[i]["attack"][attack][j] = [];

				// if type == hat, only 2 movement frames are needed
				for (var k = 0; k < 2; k++)
				{
					clothingSprite[i]["attack"][attack][j][k] = new Image();
					clothingSprite[i]["attack"][attack][j][k].src = "img//" + i + getDirName(j) + (k % 2) + ".png";
				}
			}
		}
	}

	clothingSprite["defaulthair"]["attack"]["Arrow"][3][0].src = "img//defaulthairAttackDown0.png";
	clothingSprite["defaulthair"]["attack"]["Arrow"][3][1].src = "img//defaulthairAttackDown0.png";
}

var ucounter = 0;
var rcounter = 0;

// events triggered when a user re-opens the game window
window.addEventListener("focus", function()
{
	frameTime = new Date().getTime(); // ensures animations display properly
	keysDown = {}; 
}
);

// events triggered when a user leaves the game window (switches to another tab / focus' a different application)
window.addEventListener("blur", function()
{
	keysDown = {}; // player stops moving when game loses focus
}
);

var rfps = 0;
var ufps = 0;
var updateNearbyObjectsTimer = new Date().getTime(); 

function step()
{
	while (new Date().getTime() >= frameTime)
	{
		// update the list of nearby objects every second
		if (new Date().getTime() >= updateNearbyObjectsTimer)
		{
			updateNearbyObjects();
			updateNearbyObjectsTimer = new Date().getTime() + 500;
		}
		update();
		if (!(player.entity.mapId < 0))
		{
			socket.emit('movement', player.entity); //send new location to server
		}
		frameTime += 16.6;
		ucounter += 1;
		
	}

  	render();
	rcounter += 1;

	if (rcounter >= 100)
	{
		rfps = Math.round(rcounter / ((new Date().getTime() - startTime)/1000));
		ufps = Math.round(ucounter / ((new Date().getTime() - startTime)/1000));
		player.playTime += new Date().getTime() - startTime;
		startTime = new Date().getTime();
		ucounter = 0;
		rcounter = 0;
	}
	context.font = "10px sans-serif";
	context.fillStyle = "#000000";
	context.fillText("FPS: " + rfps,10,10);
	context.fillText("FPS: " + ufps,10,20);
	context.fillText("Ping: " + ping,10,30);
	context.fillText("Position: " + player.entity.x + "," + player.entity.y,10,40);
	context.fillText("XP: " + player.entity.xp + " / " + Math.ceil(Math.pow(player.entity.lvl, 10/4) * 5),10,50);
	setTimeout(step, 4);
}

function getUsername()
{
	var c = decodeURIComponent(document.cookie).split(';');

	// read username from a cookie
	if (c != null && c[0].substr(0,8) == "username" && c[0].length > 9)
	{
		return c[0].substr(9,c[0].length - 1);
	}

	// otherwise give them default name
	else
	{
		notificationList.push(new Notification("Default Controls","Press 2 for basic attack;Press 3 for ranged attack"));
		return "Player";
	}
}

// update the list of nearby entities once a second
function updateNearbyObjects()
{
	player.entity.nearbyObjects = [];

	for (var i in playerList)
	{
		if (Math.abs(playerList[i].x - player.entity.x) <= 120 && Math.abs(playerList[i].y - player.entity.y) <= 120)
		{
			player.entity.nearbyObjects.push({id: playerList[i].id, type: "player"});
		}
	}

	for (var j in mapObjects)
	{
		if (Math.min(Math.abs(mapObjects[j].x - (mapObjects[j].width / 2) - player.entity.x), Math.abs(player.entity.x - (mapObjects[j].x + (mapObjects[j].width / 2)))) <= 35 
			&& Math.min(Math.abs(mapObjects[j].y - mapObjects[j].depth - player.entity.y), Math.abs(player.entity.y - player.entity.depth - mapObjects[j].y)) <= 35)
		{
			player.entity.nearbyObjects.push({id: mapObjects[j].id, type: "mapObject"});
		}
	}
}

Entity.prototype.getNearbyObjects = function()
{
	var objectList = [];

	for (var i in this.nearbyObjects)
	{
		// retrieve players / CPUs
		if (this.nearbyObjects[i].type == "player") 
		{
			
			if (typeof(playerList[this.nearbyObjects[i].id]) !== 'undefined')
			{
				objectList.push(playerList[this.nearbyObjects[i].id]);
			}
			else
			{
				//delete player.entity.nearbyObjects[i];
			}
		}
		// retrieve mapObjects
		else if (this.nearbyObjects[i].type == "mapObject" && typeof(mapObjects[this.nearbyObjects[i].id]) !== 'undefined')
		{
			objectList.push(mapObjects[this.nearbyObjects[i].id]);
		}
	}

	return objectList;
}


// run the main functions that must be updated based on time events
// when the tab is inactive assume this function runs at 1 fps
var update = function()
{
	//restart background music at the end of the song
	if (audio.currentTime + (8/60) > audio.duration)
	{
		audio.currentTime = 0;

		if (audio.ended == true)
		{
			audio.play();
		}
	}

	if (cutscene != null)
	{
		cutscene.update();

		if (cutscene.isComplete())
		{
			// close whatever window the cutscene may have open
			if (cutscene.displayWindow != null)
			{
				openDisplayWindow(null);
			}

			cutscene = null;
			player.conversationCounter = 30;
			player.entity.targetType = "Neutral";
		}
	}
	// only update the player if they aren't in a conversation
	else
	{
		if (player.conversationCounter > 0)
		{
			player.conversationCounter--;
		}
		if (player.entity.current_health <= 0)
		{
			playerXP = player.entity.xp;
			socket.emit('death');
			respawn();
		}
		else
		{
			//update player object
			player.update();
		}

		// check if you are standing on a portal and need to switch maps
		if (player.portalCounter == 0)
		{
			for (var i in portalList)
			{
				if (portalList[i].collisionCheck(player.entity))
				{
					console.log("moving to map " + portalList[i].destination_mapId)
					// clear any map objects from the old map
					view.clear();
					player.entity.x = portalList[i].destination_x;
					player.entity.y = portalList[i].destination_y;
					player.entity.mapId = portalList[i].destination_mapId;
					player.entity.nearbyObjects = [];
					loadMap(portalList[i].destination_mapId);
					player.portalCounter = 30;
					//send new location to server even if traveling to private map
					socket.emit('movement', player.entity); 
					break;
				}
			}
		}
		else if (player.portalCounter > 0)
		{
			player.portalCounter--;
		}

		// check if any achievements have been completed
		for (var i in achievements)
		{
			if (achievements[i].isComplete() && typeof(completedAchievements[i]) === 'undefined')
			{
				notificationList.push(new Notification("Achievement Complete","You completed the achievement " + achievements[i].name))
				var r = achievements[i].reward;

				if (typeof(r) !== "undefined" && r != null)
				{
					if (typeof(r.xp) !== "undefined")
					{
						player.entity.addXP(r.xp);
					}
					if (typeof(r.items) !== "undefined")
					{
						for (var j in r.items)
						{
							player.inventory.addItem(r.items[j]);
						}
					}
				}

				completedAchievements[i] = true;
			}
		}

		// check if any quests have been completed
		for (var i in quests)
		{
			if (quests[i].isComplete())
			{
				notificationList.push(new Notification("Quest Complete","You completed the quest " + quests[i].name))
				var r = quests[i].reward;

				if (typeof(r) !== "undefined" && r != null)
				{
					if (typeof(r.xp) !== "undefined")
					{
						player.entity.addXP(r.xp);
					}
					if (typeof(r.items) !== "undefined")
					{
						for (var j in r.items)
						{
							player.inventory.addItem(r.items[j]);
						}
					}
				}

				completedQuests[i] = true;
				delete quests[i];
			}
		}

		// update current notifcation and check if it expired
		if (notificationList[0] != null)
		{
			notificationList[0].update();

			if (notificationList[0].counter <= 0 && cutscene == null) // only start new notifications outside of cutscenes
			{
				notificationList.splice(0,1);
			}
		}
	}

	// update flytext and remove any that expired
	var n = flyTextList.length;
	for (var i = 0; i < n; i++)
	{
		if (i == 0 || flyTextList[i].counter > flyTextList[i-1].counter + 30)
		{
			flyTextList[i].update();

			if (flyTextList[i].counter <= 0)
			{
				flyTextList.splice(i,1);
				i--;
				n--;
			}
		}
	}

	updateCounter++;

	// animated footprints in the snow
	if (updateCounter % 15 == 1)
	{
		// foot prints for other players and CPUs
		for (var i in playerList)
		{
			if ((player.entity.mapId == 1 || playerList[i].faction == "iceman") && (playerList[i].x_speed != 0 || playerList[i].y_speed != 0))
			{
				playerList[i].createFootPrint();
			}
		}

		// footprints for the user's player
		if (player.entity.mapId == 1 && (player.entity.x_speed != 0 || player.entity.y_speed != 0))
		{
			player.entity.createFootPrint();
		}
	}

	// update visual effects
	for (var i in effects)
	{
		effects[i].update();
		if (effects[i].counter <= 0)
		{
			effects.splice(i,1); // delete effect if it's animation has ended
		}
	}
};


//initialize the player
function Player(mapId)
{
	this.entity = new Entity(100,100,"player",mapId);
	this.entity.initialize();
	this.entity.allyState = "Player";
	this.entity.updateSprite();
	this.healthRegenCounter = 0;
	this.portalCounter = 0;
	this.conversationCounter = 0;
	this.entity.display_name = username;
	this.inventory = new Inventory();
	this.entity.attacks = [];
	this.entity.attacks.push(new Attack("Punch", [], this.entity.attack_speed));
	this.playTime = 0;
}

//display the player
Player.prototype.render = function()
{
  this.entity.render();
};

//display graphics
var render = function()
{
	// render mapObjects: rocks, snowmen, etc
	// render items
	// render projectiles
	view.render();

	if (cutscene != null)
	{
		cutscene.render();
	}

	for (var i in flyTextList)
	{
		if (flyTextList[i].counter < 100)
		{
			flyTextList[i].render();
		}
	}

	if (notificationList[0] != null)
	{
		notificationList[0].render();
	}

	renderMinimap();
};

// sort a list of entities by their y-position, so that they are overlap properly
function renderSort(array)
{
	var n = array.length;

	for (var i = 1; i < n; i++)
	{
		var e = array[i];
		var j = i - 1;

		while (j >= 0 && renderSortAux(array[j],e))
		{
			array[j + 1] = array[j];
			j -= 1;
		}

		array[j+1] = e;
	}
}

// check what order two entities should be drawn in
function renderSortAux(e1, e2)
{
	if (e1.y <= e2.y && e1.y > e2.y - Math.floor(e1.height * 0.8) && e1.z > e2.z) // if you're standing on top of them, you get drawn second
	{
		return true;
	}
	else if (e1.y > e2.y) // if you're standing in front of them, you get drawn second
	{
		return true;
	}
	else // otherwise, you're behind them and get drawn first
	{
		return false;
	}
}

// keep track of which keys are pressed
var keysDown = {};

//event listeners for the keyboard
window.addEventListener("keydown", function(event)
{
	keysDown[event.keyCode] = true;
}
);

window.addEventListener("keyup", function(event)
{
	delete keysDown[event.keyCode];
}
);

function openDisplayWindow(windowName)
{
	// user tries to close window
	if (windowName == null)
	{
		// check if the cutscene opened the window
		if (cutscene != null)
		{
			// cannot exit a conversation
			if (cutscene.displayWindow == "CutsceneOption")
			{
				console.log("cannot exit");
				return
			}

			// exit the buy / sell cutscene
			if (cutscene.displayWindow == "Buy" || cutscene.displayWindow == "Sell")
			{
				console.log("exit the buy / sell cutscene");
				cutscene = null;
			}
		}

		// close the window
		document.getElementById("formwindow").style.display = "none";
		view.displayWindow = null;
	}
	else
	{
		view.renderOptions(windowName);
	}
};

Player.prototype.update = function()
{
	// slowly regenerate health over time
	if (this.entity.current_health < this.entity.max_health)
	{
		this.healthRegenCounter ++;

		if (this.healthRegenCounter >= 300)
		{
			this.entity.current_health ++;
			this.healthRegenCounter = 0;
		}
	}

	/* move the player based on user input */
	var x_direction = 0;
	var y_direction = 0;

	// loops through every key currently pressed and performs an action
	if (!this.entity.knockback)
	{
		for(var key in keysDown)
		{
			var value = Number(key);

			if (value == attack_key)
			{
				if (this.entity.attack_counter <= 1)
				{this.entity.setAttack(0);}
			}
			else if (value == attack2_key)
			{
				if (this.entity.attack_counter <= 1 && typeof(this.entity.attacks[1]) !== 'undefined')
				{this.entity.setAttack(1);}
			}
			else if(value == left_key)
			{
				x_direction += -1;
			}
			else if (value == right_key)
			{
				x_direction += 1;
			}
			else if (value == up_key)
			{
				y_direction += -1;
			}
			else if (value == down_key)
			{
				y_direction += 1;
			}
			// enter key
			else if (value == 13)
			{
				// send a message in chat box if it's selected
				if (document.activeElement.nodeName == 'TEXTAREA' || document.activeElement.nodeName == 'INPUT') {
					var message = document.getElementById("chatInput").value.trim();
					if (message.length > 0)
					{
						socket.emit('chatSend', player.entity.display_name, player.entity.mapId, message);
					}
					document.getElementById("chatInput").value = "";
				}
				// proceed in cutscene
				else if (cutscene == null && player.conversationCounter <= 0)
				{
					initiateConversation();
				}

			}
		}
	}

	if (cutscene == null) // don't let the player move themselves during cutscenes
	{
		this.entity.move(x_direction, y_direction);
	}

	this.entity.update();
};

// holds information about projectiles on-screen
function InitializeProjectile(p)
{
	p.sprite = new Image();
	p.x = p.spawn_x;
	p.y = p.spawn_y;
	p.z = p.spawn_z;

	if (["Snowball", "meteor", "spikeball"].includes(p.spriteName))
	{
		p.sprite.src = "img//" + p.spriteName + ".png";
	}
	else
	{
		if (p.x_speed > 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Right.png";
		}
		else if (p.x_speed < 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Left.png";
		}
		else if (p.y_speed > 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Down.png";
		}
		else if (p.y_speed < 0)
		{
			p.sprite.src = "img//" + p.spriteName + "Up.png";
		}
	}
}

function flyText(x, y, s, colour)
{
	this.msg = s;
	this.colour = colour;
	this.counter = 100;
	this.x = x;
	this.y = y;

	this.update = function()
	{
		if (this.counter > 0)
		{
			this.counter--;
		}
	}

	this.render = function()
	{
		context.globalAlpha = this.counter / 100;
		context.font = "bold " + (4 * graphics_scaling) + "px sans-serif";

		// display a black outline of the text
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
		context.strokeText(this.msg,
			((this.x - x_offset) * graphics_scaling) - (context.measureText(this.msg).width/2),
			(this.y - y_offset - ((100-this.counter) / 10)) * graphics_scaling);

		// display the text in colour
		context.fillStyle = this.colour;
		context.fillText(this.msg,
			((this.x - x_offset) * graphics_scaling) - (context.measureText(this.msg).width/2),
			(this.y - y_offset - ((100-this.counter) / 10)) * graphics_scaling);
		context.globalAlpha = 1;
	}
}

function Notification(header, body)
{
	this.header = header;
	this.body = body.split(';');
	this.counter = 300;
	this.x = Math.ceil((width / graphics_scaling) / 2);
	this.y = Math.ceil(height / graphics_scaling);

	this.update = function()
	{
		if (this.counter > 240)
		{
			this.y -= 0.5;
		}
		else if (this.counter <= 60)
		{
			this.y += 0.5;
		}
		this.counter--;
	}

	this.render = function()
	{
		// display the header
		context.font = "bold " + 5 * graphics_scaling + "px sans-serif";
		context.fillStyle = "#FFFFFF";
		context.fillText(this.header,
			(this.x * graphics_scaling) - (context.measureText(this.header).width / 2),
			(this.y + 10) * graphics_scaling);

		// display the body
		context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
		for (var i in this.body)
		{
			context.fillText(this.body[i],
				(this.x * graphics_scaling) - (context.measureText(this.body[i]).width / 2),
				(this.y + 15 + (5 * i)) * graphics_scaling);
		}
	}
}

function initiateConversation()
{
	var collisionList = player.entity.getNearbyObjects();

	for (var i in collisionList)
	{
		console.log(collisionList[i]);
		// check that the entity is not fighting the player, and that they have a conversation
		if (collisionList[i].cutsceneId != null)// && cutscene == null) //make sure you can't be in multiple conversations
		{
			if (player.entity.direction == "Left"
				&& player.entity.y > collisionList[i].y - (collisionList[i].depth / 2)
				&& player.entity.y - (player.entity.depth / 2) < collisionList[i].y
				&& player.entity.x - (player.entity.width / 2) - 3 < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x)
			{
				collisionList[i].direction = "Right";
				cutscene = new Cutscene(collisionList[i].cutsceneId);
				player.entity.x_speed = 0;
				player.entity.y_speed = 0;
				player.entity.targetType = "Passive";
				break;
			}
			else if (player.entity.direction == "Right"				
				&& player.entity.y > collisionList[i].y - (collisionList[i].depth / 2)
				&& player.entity.y - (player.entity.depth / 2) < collisionList[i].y
				&& player.entity.x < collisionList[i].x
				&& player.entity.x + (player.entity.width / 2) + 3 > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Left";
				cutscene = new Cutscene(collisionList[i].cutsceneId);
				player.entity.x_speed = 0;
				player.entity.y_speed = 0;
				player.entity.targetType = "Passive";
				break;
			}
			else if (player.entity.direction == "Up" 
				&& player.entity.y - player.entity.depth - 3 < collisionList[i].y
				&& player.entity.y > collisionList[i].y
				&& player.entity.x < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Down";
				cutscene = new Cutscene(collisionList[i].cutsceneId);
				player.entity.x_speed = 0;
				player.entity.y_speed = 0;
				player.entity.targetType = "Passive";
				break;
			}
			else if (player.entity.direction == "Down"
				&& player.entity.y < collisionList[i].y
				&& player.entity.y + 3 > collisionList[i].y - collisionList[i].y 
				&& player.entity.x < collisionList[i].x + (collisionList[i].width / 2)
				&& player.entity.x > collisionList[i].x - (collisionList[i].width / 2))
			{
				collisionList[i].direction = "Up";
				cutscene = new Cutscene(collisionList[i].cutsceneId);
				player.entity.x_speed = 0;
				player.entity.y_speed = 0;
				player.entity.targetType = "Passive";
				break;
			}
		}
	}
}

function addQuest(id)
{
	if (typeof(completedQuests[id]) === 'undefined' && typeof(quests[id]) === 'undefined')
	{
		quests[id] = new Objective(id);
		notificationList.push(new Notification("Quest received!","You received the quest " + quests[id].name))
		view.updateDisplayWindow();
	}
	else
	{
		console.log("Already have quest " + id);
	}
}

// display the minimap
function renderMinimap()
{
	var x = width - (52 * graphics_scaling);
	var y = height - (52 * graphics_scaling);
	var m_x_offset = 0;
	var m_y_offset = 0;

	// get x-offset
	if (player.entity.x / minimapScale < 25 || maps[player.entity.mapId][0].length * gridSize / minimapScale <= 50)
	{
		m_x_offset = 0;
	}
	else if ((maps[player.entity.mapId][0].length * gridSize - player.entity.x) / minimapScale < 25)
	{
		m_x_offset = (maps[player.entity.mapId][0].length * gridSize / minimapScale) -50;
	}
	else
	{
		m_x_offset = (player.entity.x / minimapScale) - 25;
	}

	// get y-offset
	if (player.entity.y / minimapScale <= 25 || maps[player.entity.mapId].length * gridSize / minimapScale <= 50)
	{
		m_y_offset = 0;
	}
	else if ((maps[player.entity.mapId].length * gridSize - player.entity.y) / minimapScale <= 25)
	{
		m_y_offset = (maps[player.entity.mapId].length * gridSize / minimapScale) - 50;
	}
	else
	{
		m_y_offset = (player.entity.y / minimapScale) - 25;
	}

	// draw the minimap background
	context.globalAlpha = 0.7;
	context.fillStyle = "#C0C0C0";
	context.fillRect(x, y, 50 * graphics_scaling, 50 * graphics_scaling);

	// draw the NPCs
	for (var i in playerList)
	{
		// only draw if they are currently on the map
		if ((playerList[i].x / minimapScale) - m_x_offset - 1.5 >= -2 && (playerList[i].x / minimapScale) - m_x_offset + 1.5 <= 52
			&& (playerList[i].y / minimapScale) - m_y_offset - 1.5 >= -2 && (playerList[i].y / minimapScale) - m_y_offset + 1.5 <= 52)
		{
			playerList[i].setColour();
			context.beginPath();
			context.arc(
				x + (((playerList[i].x / minimapScale) - m_x_offset) * graphics_scaling),
				y + (((playerList[i].y  / minimapScale)  - m_y_offset - 1.5) * graphics_scaling),
				1.5 * graphics_scaling,
				0, Math.PI * 2, false);
			context.fill();
		}
	}

	// draw the player
	context.fillStyle = "#1E90FF";
	context.beginPath();
	context.arc(
		x + (((player.entity.x / minimapScale) - m_x_offset) * graphics_scaling),
		y + (((player.entity.y / minimapScale) - m_y_offset - 1.5) * graphics_scaling),
		1.5 * graphics_scaling,
		0, Math.PI * 2, false);
	context.fill();
	context.globalAlpha = 1;

	// draw the minimap outline
	context.drawImage(minimapbox, x - (2 * graphics_scaling), y - (2 * graphics_scaling), 54 * graphics_scaling, 54 * graphics_scaling);

	// draw the user's current money
	context.fillStyle = "#000000";
	context.font = "bold " + 4 * graphics_scaling + "px sans-serif";
	context.fillText(player.inventory.getItem("money").quantity,x + graphics_scaling + Math.ceil(itemSprite["moneyIcon"].width * graphics_scaling / 2), y - (3 * graphics_scaling));
	context.drawImage(itemSprite["moneyIcon"], x, y - ((3 + Math.ceil(itemSprite["moneyIcon"].height / 2 )) * graphics_scaling), Math.ceil(itemSprite["moneyIcon"].width * graphics_scaling / 2), Math.ceil(itemSprite["moneyIcon"].height * graphics_scaling / 2))
}

window.addEventListener("resize", setScreenSize);
//document.addEventListener("fullscreenchange", setScreenSize);

function useItem(itemName)
{
	if (player.inventory.getItem(itemName).quantity > 0)
	{
		if (itemName == "apple" || itemName == "carrot" || itemName == "leek" || itemName == "pear")
		{
			player.entity.current_health = Math.min(player.entity.max_health, player.entity.current_health + 10);
			player.inventory.removeItem({name: itemName, quantity: 1});
			flyTextList.push(new flyText(player.entity.x, player.entity.y - (player.entity.height * 1.5), "+10 health", "#00FF00"));
		}
		else if (itemName == "sword")
		{
			player.inventory.removeItem({name: itemName, quantity: 1});
			player.entity.attacks[0] = new Attack("Sword", [{name:"Sword",damage:1}], player.entity.attack_speed);
		}
		else if (itemName == "bow")
		{
			player.inventory.removeItem({name: itemName, quantity: 1});
			player.entity.attacks[1] = new Attack("Arrow", [{name:"Bow",damage:0},{name:"Arrow",damage:0}], player.entity.attack_speed);
		}
		else if (itemName == "knighthelmet")
		{
			player.inventory.removeItem({name: itemName, quantity: 1});
			player.entity.removeClothing("defaulthair");
			player.entity.addClothing(itemName);
		}
		else 
		{
			console.log("cannot use item " + itemName)
		}
	}
	else
	{
		console.log("failed to use item " + item.name);
	}
}

function sellItem(itemName) 
{
	// check that they have the item they want to sell
	if (itemName != "money" && player.inventory.getItem(itemName).quantity > 0)
	{
		// remove the item from their inventory and give them half of its dollar value
		player.inventory.removeItem({name: itemName, quantity: 1});
		player.inventory.addItem({name: "money", quantity: Math.ceil(itemDetail[itemName].price / 2)});
	}
	else
	{
		console.log("failed to sell item " + item.name);
	}
}

function buyItem(itemName) 
{
	if (itemName != "money" && player.inventory.getItem("money").quantity >= itemDetail[itemName].price)
	{
		player.inventory.addItem({name: itemName, quantity: 1});
		player.inventory.removeItem({name: "money", quantity: itemDetail[itemName].price});

		if (updateCounter % 3 == 0)
		{
			cutscene.text = "An " + itemName + ", excellent choice!";
		}
		else if (updateCounter % 3 == 1)
		{
			cutscene.text = "That was my finest " + itemName + ", take good care of it!";
		}
		else
		{
			cutscene.text = "I bet that " + itemName + " will come in handy!";
		}
	}
	else
	{
		if (updateCounter % 3 == 0)
		{
			cutscene.text = "You don't have enough money to buy that " + itemName + "!";
		}
		else if (updateCounter % 3 == 1)
		{
			cutscene.text = "Maybe you should try something more in your price range.";
		}
		else
		{
			cutscene.text = "Looks like you're a little short on cash there fella.";
		}
	}
}

function setScreenSize(event)
{
	width = window.innerWidth;
	height = window.innerHeight;
	canvas.width = width;
	canvas.height = height;
	context = canvas.getContext('2d');
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;
	graphics_scaling = Math.ceil(Math.min(height,width)/250);

	// hide the chat window if the screen is really small
	if (graphics_scaling == 1)
	{
		document.getElementById('chatWindow').style.display = "none";
	}
	// otherwise format the chat window
	else
	{
		document.getElementById('chatWindow').style.display = ""
		document.getElementById('chatWindow').style.width = 54 * graphics_scaling + "px";
		document.getElementById('chatWindow').style.height = 54 * graphics_scaling + "px";
		document.getElementById('chatWindow').style.fontSize = 2 + (4 * graphics_scaling) + "px";
		document.getElementById('chatInput').style.fontSize = 2 + (4 * graphics_scaling) + "px";
	}
};

function playSoundEffect(path)
{
	var i = 0;
	while (i < soundEffect.length && !soundEffect[i].ended)
	{
		i++;
	}
	if (i < soundEffect.length)
	{
		soundEffect[i] = new Audio("audio//" + path);
		
	}
	else
	{
		soundEffect.push(new Audio("audio//" + path));
	}
	
	soundEffect[i].addEventListener('loadeddata', () => {
		soundEffect[i].play();
	});
}

// play background music
function playMusic(path)
{
	// pause any music that may already be playing
	if (typeof(audio) !== 'undefined')
	{
		audio.pause()
	}
	audio = new Audio("audio//" + path);
	audio.addEventListener('loadeddata', () => {
		audio.play();
	})
}

socket.on('mapObjects', function(a)
{
	if (!(player.entity.mapId < 0))
	{
		mapObjects = {};

		for (var i in a)
		{
			var p = new mapObject(a[i].x, a[i].y, a[i].spriteName, a[i].cutsceneId);
			p.initialize();
			mapObjects[p.id] = p;
			view.insertStatic(p);
		}
	}

	updateNearbyObjects();
});

var Effect = function(spriteName, x, y, counter)
{
	this.spriteName = spriteName;
	this.x = x;
	this.y = y;
	this.z = 0;
	this.totalCounter = counter;
	this.counter = counter;
	this.height;
	this.width;
	this.alpha = 1;
	this.sprite = new Image();
	/*this.sprite.onload = function()
	{
		this.width = this.sprite.width;
		this.height = this.sprite.height / 2;
	}*/
	this.sprite.src = "img//" + this.spriteName + ".png";
};

Effect.prototype.update = function()
{
	this.counter--;
	this.alpha = this.counter * 1.000 / this.totalCounter;
};

socket.on('createEffect', function(spriteName, x, y, counter, mapId)
{
	if (mapId == player.entity.mapId)
	{
		var e = new Effect(spriteName, x, y, counter);
		effects.push(e);

		if (spriteName == "groundcrack")
		{
			playSoundEffect("slam.mp3");
		}
	}
});

// update position of other players from the server
socket.on('players', function(players)
{	
	var needUpdate = false;

	// the index's in players is the ID of the player
	for (var i in players)
	{
		// make sure the player is on the correct map
		if (players[i].mapId != player.entity.mapId)
		{
			console.log("Error: player on wrong map " + players[i].display_name + " with ID " + i)
			break;
		}
		else if (cutscene == null || players[i].cutsceneId != cutscene.cutsceneId)
		{
			// when adding a new player, the list of nearby objects must be updated
			if (typeof(playerList[i]) === 'undefined')
			{
				needUpdate = true;
			}

			// keep all the attributes of the player 
			// and add the Entity functions, like render()
			players[i].__proto__ = Entity.prototype;
			playerList[i] = players[i];
		}
		else
		{
			// the CPU is in a cutscene and should stop moving and face the player
			playerList[i].x_speed = 0;
			playerList[i].y_speed = 0;
			socket.emit('freezeEntity', players[i].id, players[i].mapId, playerList[i].x, playerList[i].y, playerList[i].direction);
		}
	}
	// update the list of nearby objects when a new player appears on the map
	// since they could already be very close
	if (needUpdate == true)
	{
		updateNearbyObjects();
	}
});

// remove a player from the map
socket.on('removePlayer', function(id)
{
	delete playerList[id];
});

// server notifies that the player has taken damage
socket.on('damageIn', function(x, y, damage, knockback)
{
	player.entity.takeDamage(x, y, damage, knockback);
	player.healthRegenCounter = 0;
});

// server notifies that the player has gained xp
socket.on('xpgain', function(xp, entity)
{
	for (var i in achievements)
	{
		achievements[i].enemyDefeated(entity);
	}
	for (var i in quests)
	{
		quests[i].enemyDefeated(entity);
	}
	player.entity.addXP(xp);
});

socket.on('itemreceived', function(item)
{
	player.inventory.addItem(item);
});

// server sends all the projectiles currently on screen
socket.on('viewOnly', function(p, items)
{
	if (!(player.entity.mapId < 0))
	{
		var array = [];

		for (var i in p)
		{
			InitializeProjectile(p[i]);
			array.push(p[i]);
		}

		for (var i in items)
		{
			items[i].sprite = new Image();
			items[i].sprite.src = "img//" + items[i].name + ".png";
			array.push(items[i]);
		}

		view.insertDynamic(array);
	}
});

socket.on('chatRecieve', function(username, message, pClass)
{
	var p = document.createElement("p");
	var b = document.createElement("b");
	var textNode = document.createTextNode(`${username}: `);
	b.appendChild(textNode);
	p.appendChild(b);
	textNode = document.createTextNode(message);
	p.appendChild(textNode);

	if (pClass != null)
	{
		p.className = pClass;
	}

	var chatDiv = document.getElementById("chatView");
	chatDiv.appendChild(p);
});

socket.on('load', function(savedata)
	{
		loadPlayer(savedata);
	});

function loadPlayer(savedata)
{
	for (var i = 0; i < achievementCount; i++)
	{
		achievements[i] = new Objective(i);
	}

	if (savedata == "false")
	{
		console.log("no load data received");
		player = new Player(defaultmapId);
		player.entity.addClothing("defaulthair");
	}
	else
	{
		var data = JSON.parse(savedata);
		if (data.mapId == 2)
		{
			player = new Player(1);
		}
		else
		{
			player = new Player(data.mapId);
		}
		player.inventory.loadInventory(data.items);
		player.entity.setLevel(data.lvl);
		player.entity.xp = data.xp;
		player.entity.current_health = data.current_health;
		player.playTime = data.playTime;
		for (var i in data.attacks)
		{
			player.entity.attacks[i] = new Attack(data.attacks[i].name, data.attacks[i].weapons, player.entity.attack_speed);
		}
		for (var i in data.clothing)
		{	
			player.entity.addClothing(data.clothing[i].name);
		}
		quests = loadObjective(data.quests);
		completedQuests = data.completedQuests;
		for (var i in data.achievements)
		{
			achievements[i].tracker = data.achievements[i].tracker;
		}
		completedAchievements = data.completedAchievements;
	}

	if (username != "Player")
	{
				// save your data every 5 seconds
		setInterval(function()
		{
			var s = 
				"{" + 
				"\"mapId\": \"" + player.entity.mapId + "\", " + 
				"\"items\": " + JSON.stringify(player.inventory.items) + "," + 
				"\"xp\": " + player.entity.xp + "," +
				"\"lvl\": " + player.entity.lvl + "," +
				"\"current_health\": " + player.entity.current_health + "," +
				"\"quests\": " + JSON.stringify(quests) + "," + 
				"\"completedQuests\": " + JSON.stringify(completedQuests) + "," + 
				"\"achievements\": " + JSON.stringify(achievements) + "," + 
				"\"playTime\": " + player.playTime + "," +
				"\"completedAchievements\": " + JSON.stringify(completedAchievements) + "," +
				"\"attacks\": " + JSON.stringify(player.entity.attacks) + "," +
				"\"clothing\": " + JSON.stringify(player.entity.clothing) + 
				"}";
			socket.emit('save',player.entity.display_name,s);
		}, 5000);
	}

	loadMap(player.entity.mapId);
	
	frameTime = new Date().getTime();
	startTime = frameTime;
	step();
};

function loadObjective(data)
{
	var objectives = {};

	for (var i in data)
	{
		objectives[i] = new Objective(i);
		objectives[i].tracker = data[i].tracker;
	}

	return objectives;
}

// check current ping
socket.on('ping', function(serverTime)
{
	ping = new Date().getTime() - serverTime;
});

var leaderboards;

// recieve updated leaderboards from the server
socket.on('leaderboards', function(l)
{
	leaderboards = l;
	view.updateDisplayWindow();
});
