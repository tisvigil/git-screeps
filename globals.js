require('globals.constants');

require('globals.prototypes.creep');
require('globals.prototypes.room');
require('globals.prototypes.roomObject');
require('globals.prototypes.terminal');

require('globals.memory');
require('globals.spawnPriority');


//takes two points, builds road construction sites through everything without an existing structure

global.buildRoad = function(a = 'a',b = 'b')
{
    //path between two objects
    var path = PathFinder.search(Game.flags[a].pos,{ pos: Game.flags[b].pos, range: 0 },{roomCallback: function(roomName){return global.ignoreCreepsCostMatrix(roomName);}}).path;
    
    //iterate down path and build construction sites if that location has no existing building
    for(var i=0; i< path.length; i++)
    {
        //make sure that the particular location has no buildling, place construction site
        var lookedAt = Game.rooms[Game.flags[a].pos.roomName].lookAt(path[i]);
        var residentBuilding = undefined;
        
        for(var j=0; j<lookedAt.length; j++)
        {
            if(lookedAt[j].type == 'structure')
            {
                residentBuilding = lookedAt[j].structure;
            }
        }

        if(residentBuilding == undefined)
        {
            Game.rooms[path[i].roomName].createConstructionSite(path[i],STRUCTURE_ROAD);
        }
    }
}

//find the total cost of a creep
global.creepCost = function(blueprint)
{
    let totalCost = 0;
    for(i=0; i<blueprint.length; i++)
    {
        totalCost += BODYPART_COST[blueprint[i]];
    }
    return totalCost;
}

//determine whether a particular RoomLocation is one the edge of the map
global.onEdge = function(roomPos)
{
    if(roomPos.x == 0 || roomPos.x == 49 || roomPos.y == 0 || roomPos.y == 49)
    {
        return true;
    }
    
    return false;
}

//return a list of all flags with a certain name inside
global.flagSearch = function(query)
{
    let flagsList = _.filter(Game.flags, f => f.name.search(query) != -1);
    return flagsList;
}

//given a RoomLocation, find the closest spawner
global.closestSpawner = function(place)
{
    //figure out the closest spawner
    let closestSpawner;
    let bestPathCost = -1;
    
    for(let name in Game.spawns) //for all the game's spawns
    {
        //determine route length between the node and the spawner
        let currentPathCost = PathFinder.search(place,{pos: Game.spawns[name].pos, range: 1}).cost;
        
        if(bestPathCost == -1 || bestPathCost > currentPathCost) 
        {
            bestPathCost = currentPathCost;
            closestSpawner = Game.spawns[name];
        }
    }
    
    return closestSpawner;
}

global.maxCreep = function(spawn, maxSpend, iteratingArray, memorySpecs)
{
//console.log('in maxcreep',spawn,maxSpend)
   //determine the maximum energy that can be spent
   let maxEnergyUsable = spawn.room.energyCapacityAvailable;
   if(maxSpend != 0 && maxEnergyUsable > maxSpend)
   {
       maxEnergyUsable = maxSpend;
   }
   
   //representaiton of the currrent build
   let creepBlueprint = []; //array of parts to eventually use
   let workingTotal = 0; //total cost of parts
   
   //the iterating parts list
   let builderParts = iteratingArray; //cycle through these over and over
   let partsIndex = 0; //position in the builderParts array
   
   //control for the loop
   let limitReached = false;
   while(!limitReached && creepBlueprint.length < 50)
   {
       if(workingTotal + BODYPART_COST[builderParts[partsIndex]] <= maxEnergyUsable)
       {
            creepBlueprint.push(builderParts[partsIndex]);
            workingTotal += BODYPART_COST[builderParts[partsIndex]];
            
            partsIndex++;
            if(partsIndex >= builderParts.length)
            {
                partsIndex = 0;
            }
       }
       
       else
       {
           limitReached = true;
       }
   }
   
    let newName;
   
   //spawn the worker
   if(spawn.room.energyAvailable >= workingTotal && spawn.spawning == null)
   {
        newName = spawn.createCreep(creepBlueprint, undefined, memorySpecs);
        if(REPORT_SPAWN_CREEP)
        {
            console.log(spawn.room.name,' ',spawn.name,' spawning new creep: ' + newName + ' (' + memorySpecs.role + ')');
        }
   }
   
   //return the ID of the worker
   return newName;
}

