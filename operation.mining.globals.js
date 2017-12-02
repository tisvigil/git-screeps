

global.setMineSourceRoom = function(fl)
{
    let theFlag = Game.flags[fl]
    
    if(theFlag.memory.spawnRoom == undefined)
    {
        theFlag.memory.spawnRoom = global.closestSpawner(theFlag.pos).pos.roomName;
    }
}

global.setMineDropRoom = function(fl)
{
    let theFlag = Game.flags[fl]
    
    if(theFlag.memory.dropRoom == undefined)
    {
        theFlag.memory.dropRoom = global.closestSpawner(theFlag.pos).pos.roomName;
    }
}

global.incrementMinerSpawnTimer = function(fl)
{
    let theFlag = Game.flags[fl];
    
    if(theFlag.memory.ticksSinceLastMinerSpawn == undefined)
    {
        theFlag.memory.ticksSinceLastMinerSpawn = 0;
    }
    
    else
    {
        theFlag.memory.ticksSinceLastMinerSpawn++;
    }
}

//calculate mineBot and transport pathing info and saves it to flag
global.calculateMineFlagPathingInfo = function(fl)
{
    let theFlag = Game.flags[fl];
    
    //find the last step in the pathfinding algorithm to the node
    let spawnSearch = _.filter(Game.rooms[theFlag.memory.dropRoom].cacheFind(FIND_MY_STRUCTURES), s => s instanceof StructureSpawn);
    
    let closestSpawner;
    if(spawnSearch.length != 0)
    {
        closestSpawner = spawnSearch[0];
        
        let pathToSource = PathFinder.search(closestSpawner.pos,{pos:theFlag.pos, range:1},{roomCallback: function(roomName){return global.ignoreCreepsCostMatrix(roomName);}}).path;
        
        //write the information to flag for later
        theFlag.memory.tarX = pathToSource[pathToSource.length-1].x;
        theFlag.memory.tarY = pathToSource[pathToSource.length-1].y;
        theFlag.memory.tarRoom = pathToSource[pathToSource.length-1].roomName;
        theFlag.memory.transportTarX = pathToSource[pathToSource.length-2].x;
        theFlag.memory.transportTarY = pathToSource[pathToSource.length-2].y;
    }
}

//figure out whether flag is over a source or a mineral, register to flag
global.setMineFlagModeAndHarvestTarget = function(flag)
{
    let fl = Game.flags[flag];
    let theLook;
    
    //find the source id
    if(fl.memory.harvestTarget == undefined)
    {
        theLook = fl.room.lookForAt(LOOK_SOURCES,fl);
        if(theLook != undefined && theLook.length > 0)
        {
            fl.memory.harvestTarget = theLook[0].id;
            fl.memory.mode = 'source';
        }
    }
    
    if(fl.memory.harvestTarget == undefined)
    {
        theLook = fl.room.lookForAt(LOOK_MINERALS,fl);
        if(theLook != undefined && theLook.length > 0)
        {
            fl.memory.harvestTarget = theLook[0].id;
            fl.memory.mode = 'mineral';
        }
    }
}

//set target carry parts
global.setMineTargetCarryParts = function(fl, cr)
{
    let theFlag = Game.flags[fl];
    
    //calculate the distance to the closest storage in droproom and ideal number of transporters
    let pathLength = -1;
    let carryPartTarget;
    
    //iterate on all structures
    let destRoom = Game.rooms[theFlag.memory.dropRoom];
    let destRoomStorage;
    
    if(theFlag.memory.mode == 'source')
    {
        destRoomStorage = _.filter(destRoom.cacheFind(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_STORAGE);
    }
    else if(theFlag.memory.mode == 'mineral')
    {
        destRoomStorage = _.filter(destRoom.cacheFind(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_TERMINAL);
    }
    
    if(destRoomStorage == undefined || destRoomStorage.length == 0)
    {
        //if no storage, use the spawn
        destRoomStorage = _.filter(destRoom.cacheFind(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_SPAWN);
    }
        
    for(let s of destRoomStorage)
    {
        let newPath = PathFinder.search(s.pos,{pos: theFlag.pos, range:1},{roomCallback: function(roomName){return global.ignoreCreepsCostMatrix(roomName);}}).path.length;
        if(pathLength < 0)
        {
            pathLength = newPath;
        }
        else
        {
            pathLength = Math.min(pathLength, newPath);
        }
    }
    
    if(theFlag.memory.mode == 'source')
    {
        carryPartTarget = Math.max(5,CARRY_PARTS(Game.getObjectById(theFlag.memory.harvestTarget).energyCapacity, pathLength)*1.2);
        
        if(theFlag.memory.linked != undefined && theFlag.memory.linked)
        {
            carryPartTarget = carryPartTarget / 2;
        }
    }
    
    else if(theFlag.memory.mode == 'mineral')
    {
        let theCreep = Game.creeps[cr];
        let workParts = theCreep.getActiveBodyparts(WORK);
        
        //approximation
        carryPartTarget = (workParts*pathLength/150)*1.2;
    }
    
    theFlag.memory.carryPartTarget = Math.ceil(carryPartTarget);
}

global.setMineLinkId = function(fl)
{
    let theFlag = Game.flags[fl];
    
    if(theFlag.memory.linked != undefined && theFlag.memory.linked)
    {
        theFlag.memory.transferTarget = (new RoomPosition(theFlag.memory.tarX,theFlag.memory.tarY,theFlag.memory.tarRoom)).findClosestByRange(_.filter(theFlag.cacheFind(FIND_MY_STRUCTURES), s => s instanceof StructureLink)).id;
    }
}

global.setMineContainerId = function(fl)
{
    let theFlag = Game.flags[fl];
    let targetPos = new RoomPosition(theFlag.memory.tarX,theFlag.memory.tarY,theFlag.memory.tarRoom);
    let theLook = Game.rooms[targetPos.roomName].lookForAt(LOOK_STRUCTURES,targetPos);

    let theContainer = _.filter(theLook, s => s instanceof StructureContainer);
    
    if(theContainer && theContainer.length > 0)
    {
        theFlag.memory.container = theContainer[0].id;
    }
    
    else
    {
        theFlag.memory.container = null;
    }
}

