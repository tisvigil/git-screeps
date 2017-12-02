
module.exports = {
    
    run: function(creep)
    {
        if(creep.pos.roomName != creep.memory.roomToScout)
        {
            creep.moveTo(new RoomPosition(25,25,creep.memory.roomToScout));
        }
        
        else
        {
            creep.moveTo(creep.room.controller, {range:2, maxRooms: 1})
        }
        
        
    }

};