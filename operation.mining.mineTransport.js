var searchSource = require('search.source');
var searchSpend = require('search.spend');
var roleWorker = require('role.worker');

var mineTransport = 
{

    /** @param {Creep} creep **/
    run: function(creep)
    {
        //if flag is gone, suicide
        let theFlag = Game.flags[creep.memory.mineFlagTarget];
        if(theFlag == undefined)
        {
            creep.suicide();
        }
        
        //decision making for collect vs spend
        if(_.sum(creep.carry) == 0 && creep.memory.mode == 'spend')
        {
            if(theFlag.memory.ticksToLiveOnArrival && creep.ticksToLive < 500 && creep.ticksToLive < 20 + (CREEP_LIFE_TIME - theFlag.memory.ticksToLiveOnArrival)*2)
            {
                creep.suicide();
            }
            
            else
            {
                creep.memory.mode = 'get';
                creep.memory.targetId = '';
                creep.say('to collect');
            }
        }
        
        if(_.sum(creep.carry) == creep.carryCapacity && creep.memory.mode == 'get')
        {
            creep.memory.mode = 'spend';
            creep.say('to distribute');
        }
        
        if(creep.memory.mode == 'get')
        {
            if(creep.memory.targetX != undefined && creep.memory.targetY != undefined && creep.memory.targetRoom != undefined)
            {
                if(creep.pos.x != creep.memory.targetX || creep.pos.y != creep.memory.targetY || creep.pos.roomName != creep.memory.targetRoom)
                {
                    //creep.moveTo(new RoomPosition(creep.memory.targetX, creep.memory.targetY, creep.memory.targetRoom));
                    creep.travelTo({pos: new RoomPosition(creep.memory.targetX, creep.memory.targetY, creep.memory.targetRoom)});
                }
                //otherwise pick up stuff
                else
                {
                    let vicinityObjects = creep.safeLookAtArea(1);

                    if(theFlag.memory.mode == 'source')
                    {
                        let vicinityResources = _.map(_.filter(vicinityObjects, o => o.type == LOOK_RESOURCES && o[LOOK_RESOURCES].resourceType == RESOURCE_ENERGY), o => o[LOOK_RESOURCES]);
                    
                        //if you happen to pass by dropped energy, pick it up
                        if(vicinityResources.length > 0)
                        {
                            creep.pickup(vicinityResources[0]);
                        }
                    }

                    else if(theFlag.memory.mode == 'mineral')
                    {
                        if(theFlag.memory.container != undefined)
                        {
                            creep.withdrawAny(Game.getObjectById(theFlag.memory.container));
                        }
                    }
                }
            }
        }
        
        //when full, move towards dedicated location
        else if(creep.memory.mode == 'spend') //then spend
        {
            let continueAlongPath = false;
            // repair road that you're on, if it needs repairs
            if(!creep.repairStandingRoad())
            {
                continueAlongPath = true;
            }
            
            //if creep is in drop room, find job and do work
            if(continueAlongPath)
            {
                let destinationRoom = Game.flags[creep.memory.mineFlagTarget].memory.dropRoom;
                if(destinationRoom == creep.pos.roomName)
                {
                    roleWorker.run(creep);
                }
                
                else //otherwise move to drop room
                {
                    creep.travelTo(Game.rooms[destinationRoom].controller);
                }
            }
        }
    }
};

module.exports = mineTransport;