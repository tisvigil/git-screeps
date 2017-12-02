'use strict'

require ('globals');
require ('operation.market');
require ('operation.reporting');

require ('import.bonzaiferroni.traveler');

//let roleHarvester = require('role.harvester');
let roleDefender = require('role.defender');
let roleCombat = require('role.combat');
let roleWorker = require('role.worker');
let roleScout = require('role.scout');
let roleMineBot = require('operation.mining.mineBot');
let roleMineTransport = require('operation.mining.mineTransport');
let roleRemoteWorker = require('role.remoteWorker');
let roleClaimBot = require('operation.claim.claimBot');
let roleNexusBot = require('operation.base.refuel.nexus.bot');
let roleFlowerBot = require('operation.base.refuel.flower.bot');

let roleTower = require('role.tower');
let roleLink = require('role.link');

let miningOperation = require('operation.mining');
let claimOperation = require('operation.claim');
let baseOperation = require('operation.base');
let baseOperationSurplus = require('operation.base.surplus');
require('operation.market');

module.exports.loop = function () 
{   
    if(REPORT_CPU || REPORT_SPAWN)
    {
        console.log();
        console.log(Game.time);
    }
    
    //CLEAR MEMORY / FLAG OPERATIONS============================================
        //temp place to hold memory
    global.temp = {};
    
        //all creeps sorted by role into temp
    temp.creeps = _.groupBy(Game.creeps, c => c.memory.role);
    
        //cpu tracking (relies on defined temp variable)
    startCPU('main');
    
        //clear outdated memory entries
    garbageCollection();
    
    // ITERATE CREEPS ==========================================================
    startCPU('creeps');
    for(let role in temp.creeps)
    {
        let roleToRun;

        switch(role)
        {
            case 'harvester':
                roleToRun = roleWorker;
                break;
            case 'worker':
                roleToRun = roleWorker;
                break;
            case 'messenger':
                roleToRun = roleWorker;
                break;
            case 'upgrader':
                roleToRun = roleWorker;
                break;
            case 'repairer':
                roleToRun = roleWorker;
                break;
            case 'defender':
                roleToRun = roleDefender;
                break;
            case 'combat':
                roleToRun = roleCombat;
                break;
            case 'combat2':
                roleToRun = roleCombat;
                break;
            case 'scout':
                roleToRun = roleScout;
                break;
            case 'mineBot':
                roleToRun = roleMineBot;
                break;
            case 'mineTransport':
                roleToRun = roleMineTransport;
                break;
            case 'remoteWorker':
                roleToRun = roleRemoteWorker;
                break;
            case 'claimer':
                roleToRun = roleClaimBot;
                break;
            case 'nexusBot':
                roleToRun = roleNexusBot;
                break;
            case 'flowerBot':
                roleToRun = roleFlowerBot;
                break;
                
        }
        
        if(roleToRun != undefined)
        {
            startCPU(role);
            for(let cr of temp.creeps[role])
            {

                if(!cr.spawning)
                {
                    roleToRun.run(cr);
                }
            }
            endrCPU(role);
        }
    }
    endCPU('creeps');
    
    startCPU('structures');
    for(let name in Game.structures)
    {
        let building = Game.getObjectById(name);
        
        if(building.structureType == STRUCTURE_TOWER)
        {
            roleTower.run(building);
        }
        else if(building instanceof StructureLink)
        {
            roleLink.run(building);
        }
    }
    endCPU('structures');
    
    //RUN GLOBAL OPERATIONS FROM FLAGS =========================================
    startCPU('base');
    baseOperation.run();
    endrCPU('base');

    startCPU('mining');
    miningOperation.run();
    endrCPU('mining');
    
    startCPU('claim');
    claimOperation.run();
    endrCPU('claim');
    
    startCPU('baseSurplus');
    baseOperationSurplus.run();
    endrCPU('baseSurplus');
    
    startCPU('market');
    runMarketOperation();
    endrCPU('market');
    
    //REPORTING
    spawnMetrics();
    endCPU('main');
    
    let recordedCPU = reportCPU('main');
    let usedCPU = round(Game.cpu.getUsed(),2);
    let fringeCPU = round(usedCPU - recordedCPU, 2);
    
    let avgRecorded = runningAverage(recordedCPU,'observedCPU',100);
    let avgFringe = runningAverage(fringeCPU,'fringeCPU',100);
    let avgUsed = runningAverage(usedCPU,'totalCPU',100);
    
    if(REPORT_CPU)
    {
        console.log
        (
            'total: ' + 
            recordedCPU + '(' + avgRecorded + ') + ' + 
            fringeCPU + '(' + avgFringe + ') = ' +
            usedCPU + '(' + avgUsed + '), bucket = ' + Game.cpu.bucket
        );
    }
}