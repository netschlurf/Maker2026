const Ticker = require("./Ticker");
const Trader = require("./Trader");
const PriceChangeMonitor = require("./PriceChangeMonitor");
const Logger = require('./Logger');
const TelegramConnector = require('./TelegramConnector');
const Liquidation = require('./Liquidation');
const PublicTrade = require('./PublicTrade');
const Orderbook = require('./Orderbook');
const fs = require('fs');
const path = require('path');
const BybitClient = require('./BybitClient');
const Wallet = require('./Wallet');
const Position = require('./Position');
const Order = require('./Order');
const FastExecutionStream = require('./FastExecutionStream');
const { Log } = require("./node_modules/chromium-bidi/lib/cjs/protocol/chromium-bidi");

var g_positionSize = 0;
var g_numOrders = 0;
var g_orderSize = 0;
var g_exchange = null;
var g_cfg = null;
var g_orderbook = null;
var g_timeFrame = 10000;

main();
function main()
{
    if (process.argv.length < 3) {
        Logger.log("minnsing args")
    }
    g_cfg = loadConfig(process.argv[2]);
    g_positionSize = g_cfg.positionSize;
    g_numOrders = g_cfg.numOrders;
    g_timeFrame = g_cfg.timeFrame;
    g_orderSize = g_positionSize / g_numOrders;

    g_exchange = new BybitClient(g_cfg.apiKey, g_cfg.apiSecret);
    g_orderbook = new Orderbook("wss://stream.bybit.com/v5/public/linear", 500, g_cfg.symbol, OnOrderbook);
}



function OnOrderbook(data)
{
    if (!g_orderbook.lastExecutionTime || Date.now() - g_orderbook.lastExecutionTime >= g_timeFrame) {
        g_orderbook.lastExecutionTime = Date.now();
        ProcessPeriodic(data.bids, data.asks);
    }
}



function loadConfig(filePath) {
    try {
        // Standardpfad, falls kein Pfad �bergeben wird
        const resolvedPath = path.resolve(filePath || './config.json');

        // Datei lesen
        const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

        // JSON parsen
        let config = JSON.parse(fileContent);

        // Pr�fen, ob apiKey und apiSecret existieren, sonst erg�nzen
        if (!config.apiKey) {
            //console.warn('apiKey fehlt in der Konfigurationsdatei. Standardwert wird hinzugef�gt.');
            config.apiKey = 'YOUR_API_KEY';
        }

        if (!config.apiSecret) {
            //console.warn('apiSecret fehlt in der Konfigurationsdatei. Standardwert wird hinzugef�gt.');
            config.apiSecret = 'YOUR_API_SECRET';
        }

        Logger.log("Config loaded: " + filePath);
        return config;
    } catch (error) {
        Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
        throw error;
    }
}






const ticker = new Ticker(g_cfg.symbol, (message) =>
{
    // console.log(g_cfg.symbol, message.data.lastPrice)
    // unused, we have trades
});

function findTopBidsByVolume(data, length)
{
    return Array.from(data.entries())
        .sort((a, b) => b[1][1] - a[1][1])
        .slice(0, length);
}




async function ProcessPeriodic(bids, asks)
{
    
    var allorders = await g_exchange.GetOpenOrders(g_cfg.symbol);
    var buyOrders = JSON.parse(JSON.stringify(allorders));
    var sellOrders = JSON.parse(JSON.stringify(allorders));

    for (var i = buyOrders.list.length - 1; i >= 0; i--) {
        if (buyOrders.list[i].side === "Sell") {
            buyOrders.list.splice(i, 1);
        }
    }

    for (var i = sellOrders.list.length - 1; i >= 0; i--) {
        if (sellOrders.list[i].side === "Buy") {
            sellOrders.list.splice(i, 1);
        }
    }


    var position = await g_exchange.GetPosition(g_cfg.symbol); 
    var top3 = findTopBidsByVolume(bids, g_numOrders);
    var topSell = findTopBidsByVolume(asks, g_numOrders);

    top3 = Array.from(top3.entries()).sort(
        (a, b) =>
            b[1][1][0] - a[1][1][0]
    );

    topSell = Array.from(topSell.entries()).sort(
        (a, b) =>
            b[1][1][0] - a[1][1][0]
    );

    var remainingVolume = g_positionSize - Number(position.size);
    var ramainingOrders = remainingVolume / g_orderSize - buyOrders.list.length;
    var countNewOrders = 0;
    if (buyOrders.list.length < ramainingOrders)
    {
        for (var i = 0; i < ramainingOrders; i++) {
            //await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Buy", g_orderSize, top3[i][1][1][0]); 
            Logger.log("Placed Order at: " + top3[i][1][1][0]);
            countNewOrders++;
        }
        ramainingOrders -= countNewOrders;
    }

    if (buyOrders.list.length > 0)
    {
        for (var i = 0; i < buyOrders.list.length; i++) {
            var obPrice = top3[i][1][1][0];
            if (buyOrders.list[i].price != obPrice)
            {
                //await g_exchange.AmendLimitOrder(buyOrders.list[i].orderId, g_cfg.symbol, obPrice);
                Logger.log("Amend Order to: " + top3[i][1][1][0]);
            }
        }
    }
    if (position.size > 0) {
        var tp = position.avgPrice * 1.002;
        if (sellOrders.list.length == 0) {
            //await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Sell", position.size, tp);
            Logger.log("Set TP at: " + tp);
        }
        else if (sellOrders.list.length == 1) {
            //await g_exchange.AmendLimitOrder(sellOrders.list[0].orderId, g_cfg.symbol, tp, position.size);
            Logger.log("Set TP at: " + tp);
        }
    }
}

            