require ('operation.base.AI')
require ('operation.base.refuel')

module.exports = {
    
    run: function()
    { 
        //ITERATE ON EACH ROOM =====================================================
        let myRooms = _.filter(Game.rooms,r => r.controller != undefined && r.controller.my)
        
        _.forEach(myRooms, function(theRoom)
        {
            //DOOMSDAY OPERATIONS (activate safe mode if any of these are damaged)
            let preciousStructures = _.filter(theRoom.cacheFind(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_TOWER)
            let damagedPrecious = _.filter(preciousStructures, s => s.hits < s.hitsMax);
    
            if(damagedPrecious != undefined && damagedPrecious.length > 0)
            {
                theRoom.controller.activateSafeMode();
            }
            
            //AI BUILDING
            //buildByRCL(theRoom);
            
            //SPAWN QUOTAS
            let targetHarvesterNumber;
            let targetUpgraderNumber;
            let targetRepairerNumber;
            let targetWorkerNumber;
            let targetMessengerNumber;
            
            let storagePresent = _.filter(theRoom.cacheFind(FIND_STRUCTURES), s => s instanceof StructureStorage || s instanceof StructureContainer).length > 0;
            if(!storagePresent)
            {
                targetHarvesterNumber = 1;
                targetUpgraderNumber = 1;
                targetRepairerNumber = 0;
                targetWorkerNumber = 0;
                targetMessengerNumber = 0;
            }
            
            else if(theRoom.controller.level <= 4)
            {
                targetHarvesterNumber = 1;
                targetUpgraderNumber = 1;
                targetRepairerNumber = 1;
                targetWorkerNumber = 0;
                targetMessengerNumber = 0;
            }
            
            else if(theRoom.controller.level > 4)
            {
                targetHarvesterNumber = 0;
                targetUpgraderNumber = 1;
                targetRepairerNumber = 1;
                targetWorkerNumber = 0;
                targetMessengerNumber = 1;
            }
            
            //special logic for rooms with claim flags
            let roomClaimFlags = _.filter(Game.flags, f => f.pos.roomName == theRoom.name && f.name.search('claim') != -1)
            if(roomClaimFlags.length > 0)
            {
                targetHarvesterNumber = 0;
                targetWorkerNumber = 0;
            }
            
            //special logic for rooms with both nexus and flower implemented
            if(ROOMS_NEXUS_ACTIVE[theRoom.name] && ROOMS_FLOWER_ACTIVE[theRoom.name])
            {
                targetMessengerNumber = 0;
            }
            
            //spawn decision making
                //new field, creep.memory.spawnRoom
            let harvesters = _.filter(temp.creeps.harvester, c => c.memory.spawnRoom == theRoom.name);
            let repairers = _.filter(temp.creeps.repairer, c => c.memory.spawnRoom == theRoom.name);
            let upgraders = _.filter(temp.creeps.upgrader, c => c.memory.spawnRoom == theRoom.name);
            let workers = _.filter(temp.creeps.worker, c => c.memory.spawnRoom == theRoom.name);
            let messengers = _.filter(temp.creeps.messenger, c => c.memory.spawnRoom == theRoom.name);
            
            if(harvesters.length < 1 && workers.length < 1 && upgraders.length < 1 && messengers.length < 1)
            {
                console.log(spawnCreep(theRoom, 300, [WORK,MOVE,CARRY], {role: 'harvester', mode: 'spend', 
                        canMine:true, 
                        canPickupEnergy:true, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:false,
                        canRefuel:true,
                        canRepair:false,
                        canBuild:true,
                        canUpgrade:true,
                        canDepositEnergy:true,
                        canDepositMinerals:false}))
            }
            
            operationBaseRefuel(theRoom.name);
            
            if(harvesters.length < targetHarvesterNumber)
            {
                spawnCreep(theRoom, 1200, [WORK,MOVE,CARRY], {role: 'harvester', mode: 'spend', 
                        canMine:true, 
                        canPickupEnergy:true, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:false,
                        canRefuel:true,
                        canRepair:false,
                        canBuild:true,
                        canUpgrade:true,
                        canDepositEnergy:true,
                        canDepositMinerals:false});
            }
            
            else if(messengers.length < targetMessengerNumber)
            {
                spawnCreep(theRoom, 1500, [MOVE,CARRY,CARRY], {role: 'messenger', mode: 'spend', 
                        canMine:false, 
                        canPickupEnergy:true, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:false,
                        canRefuel:true,
                        canRepair:false,
                        canBuild:false,
                        canUpgrade:false,
                        canDepositEnergy:false,
                        canDepositMinerals:false});
            }
            
            else if(upgraders.length < targetUpgraderNumber && theRoom.controller.my && theRoom.controller.ticksToDowngrade < 3000)
            {
                spawnCreep(theRoom, creepCost([WORK,MOVE,CARRY]), [WORK,MOVE,CARRY], {role: 'upgrader', mode: 'spend', 
                        canMine:true, 
                        canPickupEnergy:true, 
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

            else if(workers.length < targetWorkerNumber)
            {
                spawnCreep(theRoom, 600, [MOVE,WORK,CARRY,WORK], {role: 'worker', mode: 'spend', 
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
            
            else if(repairers.length < targetRepairerNumber)
            {
                spawnCreep(theRoom, 1500, [WORK,CARRY,MOVE,MOVE], {role: 'repairer', mode: 'spend', 
                        canMine:false, 
                        canPickupEnergy:false, 
                        canPickupMinerals:false, 
                        canWithdraw:true, 
                        canDismantle:false,
                        canRefuel:false,
                        canRepair:true,
                        canBuild:true,
                        canUpgrade:false,
                        canDepositEnergy:false,
                        canDepositMinerals:false});
            }
            
        });
    }

};