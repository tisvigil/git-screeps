global.hashMarketToTemp = function()
{
    temp.market = {};
    temp.market[ORDER_BUY] = {};
    temp.market[ORDER_SELL] = {};
    
    for(let o of Game.market.getAllOrders())
    {
        if(temp.market[o.type][o.resourceType] == undefined)
        {
            temp.market[o.type][o.resourceType] = [];
        }
        
        temp.market[o.type][o.resourceType].push(o);
    }
}