'use strict';

//currently broken
global.combatCostMatrix = function(r)
{

};

global.combatMoveEngage = function(creep)
{
    //if active towers in room, move to attack flag
    let activeEnemyTowers = _.filter(creep.cacheFind(FIND_HOSTILE_STRUCTURES), s => s instanceof StructureTower && s.energy >= 10);
    
    if(activeEnemyTowers != undefined && activeEnemyTowers.length > 0)
    {
        moveByWaypoint(creep,'attack');
        return true;
    }
    
    //else normal logic -- attack
    else
    {
        let moveSolutionFound = false;
        
        if(creep.activeParts(ATTACK) || creep.activeParts(RANGED_ATTACK) || creep.activeParts(WORK))
        {
            let enemyCreeps;
            let enemyCreep;
            if(creep.activeParts(ATTACK) || creep.activeParts(RANGED_ATTACK))
            {
                enemyCreeps = _.filter(creep.cacheFind(FIND_HOSTILE_CREEPS), c => c.owner && c.owner.username != "Source Keeper");
                enemyCreep = creep.pos.findClosestByPath(enemyCreeps);
            }
            
            let enemyStructures;
            let enemyStructure;
            if(enemyCreep == undefined || enemyCreeps.length == 0)
            {
                enemyStructures = _.filter(creep.cacheFind(FIND_HOSTILE_STRUCTURES), s => s.hits > 0 && !(s instanceof StructurePowerBank || s instanceof StructureRampart));
                enemyStructure = creep.pos.findClosestByPath(enemyStructures);
            }
            
            let useThisSet;
            if(enemyCreep)
            {
                useThisSet = enemyCreeps;
            }
            
            else if(enemyStructure)
            {
                useThisSet = enemyStructures;
            }
            
            if(useThisSet != undefined)
            {
                moveSolutionFound = true;
                let target = creep.pos.findClosestByRange(useThisSet);
                let rangeTo = creep.pos.getRangeTo(target);
                //if attack parts, charge
                if(creep.activeParts(ATTACK) > 0 && rangeTo > 1)
                {
                    creep.moveTo(target);
                }
                
                //if dismantle parts, charge
                else if(creep.activeParts(WORK) > 0 && rangeTo > 1)
                {
                    creep.moveTo(target);
                }
                
                //if ranged attack parts, kite
                else if(creep.activeParts(RANGED_ATTACK) > 0 && !creep.activeParts(ATTACK) && target != undefined)
                {
                    if(target instanceof Creep)
                    {
                        if(rangeTo < 3)
                        {
                            creep.moveTo(PathFinder.search(creep.pos, {pos:target.pos, range:4},{flee:true, roomCallback: function(roomName){return global.avoidCreepsCostMatrix(roomName);}}).path[0],{maxRooms:1});
                        }
                        
                        else if(rangeTo == 3)
                        {
                            //do nothing
                        }
                        
                        else if(rangeTo > 3)
                        {
                            creep.moveTo(target,{maxRooms:1});
                        }
                    }
                    
                    else if(target instanceof Structure && rangeTo > 1)
                    {
                        creep.moveTo(target,{maxRooms:1});
                    }
                }
            }
        }
        
        if(!moveSolutionFound && creep.activeParts(HEAL))
        {
            //move towards closest allied injured creep
            let alliedCreeps = creep.cacheFind(FIND_ALLIED_CREEPS);
            let injuredCreeps = _.filter(alliedCreeps, c => c.hits < c.hitsMax);

            if(injuredCreeps.length > 0)
            {
                moveSolutionFound = true;
                let closestInjured = creep.pos.findClosestByRange(injuredCreeps);
                let rangeTo = creep.pos.getRangeTo(closestInjured);
                if(rangeTo > 1)
                {
                    creep.moveTo(closestInjured, {maxRooms:1});
                }
                
            }
        }
        
        if(moveSolutionFound)
        {
            return true;
        }
        
        else if(!moveSolutionFound)
        {
            moveByWaypoint(creep,'attack');
        }
    }
};

global.combatMoveRetreat = function(creep)
{
    let retreatFlags = _.filter(Game.flags, f => f.name.search('retreat') != -1);
    if(retreatFlags != undefined && retreatFlags.length > 0)
    {
        //creep.moveTo(retreatFlags[0].pos);
        creep.travelTo(retreatFlags[0],{ignoreCreeps:false});
    }
    else
    {
        creep.moveTo(Game.rooms[creep.memory.spawnRoom].controller);
    }
};