(function(exports)
{
    exports.HordeManager = function(startLevel, waveLimit)
    {
        this.initialLevel = startLevel;
        this.waveSize;
        this.waveTime = 10000;
        this.startTime;
        // currently unused
        this.waveLimit = waveLimit;
        this.currentWave;
        this.spawnLevels;

        this.Initialize();
    };

    exports.HordeManager.prototype.CheckSpawn = function()
    {
        // if the specified amount of time has passed since the last wave started
        if (new Date().getTime() - this.startTime >= this.waveTime)
        {
            // determine the amount of "points" to invest in strengthening the next wave
            var points = Math.ceil((this.currentWave + this.initialLevel) / 2);
            var minLevel = 99;
            for (var i in this.spawnLevels)
            {
                if (this.spawnLevels[i] < minLevel)
                {
                    minLevel = this.spawnLevels[i];
                }
            }
            if (minLevel <= points && minLevel > this.spawnLevels.length)
            {
                this.spawnLevels.push(minLevel);
                points -= minLevel;
            }

            var i = 0;
            while (points > 0)
            {
                // increase the level
                this.spawnLevels[0]++;
                points--;
                // move the item to the back of the array
                this.spawnLevels.push(this.spawnLevels[0]);
                this.spawnLevels.shift();
            }

            // reset the timer
            this.startTime = new Date().getTime();
            this.currentWave += 1;

            return this.spawnLevels;
        }
        // no enough time has passed since last wave, so spawn nothing
        else
        {
            return [];
        }
    }

    // sets up the first wave
    // also resets if a challenge was in progress but all the players left
    exports.HordeManager.prototype.Initialize = function()
    {
        this.waveSize = 2;
        this.spawnLevels = [];
        this.startTime = 0;
        this.currentWave = 1;

        for (var i = 0; i < this.waveSize; i++)
        {
            this.spawnLevels.push(this.initialLevel);
        }
    }
}(typeof exports === 'undefined' ? this.shareAttack = {} : exports));