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
var g_PositionIndex = 0;

main();
function main()
{
    if (process.argv.length < 3) {
        Logger.log("minnsing args")
    }
    g_cfg = loadConfig(process.argv[2]);


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




var g_Pos = null;

// Zustand der vorherigen Positionen global speichern
const previousPositions = {};

const checkForPositionChanges = (newPositions) => {
    const messages = [];

    // Iteriere über alle neuen Positionen
    newPositions.forEach((position) => {
        const { positionIdx, size, side, symbol, cumRealisedPnl } = position;

        // Vorherige Werte abrufen (Standardwert, falls nicht vorhanden)
        const prevState = previousPositions[positionIdx] || { size: "0", side: "" };

        // Öffnen einer Position
        if (prevState.size === "0" && size !== "0") {
            messages.push(
                `Opened ${symbol} ${side}, ${size} units`
            );
        }

        // Schließen einer Position
        if (prevState.size !== "0" && size === "0") {
            messages.push(
                `Closed ${symbol}, Unrealised PNL: ${cumRealisedPnl}`
            );
        }

        // Speichern des aktuellen Zustands
        previousPositions[positionIdx] = { size, side, cumRealisedPnl };
    });

    return messages;
};

const positionStartTimes = {}; // Speichert den Startzeitpunkt einer Position
const lastNotifiedTimes = {}; // Speichert, wann zuletzt eine Nachricht gesendet wurde

const checkForPositionRuntime = (newPositions) => {
    const messages = [];
    const now = Date.now(); // aktuelle Zeit in Millisekunden

    newPositions.forEach((position) => {
        const { positionIdx, size, updatedTime, symbol } = position;

        if (size !== "0") { // Position ist offen
            if (!positionStartTimes[positionIdx]) {
                positionStartTimes[positionIdx] = parseInt(updatedTime, 10);
            }

            const positionStartTime = positionStartTimes[positionIdx];
            const elapsedMinutes = Math.floor((now - positionStartTime) / 60000); // in Minuten
            const lastNotified = lastNotifiedTimes[positionIdx] || 0;

            if (elapsedMinutes % 30 === 0 && now - lastNotified >= 5 * 60 * 1000) {
                messages.push(`Position ${symbol} open since ${elapsedMinutes} minutes.`);
                lastNotifiedTimes[positionIdx] = now;
            }
        }
    });

    return messages;
};



const lastPnlAlerts = {}; // Speichert die letzte Alarm-Zeit für jede Position

const checkForPnlThreshold = (newPositions) => {
    const messages = [];
    const now = Date.now();

    newPositions.forEach((position) => {
        const { positionIdx, unrealisedPnl, positionIM, symbol } = position;

        if (parseFloat(positionIM) > 0) { // Position ist offen
            const thresholdStep = 0.1; // 10% Schritte
            const minThreshold = -0.2; // Ab -20%
            const positionImFloat = parseFloat(positionIM);
            const unrealizedPnlFloat = parseFloat(unrealisedPnl);

            const percentage = unrealizedPnlFloat / positionImFloat; // PnL als Faktor
            const roundedPercentage = Math.floor(percentage / thresholdStep) * thresholdStep; // In 10% Schritten runden

            if (roundedPercentage <= minThreshold) { // Erst ab -20% auslösen
                const lastAlertTime = lastPnlAlerts[positionIdx] || 0;

                if (now - lastAlertTime >= 10 * 60 * 1000) { // Nur alle 10 min
                    messages.push(`ALARM: Unrealized PNL for ${symbol} reached ${roundedPercentage * 100}%.`);
                    lastPnlAlerts[positionIdx] = now;
                }
            }
        }
    });

    return messages;
};



const alletMonitor = new Wallet(g_cfg.apiKey, g_cfg.apiSecret, (data) => {
    console.log(data)
});
// Funktion, um Änderungen zu überprüfen

const posMonitor = new Position(g_cfg.apiKey, g_cfg.apiSecret, (data) => {
    // Funktion, um Änderungen zu überprüfen

    const t = new TelegramConnector(
        "8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y",
        "394159898"
    );

    const posChangeMsgs = checkForPositionChanges(data);
    if (posChangeMsgs.length > 0) {
        posChangeMsgs.forEach((msg) => t.sendMessage(msg));
    }

    const posRuntimeMsgs = checkForPositionRuntime(data);
    if (posRuntimeMsgs.length > 0) {
        posRuntimeMsgs.forEach((msg) => t.sendMessage(msg));
    }

    const posPnlMsgs = checkForPnlThreshold(data);
    if (posPnlMsgs.length > 0) {
        posPnlMsgs.forEach((msg) => t.sendMessage(msg));
    }
});

