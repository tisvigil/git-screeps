var searchSpend = {

    //returns a target and activity given a creep that wants to spend energy
    run: function(creep)
    {
//console.log('searchSpend entered: ',creep.name,creep.memory.role);
        //get list of all potential ways to spend energy on map
        //refuel, build, repair, upgrade controller
        
        let jobType = '';
        let targets;
        
        //energy spending
        if(creep.carry[RESOURCE_ENERGY] > 0)
        {
            if(creep.memory.canRefuel)
            {
                let fillSpawns = true;
                let fillExtensions = true;
                
                if(ROOMS_NEXUS_ACTIVE[creep.pos.roomName])
                {
                    fillSpawns = false;
                }
                
                if(ROOMS_FLOWER_ACTIVE[creep.pos.roomName])
                {
                    fillExtensions = false;
                }
                
                //find structures needing energy
                if(creep.room.energyAvailable < creep.room.energyCapacityAvailable)
                {
                    targets = _.filter(creep.cacheFind(FIND_STRUCTURES), structure => 
                        (fillExtensions && structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity) ||
                        (fillSpawns && structure.structureType == STRUCTURE_SPAWN && structure.energy < structure.energyCapacity)
                    );
                }
                    
                if((targets == undefined || targets.length == 0) && fillExtensions)
                {
                    targets = _.filter(creep.cacheFind(FIND_STRUCTURES), structure => 
                        structure.structureType == STRUCTURE_TOWER && structure.energy < 0.9*structure.energyCapacity
                    );
                }
                
                if(targets == undefined || targets.length == 0)
                {
                    targets = _.filter(creep.cacheFind(FIND_STRUCTURES), structure => 
                        structure.structureType == STRUCTURE_LAB && structure.energy < structure.energyCapacity
                    );
                }
                
                if(targets != undefined && targets.length > 0)
                {
                    jobType = 'refuel';
                }
            }
            
            //if no structures needing energy, find structure repairs that need to be done
            if((targets == undefined || targets.length == 0) && (creep.memory.canRepair))
            {
                 targets;
                //first, find buildings that need repairs
                targets = _.filter(creep.cacheFind(FIND_STRUCTURES), structure => 
                    (structure.hits < structure.hitsMax &&
                    structure.structureType != STRUCTURE_ROAD &&
                    structure.structureType != STRUCTURE_WALL &&
                    structure.structureType != STRUCTURE_RAMPART &&
                    structure.structureType != STRUCTURE_KEEPER_LAIR &&
                    structure.structureType != STRUCTURE_PORTAL &&
                    structure.structureType != STRUCTURE_CONTROLLER)
                    ||
                    (structure instanceof StructureRoad && structure.hits < 3000)
                );
                
                if(targets.length > 0)
                {
                    jobType = 'repair';
                }
            }
    
            //if no structure repairs to be done, find things needing to be built
            if((targets == undefined || targets.length == 0) && (creep.memory.canBuild))
            {
                targets = _.filter(creep.cacheFind(FIND_CONSTRUCTION_SITES), c => c.my);
                
                if(targets.length > 0)
                {
                    jobType = 'build';
                }
            }
            
            //if no things needing to be built, find walls/ramparts that need repairs
            if((targets == undefined || targets.length == 0) && (creep.memory.canRepair))
            {
                if(targets.length == 0)
                {
                    targets = _.filter(creep.cacheFind(FIND_STRUCTURES), structure =>
                        (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) &&
                        structure.hits < structure.hitsMax
                    );
                }
                
                //find the target(s) with the least # HP
                if(targets.length > 0)
                {
                    targets = [_.min(targets, t => t.hits)];
                    jobType = 'repair';
                }
            }
            
            //if nothing needs to be repaired, drop it at a terminal if under a certain threshold
            if((targets == undefined || targets.length == 0) && creep.memory.canDepositEnergy)
            {
                let myStructures = creep.cacheFind(FIND_STRUCTURES);
    
                targets = _.filter(myStructures, s => 
                    (s instanceof StructureTerminal && _.sum(s.store) < s.storeCapacity && s.store[RESOURCE_ENERGY] < THRESHOLD_TERMINAL_WORKER_FILL_ENERGY)
                )
                if(targets.length > 0)
                {
                    jobType = 'depositEnergy';
                }
            }
            
    
            //if terminal is at quota energy, find the control node
            if((targets == undefined || targets.length == 0) && creep.room.controller != undefined && creep.memory.canUpgrade)
            {
                targets = [];
                targets.push(creep.room.controller);
                
                jobType = 'upgrade';
            }
    
            //if cannot upgrade, take energy to storage facility
            if((targets == undefined || targets.length == 0) && creep.memory.canDepositEnergy)
            {
                let myStructures = creep.cacheFind(FIND_STRUCTURES);
    
                targets = _.filter(myStructures, s => 
                    (s instanceof StructureStorage && _.sum(s.store) < s.storeCapacity) || 
                    (s instanceof StructureLink && Memory.links[s.id] != undefined && Memory.links[s.id].mode != undefined && Memory.links[s.id].mode == 'send' && s.energy < s.energyCapacity)
                )
                
                if(creep.room.controller.level < 6)
                {
                    targets = targets.concat(_.filter(myStructures, s => s instanceof StructureContainer && _.sum(s.store) < s.storeCapacity));
                }
                
                if(targets.length > 0)
                {
                    jobType = 'depositEnergy';
                }
            }
            
            //if cannot take to storage facility, find the nearest worker/upgrader and give them energy
            if(targets == undefined || targets.length == 0)
            {
                targets = _.filter(creep.cacheFind(FIND_MY_CREEPS), c => 
                    c.memory.role != undefined && 
                    (c.memory.role == 'worker' || c.memory.role == 'harvester' || c.memory.role == 'upgrader' || c.memory.role == 'remoteWorker') && 
                    (c.carryCapacity * 0.8 > _.sum(c.carry))
                );
    
                if(targets.length > 0)
                {
                    jobType = 'refuel';
                }
            }
        }
        
        //mineral spending
        else if(creep.memory.canDepositMinerals)
        {
            let myStructures = creep.cacheFind(FIND_STRUCTURES);
            targets = _.filter(myStructures, s => s instanceof StructureTerminal);
            
            if(targets == undefined || targets.length == 0)
            {
                targets = _.filter(myStructures, s => s instanceof StructureStorage);
            }
            
            if(targets.length > 0)
            {
                jobType = 'depositMinerals';
            }
        }
        
        //calculate costs for each location (based on activity type and distance)
        //find min cost and save index of that location

        let closest = creep.pos.findClosestByRange(targets,{range:1});

        if(closest != undefined)
        {
            creep.memory.targetId = closest.id;
            creep.memory.job = jobType;
        }
        
        //creep.memory.lastSearchSpend = Game.time;
        let packaged = {target: closest, job: jobType};
        return packaged;
    }
};

module.exports = searchSpend;
