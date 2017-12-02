'use strict'
require ('operation.combat.globals');

var roleCombat = {

    /** @param {Creep} creep **/
    run: function(creep)
    {
        let IGNORE_DESTRUCTIBLE_STRUCTURES = false;
        
        //SITUATION ASSESSMENT =================================================
        let activeMoveParts = creep.activeParts(MOVE);
        let activeAttackParts = creep.activeParts(ATTACK);
        let activeRangedAttackParts = creep.activeParts(RANGED_ATTACK);
        let activeHealParts = creep.activeParts(HEAL);
        let activeToughParts = creep.activeParts(TOUGH);
        let activeWorkParts = creep.activeParts(WORK);
        
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
        else if(activeAttackParts + activeRangedAttackParts + activeWorkParts == 0 && (creep.memory.plan == undefined || creep.memory.plan == 'offense'))
        {
            //creep.memory.plan = 'retreat';
        }
        
        
        //OFFENSE PLAN
        if(creep.memory.plan == 'offense')
        {
            creep.combatSomething();
            if(combatMoveEngage(creep))
            {
                creep.combatSomething();
            }
        }
            
        else if(creep.memory.plan == 'retreat')
        {
            creep.combatSomething();
            combatMoveRetreat(creep);
        }
	} 
};

module.exports = roleCombat;