StructureTerminal.prototype.unitCost = function (roo)
{
    return Game.market.calcTransactionCost(1000000,this.pos.roomName,roo)/1000000;
};

StructureTerminal.prototype.findBestEnergyBuy = function()
{
    let energySellOrders = temp.market[ORDER_SELL][RESOURCE_ENERGY];
    let bestOrder = _.max(energySellOrders, o => (1 - this.unitCost(o.roomName)) / o.price);
    
    return {order: bestOrder, energyPerCredit: (1 - this.unitCost(bestOrder.roomName)) / bestOrder.price};
}

StructureTerminal.prototype.findBestEnergySell = function()
{
    let energySellOrders = temp.market[ORDER_BUY][RESOURCE_ENERGY];
    let bestOrder;
    
    if(energySellOrders.length > 0)
    {
        bestOrder = _.max(energySellOrders, o => o.price/(1 + this.unitCost(o.roomName)));
    }
    
    if(bestOrder)
    {
        return {order: bestOrder, creditsPerEnergy: bestOrder.price/(1 + this.unitCost(bestOrder.roomName))};
    }
    
    else
    {
        return null;
    }
}


StructureTerminal.prototype.findBestMineralBuyOrder = function(m)
{
    let buyOrders = _.filter(temp.market[ORDER_BUY][m], o => o.amount > 0);
    let bestOrder;
    
    if(buyOrders.length > 0)
    {
        bestOrder = _.max(buyOrders, o => (o.price - this.unitCost(o.roomName)*ASSUME_ENERGY_PRICE));
        return {order: bestOrder, creditsPerMineral: (bestOrder.price - this.unitCost(bestOrder.roomName)*ASSUME_ENERGY_PRICE)}
    }
    
    else
    {
        return null;
    }
}

StructureTerminal.prototype.findBestMineralSellOrder = function(m)
{
    let sellOrders = _.filter(temp.market[ORDER_SELL][m], o => o.amount > 0);
    let bestOrder;
    
    if(sellOrders.length > 0)
    {
        bestOrder = _.min(sellOrders, o => (o.price + this.unitCost(o.roomName)*ASSUME_ENERGY_PRICE));
        return {order: bestOrder, creditsPerMineral: (bestOrder.price + this.unitCost(bestOrder.roomName)*ASSUME_ENERGY_PRICE)};
    }
    
    else
    {
        return null;
    }
}

//transact the greatest number of units possible
StructureTerminal.prototype.maxDeal = function (id, orderLimit = 300000)
{
    let theOrder = Game.market.getOrderById(id);
    
    //if we are selling
    if(theOrder.type == ORDER_BUY)
    {
        let maxByAvail = theOrder.amount;
        let maxByEnergy;
        let maxByStoredInTerminal = this.store[theOrder.resourceType];
        
        if(theOrder.resourceType == RESOURCE_ENERGY)
        {
            maxByEnergy = Math.round(this.store[RESOURCE_ENERGY]/(1+this.unitCost(theOrder.roomName)) * 0.95);
        }
        
        else
        {
            maxByEnergy = Math.round(this.store[RESOURCE_ENERGY]/this.unitCost(theOrder.roomName) * 0.95);
        }
        
        return Game.market.deal(theOrder.id,Math.min(maxByAvail,maxByEnergy,maxByStoredInTerminal,orderLimit),this.pos.roomName);
    }
    
    //if we are buying
    else if(theOrder.type == ORDER_SELL)
    {
        let maxByAvail = theOrder.amount;
        let maxByEnergy = Math.round(this.store[RESOURCE_ENERGY]/this.unitCost(theOrder.roomName) * 0.95);
        let maxSpaceInTerminal = this.storeCapacity - _.sum(this.store);
        let maxByCredits = Math.floor(Game.market.credits / theOrder.price);
        
        return Game.market.deal(theOrder.id,Math.min(maxByAvail,maxByEnergy,maxSpaceInTerminal,maxByCredits,orderLimit),this.pos.roomName);
    }
}