//upgrade maxcreep to move to multiple rooms
global.spawnCreep = function(roomToSpawn, maxSpend, iteratingArray, memorySpecs)
{
    //setup temp object for spawn reservation
    if(temp.rooms == undefined)
    {
        temp.rooms = {};
    }
    
    if(temp.rooms[roomToSpawn.name] == undefined)
    {
        temp.rooms[roomToSpawn.name] = {};
    }
    
    //check if spawn reservation, if no reservation than spawn
    if(!temp.rooms[roomToSpawn.name].spawnReservation)
    {
        let spawnsAvailable = _.filter(Game.spawns, s => s.room == roomToSpawn && s.spawning == null);
        if(spawnsAvailable.length > 0)
        {
            temp.rooms[roomToSpawn.name].spawnReservation = true;
            memorySpecs.spawnRoom = roomToSpawn.name;
            return maxCreep(spawnsAvailable[0],maxSpend,iteratingArray,memorySpecs);
        }
    }
}

//push a memory value onto every creep
global.pushMemory = function(key, value)
{
    for(let name in Game.creeps)
    {
        let theCreep = Game.creeps[name];
        theCreep.memory[key] = value;
    }
}


//given a location, find the closest player spawner
global.closestSpawner = function(location)
{
    let closest;
    let bestPathCost = -1;
    
    for(let name in Game.spawns) //for all the game's spawns
    {
        //determine route length between the node and the spawner
        let currentPathCost = PathFinder.search(location,{pos: Game.spawns[name].pos, range: 1}).cost;
        
        if(bestPathCost == -1 || bestPathCost > currentPathCost)
        {
            bestPathCost = currentPathCost;
            closest = Game.spawns[name];
        }
    }
    return closest;
}

global.avoidCreepsCostMatrix = function(r)
{
    let roo = Game.rooms[r];
    
    if(roo == undefined)
    {
        return;
    }
    /*
    //if there is already a costmatrix
    if(temp[roo.name] != undefined && temp[roo.name].ignoreCreepsCostMatrix != undefined)
    {
console.log('returned saved matrix');
        return temp[roo.name].ignoreCreepsCostMatrix;
    }
    */
    let costs = new PathFinder.CostMatrix;
    
    let noGo = _.filter(roo.cacheFind(FIND_STRUCTURES), s => 
    (
        s.structureType == STRUCTURE_SPAWN ||
        s.structureType == STRUCTURE_EXTENSION ||
        s.structureType == STRUCTURE_WALL ||
        (s.structureType == STRUCTURE_RAMPART && !(s.my || s.isPublic) ||
        s.structureType == STRUCTURE_LINK ||
        s.structureType == STRUCTURE_STORAGE ||
        s.structureType == STRUCTURE_TOWER ||
        s.structureType == STRUCTURE_OBSERVER ||
        s.structureType == STRUCTURE_LAB ||
        s.structureType == STRUCTURE_TERMINAL ||
        s.structureType == STRUCTURE_NUKER
    )));

    for(let n of noGo)
    {
        costs.set(n.pos.x,n.pos.y, 0xff);
    }
    
    //in this case, we want the creeps to NOT be passable
    let goCreeps = roo.cacheFind(FIND_CREEPS);
    
    for(let c of goCreeps)
    {
        costs.set(c.pos.x,c.pos.y, 0xff);
    }
    
    return costs;
}
    
