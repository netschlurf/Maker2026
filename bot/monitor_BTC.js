const TelegramChannelReader = require("./TelegramChannelReader");
const Ticker = require("./Ticker");
const Trader = require("./Trader");
const PriceChangeMonitor = require("./PriceChangeMonitor");
const Logger = require('./Logger');
const TelegramConnector = require('./TelegramConnector');
const Liquidation = require('./Liquidation');
const PublicTrade = require('./PublicTrade');
const CSVWriterTrade = require('./CSVWriterTrade');
const CSVWriterLiquidation = require('./CSVWriterLiquidation');



const fs = require('fs');
const path = require('path');

'use strict';


var g_LastTicker = null;
var cfg = loadConfig("./config.json");

function reloadConfig() {
    cfg = loadConfig("./config.json");
}

setInterval(reloadConfig, 5000);

// 20316331
// api_id 20316331
// api_hash c55cf7d52ea962f71b41a4a7b478175a
// app title tOTALhEDGEbOT

// Production configuration:
// 149.154.167.50: 443
/*
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA6LszBcC1LGzyr992NzE0ieY+BSaOW622Aa9Bd4ZHLl+TuFQ4lo4g
5nKaMBwK/BIb9xUfg0Q29/2mgIR6Zr9krM7HjuIcCzFvDtr+L0GQjae9H0pRB2OO
62cECs5HKhT5DZ98K33vmWiLowc621dQuwKWSQKjWf50XYFw42h21P2KXUGyp2y/
+aEyZ+uVgLLQbRA1dEjSDZ2iGRy12Mk5gpYc397aYp438fsJoHIgJ2lgMv5h7WY9
t6N/byY9Nw9p21Og3AoXSL2q/2IJ1WRUhebgAdGVMlV1fkuOQoEzR7EdpqtQD9Cs
5+bfo3Nhmcyvk5ftB0WkJ9z6bNZ7yxrP8wIDAQAB
-----END RSA PUBLIC KEY-----
*/


// Test configuration:
// 149.154.167.40: 443

/*4-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAyMEdY1aR+sCR3ZSJrtztKTKqigvO/vBfqACJLZtS7QMgCGXJ6XIR
yy7mx66W0/sOFa7/1mAZtEoIokDP3ShoqF4fVNb6XeqgQfaUHd8wJpDWHcR2OFwv
plUUI1PLTktZ9uW2WE23b+ixNwJjJGwBDJPQEQFBE+vfmH0JP503wr5INS1poWg/
j25sIWeYPHYeOrFp/eXaqhISP6G+q2IeTaWTXpwZj4LzXq5YOpk4bYEQ6mvRq7D1
aHWfYmlEGepfaYR8Q0YqvvhYtMte3ITnuSJs171+GDqpdKcSwHnd6FudwGO4pcCO
j4WcDuXc2CTHgH8gFTNhp/Y8/SpDOhvn9QIDAQAB
-----END RSA PUBLIC KEY-----
*/

 //(async () => {
 //    const reader = new TelegramChannelReader(20316331, "c55cf7d52ea962f71b41a4a7b478175a");
 //    await reader.connect();
 //    const messages = await reader.getChannelMessages("@netschlurfs_SAR_bot", 5); // Verwende die ID oder den Handle
 //    Logger.log("Nachrichten:", messages);
 //    await reader.disconnect();
 //})();


//var signal = {
//    "start": 1734033106895,
//    "symbol": "1000XUSDT",
//    "signal_type": "Long",
//    "leverage": "Cross (30.0X)",
//    "entry_zone": [0.2048, 0.2188],
//    "take_profit_targets": [0.2199, 0.221, 0.2221, 0.2254],
//    "stop_target": 0.1925
//}

//var signal = {
//    "start": 1734033106895,
//    "symbol": "1000XUSDT",
//    "signal_type": "Long",
//    "leverage": "Cross (30.0X)",
//    "entry_zone": [0.1048, 0.1188],
//    "take_profit_targets": [0.1199, 0.121, 0.1221, 0.1254],
//    "stop_target": 0.0925
//}

var signal = {
    "start": 1734109901000,
    "symbol": cfg.symbol,
    "signal_type": "Long",
    "leverage": "Cross (20.0X)",
    "entry_zone": [0.59, 0.612],
    "take_profit_targets": [0.72, 0.83, 0.91, 1.02],
    "stop_target": 0.52
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

        // Config zurückgeben
        return config;
    } catch (error) {
        Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
        throw error;
    }
}


let trader = new Trader(signal, cfg);


let PriceChangeMonitors = new Array();
setupMonitors();

function roundToThreeDecimals(number) {
    return Math.round(number * 1000) / 1000;
}

function roundToTwoDecimals(number) {
    return Math.round(number * 100) / 100;
}