StructureTerminal.prototype.sellAllMinerals = function(term)
{
    for(let m in this.store)
    {
        if(m != RESOURCE_ENERGY)
        {
            let theDeal = this.findBestMineralBuyOrder(m);
            
            if(theDeal != null)
            {
                let creditsPerMineral = theDeal.creditsPerMineral;
                let order = theDeal.order;
                
                //sanity check
                if(
                    creditsPerMineral > 0.5*order.price &&
                    creditsPerMineral > 0.05
                )
                {
                    this.maxDeal(order.id);
                }
            }
        }
    }
}

//buy up to the desired quota of energy
StructureTerminal.prototype.closeEnergyDeficit = function()
{
    let theDeficit = THRESHOLD_TERMINAL_BUY_ENERGY - this.store[RESOURCE_ENERGY];
    
    if(theDeficit > 0 && this.room.controller.level < 8)
    {
        //first, try to buy
        let buyEnergySearch = this.findBestEnergyBuy();
        if(buyEnergySearch.energyPerCredit >= 1/BUY_ENERGY_PRICE)
        {
            let theDeal = buyEnergySearch.order;
            return this.maxDeal(theDeal.id,theDeficit);
        }
        
        //if no good deals, create a buy order or update an existing buy order
        else
        {
            let myEnergyOrders = _.filter(Game.market.orders, o => o.type == ORDER_BUY && o.resourceType == RESOURCE_ENERGY && o.roomName == this.pos.roomName);
            let theEnergyOrder;
            if(myEnergyOrders != undefined && myEnergyOrders.length > 0)
            {
                theEnergyOrder = myEnergyOrders[0];
            }
            
            //if there is an energy order
            if(theEnergyOrder)
            {
                //if order price is less than BUY_ENERGY_PRICE, increase order to that price
                if(theEnergyOrder.price < BUY_ENERGY_PRICE)
                {
                    Game.market.changeOrderPrice(theEnergyOrder.id, BUY_ENERGY_PRICE);
                }
                //if the order is less than deficit, increase order
                if(theEnergyOrder.remainingAmount < theDeficit)
                {
                    Game.market.extendOrder(theEnergyOrder.id,theDeficit - theEnergyOrder.remainingAmount);
                }
            }
            
            //otherwise create an energy order
            else
            {
                Game.market.createOrder(ORDER_BUY,RESOURCE_ENERGY,BUY_ENERGY_PRICE,theDeficit,this.pos.roomName);
            }
        }
    }
}

StructureTerminal.prototype.stationTrade = function()
{
    let runTradingAgain = false;
    
    for(let minType in temp.market[ORDER_SELL])
    {
        if(minType != SUBSCRIPTION_TOKEN)
        {
            let bestBuy = this.findBestMineralBuyOrder(minType);
            let bestSell = this.findBestMineralSellOrder(minType);
//console.log(minType,bestBuy,bestSell);
    
            if(bestBuy != null && bestSell != null && bestBuy.creditsPerMineral > bestSell.creditsPerMineral)
            {
//console.log(this,this.pos.roomName,minType,'bestBuyOrder = ',bestBuy.creditsPerMineral,'bestSellOrder = ',bestSell.creditsPerMineral,bestBuy.creditsPerMineral > bestSell.creditsPerMineral);
                runTradingAgain = true;
            }
        }
    }
}

StructureTerminal.prototype.maxSend = function (resourceType, amount, destination, description = '')
{
    let maxByEnergy;
    let maxByStoredInTerminal = this.store[resourceType];
    let maxByDestinationSpace;
    
    let theDestinationRoom = Game.rooms[destination];
    if(theDestinationRoom && theDestinationRoom.terminal)
    {
        maxByDestinationSpace = theDestinationRoom.terminal.storeCapacity - _.sum(theDestinationRoom.terminal.store);
    }
    
    
    if(resourceType == RESOURCE_ENERGY)
    {
        maxByEnergy = Math.round(this.store[RESOURCE_ENERGY]/(1+this.unitCost(destination)) * 0.95);
    }
    
    else
    {
        maxByEnergy = Math.round(this.store[RESOURCE_ENERGY]/this.unitCost(destination) * 0.95);
    }
    
    return this.send(resourceType,Math.min(amount,maxByEnergy,maxByStoredInTerminal,maxByDestinationSpace),destination,description);
}