const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const TelegramConnector = require('./TelegramConnector');

const dynStart = Date.now() - 60 * 60 * 1000;


const smoothingFactor = 0.000005; // Glättungsfaktor für EMA
const startTS = dynStart;// 1735858817000;

var cfg = loadConfig("./config.json");
const pair = cfg.symbol;      // Währungspaar (z. B., BTCUSDT)

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

// EMA-Funktion für ein Array von Daten
const calculateEMA = (data, smoothingFactor) => {
    let emaArray = [];
    let ema = data[0]; // Der erste Wert ist der Anfangswert für EMA
    emaArray.push(ema);
    for (let i = 1; i < data.length; i++) {
        ema = (data[i] * smoothingFactor) + (ema * (1 - smoothingFactor));
        emaArray.push(ema);
    }
    return emaArray;
};

// Funktion zur Formatierung des Zeitstempels
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp); // Konvertiere von Millisekunden nach Sekunden
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind nullbasiert
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return date;// `${day}/${month} ${hour}:${minute}`;
};

(async () => {
    const linearFiles = [];
    const liquidationFiles = [];
    const spotFiles = [];
    const sellVolumes = [];
    const buyVolumes = [];
    const prices = [];
    const times = [];
    const liquidationPrices = [];
    const liquidationTimes = [];
    const liquidationSides = [];

    var linearBuyVolume = 0;
    var linearSellVolume = 0;
    var spotBuyVolume = 0;
    var spotSellVolume = 0;
    var longLiquVolume = 0;
    var shortLiquVolume = 0;
    var logStartTime = 9735858817000;
    var linearAvg = 0;
    var spotAvg = 0;
    var linearTradeCnt = 0;
    var spotTradeCnt = 0;







    // Linear-Daten verarbeiten
    linearFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const records = parse.parse(content, { columns: true, delimiter: ';' });
        records.forEach(row => {
            
            if (Number(row.updatedTime) > startTS) {
                linearAvg += Number(row.price)
                var ts = Number(row.updatedTime);
                if (ts < logStartTime)
                    logStartTime = ts;
                if (row.side === 'Buy') {
                    linearBuyVolume += Number(row.size);
                } else if (row.side === 'Sell') {
                    linearSellVolume += Number(row.size);
                }
                linearTradeCnt++;
            }
            
        });
        
    });
    linearAvg = linearAvg / linearTradeCnt;

    spotFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const records = parse.parse(content, { columns: true, delimiter: ';' });
        records.forEach(row => {
            if (Number(row.updatedTime) > startTS) {
                spotAvg += Number(row.price)
                if (row.side === 'Buy') {
                    spotBuyVolume += Number(row.size);
                } else if (row.side === 'Sell') {
                    spotSellVolume += Number(row.size);
                }
                spotTradeCnt++
            }
            
        });
        
    });
    spotAvg = spotAvg / spotTradeCnt;

    // Liquidation-Daten verarbeiten
    liquidationFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const records = parse.parse(content, { columns: true, delimiter: ';' });
        records.forEach(row => {
            if (Number(row.updatedTime) > startTS) {
                if (row.side === 'Buy') {
                    longLiquVolume += Number(row.size);
                } else if (row.side === 'Sell') {
                    shortLiquVolume += Number(row.size);
                }
            }
        });
    });

    // Exponentiell gleitende Durchschnitte (EMA) für das Volumen berechnen
    const smoothedSellVolumes = calculateEMA(sellVolumes, smoothingFactor);
    const smoothedBuyVolumes = calculateEMA(buyVolumes, smoothingFactor);
    const smoothedPrices = calculateEMA(prices, 0.0001);

    var totalBuy = linearBuyVolume + spotBuyVolume + shortLiquVolume;
    var totalSell = linearSellVolume + spotSellVolume + longLiquVolume;

    var msg = `ByBit ${cfg.symbol} volumes since  ${formatTimestamp(logStartTime)} in units
                Perp. Buy : ${linearBuyVolume.toFixed(2) }
                Perp. Sell : ${linearSellVolume.toFixed(2) }
                Spot  Buy : ${spotBuyVolume.toFixed(2) }
                Spot  Sell : ${spotSellVolume.toFixed(2) }
                Long  Liq. : ${longLiquVolume.toFixed(2) }
                Short Liq. : ${shortLiquVolume.toFixed(2)}

                Total Buy : ${totalBuy.toFixed(2)}
                Total Sell : ${totalSell.toFixed(2)}
                AVG Perp: ${linearAvg.toFixed(2)} USDT
                AVG Spot: ${spotAvg.toFixed(2)} USDT`;
    console.log(msg);
    //fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", /*"394159898"*/cfg.channel);
    await t.sendMessage(msg);

})();
