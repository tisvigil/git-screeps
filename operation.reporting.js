
global.startCPU = function(str)
{
    if(temp.reporting == undefined)
    {
        temp.reporting = {};
    }
    
    if(temp.reporting.cpu == undefined)
    {
        temp.reporting.cpu = {};
    }
    
    temp.reporting.cpu[str] = {start: Game.cpu.getUsed()};
}

global.endCPU = function(str)
{
    temp.reporting.cpu[str].end = Game.cpu.getUsed();
}

global.reportCPU = function(str)
{
    if(
        temp.reporting.cpu[str] != undefined &&
        temp.reporting.cpu[str].start != undefined &&
        temp.reporting.cpu[str].end != undefined
    )
    {
        return round(temp.reporting.cpu[str].end - temp.reporting.cpu[str].start, 2);
    }
    
    else
    {
        if(temp.reporting.cpu[str] == undefined)
        {
            return 'no memory of string';
        }
        
        else if(temp.reporting.cpu[str].start == undefined)
        {
            return 'undefined start CPU';
        }
        
        else if(temp.reporting.cpu[str].end == undefined)
        {
            return 'undefined end CPU';
        }
    }
}

global.endrCPU = function(str)
{
    endCPU(str);
    let currentTickCPU = reportCPU(str);
    let avgCPU = runningAverage(currentTickCPU,str,100);
    if(REPORT_CPU)
    {
        console.log(str + ' CPU: ' + currentTickCPU + ' (' + avgCPU + ')');
    }
}

global.runningAverage = function(value,str,lookBack)
{
    if(Memory.reporting == undefined)
    {
        Memory.reporting = {};
    }
    
    if(Memory.reporting[str] == undefined)
    {
        Memory.reporting[str] = value;
    }
    
    else
    {
        Memory.reporting[str] += (value - Memory.reporting[str])/lookBack
    }
    
    return round(Memory.reporting[str],2);
}

global.determineSpawnStatus = function(s)
{
    let sp = Game.spawns[s];
    
    if(sp.spawning != null)
    {
        return 'spawning';
    }
    
    else if(sp.room.energyCapacityAvailable > sp.room.energyAvailable)
    {
        return 'refueling';
    }
    
    else
    {
        return 'idle';
    }
}

global.spawnMetrics = function()
{
    if(Memory.reporting == undefined)
    {
        Memory.reporting = {};
    }
    
    if(Memory.reporting.spawns == undefined)
    {
        Memory.reporting.spawns = {};
    }
    
    for(let s in Game.spawns)
    {
        
        let theStatus = determineSpawnStatus(s);
        
        let spawning = 0;
        let refueling = 0;
        let idle = 0;
        
        if(theStatus != undefined)
        {
            if(theStatus == 'spawning')
            {
                spawning = 1;
            }
            
            else if(theStatus == 'idle')
            {
                idle = 1;
            }
            
            else if(theStatus == 'refueling')
            {
                refueling = 1;
            }
        }
        
        let avgSpa = runningAverage(spawning,s + 'Spawning',1500);
        let avgRef = runningAverage(refueling,s + 'Refueling',1500);
        let avgIdl = runningAverage(idle,s + 'Idle',1500);
        
        if(REPORT_SPAWN)
        {
            console.log(
                s + ': ' + theStatus + 
                ' (S: ' + avgSpa +
                ' R: ' + avgRef +
                ' I: ' + avgIdl + ')'
            );
        }
    }
}


