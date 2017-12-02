require('operation.base.refuel.nexus')
require('operation.base.refuel.flower')


global.operationBaseRefuel = function(theRoomName)
{
    //find all nexus flags
    let nexusFlags = _.filter(Game.flags, f => f.name.search('nexus') != -1 && f.name.search(theRoomName) != -1);
    
    //for each flag, run operationBaseRefuelNexus
    for(let f of nexusFlags)
    {
        operationBaseRefuelNexus(f.name);
    }
    
    //find all flower flags
    
    let flowerFlags = _.filter(Game.flags, f => f.name.search('flower') != -1 && f.name.search(theRoomName) != -1);
    
    //for each flag, run operationBaseRefuelFlower
    for(let f of flowerFlags)
    {
        operationBaseRefuelFlower(f.name);
    }
}