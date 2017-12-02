Creep.prototype.withdrawAny = function(t)
{
    let lastErrorCode;
    
    if(_.sum(t.store) > 0)
    {
        for(let r in t.store)
        {
            lastErrorCode = this.withdraw(t,r);
            if(lastErrorCode == OK)
            {
                break;
            }
        }
        
        return lastErrorCode;
    }
}

Creep.prototype.transferAny = function(t)
{
    let lastErrorCode;
    
    if(_.sum(this.carry)>0)
    {
        for(let r in this.carry)
        {
            lastErrorCode = this.transfer(t,r);
            if(lastErrorCode == OK)
            {
                break;
            }
        }
        
        return lastErrorCode;
    }
}

Creep.prototype.blueprint = function()
{
    if(!this.memory.blueprint)
    {
        let index = {};
        let body = this.body;
        
        _.forEach(body, p => {
            if(!index[p.type])
            {
                index[p.type] = 0;
            }
            
            index[p.type]++;
        })
        
        this.memory.blueprint = index;
    }
    
    return this.memory.blueprint;
}

Creep.prototype.activeParts = function(part)
{
    if(!temp[this.id])
    {
        temp[this.id] = {};
    }
    
    if(!temp[this.id][part])
    {
        temp[this.id][part] = this.getActiveBodyparts(part);
    }
    
    return temp[this.id][part];
}

Creep.prototype.lookWithinRange = function(ran)
{
    if(!temp[this.id])
    {
        temp[this.id] = {};
    }
    
    if(!temp[this.id][ran])
    {
        temp[this.id][ran] = this.room.lookAtArea(Math.max(0, this.pos.y - ran), Math.max(0, this.pos.x - ran), Math.min(49, this.pos.y + ran), Math.min(49, this.pos.x + ran), true);
    }
    
    return temp[this.id][ran];
}


