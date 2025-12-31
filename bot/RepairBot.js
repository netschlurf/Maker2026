//const Ticker = require("./Ticker");
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
var g_PositionTP = 0;
var g_FastExecutionStream = null;
var g_OrderStream = null

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
    g_FastExecutionStream = new FastExecutionStream(g_cfg.apiKey, g_cfg.apiSecret, FastExecutionStreamCallback);
    g_OrderStream = new Order(g_cfg.apiKey, g_cfg.apiSecret, OrderStreamCallback);
}



function OnOrderbook(data)
{
    if (!g_orderbook.lastExecutionTime || Date.now() - g_orderbook.lastExecutionTime >= g_timeFrame) {
        g_orderbook.lastExecutionTime = Date.now();
        ProcessPeriodic(data.bids, data.asks);
        //g_cfg = loadConfig(process.argv[2]);
    }
}



function loadConfig(filePath) {
    try {
        // Standardpfad, falls kein Pfad übergeben wird
        const resolvedPath = path.resolve(filePath || './config.json');

        // Datei lesen
        const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

        // JSON parsen
        let config = JSON.parse(fileContent);

        // Prüfen, ob apiKey und apiSecret existieren, sonst ergänzen
        if (!config.apiKey) {
            //console.warn('apiKey fehlt in der Konfigurationsdatei. Standardwert wird hinzugefügt.');
            config.apiKey = 'YOUR_API_KEY';
        }

        if (!config.apiSecret) {
            //console.warn('apiSecret fehlt in der Konfigurationsdatei. Standardwert wird hinzugefügt.');
            config.apiSecret = 'YOUR_API_SECRET';
        }

        Logger.log("Config loaded: " + filePath);
        return config;
    } catch (error) {
        Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
        throw error;
    }
}






//const ticker = new Ticker(g_cfg.symbol, (message) =>
//{
//    // console.log(g_cfg.symbol, message.data.lastPrice)
//    // unused, we have trades
//});

function findTopBidsByVolume(data, length)
{
    return Array.from(data.entries())
        .sort((a, b) => b[1][1] - a[1][1])
        .slice(0, length);
}

function calculatePercentageChange(entryPrice, exitPrice) {

    return (exitPrice - entryPrice) / entryPrice * 100;
}

var g_BuyOrder = null;
var g_Entry = 0;
var g_SellOrder = null;
var g_RepairPosSize = 60;
var g_RepairPosQty = 5;

function FastExecutionStreamCallback(data) {
    //console.log(data);
}

function OrderStreamCallback(data) {
    //console.log(data);
    if (g_SellOrder != null) {
        if (data[0].orderId == g_SellOrder.result.orderId) {
            if (data[0].orderStatus == "Filled") {
                g_BuyOrder = null;
                g_Entry = 0;
                g_SellOrder = null;
            }

        }
    }
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

    if (position.size == 0 && buyOrders.list.length == 0)
        g_PositionTP = 0;

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
    if (position.size == g_RepairPosSize && g_BuyOrder == null)
    {
        for (var i = 0; i < 1; i++) {
            if (g_BuyOrder == null) {
                g_BuyOrder = await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Buy", g_RepairPosQty, top3[i][1][1][0], null);
                Logger.log("Placed Order at: " + top3[i][1][1][0]);
                countNewOrders++;
                g_SellOrder = null;
                g_Entry = top3[i][1][1][0];
                if (position.size == 0 && g_PositionTP == 0) {
                    g_PositionTP = top3[g_numOrders - 1][1][1][0]; // most inner ask
                }
            }
        }
        ramainingOrders -= countNewOrders;
    }

    if (buyOrders.list.length > 0)
    {
        for (var i = 0; i < buyOrders.list.length; i++) {
            var obPrice = top3[i][1][1][0];
            if (buyOrders.list[i].price != obPrice)
            {
                await g_exchange.AmendLimitOrder(buyOrders.list[i].orderId, g_cfg.symbol, obPrice);
                //Logger.log("Amend Order to: " + top3[i][1][1][0]);
            }
        }
    }
    if (position.size > g_RepairPosSize && g_SellOrder == null && g_Entry > 0) {
        var tp = g_Entry * 1.004;
        //if (sellOrders.list.length == 0) {
        if (g_SellOrder == null) {
            g_SellOrder = await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Sell", g_RepairPosQty, tp);
            Logger.log("Set TP at: " + tp);
            g_BuyOrder = null;
        }
        else if (sellOrders.list.length == 1) {
            var setTp = Number(sellOrders.list[0].price);

            var absChange = Math.abs(calculatePercentageChange(setTp, tp));

            if (absChange > 0.005) {
                await g_exchange.AmendLimitOrder(sellOrders.list[0].orderId, g_cfg.symbol, tp, 1);
                Logger.log("Set TP at: " + tp);
            }

        }

        if (sellOrders.list.length > 1) {
            //await g_exchange.CancelLimitOrder(sellOrders.list[1].orderId, g_cfg.symbol);
            //Logger.log("Deleted double sell");
            
        }
    }
}

            