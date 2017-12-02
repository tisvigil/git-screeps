
var roleLink = 
{

    run: function(link)
    {
        if(Memory.links == undefined)
        {
            Memory.links = {};
        }
        
        if(Memory.links[link.id] == undefined)
        {
            Memory.links[link.id] = {};
        }
        
        if(Memory.links[link.id].mode != undefined && Memory.links[link.id].mode == 'send')
        {
            //if link is full and ready to send
            if(link.cooldown == 0)
            {
                //find the link in the room with the least energy, send to that link
                let openLinks = _.filter(link.room.cacheFind(FIND_MY_STRUCTURES), 
                    s => s instanceof StructureLink &&
                    Memory.links[s.id] != undefined &&
                    (Memory.links[s.id].mode == undefined || Memory.links[s.id].mode == 'receive') &&
                    s.energy < 780 &&
                    s.energy < link.energy
                    );
                    
                let receiveLink = _.min(openLinks, l => l.energy);
                if(receiveLink != undefined)
                {
                    link.transferEnergy(receiveLink);
                }
            }
        }
        
    }
};

module.exports = roleLink;
