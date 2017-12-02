/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('operation.base.refuel.nexus.bot');
 * mod.thing == 'a thing'; // true
 */

module.exports = 
{
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
            
            //get logic
            if(_.sum(creep.carry) == 0)
            {
                //if room reserve energy is too high, take from storage
                if(Game.getObjectById(theFlag.memory.storage) && Game.getObjectById(theFlag.memory.storage).store[RESOURCE_ENERGY] > TARGET_ROOM_RESERVE_ENERGY_BY_LEVEL[creep.room.controller.level])
                {
                    creep.withdraw(Game.getObjectById(theFlag.memory.storage),RESOURCE_ENERGY);
                }
                
                else if(Game.getObjectById(theFlag.memory.terminal) && Game.getObjectById(theFlag.memory.terminal).store[RESOURCE_ENERGY] > THRESHOLD_TERMINAL_WORKER_WITHDRAW_ENERGY)
                {
                    creep.withdraw(Game.getObjectById(theFlag.memory.terminal),RESOURCE_ENERGY);
                }
                
                else if(Game.getObjectById(theFlag.memory.storage) && Game.getObjectById(theFlag.memory.storage).store[RESOURCE_ENERGY] > 0)
                {
                    creep.withdraw(Game.getObjectById(theFlag.memory.storage),RESOURCE_ENERGY);
                }
                
                else if(Game.getObjectById(theFlag.memory.terminal) && Game.getObjectById(theFlag.memory.terminal).store[RESOURCE_ENERGY] > 0)
                {
                    creep.withdraw(Game.getObjectById(theFlag.memory.terminal),RESOURCE_ENERGY);
                }
            }
            
            //spend logic
            else
            {
                let spendTargetFound = false;
                
                for(let refuel of theFlag.memory.refuel)
                {
                    if(!spendTargetFound)
                    {
                        let theObject = Game.getObjectById(refuel);
                        if(theObject != undefined && theObject.energy < theObject.energyCapacity)
                        {
                            spendTargetFound = true;
                            creep.transfer(theObject,RESOURCE_ENERGY);
                        }
                    }
                }
                
                //extra logic for room overflow (storage to terminal)
                if(
                    !spendTargetFound && 
                    Game.getObjectById(theFlag.memory.terminal) && 
                    Game.getObjectById(theFlag.memory.storage) && 
                    Game.getObjectById(theFlag.memory.storage).store[RESOURCE_ENERGY] > TARGET_ROOM_RESERVE_ENERGY_BY_LEVEL[creep.room.controller.level] && 
                    _.sum(Game.getObjectById(theFlag.memory.terminal).store) < Game.getObjectById(theFlag.memory.terminal).storeCapacity
                )
                {
                    creep.transfer(Game.getObjectById(theFlag.memory.terminal),RESOURCE_ENERGY);
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
    }

};