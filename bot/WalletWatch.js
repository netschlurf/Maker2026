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
//var exchange = new BybitClient(cfg.apiKey, cfg.apiSecret);


const position = new Position(cfg.apiKey, cfg.apiSecret, (message) =>
{
    console.log(message);
});

const fast = new Wallet(cfg.apiKey, cfg.apiSecret, (message) => {
    console.log(message);
});

const order = new Order(cfg.apiKey, cfg.apiSecret, (message) => {
    console.log(message);
});
