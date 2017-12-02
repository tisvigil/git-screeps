/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('operation.base.AI');
 * mod.thing == 'a thing'; // true
 */

global.buildByRCL = function(rm)
{
    if(Game.time % 10 == 0 && rm.controller.level <= 3)
    {
        //count extensions, compare to total allowed.  then count containers, place one if needed
        
        let roomStructures = rm.cacheFind(FIND_MY_STRUCTURES);
        let roomExtensions = _.filter(roomStructures, s => s instanceof StructureExtension).length;
        let roomContainers = _.filter(roomStructures, s => s instanceof StructureContainer).length;
        let roomTowers = _.filter(roomStructures, s => s instanceof StructureTower).length;
        
        //place sites
        let theSpawns = _.filter(roomStructures, s => s instanceof StructureSpawn);
        let theSpawn;
        
        theSpawns.length > 0 ? theSpawn = theSpawns[0] : null;
        
        if(rm.controller.level == 2 && roomExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][rm.controller.level])
        {
            if(theSpawn != undefined)
            {
                let spawnX = theSpawn.pos.x;
                let spawnY = theSpawn.pos.y;
                
                rm.createConstructionSite(spawnX-1,spawnY-1,STRUCTURE_EXTENSION);
                rm.createConstructionSite(spawnX-1,spawnY+1,STRUCTURE_EXTENSION);
                rm.createConstructionSite(spawnX+1,spawnY-1,STRUCTURE_EXTENSION);
                rm.createConstructionSite(spawnX+1,spawnY+1,STRUCTURE_EXTENSION);
                rm.createConstructionSite(spawnX-2,spawnY,STRUCTURE_EXTENSION);
            }
        }
        
        else if(rm.controller.level == 3 && roomTowers == 0)
        {
            if(rm.controller.level >= 3)
            {
                let spawnX = theSpawn.pos.x;
                let spawnY = theSpawn.pos.y;
                
                rm.createConstructionSite(spawnX+3,spawnY-1,STRUCTURE_TOWER);
            }
        }
    }
}