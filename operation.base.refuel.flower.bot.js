/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('operation.base.refuel.flower.bot');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    
     run: function(creep)
    {
        if(creep.memory.targetFlag == undefined || Game.flags[creep.memory.targetFlag] == undefined)
        {
            creep.suicide();
        }
        
        let theMode = creep.memory.mode;
        let theFlag = Game.flags[creep.memory.targetFlag];
        
        if(theMode == 'work')
        {
            if(theFlag.memory.activeCreep != creep.id)
            {
                creep.suicide();
            }
            
            //BEHAVIOR DETERMINATION
            let behavior;
            let rangeToFlag = creep.pos.getRangeTo(theFlag);
            if(creep.carry[RESOURCE_ENERGY] === 0)
            {
                if(rangeToFlag === 0)
                {
                    behavior = 'withdrawEnergy';
                }
                else
                {
                    behavior = 'return';
                }
            }
            //this means creep has energy
            else
            {
                if(creep.room.energyAvailable === creep.room.energyCapacityAvailable)
                {
                    if(rangeToFlag === 0)
                    {
                        behavior = 'depositSurplus';
                    }
                    else
                    {
                        behavior = 'return';
                    }
                }
                //this means room needs refilling
                else
                {
                    behavior = 'refill';
                }
            }
            
            //BEHAVIOR EXECUTION
            let direction;
            
            if(behavior === 'refill')
            {
                let refuelThis; 
             
                if(true)//creep.memory.outbound)
                {
                    //find everything in range that needs refueling
                    refuelThis = _.filter(_.map(creep.safeLookForAtArea(LOOK_STRUCTURES,1), l => l[LOOK_STRUCTURES]), s => (s instanceof StructureTower || s instanceof StructureExtension) && s.energy < s.energyCapacity);
                    
                    //if something needs refueling, do so
                    if(refuelThis != undefined && refuelThis.length > 0)
                    {
                        creep.transfer(refuelThis[0], RESOURCE_ENERGY);
                    }
                }
                
                //move logic based on number and need
                if(
                    !creep.repairStandingRoad() &&
                    (
                        refuelThis === undefined ||
                        refuelThis.length === 0 ||
                        (refuelThis.length === 1 && refuelThis[0].energyCapacity - refuelThis[0].energy < creep.carry[RESOURCE_ENERGY])
                    )
                )
                {
                    this.moveByPhase(creep,rangeToFlag);
                }
            }
            else if(behavior === 'return')
            {
                direction = this.reverseDirection(theFlag.memory.directions[creep.memory.directionIndex]);
                creep.move(direction);
            }
            else if(behavior === 'withdrawEnergy')
            {
                direction = theFlag.memory.directions[creep.memory.directionIndex];
                let withdrawSolutionFound = false;
                let withdrawTarget;
                if(Game.getObjectById(theFlag.memory.link) && Game.getObjectById(theFlag.memory.link).energy > 0)
                {
                    withdrawSolutionFound = true;
                    withdrawTarget = Game.getObjectById(theFlag.memory.link);
                }
                
                if(!withdrawSolutionFound && creep.room.energyAvailable < creep.room.energyCapacityAvailable)
                {
                    for(let cont of theFlag.memory.containers)
                    {
                        if(withdrawSolutionFound === true)
                        {
                            break;
                        }
                        else
                        {
                            if(Game.getObjectById(cont) && Game.getObjectById(cont).store[RESOURCE_ENERGY] > 0)
                            {
                                withdrawSolutionFound = true;
                                withdrawTarget = Game.getObjectById(cont);
                            }
                        }
                    }
                }
                
                if(withdrawTarget)
                {
                    creep.withdraw(withdrawTarget, RESOURCE_ENERGY);
                    if(creep.room.energyAvailable < creep.room.energyCapacityAvailable)
                    {
                        this.moveByPhase(creep,rangeToFlag);
                    }
                }
            }
            else if(behavior === 'depositSurplus')
            {
                let depositSolutionFound = false;
                if(!creep.repairAdjacentContainers() && theFlag.memory.containers && theFlag.memory.containers.length > 0)
                {
                    for(let cont of theFlag.memory.containers)
                    {
                        if(depositSolutionFound)
                        {
                            break;
                        }
                        else
                        {
                            if(Game.getObjectById(cont) && _.sum(Game.getObjectById(cont).store) < Game.getObjectById(cont).storeCapacity)
                            {
                                depositSolutionFound = true;
                                creep.transfer(Game.getObjectById(cont),RESOURCE_ENERGY);
                            }
                        }
                    }
                }
            }
        }
        
        else if(theMode == 'travelTo' && !creep.spawning)
        {
            let rangeToFlag = creep.pos.getRangeTo(theFlag);
            //if traveling, and close to flag, set flag mode to creep
            if(rangeToFlag < 2)
            {
                theFlag.memory.activeCreep = creep.id;
            }
            
            //if on top of flag, start working
            if(rangeToFlag == 0)
            {
                creep.memory.mode = 'work';
            }
            
            creep.moveTo(theFlag);
        }
    },
    
    reverseDirection: function(dir)
    {
        switch(dir)
        {
            case TOP:
                return BOTTOM;
                break;
            case TOP_RIGHT:
                return BOTTOM_LEFT;
                break;
            case RIGHT:
                return LEFT;
                break;
            case BOTTOM_RIGHT:
                return TOP_LEFT;
                break;
            case BOTTOM:
                return TOP;
                break;
            case BOTTOM_LEFT:
                return TOP_RIGHT;
                break;
            case LEFT:
                return RIGHT;
                break;
            case TOP_LEFT:
                return BOTTOM_RIGHT;
                break;
        }
    },
    
    directionByPhase: function(creep,dir)
    {
        if(creep.memory.outbound)
        {
            return dir;
        }
        
        else
        {
            return this.reverseDirection(dir);
        }
    },
    
    moveByPhase: function(creep,dist)
    {
        let theFlag = Game.flags[creep.memory.targetFlag];
        if(dist === theFlag.memory.range)
        {
            creep.memory.outbound = false;
        }
        else if(dist === 0)
        {
            creep.memory.outbound = true;
            creep.memory.directionIndex = (creep.memory.directionIndex + 1) % theFlag.memory.directions.length;
        }
        
        creep.move(this.directionByPhase(creep,theFlag.memory.directions[creep.memory.directionIndex]));
    }
    
};