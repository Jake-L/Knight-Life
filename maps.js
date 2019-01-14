(function(exports)
{

    function generateDungeon(mapId, options)
    {
        for (var i = 0; i < maps["da0"].length; i++)
        {
            maps["da0"][0][i] = "rockWallMid";
            maps["da0"][31][i] = "rockWallMid";
            maps["da0"][i][0] = "rockWallMid";
            maps["da0"][i][31] = "rockWallMid";
        }

        // create the rock walls
        for (var i = 1; i < maps["da0"][0].length - 1; i++)
        {
            // the rock wall at the top and bottom of the screen
            maps["da0"][1][i] = "rockWallBot";
            maps["da0"][30][i] = "rockWallTop";
        }

        for (var i = 2; i < maps["da0"].length - 2; i++)
        {
            // the rock wall at the left and right of the screen
            maps["da0"][i][1] = "rockWallRight";
            maps["da0"][i][30] = "rockWallLeft";
        }
    
        if (options.includes(1))
        {
            // create a horizontal wall from the right
            for (var i = 10; i < maps[mapId].length - 1; i++)
            {
                maps[mapId][10][i] = "rockWallTop";
                maps[mapId][11][i] = "rockWallMid";
                maps[mapId][12][i] = "rockWallBot";
            }

            maps[mapId][10][9] = "rockWallLeft";
            maps[mapId][11][9] = "rockWallLeft";
            maps[mapId][12][9] = "rockWallLeft";
        }
        if (options.includes(2))
        {
            // create a L shaped wall from the left
            for (var i = 1; i < 20; i++)
            {
                maps[mapId][20][i] = "rockWallTop";
                maps[mapId][21][i] = "rockWallMid";
                maps[mapId][22][i] = "rockWallBot";
            }

            for (var i = 15; i < 20; i++)
            {
                maps[mapId][i][17] = "rockWallLeft";
                maps[mapId][i][18] = "rockWallMid";
                maps[mapId][i][19] = "rockWallRight";
            }

            // the right part where the L angles upward
            maps[mapId][20][18] = "rockWallMid";
            maps[mapId][20][19] = "rockWallRight";
            maps[mapId][21][19] = "rockWallRight";
            maps[mapId][22][19] = "rockWallRight";

            // the highest point of the L
            maps[mapId][15][18] = "rockWallTop";
        }
    }

    maps = {};
    maps[0] = new Array(64);
    maps[1] = new Array(64);
    maps[2] = new Array(8);
    maps[-1] = new Array(8);
    maps[-2] = new Array(8);
    maps[-3] = new Array(12);
    maps[-4] = new Array(12);
    maps[-5] = new Array(8);
    maps["da0"] = new Array(32);
    
    for (var i = 0; i < 64; i++)
    {
        row = new Array(64).fill("grass1");
        maps[0][i] = row;
    }

    for (var i = 10; i < 23; i++)
    {
        maps[0][i][10] = "dirtPathLeft";
        maps[0][i][11] = "dirtPathMid";
        maps[0][i][12] = "dirtPathRight";
    }

    for (var i = 11; i < 23; i++)
    {
        maps[0][20][i] = "dirtPathTop";
        maps[0][21][i] = "dirtPathMid";
        maps[0][22][i] = "dirtPathBot";
    }

    maps[0][20][11] = "dirtPathMid";
    maps[0][20][12] = "dirtPathTopRightInner";
    maps[0][22][10] = "dirtPathBotLeftOuter";

    row = new Array(64).fill("grass1top");
    maps[0][2] = row;

    row = new Array(64).fill("snow1");
    maps[1].fill(row);

    row = new Array(64).fill("snow1top");
    maps[1][2] = (row);

    row = new Array(8).fill("snow1");
    maps[2].fill(row);

    row = new Array(8).fill("loghouseinside");
    maps[-1].fill(row);
    maps[-2].fill(row);

    
    for (var i = 0; i < 4; i++)
    {
        maps[-3][i] = row;
    }

    // create castle
    // stairs for first floor
    row = new Array(16);
    row[0] = "stairsleft";
    row[1] = "stairs";
    row[2] = "stairs";
    row[3] = "stairsright";   
    row[12] = "stairsleft";
    row[13] = "stairs";
    row[14] = "stairs";
    row[15] = "stairsright";  
    for (var i = 0; i < 4; i++)
    {
        maps[-3][i] = row;
    }
    // stairs for second floor
    row = new Array(16);
    row[0] = "stairsdownleft";
    row[1] = "stairsdown";
    row[2] = "stairsdown";
    row[3] = "stairsdownright";   
    row[12] = "stairsdownleft";
    row[13] = "stairsdown";
    row[14] = "stairsdown";
    row[15] = "stairsdownright";  
    for (var i = 8; i < 12; i++)
    {
        maps[-4][i] = row;
    }
    row = new Array(16).fill("cobblestonefloor");
    for (var i = 4; i < 8; i++)
    {
        maps[-3][i] = row;
        maps[-4][i-4] = row;
        maps[-4][i] = row;
    }
    row = new Array(16).fill("cobblestonefloor", 4, 12);
    for (var i = 8; i < 12; i++)
    {
        maps[-3][i] = row;
    }

    // create mail room of castle
    row = new Array(8).fill("cobblestonefloor");
    maps[-5].fill(row);
    
    // push empty rows for the sky at the top of the map
    row = new Array(64);
    maps[0][0] = row;
    maps[0][1] = row
    maps[1][0] = row;
    maps[1][1] = row;

    //create the first dungeon
    for (var i = 0; i < 32; i++)
    {
        row = new Array(32).fill("dirtground");
        maps["da0"][i] = row;
    }

    generateDungeon("da0", [1,2,3]);
    maps["da0"][26][5] = "dungeonstairs";

    exports.maps = maps;
    exports.gridSize = 16;
}(typeof exports === 'undefined' ? this.shareMap = {} : exports));