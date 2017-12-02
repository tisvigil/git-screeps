

var roleTower = {

    run: function(tower)
    {
        let acted = false;
        
        //hostiles: attack
        let hostiles = tower.cacheFind(FIND_HOSTILE_CREEPS);
        var closestHostile = tower.pos.findClosestByRange(hostiles);
        
        if(closestHostile != undefined && tower.pos.getRangeTo(closestHostile) <= MAX_TOWER_RANGE)
        {
            tower.attack(closestHostile);
            acted = true;
        }
        //tower.attack(Game.getObjectById('5881cbd931a1131026dd5be6'));
        
        if(!acted)
        {
            //friendlies repair
            var allyCreeps = tower.room.cacheFind(FIND_ALLIED_CREEPS);
            let injuredAllies = _.filter(allyCreeps, c => c.hits < c.hitsMax);
            if(injuredAllies.length > 0)
            {
                tower.heal(tower.pos.findClosestByRange(injuredAllies));
                acted = true;
            }
        }
        
        if(!acted)
        {
            //closest structure damaged (if below half)
            let str = tower.cacheFind(FIND_STRUCTURES);
            let structs = _.filter(str, structure => 
                structure.hits*2 < structure.hitsMax &&
                structure.structureType != STRUCTURE_WALL && 
                structure.structureType != STRUCTURE_RAMPART && 
                structure.structureType != STRUCTURE_ROAD
            );
            
            let closestDamagedStructure;
            if(structs)
            {
                closestDamagedStructure = tower.pos.findClosestByRange(structs);
            }
            
            if(closestDamagedStructure)
            {
                tower.repair(closestDamagedStructure);
                acted = true;
            }
        
            else
            {
                //find ramparts about to decay
                structs = _.filter(str, structure => structure.hits < 1000 && structure.structureType == STRUCTURE_RAMPART);
                closestDamagedStructure = tower.pos.findClosestByRange(structs);
                
                if(closestDamagedStructure)
                {
                    tower.repair(closestDamagedStructure);
                    acted = true;
                }
            }
        }
    }
};

module.exports = roleTower;
