global.operationBaseRefuelNexus = function(fl)
{
    let theFlag = Game.flags[fl];
    
    //flag setup
    if(!theFlag.memory.setupComplete && theFlag.room != undefined)
    {
        let theLook = _.map(_.filter(theFlag.safeLookAtArea(1), l => l.type == LOOK_STRUCTURES), s => s[LOOK_STRUCTURES]);
        
        //find terminal
        if(theFlag.room.terminal != undefined)
        {
            theFlag.memory.terminal = theFlag.room.terminal.id;
        }
        
        //find storage
        if(theFlag.room.storage != undefined)
        {
            theFlag.memory.storage = theFlag.room.storage.id;
        }
        
        //find stuff to fill
        let refuelThese = _.map(_.filter(theLook, s => s.my && (s instanceof StructureSpawn || s instanceof StructureLink || s instanceof StructureExtension)), s => s.id);
        
        if(refuelThese != undefined && refuelThese.length > 0)
        {
            theFlag.memory.refuel = refuelThese;
        }
        
        theFlag.memory.setupComplete = true;
    }
    
    //spawn logic
    let bots = _.filter(temp.creeps.nexusBot, c => c.memory.targetFlag == theFlag.name);
    
    if(bots == undefined || bots.length == 0 || (bots.length == 1 && bots[0].ticksToLive < 151))
    {
        spawnCreep(Game.rooms[theFlag.pos.roomName], 850, [MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], {role: 'nexusBot', mode: 'travelTo', targetFlag: theFlag.name});
    }
}