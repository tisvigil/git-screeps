require('operation.market.globals');

global.runMarketOperation = function()
{
    if(Game.time % MOD_RUN_MARKET == 0 || Memory.runMarketOperationAgain)
    {
        hashMarketToTemp();
        
        let terminals = _.filter(Game.structures, s => s instanceof StructureTerminal);
        
        for(let t of terminals)
        {
            if(Memory.structures == undefined)
            {
                Memory.structures = {};
            }
            
            if(Memory.structures[t.id] == undefined)
            {
                Memory.structures[t.id] = {}
            }
            
            t.sellAllMinerals();
            //t.closeEnergyDeficit();
            let energySendSolutionFound = false;
            if(
                t.store.energy > THRESHOLD_TERMINAL_SEND_AWAY_ENERGY && 
                ROOM_TO_BOOST &&
                t.pos.roomName != ROOM_TO_BOOST && 
                Game.rooms[ROOM_TO_BOOST].terminal && 
                _.sum(Game.rooms[ROOM_TO_BOOST].terminal.store) < 280000
            )
            {
                energySendSolutionFound = true;
                t.send(RESOURCE_ENERGY, Math.min(t.store.energy - THRESHOLD_TERMINAL_SEND_AWAY_ENERGY, 300000 - _.sum(Game.rooms[ROOM_TO_BOOST].terminal.store)),ROOM_TO_BOOST);
            }
            else if(t.pos.roomName != ROOM_TO_BOOST && t.store.energy > THRESHOLD_TERMINAL_SELL_ENERGY)
            {
                let bestEnergySell = t.findBestEnergySell();
                let theDeal;
                if(bestEnergySell != undefined && bestEnergySell != null)
                {
                    theDeal = bestEnergySell.order;
                    t.maxDeal(theDeal.id,t.store.energy - THRESHOLD_TERMINAL_SELL_ENERGY);
                }
            }
            
            /*
            if(Memory.structures[t.id].stationTrade)
            {
                t.stationTrade();
            }
            */
        }
    }
}