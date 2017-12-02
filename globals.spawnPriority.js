/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('globals.spawnPriority');
 * mod.thing == 'a thing'; // true
 */

global.spawnPriority = function(role)
{
    switch(role)
    {
        case 'harvester':
            return 100;
            break;
        case '':
            return 0;
            break;
    }
}
