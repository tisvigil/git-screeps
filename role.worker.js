var searchSource = require('search.source');
var searchSpend = require('search.spend');

//MEMORY
/*
String role = worker
String mode (spend or get)
String job (any of the acquire/spend names)
String targetId
boolean askAgain (if the job was undefined, ask again next turn)

(acquire energy)
boolean canMine
boolean canPickupEnergy
boolean canPickupMinerals
boolean canWithdraw
boolean canDismantle

(spend energy)
boolean canRefuel (into structures that can spawn creeps)
boolean canRepair
boolean canBuild
boolean canUpgrade
boolean canDepositEnergy (into storage structures)
boolean canDepositMinerals

maxCreep.run(Game.spawns['Spawn1'], 200, [WORK,MOVE,CARRY],
{role: 'worker', mode: 'spend', 
canMine:false, 
canPickupEnergy:false, 
canPickupMinerals:false, 
canWithdraw:false, 
canDismantle:false,
canRefuel:false,
canRepair:false,
canBuild:false,
canUpgrade:false,
canDepositEnergy:false,
canDepositMinerals:false});

*/

var roleWorker = 
{
    /** @param {Creep} creep **/
    run: function(creep) 
    {
        //STATE SWAPPING (incongruous state spend/get) =========================
        
        //if spend and job type is not correct, keep asking
        if(creep.memory.mode === 'spend')
        {
            if(creep.memory.job == undefined || 
                creep.memory.job === 'mine' ||
                creep.memory.job === 'pickupEnergy' ||
                creep.memory.job === 'pickupMinerals' ||
                creep.memory.job === 'withdraw' ||
                creep.memory.job === 'dismantle')
                {
                    searchSpend.run(creep);
                }
        }

        //if get and job type is not correct, keep asking
        else if(creep.memory.mode === 'get')
        {
            if(creep.memory.job == undefined || 
                creep.memory.job === 'refuel' ||
                creep.memory.job === 'repair' ||
                creep.memory.job === 'build' ||
                creep.memory.job === 'upgrade' ||
                creep.memory.job === 'depositEnergy' ||
                creep.memory.job === 'depositMinerals')
                {
                    searchSource.run(creep);
                }
        }
        
        // STATE SWAPPING (completed objective) ================================
        let gameObject = Game.getObjectById(creep.memory.targetId);

        if
        (
            (creep.memory.job === 'mine' && gameObject.energy === 0) ||
            (creep.memory.job === 'pickupEnergy' && gameObject == undefined) ||
            (creep.memory.job === 'pickupMinerals' && gameObject == undefined) ||
            (creep.memory.job === 'withdraw' && (gameObject instanceof StructureContainer || gameObject instanceof StructureStorage) && (gameObject == undefined || gameObject.store[RESOURCE_ENERGY] == 0)) ||
            (creep.memory.job === 'withdraw' && gameObject instanceof StructureLink && (gameObject == undefined || gameObject.energy == 0)) ||
            (creep.memory.job === 'dismantle' && gameObject == undefined)
        )
        {
             searchSource.run(creep);
        }
        
        else if
        (
            (creep.memory.job === 'repair' && (gameObject == undefined || gameObject.hits === gameObject.hitsMax)) ||
            (creep.memory.job === 'build' && gameObject == undefined) ||
            (creep.memory.job === 'upgrade' && (gameObject == undefined || !gameObject.my)) ||
            (creep.memory.job === 'depositEnergy' && (gameObject == undefined || gameObject.storeCapacity == _.sum(gameObject.store) || (gameObject.energy && gameObject.energy == gameObject.energyCapacity))) ||
            (creep.memory.job === 'depositMinerals' && (gameObject == undefined || gameObject.storeCapacity == _.sum(gameObject.store))) ||
            (creep.memory.job === 'refuel' && 
                (
                    gameObject == undefined || 
                    (gameObject instanceof Structure && gameObject.energyCapacity == gameObject.energy) ||
                    (gameObject instanceof Creep && gameObject.carryCapacity * 0.8 <= _.sum(gameObject.carry))
                )
            )
            
        )
        {
            searchSpend.run(creep);
        }
        
        //STATE SWAPPING (energy left) =========================================
        if(_.sum(creep.carry) == 0 && creep.memory.mode === 'spend')
        {
            creep.memory.mode = 'get';
            
            //find target
            searchSource.run(creep);
        }
        
        if(_.sum(creep.carry) == creep.carryCapacity && creep.memory.mode === 'get')
        {
            creep.memory.mode = 'spend';
            
            //find target
            searchSpend.run(creep);
        }
        
        //if not mining, 30% energy = spend
        if(_.sum(creep.carry) > 0.3 * creep.carryCapacity && creep.memory.job != 'mine' && creep.memory.mode === 'get')
        {
            creep.memory.mode = 'spend';
            
            //find target
            searchSpend.run(creep);
        }
        
        creep.say(creep.memory.job);
        
        //GET FUNCTIONS ========================================================
        
        gameObject = Game.getObjectById(creep.memory.targetId);
        
        if(creep.memory.job === 'mine')
        {
            if(creep.harvest(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'pickupEnergy')
    	{
    	    if(creep.pickup(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
    	}
    	
    	/*
    	else if(creep.memory.job === 'pickupMinerals')
    	{
    	}
    	*/
    	
    	else if(creep.memory.job === 'withdraw')
    	{
    	    if(creep.withdraw(gameObject, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
    	}
    	
    	else if(creep.memory.job === 'dismantle')
    	{
    	    if(creep.dismantle(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
    	}
    	
        //SPEND FUNCTION =======================================================
        
        //road repair
        if(creep.carry[RESOURCE_ENERGY] != undefined && creep.carry[RESOURCE_ENERGY] > 0)
        {
            creep.repairStandingRoad();
        }

        if(creep.memory.job === 'repair')
        {
            if(creep.repair(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'build')
        {
            if(creep.build(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'upgrade')
        {
            if(creep.upgradeController(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'depositEnergy')
        {
            if(creep.transfer(gameObject, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'depositMinerals')
        {
            if(creep.transferAny(gameObject) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
        
        else if(creep.memory.job === 'refuel')
        {
            if(creep.transfer(gameObject, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(gameObject,{maxRooms:1});
            }
        }
	}
};

module.exports = roleWorker;