function dbgMonitorCb(currentPrice,
    percentageChange,
    direction,
    firstPrice) {

    var msg = `dbgMonitorCb ${signal.symbol} ${currentPrice.direction} Change: ${roundToThreeDecimals(currentPrice.percentageChange)}% in ${this.timeWindowMs / 60000}m (${currentPrice.firstPrice} -> ${currentPrice.currentPrice})`;
    Logger.log(msg);

    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", "394159898");
    t.sendMessage(msg);
}

function scalpMonitorCb(currentPrice,
    percentageChange,
    direction,
    firstPrice) {

    var msg = `FAST ${signal.symbol} ${currentPrice.direction} Change: ${roundToThreeDecimals(currentPrice.percentageChange)}% in ${this.timeWindowMs / 60000}m (${currentPrice.firstPrice} -> ${currentPrice.currentPrice})`;
    Logger.log(msg);

    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", "394159898");
    t.sendMessage(msg);
}

function swingMonitorCb(currentPrice,
    percentageChange,
    direction,
    firstPrice) {

    var msg = `SCALP ${signal.symbol} ${currentPrice.direction} Change: ${roundToThreeDecimals(currentPrice.percentageChange)}% in ${this.timeWindowMs / 60000}m (${currentPrice.firstPrice} -> ${currentPrice.currentPrice})`;
    Logger.log(msg);

    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", "394159898");
    t.sendMessage(msg);
}

function breakoutMonitorCb(currentPrice,
    percentageChange,
    direction,
    firstPrice) {

    var msg = `SIGN ${signal.symbol} ${currentPrice.direction} Change: ${roundToThreeDecimals(currentPrice.percentageChange)}% in ${this.timeWindowMs / 60000}m (${currentPrice.firstPrice} -> ${currentPrice.currentPrice})`;
    Logger.log(msg);

    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", "394159898");
    t.sendMessage(msg);
}



function setupMonitors()
{


    // Debug Scalping-Setup
    //const debugOptions = {
    //    percentageThreshold: 0.01,  // Enge Schwelle für schnelle Bewegungen
    //    timeWindowMs: 60000,         // Kurzes Zeitfenster
    //    alertType: 'immediate',     // Sofortige Benachrichtigung
    //    maxAlertFrequency: 10,       // Max. 10 Alerts pro Minute
    //    onPriceChangeCallback: dbgMonitorCb,
    //};

    //let PriceChangeMonitor0 = new PriceChangeMonitor(debugOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor0);

    // Aggressives Scalping-Setup
    const scalpingOptions = {
        percentageThreshold: 0.04,  // Enge Schwelle für schnelle Bewegungen
        timeWindowMs: 60000,         // Kurzes Zeitfenster
        alertType: 'immediate',     // Sofortige Benachrichtigung
        maxAlertFrequency: 10,       // Max. 10 Alerts pro Minute
        onPriceChangeCallback: scalpMonitorCb,
    };

    //let PriceChangeMonitor1 = new PriceChangeMonitor(scalpingOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor1);

    //// Swing Trading Setup
    const swingTradingOptions = {
        percentageThreshold: 0.06,     // Größere Preisbewegungen
        timeWindowMs: 60000,        // 60 Sekunden Beobachtungszeitraum
        alertType: 'consolidated',  // Zusammengefasste Alerts
        maxAlertFrequency: 2,        // Max. 2 Alerts pro 5 Minuten
        onPriceChangeCallback: swingMonitorCb,
    };

    //let PriceChangeMonitor2 = new PriceChangeMonitor(swingTradingOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor2);

    //// Volatilitäts-Breakout Setup
    const breakoutOptions = {
        percentageThreshold: 1,     // Signifikante Bewegung
        timeWindowMs: 600000,        // 10minBeobachtungszeitraum
        minVolume: 10000,           // Mindest-Tradingvolumen
        alertType: 'trend',          // Trendbestätigungsalert
        onPriceChangeCallback: breakoutMonitorCb,
    };

    let PriceChangeMonitor3 = new PriceChangeMonitor(breakoutOptions);
    PriceChangeMonitors.push(PriceChangeMonitor3);

    //// Konservatives Monitoring
    //const conservativeOptions = {
    //    percentageThreshold: 0.12,     // Moderate Schwelle
    //    timeWindowMs: 60000,        // 10 Sekunden Beobachtungszeitraum
    //    alertType: 'summary',       // Zusammenfassende Benachrichtigungen
    //    maxAlertFrequency: 1        // Max. 1 Alert pro 10 Minuten
    //};

    //let PriceChangeMonitor4 = new PriceChangeMonitor(conservativeOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor4);

    ////// Hochfrequenz-Trading Setup
    //const highFrequencyOptions = {
    //    percentageThreshold: 0.2,   // Sehr enge Schwelle
    //    timeWindowMs: 60000,         // 1 Sekunde Beobachtungszeitraum
    //    alertType: 'immediate',     // Sofortige Benachrichtigung
    //    maxAlertFrequency: 20       // Sehr häufige Alerts möglich
    //};

    //let PriceChangeMonitor5 = new PriceChangeMonitor(highFrequencyOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor5);

    ////// News-Reaktions-Setup
    //const newsReactionOptions = {
    //    percentageThreshold: 0.4,     // Größere Bewegungen
    //    timeWindowMs: 60000,        // 1 Minute nach Nachricht
    //    minVolume: 50000,           // Höheres Mindestvolumen
    //    alertType: 'significant',   // Nur signifikante Änderungen
    //    newsImpactMultiplier: 1.5   // Zusätzliche Gewichtung bei Nachrichten
    //};

    //let PriceChangeMonitor6 = new PriceChangeMonitor(newsReactionOptions);
    //PriceChangeMonitors.push(PriceChangeMonitor6);
}



