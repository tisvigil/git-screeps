

Room.prototype.cacheFind = function (theSearch)
{
    if(global.temp.find == undefined)
    {
        global.temp.find = {};
    }
    
    if(global.temp.find[this.name] == undefined)
    {
        global.temp.find[this.name] = {};
    }
    
    if(global.temp.find[this.name][theSearch] == undefined)
    {
        let searchResult;
        
        if(theSearch == FIND_HOSTILE_CREEPS)
        {
            searchResult = this.find(FIND_CREEPS);
            searchResult = _.filter(searchResult, c => !ALLIES[c.owner.username]);
        }
        
        else if(theSearch == FIND_HOSTILE_STRUCTURES)
        {
            searchResult = this.find(FIND_STRUCTURES);
            searchResult = _.filter(searchResult, s => s instanceof OwnedStructure && s.owner && !ALLIES[s.owner.username]);
        }
        else if(theSearch == FIND_ALLIED_CREEPS)
        {
            searchResult = this.find(FIND_CREEPS);
            searchResult = _.filter(searchResult, c => ALLIES[c.owner.username]);
        }
        
        else if(theSearch == FIND_ALLIED_STRUCTURES)
        {
            searchResult = this.find(FIND_STRUCTURES);
            searchResult = _.filter(searchResult, s => s.owner && ALLIES[s.owner.username]);
        }
        
        else
        {
            searchResult = this.find(theSearch);
        }
        
        global.temp.find[this.name][theSearch] = searchResult;
    }
    
    return global.temp.find[this.name][theSearch];
};