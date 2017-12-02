

RoomObject.prototype.cacheFind = function (theSearch)
{
    if(this.room != undefined)
    {
        return this.room.cacheFind(theSearch);
    }
};

RoomObject.prototype.safeLookAtArea = function (range)
{
    if(this.room != undefined)
    {
        let center = this.pos;
        
        return this.room.lookAtArea(Math.max(0, center.y - range), Math.max(0, center.x - range), Math.min(49, center.y + range), Math.min(49, center.x + range), true);
    }
};

RoomObject.prototype.safeLookForAtArea = function (lookType,range)
{
    if(this.room != undefined)
    {
        let center = this.pos;
        
        return this.room.lookForAtArea(lookType, Math.max(0, center.y - range), Math.max(0, center.x - range), Math.min(49, center.y + range), Math.min(49, center.x + range), true);
    }
};