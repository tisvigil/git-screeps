
global.runMineralMiningOperation = function(fl)
{
    let theFlag = Game.flags[fl];
    let thisFlagName = theFlag.name;
    let thisRoomName = theFlag.pos.roomName;
    
    //mine flag timers
    incrementMinerSpawnTimer(thisFlagName);
    
    //look at every creep to determine which ones are attached to the flag, if none, spawn
        //if miner bots are not there, or about to die, spawn them
        //flag logic: keep track of number of ticks since last spawn, spawn one preemptively (CREEP_LIFE_TIME)
    let spawnMiner = false;
    let spawnTransport = false;

    if(theFlag.memory.ticksSinceLastMinerSpawn >= theFlag.memory.ticksToLiveOnArrival || _.filter(temp.creeps.mineBot, c => c.memory.mineFlagTarget != undefined && c.memory.mineFlagTarget == thisFlagName).length == 0)
    {
        spawnMiner = true;
    }
    
    //if no more minerals, don't spawn
    if(Game.getObjectById(theFlag.memory.harvestTarget).mineralAmount == 0)
    {
        spawnMiner = false;
    }
    
    let transporterCollection = _.filter(temp.creeps.mineTransport, c => c.memory.mineFlagTarget != undefined && c.memory.mineFlagTarget == thisFlagName);
    let totalTransportMovePieces = 0;
    
    //figure out how many total transporter pieces there are.  
    if(transporterCollection.length > 0)
    {
        totalTransportMovePieces = _.sum(transporterCollection, t =>
        {
        	return _.filter(t.body, p => p.type === CARRY).length;
        });
    }

    // if less than the actual, spawn another transporter with the difference (only if container is not empty)
    if(totalTransportMovePieces < theFlag.memory.carryPartTarget && Game.getObjectById(theFlag.memory.container) != undefined && _.sum(Game.getObjectById(theFlag.memory.container).store) > 0)
    {
        spawnTransport = true;
    }
    
//console.log(spawnTransport,totalTransportMovePieces < theFlag.memory.carryPartTarget,Game.getObjectById(theFlag.memory.container) != undefined,_.sum(Game.getObjectById(theFlag.memory.container).store) > 0);
    if(spawnTransport)
    {
        //get the carry part target.  if undefined, assume something small (5)
        let partsTarget = 5;
        if(theFlag.memory.carryPartTarget != undefined)
        {
            partsTarget = theFlag.memory.carryPartTarget;
        }
        
        //build a body for the parts target
        let bod = [];
        
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
            canDepositMinerals:true
            }) != undefined)
        {
            theFlag.memory.ticksSinceLastTransportSpawn = 0;
        }
    }

    if(spawnMiner && !spawnTransport)
    {
        //spawn
        if(spawnCreep(Game.rooms[theFlag.memory.spawnRoom], 0, [MOVE,WORK,WORK], 
        {mineFlagTarget: theFlag.name, role: 'mineBot', targetRoom: theFlag.memory.tarRoom, targetX: theFlag.memory.tarX, targetY: theFlag.memory.tarY, firstArrival: true}) != undefined)
        {
            theFlag.memory.ticksSinceLastMinerSpawn = 0;
        }
    }
    
    
}
