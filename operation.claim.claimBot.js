var claimBot = 
{

    /** @param {Creep} creep **/
    run: function(creep)
    {
        
        //if flag is gone, suicide
        if(Game.flags[creep.memory.targetClaimFlag] == undefined)
        {
            creep.suicide();
        }
        
        //if in the same room as the target flag
        if(creep.pos.roomName == Game.flags[creep.memory.targetClaimFlag].pos.roomName)
        {
            //update decay timer
            if(creep.room.controller != undefined && creep.room.controller.reservation != undefined)
            {
                Game.flags[creep.memory.targetClaimFlag].memory.decayTimer = creep.room.controller.reservation.ticksToEnd;
            }
            
            //try to claim
            if(creep.memory.mode == 'reserve')
            {
                if(creep.reserveController(creep.room.controller) != OK)
                {
                    creep.moveTo(creep.room.controller);
                    creep.say("to controller");
                }
            }
            else if(creep.memory.mode == 'claim')
            {
                if(creep.claimController(creep.room.controller) != OK)
                {
                    creep.moveTo(creep.room.controller);
                    creep.say("to controller");
                }
            }
                
            else
            {
                if(Game.flags[creep.memory.targetClaimFlag].memory.decayTimer == undefined)
                {
                    Game.flags[creep.memory.targetClaimFlag].memory.decayTimer = 2;
                }
                
                else
                {
                    Game.flags[creep.memory.targetClaimFlag].memory.decayTimer += creep.getActiveBodyparts(CLAIM);
                }
            }
        }
        //otherwise move to the flag
        else
        {
            
            if(Game.flags[creep.memory.targetClaimFlag] != undefined && Game.flags[creep.memory.targetClaimFlag].pos != undefined)
            {
                creep.travelTo(Game.flags[creep.memory.targetClaimFlag]);
                //creep.moveTo(Game.flags[creep.memory.targetClaimFlag].pos);
                //creep.moveByPath(PathFinder.search(creep.pos,{pos: Game.flags[creep.memory.targetClaimFlag].pos, range:1},{maxOps: 999999,roomCallback: function(roomName){return global.ignoreCreepsCostMatrix(roomName);}}).path);
            }
            
        }
        
	}
};

module.exports = claimBot;