function formatLiquidationMessage(data) {
    // Konvertiere den Zeitstempel in ein lesbares Datum
    const updatedTime = new Date(data.updatedTime).toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    // Erstelle die Nachricht
    const message = `
    Liquidation \u{1F440}
----------------------------
    Symbol: ${data.symbol}
    Side: ${data.side === 'Buy' ? 'Long Liquidation' : 'Short Liquidation'}
    Price: ${g_LastTicker.data.lastPrice}
    Bankruptcy price: ${parseFloat(data.price).toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}
    Size: ${data.size} ${cfg.symbol}
    Time: ${updatedTime}
----------------------------
`;
    return message.trim();
}

function formatPublicTradeMessage(trade) {
    // Convert timestamp into a readable date

    
    data = trade[0];
    var vol = roundToTwoDecimals(parseFloat(data.v) * parseFloat(data.p));
        const tradeTime = new Date(data.T).toLocaleString("de-DE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        // Format the message with trade details
    const message = ` ${data.S === 'Buy' ? ' \u{1F7E9}' : ' \u{1F7E5}'  } 
  
----------------------------
    Symbol: ${data.s}
    Side: ${data.S === 'Buy' ? 'Buy (Bid)' : 'Sell (Ask)'  } 
    Price: ${parseFloat(data.p).toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}
    Quantity: ${parseFloat(data.v).toLocaleString('de-DE')} ${data.s.split('USDT')[0]} 
    Volume: ${vol} $ 
    Time: ${tradeTime}
----------------------------
`;

 

    return message.trim();
}


const linearCSVWriter = new CSVWriterTrade("linear", cfg);
const spotCSVWriter = new CSVWriterTrade("spot", cfg);
const liquidationCSVWriter = new CSVWriterLiquidation("liquidation", cfg);


const liquidationMonitor = new Liquidation(cfg.symbol, (data) => {
    liquidationCSVWriter.writeData(data, g_LastTicker.data.lastPrice);
    var vol = parseFloat(data.size)
    if (vol > cfg.monLinearLiquidationThreshold)
    {
        var msg = formatLiquidationMessage(data);
        var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", /*"394159898"*/cfg.channel);
        t.sendMessage(msg);
        console.log('Received liquidation data:', data);
    }

});

const PublicTradeMonitorSpot = new PublicTrade('wss://stream.bybit.com/v5/public/spot', cfg.symbol, (data) => {
    spotCSVWriter.writeData(data);
    var vol = parseFloat(data[0].v);
    if (vol > cfg.monSpotTradeThreshold)
    {
        var msg = formatPublicTradeMessage(data);
        msg = "Spot Trade " + msg;
        var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", /*"394159898"*/cfg.channel);
        t.sendMessage(msg);
        //console.log('Received spot trade data:', data);
    }

});

const PublicTradeMonitorLinear = new PublicTrade('wss://stream.bybit.com/v5/public/linear', cfg.symbol, (data) => {

    linearCSVWriter.writeData(data);
    var vol = parseFloat(data[0].v);
    if (vol > cfg.monLinearTradeThreshold)
    {
        var msg = formatPublicTradeMessage(data);
        msg = "Perpetual Trade " + msg;
        var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", /*"394159898"*/cfg.channel);
        t.sendMessage(msg);
        //console.log('Received linear trade data:', data);
    }

});


// Beispielhafte Verwendung:
const ticker = new Ticker(signal.symbol, (message) => {


    trader.OnTicker(message);
    g_LastTicker = message;

    for (var i = 0; i < PriceChangeMonitors.length; i++) {
        PriceChangeMonitors[i].processPrice(message.data.lastPrice, Date.now());
    }
});


