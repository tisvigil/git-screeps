
global.runSourceMiningOperation = function(fl)
{
    let theFlag = Game.flags[fl];
    let thisFlagName = theFlag.name;
    let thisRoomName = theFlag.pos.roomName;
    
    //mine flag timers
    incrementMinerSpawnTimer(thisFlagName);
    
    //room status: visible safe, visible unsafe, not visible
    let roomStatus = getRoomSafety(thisRoomName);
    
    if(roomStatus == 'visible unsafe' && !Game.rooms[thisRoomName].controller.my && Game.rooms[theFlag.memory.spawnRoom].controller.level >= 3)
    {
        //search all defenders, see if room appears in any of them
        let defenders = _.filter(temp.creeps.defender, c => c.memory.roomToDefend != undefined && c.memory.roomToDefend == thisRoomName);
        
        if(defenders == undefined || defenders.length < 1)
        {
            //spawn defender
            spawnCreep(Game.rooms[theFlag.memory.spawnRoom], creepCost(DEFENDER_BODY), DEFENDER_BODY,
            {mineFlagTarget: theFlag.name, role: 'defender', roomToDefend: thisRoomName, defendFlag: thisFlagName, nextWaypoint:'defend'});
        }
    }
    
    if(roomStatus == 'visible safe' || (Game.rooms[thisRoomName] != undefined && Game.rooms[thisRoomName].controller.my))
    {
        //look at every creep to determine which ones are attached to the flag, if none, spawn
        let spawnMiner = false;
        let spawnTransport = false;

        if(_.filter(temp.creeps.mineBot, c => c.memory.mineFlagTarget != undefined && c.memory.mineFlagTarget == thisFlagName).length == 0)
        {
            spawnMiner = true;
        }
        
        let transporterCollection = _.filter(temp.creeps.mineTransport, c => c.memory.mineFlagTarget != undefined && c.memory.mineFlagTarget == thisFlagName);
        
        //if miner bots are not there, or about to die, spawn them
            //flag logic: keep track of number of ticks since last spawn, spawn one preemptively (CREEP_LIFE_TIME)
        if(theFlag.memory.ticksSinceLastMinerSpawn >= theFlag.memory.ticksToLiveOnArrival)
        {
            spawnMiner = true;
        }
        
        let totalTransportMovePieces = 0;
        
        //figure out how many total transporter pieces there are.  
        if(transporterCollection.length > 0)
        {
            totalTransportMovePieces = _.sum(transporterCollection, t =>
            {
            	return _.filter(t.body, p => p.type === CARRY).length;
            });
        }
        
        // if less than the actual, spawn another transporter with the difference
        if(totalTransportMovePieces + theFlag.room.controller.level < theFlag.memory.carryPartTarget)
        {
            spawnTransport = true;
        }
    
       
        if(spawnMiner)
        {
            //calcualte the number of work nodes based on size of source
                //if you can't see the room and have just a location, spawn default
                //2 per tick per WORK
                //1500 unreserved, 3000 reserved, 4000 center (per 300 ticks)
            let bod = [];    
            let countWorkParts = 5;
            let sourceEnergyMax;
                
            let flagRoom = theFlag.room
                //if you have access to the flag's room, you can see what is inside and determine the best number of work parts
            if(flagRoom != undefined)
            {
                sourceEnergyMax = flagRoom.lookForAt(LOOK_SOURCES,theFlag.pos)[0].energyCapacity;
                countWorkParts = Math.ceil(sourceEnergyMax/300/2);
            }
            
            let countMoveParts = Math.ceil(countWorkParts/2);
            
            while(countMoveParts > 0 || countWorkParts > 0)
            {
                if(countMoveParts > 0)
                {
                    bod.push(MOVE);
                    countMoveParts --;
                }
                
                if(countWorkParts > 0)
                {
                    bod.push(WORK);
                    countWorkParts --;
                }
                
                if(countWorkParts > 0)
                {
                    bod.push(WORK);
                    countWorkParts --;
                }
            }

            //add a carry part if linked
            if(theFlag.memory.linked != undefined && theFlag.memory.linked)
            {
                bod.push(MOVE);
                bod.push(CARRY);
            }
            
            //spawn
            if(spawnCreep(Game.rooms[theFlag.memory.spawnRoom], creepCost(bod), bod, 
            {mineFlagTarget: theFlag.name, role: 'mineBot', targetRoom: theFlag.memory.tarRoom, targetX: theFlag.memory.tarX, targetY: theFlag.memory.tarY, firstArrival: true}) != undefined)
            {
                theFlag.memory.ticksSinceLastMinerSpawn = 0;
            }
        }
        
        if(spawnTransport && !spawnMiner)
        {
            //get the carry part target.  if undefined, assume something small (5)
            let partsTarget = 5;
            if(theFlag.memory.carryPartTarget != undefined)
            {
                partsTarget = theFlag.memory.carryPartTarget;
            }
            
            //build a body for the parts target
            let bod = [];
                //if a transporter with a work part already exists, don't spawn one with work parts
            if(!(_.filter(transporterCollection, t => t.getActiveBodyparts(WORK) > 0).length >0) && theFlag.memory.paved)
            {
                bod = [WORK,MOVE];
            }
            
            let partsDifference = Math.max(0, partsTarget - totalTransportMovePieces);
            
            if(theFlag.memory.paved == undefined || !theFlag.memory.paved)
            {
                for(let i = 0; i < partsDifference; i++)
                {
                    bod.push(MOVE);
                    bod.push(CARRY);
                }
            }
            
            else //if paved, spawn transport with half the move parts
            {
                for(let i = 0; i < Math.ceil(partsDifference/2); i++)
                {
                    bod.push(MOVE);
                    bod.push(CARRY);
                    bod.push(CARRY);
                }
            }
            
            //spawn
            if(spawnCreep(Game.rooms[theFlag.memory.spawnRoom], creepCost(bod), bod,
                {mineFlagTarget: theFlag.name, role: 'mineTransport', mode: 'spend',
                targetRoom: theFlag.memory.tarRoom, targetX: theFlag.memory.transportTarX, targetY: theFlag.memory.transportTarY,
                canMine:false, 
                canPickupEnergy:false, 
                canPickupMinerals:false, 
                canWithdraw:false, 
                canDismantle:false,
                canRefuel:true,
                canRepair:false,
                canBuild:false,
                canUpgrade:false,
                canDepositEnergy:true,
                canDepositMinerals:false
                }) != undefined)
            {
                theFlag.memory.ticksSinceLastTransportSpawn = 0;
            }
        }
        
        //if construction sites in room, spawn a builder, set to go to room
        let construction;

        if(!spawnTransport && !spawnMiner && theFlag.pos != undefined && theFlag.pos.roomName != undefined && Game.rooms[theFlag.pos.roomName] != undefined && !Game.rooms[theFlag.pos.roomName].controller.my)
        {
            construction = _.filter(Game.rooms[theFlag.pos.roomName].cacheFind(FIND_CONSTRUCTION_SITES), c => c.my);
        }
        
        if(construction != undefined && construction.length > 0)
        {
            //search all workers, see if room appears in any of them
            let roomWorkers = _.filter(temp.creeps.remoteWorker, c => c.memory.targetRoom == theFlag.pos.roomName);
            
            if(roomWorkers == undefined || roomWorkers.length < 1)
            {
                //spawn worker
                spawnCreep(Game.rooms[theFlag.memory.spawnRoom], 0, [MOVE,WORK,MOVE,CARRY],
                {targetRoom: theFlag.pos.roomName, role: 'remoteWorker',mode: 'spend',
                    canMine:true, 
                    canPickupEnergy:true, 
                    canPickupMinerals:false, 
                    canWithdraw:true, 
                    canDismantle:false,
                    canRefuel:false,
                    canRepair:false,
                    canBuild:true,
                    canUpgrade:false,
                    canDepositEnergy:false,
                    canDepositMinerals:false
                })
                
            }
            
        }
        
    }
    
}
