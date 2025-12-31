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
const Ticker = require('./Ticker');
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
var g_PositionIndex = 0;
var g_LastTicker = null;
var g_FinalSL = false;
var g_LastSL = 0;

var g_InLongProcessing = false;
var g_Position = null;
var g_IsTrailing = false;
var g_OpenOrder = null; // Variable hinzufügen

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
    g_orderbook = new Orderbook("wss://stream.bybit.com/v5/public/linear", 200, g_cfg.symbol, OnOrderbook);

    if (g_cfg.side == "long") {
        g_PositionIndex = 0; // One-Way Mode verwendet immer Index 0
    }

    else if (g_cfg.side == "short") {
        g_PositionIndex = 0; // One-Way Mode verwendet immer Index 0  
    }

    else {
        g_PositionIndex = 0;
    }

    var msg = g_cfg.symbol + " " + g_cfg.side + " started";
    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", "394159898");
    t.sendMessage(msg);

}

async function Terminate() {
    if (g_OpenOrder) {
        await g_exchange.CancelLimitOrder(g_OpenOrder.orderId, g_cfg.symbol);
    }
    //if (g_CloseOrder) {
    //    await g_exchange.CancelLimitOrder(g_CloseOrder.orderId, g_cfg.symbol);
    //}
    
    process.exit(0);   
}

process.on('SIGINT', () => {
    console.log('PM2 stop detected. Cleaning up...');
    Terminate();
});

process.on('SIGTERM', () => {
    console.log('PM2 terminate detected.');
    Terminate();
});

var g_Last10s = 0;
var g_Last5s = 0;
function OnOrderbook(data)
{
    if (!g_orderbook.lastExecutionTime || Date.now() - g_orderbook.lastExecutionTime >= g_timeFrame) {
        g_orderbook.lastExecutionTime = Date.now();

        if (g_cfg.side == "short") {
            ProcessPeriodicShort(data.bids, data.asks);
        }
        else {
            if (!g_InLongProcessing)
                ProcessPeriodicLong(data.bids, data.asks);
        }
    }
    if (!g_Last10s || Date.now() - g_Last10s >= 10000) {
        //g_Last10s = Date.now()
        //g_cfg = loadConfig(process.argv[2]);
    }
    if (!g_Last5s || Date.now() - g_Last5s >= 1000) {
        g_Last5s = Date.now()
        g_cfg = loadConfig(process.argv[2]);
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

        //Logger.log("Config loaded: " + filePath);
        return config;
    } catch (error) {
        Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
        throw error;
    }
}



//const pos = new Position(g_cfg.apiKey, g_cfg.apiSecret, (message) => {
//    for (var i = 0; i < message.length; i++) {
//        if (message[i].positionIdx == g_PositionIndex) {
//            var pos = message[i];
            
//            if (pos.positionBalance == 0) {
//                g_CloseOrder = null;
//                g_Position = null;
//            }
//            else {
//                g_Position = pos;
//            }
//        }
//    }
//});


//const order = new Order(g_cfg.apiKey, g_cfg.apiSecret, (message) => {
//    var tmp = message[0].orderId;
//    if (g_OpenOrder) {
//        if (g_OpenOrder.orderId == message[0].orderId) {
//            g_OpenOrder = message[0];
//            if (message[0].orderStatus == "Cancelled")
//                g_OpenOrder = null;
//        }
//    }
//    if (g_CloseOrder) {
//        if (g_CloseOrder.orderId == message[0].orderId) {
//            g_CloseOrder = message[0];
//            if (message[0].orderStatus == "Filled") {
//                g_CloseOrder = null;
//                g_OpenOrder = null;
//            }
//        }
//    }
//});


const ticker = new Ticker(g_cfg.symbol, (message) =>
{
    g_LastTicker = message.data;
});

function findTopBidsByVolume(data, length)
{
    data =  Array.from(data.entries())
        .sort((a, b) => b[1][1] - a[1][1])
        .slice(0, length);

    data = Array.from(data.entries()).sort(
        (a, b) =>
            b[1][1][0] - a[1][1][0]
    );
    return data;
}

function calculatePercentageChange(entryPrice, exitPrice) {

    return (exitPrice - entryPrice) / entryPrice * 100;
}

