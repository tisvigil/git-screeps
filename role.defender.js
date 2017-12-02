var roleDefender = {

    /** @param {Creep} creep **/
    run: function(creep)
    {
        //figure out what parts a creep has
        //let activeMoveParts = creep.getActiveBodyparts(MOVE);
        let activeAttackParts = creep.getActiveBodyparts(ATTACK);
        let activeRangedAttackParts = creep.getActiveBodyparts(RANGED_ATTACK);
        let activeHealParts = creep.getActiveBodyparts(HEAL);
        //let activeToughParts = creep.getActiveBodyparts(TOUGH);
        let activeWorkParts = creep.getActiveBodyparts(WORK);
        
        //assess situation
        if ((creep.hits > 0.95* creep.hitsMax ||
            (activeAttackParts > 0 && creep.pos.findClosestByPath(creep.cacheFind(FIND_HOSTILE_CREEPS)) != undefined) ||
            (activeRangedAttackParts > 0 && creep.pos.findClosestByPath(creep.cacheFind(FIND_HOSTILE_CREEPS)) != undefined))
            
            && (creep.memory.plan == undefined ||creep.memory.plan == 'retreat'))
        {
            creep.memory.plan = 'offense';
        }
        
        //retreat if low life
        if(creep.hits < 0.2*creep.hitsMax && (creep.memory.plan == undefined || creep.memory.plan == 'offense'))
        {
            creep.memory.plan = 'retreat';
        }
            //retreat if no more combat parts
        else if(activeAttackParts + activeRangedAttackParts + activeHealParts + activeWorkParts == 0 && (creep.memory.plan == undefined || creep.memory.plan == 'offense'))
        {
            creep.memory.plan = 'retreat';
        }
        
        //if anything hostile is in room, move to closest and fight it
        if(creep.memory.plan == 'offense')
        {
            let hostileCreeps = creep.room.cacheFind(FIND_HOSTILE_CREEPS);
            //if creep in room
            if(hostileCreeps.length > 0)
            {
                creep.combatSomething();
                combatMoveEngage(creep);
            }
            
            //if nothing is in room, move to room controller in room assigned to defender
            else
            {
                //if no enemy creeps in target room, move to controller with range
                if(Game.flags[creep.memory.defendFlag] != undefined && Game.flags[creep.memory.defendFlag].room != undefined &&
                    creep.room.name == Game.flags[creep.memory.defendFlag].room.name)
                {
                    creep.moveTo(creep.room.controller, {range:2});
                }
                
                else
                {
                    let dest = Game.flags[creep.memory.defendFlag];
                    creep.travelTo(dest);
                }
            }
        }
        
        else if(creep.memory.plan == 'retreat')
        {
            //move to spawn
            creep.moveTo(Game.rooms[creep.memory.spawnRoom].controller.pos);
        }
	}
};

module.exports = roleDefender;