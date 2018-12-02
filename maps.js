(function(exports)
{
    maps = {};
    maps[0] = new Array(64);
    maps[1] = new Array(64);
    maps[2] = new Array(8);
    maps[-1] = new Array(8);
    maps[-2] = new Array(8);
    maps[-3] = new Array(12);
    maps[-4] = new Array(12);
    
    row = new Array(64).fill("grass1");
    maps[0].fill(row);

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
    
    // push empty rows for the sky at the top of the map
    row = new Array(64);
    maps[0][0] = row;
    maps[0][1] = row
    maps[1][0] = row;
    maps[1][1] = row;


    exports.maps = maps;
    exports.gridSize = 16;
}(typeof exports === 'undefined' ? this.shareMap = {} : exports));