function FilterLimitOrders(orders, type, direction, posIndex)
{
    // Null-Check hinzufügen
    if (!orders || !orders.list || !Array.isArray(orders.list)) {
        Logger.error(`FilterLimitOrders: Invalid orders object received: ${JSON.stringify(orders)}`);
        return { list: [] }; // Return empty structure
    }
    
    for (var i = orders.list.length - 1; i >= 0; i--) {
        if (orders.list[i].positionIdx != posIndex) {
            orders.list.splice(i, 1);
        }
    }

    for (var i = orders.list.length - 1; i >= 0; i--) {
        if (orders.list[i].side != direction) {
            orders.list.splice(i, 1);
        }
    }

    for (var i = orders.list.length - 1; i >= 0; i--) {
        if (orders.list[i].orderType != type) {
            orders.list.splice(i, 1);
        }
    }
    return orders;
}

function AddPercentage(value, perc)
{
    var newVal = value + (value * perc / 100);
    return newVal;
}

function SubPercentage(value, perc) {
    var newVal = value - (value * perc / 100);
    return newVal;
}

function EpsilonCompare(a, b, epsilon)
{
    var absChange = Math.abs(calculatePercentageChange(a, b));
    return absChange > epsilon;
}

async function ClearOrdersExcept1(orders) {
    if (orders.list.length == 1)
        return;
    for (var i = 1; i < orders.list.length; i++) {
        await g_exchange.CancelLimitOrder(orders.list[i].orderId, g_cfg.symbol);
    }
}
async function ProcessPeriodicLong(bids, asks)
{
    g_InLongProcessing = true;

    var allorders = await g_exchange.GetOpenOrders(g_cfg.symbol);
    
    if (!allorders || !allorders.list) {
        Logger.error("Failed to get orders, skipping this cycle");
        g_InLongProcessing = false;
        return;
    }
    
    var closeOrders = JSON.parse(JSON.stringify(allorders));
    var openOrders = JSON.parse(JSON.stringify(allorders));
    openOrders = FilterLimitOrders(openOrders, "Limit", "Buy", g_PositionIndex);
    closeOrders = FilterLimitOrders(closeOrders, "Limit", "Sell", g_PositionIndex);

    var openOrder = null;
    if (openOrders.list.length > 0)
        openOrder = openOrders.list[0];
    var closeOrder = null;
    if (closeOrders.list.length > 0)
        closeOrder = closeOrders.list[0];

    var level = g_cfg.aggressiveness;
    
    var topBid = findTopBidsByVolume(bids, 10);
    var position = await g_exchange.GetPosition(g_cfg.symbol, g_PositionIndex);
    
    // Null-Check für Position
    if (!position) {
        position = { size: '0', avgPrice: '0', positionIdx: g_PositionIndex };
    }

    // Multi-Order Logik: Platziere exakt numOrders auf verschiedenen Ranks
    var missingOrders = g_numOrders - openOrders.list.length;
    var totalPositionNeeded = g_positionSize - Number(position.size);
    
    if (totalPositionNeeded > 0 && missingOrders > 0) {
        Logger.log(`Placing ${missingOrders} missing orders. Position needed: ${totalPositionNeeded}`);
        
        // Bestimme welche Ranks bereits belegt sind
        var usedRanks = [];
        for (var j = 0; j < openOrders.list.length; j++) {
            // Finde heraus welcher Rank zu diesem Preis passt
            for (var r = 0; r < topBid.length; r++) {
                var expectedPrice = SubPercentage(topBid[r][1][1][0], 0.06);
                if (Math.abs(Number(openOrders.list[j].price) - expectedPrice) < 0.01) {
                    usedRanks.push(r);
                    break;
                }
            }
        }
        
        // Platziere Orders an freien Ranks
        var placedCount = 0;
        for (var i = 0; i < topBid.length && placedCount < missingOrders; i++) {
            var rank = level + i;
            
            // Skip wenn dieser Rank bereits verwendet wird
            if (usedRanks.includes(rank)) {
                continue;
            }
            
            if (rank >= topBid.length) break;
            
            var obPrice = topBid[rank][1][1][0];
            obPrice = SubPercentage(obPrice, 0.06);
            
            try {
                Logger.log(`Placing order at RANK ${rank}: ${g_orderSize} ${g_cfg.symbol} at ${obPrice}`);
                await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Buy", g_orderSize, obPrice, g_PositionIndex, null);
                Logger.log(`✅ Order at RANK ${rank} placed successfully`);
                placedCount++;
                
                // Pause zwischen Orders
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                Logger.error(`❌ Order RANK ${rank} failed: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } else if (openOrders.list.length > 0) {
        // Nur Preis-Updates, keine neuen Orders - und nur loggen wenn Updates nötig
        var updatesNeeded = false;
        var pendingUpdates = [];
        
        for (var i = 0; i < openOrders.list.length && i < g_numOrders; i++) {
            var rank = level + i;
            if (rank >= topBid.length) continue;
            
            var expectedPrice = SubPercentage(topBid[rank][1][1][0], 0.06);
            var currentOrder = openOrders.list[i];
            
            if (Math.abs(Number(currentOrder.price) - expectedPrice) > 0.01) {
                updatesNeeded = true;
                pendingUpdates.push({
                    order: currentOrder,
                    expectedPrice: expectedPrice,
                    rank: rank,
                    index: i + 1
                });
            }
        }
        
        // Nur loggen wenn Updates nötig sind
        if (updatesNeeded) {
            Logger.log(`Updating ${pendingUpdates.length} orders with new prices...`);
            
            for (var update of pendingUpdates) {
                try {
                    Logger.log(`Order ${update.index}: ${update.order.price} → ${update.expectedPrice} (RANK ${update.rank})`);
                    await g_exchange.AmendLimitOrder(update.order.orderId, g_cfg.symbol, update.expectedPrice);
                    Logger.log(`✅ Order ${update.index} updated`);
                } catch (error) {
                    Logger.error(`❌ Order ${update.index} update failed: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        // Kein Logging wenn keine Updates nötig sind
    }

    // Diese alte Logik wird durch die neue Multi-Order Logik oben ersetzt
    // if (Number(position.size) == 0 && openOrder) {
    //     var obPrice = topBid[level][1][1][0];
    //     obPrice = SubPercentage(obPrice, 0.06);
    //     if (EpsilonCompare(Number(openOrder.price), obPrice, 0.005)) {
    //         await g_exchange.AmendLimitOrder(openOrder.orderId, g_cfg.symbol, obPrice, g_positionSize, null);
    //         Logger.log("Ammend Order at: " + obPrice);
    //     }
    // }

    // Close
    var breakEvenSave = AddPercentage(Number(position.avgPrice), 0.125);
    var trailingStop = AddPercentage(Number(g_LastTicker.lastPrice), 0.06);
    var tp = AddPercentage(Number(position.avgPrice), g_cfg.tp);
    var sl = SubPercentage(Number(position.avgPrice), g_cfg.sl)

    if (Number(position.size) > 0) {
        if (!g_IsTrailing) {
            var ssl = Number(position.stopLoss);
            if (!EpsilonCompare(ssl, sl, 0.0001)) {
                await g_exchange.SetStopLoss(g_cfg.symbol, sl, g_PositionIndex);
                Logger.log("Set SL: " + sl);
            }
        }

        if (!closeOrder) {
            await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Sell", Number(position.size), tp, g_PositionIndex);
            Logger.log("Set TP: " + tp + " size: " + position.size);
        }
        else {
            await g_exchange.AmendLimitOrder(closeOrder.orderId, g_cfg.symbol, tp, Number(position.size), null);
        }

    }
    else {
        g_IsTrailing = false;
        // Wenn keine Position mehr offen ist, lösche NUR offene Sell-Orders (TP/SL), aber keine Buy-Orders
        const allorders = await g_exchange.GetOpenOrders(g_cfg.symbol);
        if (allorders && allorders.list && allorders.list.length > 0) {
            for (const order of allorders.list) {
                if (order.side === "Sell") {
                    await g_exchange.CancelLimitOrder(order.orderId, g_cfg.symbol);
                    Logger.log(`Cancelled leftover Sell order after position close: ${order.orderId}`);
                }
            }
        }
    }
    if (Number(position.size) > 0) {
        if (g_LastTicker.lastPrice > breakEvenSave) {
            await g_exchange.SetStopLoss(g_cfg.symbol, trailingStop, g_PositionIndex);
            Logger.log("Set trailingStop: " + trailingStop);
            g_IsTrailing = true;
        }
    }
    await ClearOrdersExcept1(openOrders);
    g_InLongProcessing = false;
}

async function ProcessPeriodicShort(bids, asks) {
    g_InLongProcessing = true;

    var allorders = await g_exchange.GetOpenOrders(g_cfg.symbol);
    var closeOrders = JSON.parse(JSON.stringify(allorders));
    var openOrders = JSON.parse(JSON.stringify(allorders));
    openOrders = FilterLimitOrders(openOrders, "Limit", "Sell", g_PositionIndex);
    closeOrders = FilterLimitOrders(closeOrders, "Limit", "Buy", g_PositionIndex);

    var openOrder = null;
    if (openOrders.list.length > 0)
        openOrder = openOrders.list[0];
    var closeOrder = null;
    if (closeOrders.list.length > 0)
        closeOrder = closeOrders.list[0];

    var level = g_cfg.aggressiveness;

    var topAsk = findTopBidsByVolume(asks, 10);
    var position = await g_exchange.GetPosition(g_cfg.symbol, g_PositionIndex);

    if (Number(position.size) == 0 && openOrders.list.length == 0) {
        var obPrice = topAsk[level][1][1][0];
        obPrice = AddPercentage(obPrice, 0.06);
        await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Sell", g_orderSize, obPrice, g_PositionIndex, null);
        Logger.log("Placed Order at: " + obPrice);
    }

    if (Number(position.size) == 0 && openOrder) {
        var obPrice = topAsk[level][1][1][0];
        obPrice = AddPercentage(obPrice, 0.06);
        if (EpsilonCompare(Number(openOrder.price), obPrice, 0.005)) {
            await g_exchange.AmendLimitOrder(openOrder.orderId, g_cfg.symbol, obPrice, null, null);
            Logger.log("Ammend Order at: " + obPrice);
        }
    }

    // Close
    var breakEvenSave = SubPercentage(Number(position.avgPrice), 0.125);
    var trailingStop = SubPercentage(Number(g_LastTicker.lastPrice), 0.06);
    var tp = SubPercentage(Number(position.avgPrice), g_cfg.tp);
    var sl = AddPercentage(Number(position.avgPrice), g_cfg.sl)

    if (Number(position.size) > 0) {
        if (!g_IsTrailing) {
            var ssl = Number(position.stopLoss);
            if (EpsilonCompare(ssl, sl, 0.0001)) {
                await g_exchange.SetStopLoss(g_cfg.symbol, sl, g_PositionIndex);
                Logger.log("Set SL: " + sl);
            }
        }

        if (!closeOrder) {
            await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Buy", g_orderSize, tp, g_PositionIndex);
            Logger.log("Set TP: " + tp);
        }
        else {
            await g_exchange.AmendLimitOrder(closeOrder.orderId, g_cfg.symbol, tp, null, null);
        }

    }
    else
        g_IsTrailing = false;
    if (Number(position.size) > 0) {
        if (g_LastTicker.lastPrice < breakEvenSave) {
            await g_exchange.SetStopLoss(g_cfg.symbol, trailingStop, g_PositionIndex);
            Logger.log("Set trailingStop: " + trailingStop);
            g_IsTrailing = true;
        }
    }
    await ClearOrdersExcept1(openOrders);
    g_InLongProcessing = false;
    
}



//async function ProcessPeriodicShort(bids, asks) {
//    var allorders = await g_exchange.GetOpenOrders(g_cfg.symbol);
//    var closeOrders = JSON.parse(JSON.stringify(allorders));
//    var openOrders = JSON.parse(JSON.stringify(allorders));


//    closeOrders = FilterLimitOrders(closeOrders, "Buy");


//    for (var i = openOrders.list.length - 1; i >= 0; i--) {
//        if (openOrders.list[i].side === "Buy") {
//            openOrders.list.splice(i, 1);
//        }
//    }



//    for (var i = openOrders.list.length - 1; i >= 0; i--) {
//        if (openOrders.list[i].positionIdx != g_PositionIndex) {
//            openOrders.list.splice(i, 1);
//        }
//    }


//    var position = await g_exchange.GetPosition(g_cfg.symbol, g_PositionIndex);
//    var topSell = findTopBidsByVolume(bids, g_numOrders);
//    var top3 = findTopBidsByVolume(asks, g_numOrders);

//    if (position.size == 0 && openOrders.list.length == 0)
//        g_PositionTP = 0;

//    top3 = Array.from(top3.entries()).sort(
//        (a, b) =>
//            b[1][1][0] - a[1][1][0]
//    );

//    topSell = Array.from(topSell.entries()).sort(
//        (a, b) =>
//            b[1][1][0] - a[1][1][0]
//    );

//    var remainingVolume = g_positionSize - Number(position.size);
//    var ramainingOrders = remainingVolume / g_orderSize - openOrders.list.length;
//    var countNewOrders = 0;
//    if (openOrders.list.length < ramainingOrders) {
//        for (var i = 0; i < ramainingOrders; i++) {
//            var sl = top3[i][1][1][0] * g_cfg.sl;
//            await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Sell", g_orderSize, top3[i][1][1][0], g_PositionIndex, sl);
//            Logger.log("Placed Order at: " + top3[i][1][1][0] + " Size: " + g_orderSize + " Idx: " + g_PositionIndex);
//            countNewOrders++;
//            if (position.size == 0 && g_PositionTP == 0) {
//                g_PositionTP = top3[g_numOrders - 1][1][1][0]; // most inner ask
//            }

//        }
//        ramainingOrders -= countNewOrders;
//    }

//    if (openOrders.list.length > 0) {
//        for (var i = 0; i < openOrders.list.length; i++) {
//            if (top3[i] != null) {
//                var obPrice = top3[i][1][1][0];
//                var sl = obPrice * g_cfg.sl;
//                if (openOrders.list[i].price != obPrice) {
//                    await g_exchange.AmendLimitOrder(openOrders.list[i].orderId, g_cfg.symbol, obPrice, null, null);
//                    //Logger.log("Amend Order to: " + top3[i][1][1][0]);
//                }
//            }
//        }
//    }
//    if (position.size > 0) {
//        var tp = position.avgPrice * g_cfg.tp;
//        if (closeOrders.list.length == 0) {
//            g_OpenOrder = await g_exchange.PlaceLimitOrder(g_cfg.symbol, "Buy", g_orderSize, tp, g_PositionIndex );
//            Logger.log("Set TP at: " + tp + " Size: " + position.size + " Idx: " + g_PositionIndex);
//        }
//        else if (closeOrders.list.length == 1) {
//            var setTp = Number(closeOrders.list[0].price);

//            var absChange = Math.abs(calculatePercentageChange(setTp, tp));

//            if (absChange > 0.005) {
//                await g_exchange.AmendLimitOrder(closeOrders.list[0].orderId, g_cfg.symbol, tp, position.size);
//                Logger.log("Set TP at: " + tp + " Size: " + position.size);
//            }

//        }
//    }

//    if (position.size > 0) {
//        //if (g_LastTicker && (g_LastTicker.lastPrice < (position.avgPrice * 0.9993))) {
//        //    var sl = g_LastTicker.lastPrice - (g_LastTicker.lastPrice*0.0005);
//        //    await g_exchange.SetStopLoss(g_cfg.symbol, sl, g_PositionIndex);
//        //    g_FinalSL = true;
//        //}
//        //else {
//        //    if (!g_FinalSL) {
//        //        var sl = position.avgPrice * g_cfg.sl;
//        //        if (sl < g_LastSL) {
//        //            g_LastSL = sl;
//                    await g_exchange.SetStopLoss(g_cfg.symbol, sl, g_PositionIndex);
//                    Logger.log("Final SL set to " + sl);
//        //        }
//        //    }
//        //}
//    }
//    else {
//        g_FinalSL = false;
//        g_LastSL = 0;
//    }

//    if (openOrders.list.length > g_numOrders) {
//        for (var i = g_numOrders; i < openOrders.list.length; i++) {
//            await g_exchange.CancelLimitOrder(openOrders.list[i].orderId, g_cfg.symbol);
//        }
//    }
//}

            