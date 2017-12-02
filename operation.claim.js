'use strict';
require ('operation.mining.globals');

var worker = require('role.worker');

var claimOperation = 
{

    run: function()
    {
        let TARGET_CLAIM_BUILDER_NUMBER = 3
        
        //get a list of all creeps doing claiming, store for later
        let claimBots = temp.creeps.claimer;
        
        //get a list of all flags with 'claim' in name
        let claimFlagsList = flagSearch('claim');
        if(claimFlagsList.length > 0)
        {

            for(let fl = 0; fl < claimFlagsList.length; fl++)
            {
                setMineSourceRoom(claimFlagsList[fl].name);
                
                let roomSafety = getRoomSafety(claimFlagsList[fl].pos.roomName);
                if(roomSafety == 'visible safe')
                {
                    let spawnClaimBot = true;
                    //let spawnClaimBot = false;
                    
                    //if a claimbot already exists, don't spawn another
                    if(claimBots != undefined)
                    {
                        for(let b = 0; b < claimBots.length; b++)
                        {
                            if(claimBots[b].memory.targetClaimFlag == claimFlagsList[fl].name)
                            {
                                spawnClaimBot = false;
                            }
                        }
                    }
                    //if room has no controller, don't spawn another
                    if(Game.rooms[claimFlagsList[fl].pos.roomName] != undefined && Game.rooms[claimFlagsList[fl].pos.roomName].controller == undefined)
                    {
                        spawnClaimBot = false;
                    }
                    
                    //if room is mine already, don't spawn another
                    if(Game.rooms[claimFlagsList[fl].pos.roomName] != undefined && Game.rooms[claimFlagsList[fl].pos.roomName].controller != undefined && Game.rooms[claimFlagsList[fl].pos.roomName].controller.my)
                    {
                        spawnClaimBot = false;
                    }

                    //spawn or not to spawn?
                    if(spawnClaimBot)
                    {
                        spawnCreep(Game.rooms[claimFlagsList[fl].memory.spawnRoom], creepCost([MOVE,CLAIM]),[MOVE,CLAIM], {targetClaimFlag: claimFlagsList[fl].name, role: 'claimer', mode: 'claim'});
                    }
                    
                    let claimBuilders = _.filter(temp.creeps.remoteWorker, c => 
                        c.memory.targetRoom != undefined && 
                        c.memory.targetRoom == claimFlagsList[fl].pos.roomName);
                    
                    //then spawn builder creeps
                    if(claimBuilders.length < TARGET_CLAIM_BUILDER_NUMBER)
                    {
                        if(claimFlagsList[fl].memory.spawnRoom == undefined)
                        {
                            claimFlagsList[fl].memory.spawnRoom = closestSpawner(claimFlagsList[fl].pos).room;
                        }
                        
                        spawnCreep(Game.rooms[claimFlagsList[fl].memory.spawnRoom], 0, [MOVE,WORK,CARRY], {role: 'remoteWorker', mode: 'spend', targetRoom: claimFlagsList[fl].pos.roomName,
                        canMine:true, 
                        canPickupEnergy:true, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:true,
                        canRefuel:true,
                        canRepair:false,
                        canBuild:true,
                        canUpgrade:true,
                        canDepositEnergy:false,
                        canDepositMinerals:false});
                    }
                    
                    //if we own the area, place spawn site
                    let theRoom = Game.rooms[claimFlagsList[fl].pos.roomName]
                    if(theRoom != undefined && theRoom.controller != undefined && theRoom.controller.my)
                    {
                        let mySpawns = _.filter(theRoom.cacheFind(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_SPAWN);
                        if(mySpawns == undefined || mySpawns.length == 0)
                        {
                            //find flag with spawn in name
                            let siteFlags =_.filter(Game.flags, f => f.pos.roomName == claimFlagsList[fl].pos.roomName && f.name.search('spawn') != -1)
                            
                            if(siteFlags != undefined && siteFlags.length > 0)
                            {
                                theRoom.createConstructionSite(siteFlags[0].pos,STRUCTURE_SPAWN);
                            }
                        }
                    }
                }
                
                else if(roomSafety == 'not visible')
                {
                    //search all scouts, see if room appears in any of them
                    let scouts = _.filter(temp.creeps.scout, c => c.memory.roomToScout != undefined && c.memory.roomToScout == claimFlagsList[fl].pos.roomName);
                    
                    if(scouts == undefined || scouts.length < 1)
                    {
                        //spawn scout
                        spawnCreep(Game.rooms[claimFlagsList[fl].memory.spawnRoom], 50, [MOVE],
                        {role: 'scout', roomToScout: claimFlagsList[fl].pos.roomName});
                    }
                }
            }
        }
        
        //RESERVE BOTS =========================================================
        //get a list of all flags with 'reserve' in name
        claimFlagsList = flagSearch('reserve');
        if(claimFlagsList.length > 0)
        {
            for(let fl = 0; fl < claimFlagsList.length; fl++)
            {
                let roomSafety = getRoomSafety(claimFlagsList[fl].pos.roomName);
                if(roomSafety == 'visible safe')
                {
                    let spawnClaimBot = true;
                    let claimParts = 0;
                    
                    //if a claimbot already exists, don't spawn another
                    if(claimBots != undefined)
                    
                    {
                        for(let b = 0; b < claimBots.length; b++)
                        {
                            if(claimBots[b].memory.targetClaimFlag == claimFlagsList[fl].name)
                            {
                                claimParts += claimBots[b].getActiveBodyparts(CLAIM);
                            }
                        }
                    }
                    
                    if(claimParts >= 2)
                    {
                        spawnClaimBot = false;
                    }
                    
                    //figure out timer from flags
                    if(claimFlagsList[fl].memory.decayTimer != undefined && claimFlagsList[fl].memory.decayTimer > 0)
                    {
                        //DECREMENT CLAIM TIMER
                        claimFlagsList[fl].memory.decayTimer--;
                        
                        //if timer is above 2000, don't spawn one
                        if(claimFlagsList[fl].memory.decayTimer > 2000)
                        {
                            spawnClaimBot = false;
                        }
                    }
                    
                    //spawn or not to spawn?
                    if(spawnClaimBot)
                    {
                        if(claimFlagsList[fl].memory.spawnRoom == undefined)
                        {
                            claimFlagsList[fl].memory.spawnRoom = closestSpawner(claimFlagsList[fl].pos).room.name
                        }
                        
                        spawnCreep(Game.rooms[claimFlagsList[fl].memory.spawnRoom], 4550,[MOVE,CLAIM], {targetClaimFlag: claimFlagsList[fl].name, role: 'claimer', mode: 'reserve'});
                    }
                }
                
                else if(roomSafety == 'not visible')
                {
                    //search all scouts, see if room appears in any of them
                    let scouts = _.filter(temp.creeps.scout, c => c.memory.roomToScout != undefined && c.memory.roomToScout == claimFlagsList[fl].pos.roomName);
                    
                    if((scouts == undefined || scouts.length < 1) && claimFlagsList[fl].memory.spawnRoom)
                    {
                        //spawn scout
                        spawnCreep(Game.rooms[claimFlagsList[fl].memory.spawnRoom], 50, [MOVE],
                        {role: 'scout', roomToScout: claimFlagsList[fl].pos.roomName});
                    }
                }
            }
        }
	}
};

module.exports = claimOperation;