Creep.prototype.combatSomething = function()
{
    let lookRange;
    if(this.activeParts(RANGED_ATTACK) > 0 || this.activeParts(HEAL) > 0)
    {
        lookRange = 3;
    }
    
    else if(this.activeParts(ATTACK) > 0 || this.activeParts(WORK) > 0)
    {
        lookRange = 1;
    }
    
    //if lookRange is defined, it means there is some kind of active combat part
    if(lookRange)
    {
        let theLook = this.lookWithinRange(lookRange);
        
        //FIND TARGETS =========================================================
        
        //ANY CREEPS: if any of these, we need to look at creeps
        let theCreeps;
        if(this.activeParts(ATTACK) || this.activeParts(RANGED_ATTACK) || this.activeParts(HEAL))
        {
            theCreeps = _.map(_.filter(theLook, l => l.type == LOOK_CREEPS), c => c[LOOK_CREEPS]);
        }
        
        //FRIENDLY CREEPS: if heal parts, we need to find allied creeps, melee and any
        let hurtFriendlyCreeps;
        let hurtFriendlyMeleeCreeps;
        if(this.activeParts(HEAL))
        {
            hurtFriendlyCreeps = _.filter(theCreeps, c => ALLIES[c.owner.username] && c.hits < c.hitsMax);
            hurtFriendlyMeleeCreeps = _.filter(hurtFriendlyCreeps, fc => this.pos.getRangeTo(fc) < 2);
        }
        
        //ENEMY CREEPS: if ranged or attack parts, we need enemy creeps
        let enemyCreeps;
        if(this.activeParts(ATTACK) || this.activeParts(RANGED_ATTACK))
        {
            enemyCreeps = _.filter(theCreeps, c => !ALLIES[c.owner.username]);
        }
        
        //if attack parts, we need to find enemy melee creeps
        let enemyMeleeCreeps;
        if(this.activeParts(ATTACK) && enemyCreeps.length > 0)
        {
            enemyMeleeCreeps = _.filter(enemyCreeps, c => this.pos.getRangeTo(c) < 2);
        }
        
        // STRUCTURES: if (ranged and no enemy creeps) || (melee and no melee creeps) || (work), find enemy structures -- only if creep is not in a friendly location
        let enemyStructures;
        let enemyMeleeStructures;

        if(
            (
                (this.room.controller && !this.room.controller.my) || 
                (this.room.controller && this.room.controller.owner && !ALLIES[this.room.controller.owner.username]) ||
                !this.room.controller
            ) &&
            (
                (this.activeParts(RANGED_ATTACK) && (enemyCreeps == undefined ||(enemyCreeps != undefined && enemyCreeps.length == 0))) ||
                (this.activeParts(ATTACK) && (enemyMeleeCreeps == undefined || (enemyMeleeCreeps != undefined && enemyMeleeCreeps.length == 0))) ||
                this.activeParts(WORK)
            )
        )
        {
            let unpeeledStructures = _.map(_.filter(theLook, l => l.type == LOOK_STRUCTURES), c => c[LOOK_STRUCTURES]);
            enemyStructures = _.filter(unpeeledStructures, s =>
                s.hits > 0 &&
                s instanceof OwnedStructure &&
                !(s instanceof StructurePowerBank) &&
                !(s instanceof StructureRampart)
            )
            
            //if after the search, there are no matches, include bastion+wall+container
            if(enemyStructures.length == 0)
            {
                enemyStructures = _.filter(unpeeledStructures, s =>
                    s instanceof StructureContainer ||
                    s instanceof StructureWall ||
                    s instanceof StructureRampart
                );
            }
            
            //if (melee and no melee creeps) || (work), find melee structures
            if((this.activeParts(ATTACK) && (enemyMeleeCreeps == undefined || (enemyMeleeCreeps != undefined && enemyMeleeCreeps.length == 0)) || this.activeParts(WORK)))
            {
                if(lookRange == 1)
                {
                    enemyMeleeStructures = enemyStructures;
                }
                
                else
                {
                    enemyMeleeStructures = _.filter(enemyStructures, s => this.pos.getRangeTo(s.pos) < 2);
                    
                    //if after the search, there are no matches, include bastion+wall+container
                    if(enemyMeleeStructures.length == 0)
                    {
                        enemyMeleeStructures = _.filter(unpeeledStructures, s =>
                            this.pos.getRangeTo(s) < 2 &&
                            (s instanceof StructureContainer ||
                            s instanceof StructureWall ||
                            s instanceof StructureRampart)
                        );
                    }
                }
            }
        }
        
        //ACT ON TARGETS =======================================================
        let tree1 = false;
        let tree2 = false;
        let meleeHealed = false;
        
        //axis 1
        if(enemyMeleeCreeps != undefined && enemyMeleeCreeps.length > 0 && this.attack(_.min(enemyMeleeCreeps, c => c.hits)) == OK)
        {
//console.log(this,'in attack tree', _.min(enemyMeleeCreeps, c => c.hits),this.attack(_.min(enemyMeleeCreeps, c => c.hits)))
            tree1 = true;
        }
        if(!tree1 && enemyMeleeStructures != undefined && enemyMeleeStructures.length > 0)
        {
            let lowestHPStructure = _.min(enemyMeleeStructures, c => c.hits);
            if(this.activeParts(ATTACK) && this.attack(lowestHPStructure) == OK)
            {
                tree1 = true;
            }
            
            else if(this.activeParts(WORK) && this.dismantle(lowestHPStructure) == OK)
            {
                tree1 = true;
            }
        }
        
        if(!tree1 && hurtFriendlyMeleeCreeps != undefined && hurtFriendlyMeleeCreeps.length > 0)
        {

            let lowestHPAlly = _.min(hurtFriendlyMeleeCreeps, c => c.hits);
//console.log(this,'inside hurt creep', lowestHPAlly)
            if(this.heal(lowestHPAlly) == OK)
            {
                tree1 = true;
                meleeHealed = true;
            }
        }
        
        //axis 2
        if(enemyCreeps != undefined && enemyCreeps.length > 0 && this.activeParts(RANGED_ATTACK))
        {
            let closestCreep = this.pos.findClosestByRange(enemyCreeps);
            let rangeTo = this.pos.getRangeTo(closestCreep);
            if(rangeTo == 1 && this.rangedMassAttack() == OK)
            {
                tree2 = true;
            }
            
            else if(rangeTo > 1 && this.rangedAttack(closestCreep) == OK)
            {
                tree2 = true;
            }
        }
        
        if(!tree2 && !tree1 && !meleeHealed && hurtFriendlyCreeps != undefined && hurtFriendlyCreeps.length > 0 && this.rangedHeal(_.min(hurtFriendlyCreeps, c => c.hits)) == OK)
        {
            tree2 = true
        }
        
        if(!tree2 && enemyStructures != undefined && enemyStructures.length > 0)
        {
            let closestStructure = this.pos.findClosestByRange(enemyStructures);
            let rangeTo = this.pos.getRangeTo(closestStructure);
            if(rangeTo == 1 && closestStructure.owner != undefined && this.rangedMassAttack() == OK)
            {
                tree2 = true;
            }
            
            else if(this.rangedAttack(closestStructure) == OK)
            {
                tree2 = true;
            }
        }
    }
}

Creep.prototype.repairStandingRoad = function()
{
    let workParts = this.activeParts(WORK);
    
    if(workParts > 0)
    {
        let lookPos = _.filter(this.room.lookAt(this.pos), o => o.type == 'structure' && o.structure instanceof StructureRoad && o.structure.hits < o.structure.hitsMax);
        let repairTarget;
        let stayInPlace = false;
        if(lookPos != undefined && lookPos.length > 0)
        {
            repairTarget = lookPos[0].structure;
            if(repairTarget.hits + workParts*100 < repairTarget.hitsMax)
            {
                stayInPlace = true;
            }
        }
        
        if(repairTarget != undefined)
        {
            this.repair(repairTarget);
            return stayInPlace;
        }
    }
    
    return false;
}

Creep.prototype.repairAdjacentContainers = function()
{
    let workParts = this.activeParts(WORK);
    
    if(workParts > 0)
    {
        let lookPos = _.filter(_.map(this.safeLookForAtArea(LOOK_STRUCTURES, 1), l => l[LOOK_STRUCTURES]), s => s instanceof StructureContainer && s.hits < s.hitsMax);
        let repairTarget;
        let stayInPlace = false;
        if(lookPos != undefined && lookPos.length > 0)
        {
            repairTarget = lookPos[0];
            if(repairTarget.hits + workParts*100 < repairTarget.hitsMax)
            {
                stayInPlace = true;
            }
        }
        
        if(repairTarget != undefined)
        {
            this.repair(repairTarget);
            return stayInPlace;
        }
    }
    
    return false;
}
