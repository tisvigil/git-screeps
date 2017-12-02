'use strict';
require ('operation.mining.globals');
require ('operation.mining.source');
require ('operation.mining.mineral');

var miningOperation = 
{

    run: function()
    {
        //get a list of all flags with 'mine' in name
        let mineFlagsList;
        mineFlagsList = flagSearch('mine');

        if(mineFlagsList.length > 0) //if there are any miner flags in Game
        {
            for(let fl = 0; fl < mineFlagsList.length; fl++) //for every miner flag
            {   
                let thisFlag = mineFlagsList[fl];
                let thisFlagName = mineFlagsList[fl].name;
                let thisRoomName = mineFlagsList[fl].pos.roomName;
                
                //if room is not visible, scout
                if(Game.rooms[thisRoomName] == undefined)
                {
                    //search all scouts, see if room appears in any of them
                    let scouts = _.filter(temp.creeps.scout, c => c.memory.roomToScout != undefined && c.memory.roomToScout == thisRoomName);
                    
                    if(scouts == undefined || scouts.length < 1)
                    {
                        //spawn scout
                        if(thisFlag.memory.spawnRoom)
                        {
                            spawnCreep(Game.rooms[thisFlag.memory.spawnRoom], 50, [MOVE],
                            {mineFlagTarget: thisFlag.name, role: 'scout', roomToScout: thisRoomName, defendFlag: thisFlagName});
                        }
                        
                        else
                        {
                            spawnCreep(Game.rooms[global.closestSpawner(thisFlag.pos).pos.roomName], 50, [MOVE],
                            {mineFlagTarget: thisFlag.name, role: 'scout', roomToScout: thisRoomName, defendFlag: thisFlagName});
                        }
                    }
                }
                
                //basic setup
                if((thisFlag.memory.setupComplete == undefined || !thisFlag.memory.setupComplete) && thisFlag.room != undefined)
                {
                    setMineFlagModeAndHarvestTarget(thisFlagName);
                    setMineSourceRoom(thisFlagName);
                    setMineDropRoom(thisFlagName);
                    calculateMineFlagPathingInfo(thisFlagName);
                    
                    thisFlag.memory.setupComplete = true;
                }
                
                if(thisFlag.memory.mode == 'source')
                {
                    runSourceMiningOperation(thisFlagName);
                }
                
                else if(thisFlag.memory.mode == 'mineral')
                {
                    runMineralMiningOperation(thisFlagName);
                }
            }
        }
	}
};

module.exports = miningOperation;