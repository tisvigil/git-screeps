/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('operation.base.surplus');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    
    run: function()
    {
        let myRooms = _.filter(Game.rooms,r => r.controller != undefined && r.controller.my)
        
        _.forEach(myRooms, function(theRoom)
        {
            //determine energy state
            let storageStructures = _.filter(theRoom.cacheFind(FIND_STRUCTURES), s => s.structureType == STRUCTURE_STORAGE ||  s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_TERMINAL);
            let structureEnergy = _.sum(storageStructures, s => s.store[RESOURCE_ENERGY]);
            let totalCapacity = _.sum(storageStructures, s => s.storeCapacity);
            
            let targetSoldierNumber = 0;
            let targetSoldier2Number = 0;
            
            if(ROOMS_SPAWN_COMBAT[theRoom.name] && structureEnergy > THRESHOLD_ROOM_NO_MORE_OFFENSE)
            {
                targetSoldierNumber = TARGET_SOLDIER;
                targetSoldier2Number = TARGET_SOLDIER_2;
            }
            
            let soldiers = _.filter(temp.creeps.combat, c => c.memory.spawnRoom == theRoom.name);
            let soldiers2 = _.filter(temp.creeps.combat2, c => c.memory.spawnRoom == theRoom.name);
            let upgraders = _.filter(temp.creeps.upgrader, c => c.memory.spawnRoom == theRoom.name);
            let workers = _.filter(temp.creeps.worker, c => c.memory.spawnRoom == theRoom.name);
            
            //bonus spawns
            if(soldiers.length < targetSoldierNumber)
            {
                spawnCreep(theRoom, creepCost(SOLDIER_BODY), SOLDIER_BODY, {role: 'combat'});
            }
            
            else if(soldiers2.length < targetSoldier2Number)
            {
                spawnCreep(theRoom, creepCost(SOLDIER_BODY_2), SOLDIER_BODY_2, {role: 'combat2'});
            }
            
            else if(structureEnergy != 0 && theRoom.controller.level < 8 && workers.length < 10 && (structureEnergy >= 0.9*totalCapacity || structureEnergy > TARGET_ROOM_RESERVE_ENERGY_BY_LEVEL[theRoom.controller.level]))
            {
                spawnCreep(theRoom, 0, [MOVE,WORK,CARRY,WORK], {role: 'worker', mode: 'spend', 
                    canMine:false, 
                    canPickupEnergy:true, 
                    canPickupMinerals:false, 
                    canWithdraw:true, 
                    canDismantle:false,
                    canRefuel:false,
                    canRepair:false,
                    canBuild:true,
                    canUpgrade:true,
                    canDepositEnergy:false,
                    canDepositMinerals:false});
            }
            
            else if(upgraders.length < 1 && theRoom.controller.level == 8 && structureEnergy > TARGET_ROOM_RESERVE_ENERGY_BY_LEVEL[theRoom.controller.level])
            {
               spawnCreep(theRoom, 3000, [WORK,MOVE,CARRY], {role: 'upgrader', mode: 'spend', 
                        canMine:false, 
                        canPickupEnergy:false, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:false,
                        canRefuel:false,
                        canRepair:false,
                        canBuild:false,
                        canUpgrade:true,
                        canDepositEnergy:false,
                        canDepositMinerals:false});
            }
        });
    }
};