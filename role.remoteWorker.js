
//extends operation.worker
var roleWorker = require('role.worker');

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep)
    {
        //if the creep is in the room, run builder script
       if(creep.room.name == creep.memory.targetRoom)
       {
           roleWorker.run(creep);
       }
       
       else
       {
           if(Game.rooms[creep.memory.targetRoom] != undefined)
           {
               creep.drop(RESOURCE_ENERGY);
               creep.travelTo(Game.rooms[creep.memory.targetRoom].controller);
           }
       }
	}
};

