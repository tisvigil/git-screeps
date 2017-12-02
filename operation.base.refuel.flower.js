global.operationBaseRefuelFlower = function(fl)
{
    let theFlag = Game.flags[fl];
    
    //flag setup
    if(!theFlag.memory.setupComplete && theFlag.room != undefined)
    {
        let theLook = _.map(_.filter(theFlag.safeLookAtArea(1), l => l.type == LOOK_STRUCTURES), s => s[LOOK_STRUCTURES]);
        
        //find link
        let links = _.filter(theLook, s => s instanceof StructureLink);
        if(links != undefined && links.length > 0)
        {
            theFlag.memory.link = links[0].id;
        }
        
        //find containers
        let containers = _.filter(theLook, s => s instanceof StructureContainer);
        if(containers != undefined && containers.length > 0)
        {
            theFlag.memory.containers = _.map(containers, c => c.id);
        }
        
        //setup basic memory values
        if(theFlag.memory.directions === undefined)
        {
            theFlag.memory.directions = [2,4,6,8]; 
        }
        if(theFlag.memory.range === undefined)
        {
            theFlag.memory.range = 4;
        }
        
        theFlag.memory.setupComplete = true;
    }
    
    //spawn logic
    let bots = _.filter(temp.creeps.flowerBot, c => c.memory.targetFlag == theFlag.name);
    
    if(bots == undefined || bots.length == 0 || (bots.length == 1 && bots[0].ticksToLive < 151))
    {
        spawnCreep(Game.rooms[theFlag.pos.roomName], Math.min(Game.rooms[theFlag.pos.roomName].energyAvailable, 1350), [WORK,MOVE,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY], {role: 'flowerBot', mode: 'travelTo', targetFlag: theFlag.name, directionIndex: 0, outbound: true});
    }
}