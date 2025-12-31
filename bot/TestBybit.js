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
const BybitConfig = require('./BybitConfig');

var g_cfg = null;
var exchange = null;

main();

async function main()
{
    g_cfg = BybitConfig.loadConfig("./sui.json");
    exchange = new BybitClient(g_cfg.apiKey, g_cfg.apiSecret);

    var poss = await exchange.GetPosition("SUIUSDT", 1);
    var order = await exchange.GetActiveOrders("SUIUSDT",  1);

    var dur1 = await exchange.CalcOrderAgeInSeconds(order[0]) / 60;
    var dur2 = await exchange.CalcPositionAgeInSeconds(poss) / 60;
    var pnl = await exchange.CalcPositionPnL(poss);
    console.log(dur1, pnl)
}