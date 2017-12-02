var searchSource =
{

    //returns a target source for a creep that wants to get energy
    run: function(creep)
    {
//console.log('searchSource entered: ',creep.name,creep.memory.role);
        //iterate through all the parts of the creep, looking for WORK and CARRY
        let hasWorkPart = false;
        let hasCarryPart = false;
        let bodyPos = 0;
        
        while((!hasWorkPart || !hasCarryPart) && bodyPos < creep.body.length)
        {
            switch(creep.body[bodyPos].type)
            {
                case WORK:
                    hasWorkPart = true;
                    break;
                    
                case CARRY:
                    hasCarryPart = true;
            }
            bodyPos++;
        }
        
        var sourceCollection = []; //{source: , type: (dropped or source)}
        
        if(hasWorkPart && creep.memory.canMine)
        {
            //get list of all potential power sources on map
            let sources = _.filter(creep.cacheFind(FIND_SOURCES), s => s.energy > 0);
            
            for(var i = 0; i<sources.length; i++)
            {
                sourceCollection.push({source: sources[i], sourceType: 'source'});
            }
            
        }
        
        if(hasCarryPart && creep.memory.canPickupEnergy)
        {
            //add in dropped energy
            let dropped = creep.cacheFind(FIND_DROPPED_ENERGY);
            if(dropped.length > 0)
            {
                for(var i = 0; i < dropped.length; i++)
                {
                    sourceCollection.push({source: dropped[i], sourceType: 'drop'});
                }
            }
        }
        
        if(hasCarryPart && creep.memory.canWithdraw)
        {
            //get list of all storage locations on map
            let storages = _.filter(creep.cacheFind(FIND_STRUCTURES), structure => 
                ((structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store.energy > 0) || 
                (structure.structureType == STRUCTURE_TERMINAL && structure.store.energy > THRESHOLD_TERMINAL_WORKER_WITHDRAW_ENERGY) || 
                (structure.structureType == STRUCTURE_LINK && structure.energy > 0)
            );
            
            for(var i = 0; i<storages.length; i++)
            {
                sourceCollection.push({source: storages[i], sourceType: 'storage'});
            }
        }
        
        if(hasWorkPart && creep.memory.canDismantle && creep.room.controller.my)
        {
            let dismantleTargets = _.filter(creep.cacheFind(FIND_STRUCTURES), s => s.my === false && s.hits)
            
            for(var i = 0; i<dismantleTargets.length; i++)
            {
                sourceCollection.push({source: dismantleTargets[i], sourceType: 'dismantle'});
            }
        }
        
        let favoriteSource;
        
        if(sourceCollection.length > 0)
        {
            favoriteSource = _.min(sourceCollection, sc => creep.pos.getRangeTo(sc.source));
        }
        
        //write source to creep memory
        if(favoriteSource != undefined)
        {
            creep.memory.targetId = favoriteSource.source.id;
            
            if(favoriteSource.sourceType != undefined &&  favoriteSource.sourceType === 'source')
            {
                 creep.memory.job = 'mine';
            }
            
            else if(favoriteSource.sourceType != undefined &&  favoriteSource.sourceType === 'drop')
            {
                 creep.memory.job = 'pickupEnergy';
            }
            
            else if(favoriteSource.sourceType != undefined &&  favoriteSource.sourceType === 'storage')
            {
                 creep.memory.job = 'withdraw';
            }
            
            else if(favoriteSource.sourceType != undefined &&  favoriteSource.sourceType === 'dismantle')
            {
                 creep.memory.job = 'dismantle';
            }
            
        }
        
        //return minimum cost source
        return favoriteSource;

    }
};

module.exports = searchSource;
