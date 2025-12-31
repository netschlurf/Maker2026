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

        // Config zurückgeben
        return config;
    } catch (error) {
        Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
        throw error;
    }
}

var cfg = loadConfig("./config.json");

const client = new BybitClient(cfg.apiKey, cfg.apiSecret);

async function LoadPnl() {
    var pnl2 = await client.GetClosedPnL('linear', 100);
    var pnl = await client.GetAllClosedPnLs('linear', 1738588434000);
    //console.log(pnl);
    var obj = new Object()
    obj.list = pnl;
    generatePnLReport(obj, 1738588434000);
    return pnl;
}

const moment = require('moment');

function calculatePercentageChange(entryPrice, exitPrice, leverage, side) {

    //if (side == "Buy")
    //    return (entryPrice - exitPrice) / entryPrice * leverage * 100;
    //else
        return (exitPrice - entryPrice) / entryPrice * leverage * 100;
}

function calculateMaxExposure(data) {
    let maxExposure = 0;
    let currentExposure = 0;
    const events = [];

    // Erstelle Ereignisse für Positionseröffnungen und -schließungen
    data.list.forEach(trade => {
        const entryValue = parseFloat(trade.avgEntryPrice) * parseFloat(trade.qty);
        events.push({ time: parseInt(trade.createdTime), type: 'open', value: entryValue });
        events.push({ time: parseInt(trade.updatedTime), type: 'close', value: entryValue });
    });

    // Ereignisse nach Zeit sortieren
    events.sort((a, b) => a.time - b.time);

    // Maximalen Wert bestimmen
    events.forEach(event => {
        if (event.type === 'open') {
            currentExposure += event.value;
        } else if (event.type === 'close') {
            currentExposure -= event.value;
        }
        maxExposure = Math.max(maxExposure, currentExposure);
    });

    return maxExposure.toFixed(2);
}

function calculateDurationFromNow(fromDate) {
    const now = moment();
    const start = moment(fromDate);
    const duration = moment.duration(now.diff(start));

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    return `${days} days, ${hours} hours, and ${minutes} minutes`;
}

function sideToDir(trade) {
    if (trade.side == "Buy")
        return "SHORT";
    else
        return "LONG";
}

function generatePnLReport(data, fromDate) {
    const trades = data.list
        .filter(trade => parseInt(trade.createdTime) >= fromDate)
        .sort((a, b) => b.createdTime - a.createdTime); // Sortiere die Trades absteigend nach Zeit

    // Füge rückwärtsgerichtete Nummerierung hinzu
    trades.forEach((trade, index) => {
        trade.index = trades.length - index; // Nummerierung basierend auf der Reihenfolge
    });

    // Gesamt-PnL berechnen
    const totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.closedPnl), 0).toFixed(2);
    const exposure = (calculateMaxExposure(data) / 10).toFixed(2);
    const gain = calculatePercentageChange(parseFloat(exposure), parseFloat(exposure) + parseFloat(totalPnL), 1, "Buy");

    // HTML-Bericht mit Bootstrap erstellen
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trade PnL Report MT415886910</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center">Trade PnL Report MT415886910</h1>
        <p class="text-center fs-4">Total Realized PnL: <strong>${totalPnL}</strong> USDT</p>
        <div class="table-responsive">
<table class="table table-striped table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Period</th>
                        <th>Trades</th>
                        <th>Max Exposure</th>
                        <th>Gain</th>
                    </tr>
                </thead>
                <tbody>
                        <tr>
                            <td>${calculateDurationFromNow(fromDate)}</td>
                            <td>${trades.length}</td>
                            <td>${exposure} USDT</td>
                            <td>${gain.toFixed(2)}%</td>
                        </tr>
                </tbody>
            </table>            <table class="table table-striped table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Leverage</th>
                        <th>Created Time</th>
                        <th>Updated Time</th>
                        <th>Order ID</th>
                        <th>Avg Entry</th>
                        <th>Avg Exit</th>
                        <th>Qty</th>
                        <th>Closed PnL</th>
                        <th>ROI</th>
                    </tr>
                </thead>
                <tbody>
                    ${trades.map(trade => `
                        <tr>
                            <td>${trade.index}</td> <!-- Rückwärtsgerichtete Nummerierung -->
                            <td>${trade.symbol}</td>
                            <td>${sideToDir(trade)}</td>
                            <td>${trade.leverage}x</td>
                            <td>${moment(parseInt(trade.createdTime)).format('YYYY-MM-DD HH:mm:ss')}</td>
                            <td>${moment(parseInt(trade.updatedTime)).format('YYYY-MM-DD HH:mm:ss')}</td>
                            <td>${trade.orderId}</td>
                            <td>${parseFloat(trade.avgEntryPrice).toFixed(3)}</td>
                            <td>${parseFloat(trade.avgExitPrice).toFixed(3)}</td>
                            <td>${parseFloat(trade.qty).toFixed(3)}</td>
                            <td>${parseFloat(trade.closedPnl).toFixed(3)}</td>
                            <td>${parseFloat(calculatePercentageChange(
        Number(trade.avgEntryPrice),
        Number(trade.avgExitPrice),
        Number(trade.leverage),
        trade.side)).toFixed(2)}%</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

    // HTML-Datei speichern
    fs.writeFileSync('pnl_report.html', html);
}

// Beispiel-Daten
const exampleData = {
    list: [
        {
            symbol: 'XRPUSDT',
            leverage: '5',
            createdTime: '1736094636615',
            updatedTime: '1736096583610',
            orderId: '325b9350-c260-404c-a43d-2b789de57452',
            closedPnl: '0.00770608',
            avgEntryPrice: '2.365',
            qty: '2'
        },
        {
            symbol: 'ETHUSDT',
            leverage: '10',
            createdTime: '1736093661160',
            updatedTime: '1736093661255',
            orderId: 'ec9671fa-005f-4b2b-9edb-a3f933025998',
            closedPnl: '0.17412786',
            avgEntryPrice: '3627.3834',
            qty: '0.03'
        }
    ]
};

var data = LoadPnl();