global.ignoreCreepsCostMatrix = function(r)
{
    let roo = Game.rooms[r];
    
    if(roo == undefined)
    {
        return;
    }
    /*
    //if there is already a costmatrix
    if(temp[roo.name] != undefined && temp[roo.name].ignoreCreepsCostMatrix != undefined)
    {
console.log('returned saved matrix');
        return temp[roo.name].ignoreCreepsCostMatrix;
    }
    */
    let costs = new PathFinder.CostMatrix;
    
    let noGo = _.filter(roo.cacheFind(FIND_STRUCTURES), s => 
    (
        s.structureType == STRUCTURE_SPAWN ||
        s.structureType == STRUCTURE_EXTENSION ||
        s.structureType == STRUCTURE_WALL ||
        (s.structureType == STRUCTURE_RAMPART && !(s.my || s.isPublic) ||
        s.structureType == STRUCTURE_LINK ||
        s.structureType == STRUCTURE_STORAGE ||
        s.structureType == STRUCTURE_TOWER ||
        s.structureType == STRUCTURE_OBSERVER ||
        s.structureType == STRUCTURE_LAB ||
        s.structureType == STRUCTURE_TERMINAL ||
        s.structureType == STRUCTURE_NUKER
    )));

    for(let n of noGo)
    {
        costs.set(n.pos.x,n.pos.y, 0xff);
    }
    
    //in this case, we want the creeps to be passable
    let goCreeps = roo.cacheFind(FIND_CREEPS);
    
    for(let c of goCreeps)
    {
        let theLook = c.room.lookAt(c);
        let theTerrainObject = _.filter(theLook, o => o.type == 'terrain');
        let theTerrain = theTerrainObject[0].terrain;
        if(theTerrain == 'plain')
        {
            costs.set(c.pos.x,c.pos.y, 1);
        }
        
        else if(theTerrain == 'swamp')
        {
            costs.set(c.pos.x,c.pos.y, 5);
        }
    }

    //temp[roo.name].ignoreCreepsCostMatrix = costs;
    return costs;
}

global.raze = function(roomN)
{
    let toDestroy = _.filter(Game.structures,s => s.pos.roomName == roomN);
    for(let s of toDestroy)
    {
        s.destroy();
    }
}

global.moveByWaypoint = function(creep,flagString,args={})
{
    if(creep.memory.nextWaypoint == undefined)
    {
        //find closest waypoint containing flagString

        let flagsWithString = _.filter(Game.flags,f => f.name.search(flagString) != -1)

        if(flagsWithString != undefined && flagsWithString.length > 0)
        {
            let closest = creep.pos.findClosestByPath(flagsWithString);
            
            if(closest != undefined)
            {
                creep.memory.nextWaypoint = closest.name;
            }
        }
    }
    
    if(creep.memory.nextWaypoint != undefined)
    {
        //check if creep is at the destination flag
            //if at flag, update with the next location from flag
        let targetFlag = Game.flags[creep.memory.nextWaypoint];
        
        if(targetFlag != undefined && creep.pos.isNearTo(targetFlag.pos))
        {
            //find next location
            let nextFlag = targetFlag.memory.next;
            if(nextFlag != undefined)
            {
                creep.memory.nextWaypoint = nextFlag;
                targetFlag = Game.flags[creep.memory.nextWaypoint];
            }
        }

        //move to next location
        if(targetFlag != undefined)
        {
            if(creep.pos.roomName == targetFlag.pos.roomName)
            {
                creep.moveTo(targetFlag.pos);
            }
            
            else
            {
                creep.travelTo(targetFlag,{allowHostile: true, allowSK: true});
            }
            
        }
        
    }
}

global.round = function (value, decimals) 
{
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

global.getRoomSafety = function(rm)
{
    let theRoom = Game.rooms[rm];
    
    if(theRoom == undefined)
    {
        return 'not visible';
    }
    
    else if(theRoom.cacheFind(FIND_HOSTILE_CREEPS).length > 0)
    {
        return 'visible unsafe';
    }
    
    else
    {
        return 'visible safe';
    }
}

