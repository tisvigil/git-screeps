var mineBot = 
{

    /** @param {Creep} creep **/
    run: function(creep)
    {
        //if flag is gone, suicide
        if(Game.flags[creep.memory.mineFlagTarget] == undefined)
        {
            creep.suicide();
        }
        
        if(creep.memory.targetX != undefined && creep.memory.targetY != undefined && creep.memory.targetRoom != undefined)
        {
            if(creep.pos.x != creep.memory.targetX || creep.pos.y != creep.memory.targetY || creep.pos.roomName != creep.memory.targetRoom)
            {
                creep.travelTo({pos: new RoomPosition(creep.memory.targetX, creep.memory.targetY, creep.memory.targetRoom)});
            }
            
            //if creep is at the correct position
            else
            {
                let theFlag = Game.flags[creep.memory.mineFlagTarget];
                
                //if this is the first time that flag has been encountered, update it with age on arrival
                if(creep.memory.firstArrival == true || creep.memory.firstArrival == undefined)
                {
                    creep.memory.firstArrival = false;
                    
                    theFlag.memory.ticksToLiveOnArrival = creep.ticksToLive;
                    setMineTargetCarryParts(theFlag.name, creep.name);
                    setMineLinkId(theFlag.name);
                    setMineContainerId(theFlag.name);
                }
                
                //mine the source if source is >0
                let theSource = Game.getObjectById(theFlag.memory.harvestTarget);
                if(theSource instanceof Source)
                {
                    if(theSource.energy > 0)
                    {
                        creep.harvest(theSource);
                    }
                    
                    //if target flag is linked, transfer to link
                    if(theFlag.memory.linked != undefined && theFlag.memory.linked && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                    {
                        //transfer
                        let theLink = Game.getObjectById(theFlag.memory.transferTarget);
                        if(theLink != undefined && theLink.energyCapacity > theLink.energy)
                        {
                            creep.transfer(theLink,RESOURCE_ENERGY);
                        }
                    }
                }
                
                else if(Game.time % 6 == 0 && theSource instanceof Mineral && theSource.mineralAmount > 0)
                {
                    creep.harvest(theSource);
                    
                }
            } //end of creep correct position
        } //end of check for defined target position/room
	} //end of function
};

module.exports = mineBot;