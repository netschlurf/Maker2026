const BybitConfig = require('./BybitConfig');
const BybitClient = require('./BybitClient');

var cfg = BybitConfig.loadConfig("./sui.json");
var allDrawdowns = new Array();

const client = new BybitClient(cfg.apiKey, cfg.apiSecret);
main();

async function main()
{
    var pnl = await client.GetAllClosedPnLs('linear', 1737060720000);
    let filteredPnL = pnl.filter(trade => trade.symbol === "SUIUSDT");
    
    let maxDD = await calculateMaxDrawdown(filteredPnL);
    allDrawdowns.sort((a, b) => parseFloat(a.dur) - parseFloat(b.dur));
    allDrawdowns.sort((a, b) => (a.draw) - (b.draw));
    console.log(allDrawdowns); // Ausgabe: [1.5, 2.9, 3.2, 4.8]

    console.log("Max Drawdown:", maxDD)
}


async function calculateMaxDrawdown(pnlData) {
    // Filtere erfolgreiche Trades (positive closedPnl)
    let successfulTrades = pnlData.filter(trade => parseFloat(trade.closedPnl) > 0);
    let maxDrawdown = 0;

    for (let trade of successfulTrades) {
        let entryTime = parseInt(trade.createdTime);
        let exitTime = parseInt(trade.updatedTime);

        var klines = await client.GetAllKlines(cfg.symbol, 1, entryTime, 1000)
        // Filtere Klines, die zwischen Entry und Exit liegen
        let relevantKlines = klines.filter(kline => {
            let timestamp = parseInt(kline[0]);
            return timestamp >= entryTime && timestamp <= exitTime;
        });

        if (relevantKlines.length === 0) continue;

        let highestPrice = Math.max(...relevantKlines.map(k => parseFloat(k[2]))); // Highs
        let lowestPrice = Math.min(...relevantKlines.map(k => parseFloat(k[3])));  // Lows

        let drawdown = ((parseFloat(trade.avgEntryPrice) - lowestPrice) / parseFloat(trade.avgEntryPrice)) * 100;
        //console.log("Drawdown:", drawdown);
        let tr = new Object();

        let timeDifferenceMinutes = (exitTime - entryTime) / 60000;
        tr.dur = timeDifferenceMinutes.toFixed(1);
        tr.draw = drawdown;
        allDrawdowns.push(tr);
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
}