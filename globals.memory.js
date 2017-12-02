global.garbageCollection = function()
{
    if(Game.time % 100 == 0)
    {
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                //console.log('Clearing non-existing creep memory:', name, ' (' + Memory.creeps[name].role + ')');
                delete Memory.creeps[name];
            }
        }
        
            //clear outdated flag entries
        for(let name in Memory.flags)
        {
            if(!Game.flags[name])
            {
                //console.log('Clearing non-existing flag memory:', name);
                delete Memory.flags[name];
            }
        }
        
        for(let i in Memory.links)
        {
            if (!Game.getObjectById(i))
            {
                delete Memory.links[i];
            }
        }
    }
}