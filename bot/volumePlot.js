const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');
const TelegramConnector = require('./TelegramConnector');

const dynStart = Date.now() - 1000 * 120;
const folderPath = './data'; // Ordnerpfad zu den CSV-Dateien
const pair = 'BTCUSDT';      // Währungspaar (z. B., BTCUSDT)
const smoothingFactor = 0.000005; // Glättungsfaktor für EMA
const startTS = 1735718417000;

var cfg = loadConfig("./config.json");

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
    const sellVolumes = [];
    const buyVolumes = [];
    const prices = [];
    const times = [];
    const liquidationPrices = [];
    const liquidationTimes = [];
    const liquidationSides = [];

    // Dateien einlesen
    fs.readdirSync(folderPath).forEach(file => {
        if (file.includes('linear') && file.includes(pair)) {
            linearFiles.push(path.join(folderPath, file));
        } else if (file.includes('liquidation') && file.includes(pair)) {
            liquidationFiles.push(path.join(folderPath, file));
        }
    });



    // Linear-Daten verarbeiten
    linearFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const records = parse.parse(content, { columns: true, delimiter: ';' });
        records.forEach(row => {
            if (Number(row.updatedTime) > startTS) {
                const formattedTime = formatTimestamp(Number(row.updatedTime)); // Zeit formatieren
                times.push(formattedTime); // Formatierten Zeitstempel speichern
                prices.push(Number(row.price));
                if (row.side === 'Buy') {
                    buyVolumes.push(Number(row.size));
                    sellVolumes.push(0); // Kein Sell-Volumen
                } else if (row.side === 'Sell') {
                    sellVolumes.push(Number(row.size));
                    buyVolumes.push(0); // Kein Buy-Volumen
                }
            }
        });
    });

    // Liquidation-Daten verarbeiten
    liquidationFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const records = parse.parse(content, { columns: true, delimiter: ';' });
        records.forEach(row => {
            if (Number(row.updatedTime) > startTS) {
                const formattedTime = formatTimestamp(Number(row.updatedTime)); // Zeit formatieren
                liquidationTimes.push(formattedTime); // Formatierten Zeitstempel speichern
                liquidationPrices.push(Number(row.price));
                liquidationSides.push(row.side);
            }
        });
    });

    // Exponentiell gleitende Durchschnitte (EMA) für das Volumen berechnen
    const smoothedSellVolumes = calculateEMA(sellVolumes, smoothingFactor);
    const smoothedBuyVolumes = calculateEMA(buyVolumes, smoothingFactor);
    const smoothedPrices = calculateEMA(prices, 0.0001);

    // Plotly HTML erstellen
    const tracePrice = {
        x: times,
        y: smoothedPrices,
        mode: 'lines',
        name: '',
        line: { color: 'yellow', width: 2, simplify: true }
    };

    const traceSellVolume = {
        x: times,
        y: smoothedSellVolumes,
        mode: 'lines',
        name: 'V Sell',
        line: { color: 'red', width: 2, simplify: true },
        yaxis: 'y2' // Zweite Skala
    };

    const traceBuyVolume = {
        x: times,
        y: smoothedBuyVolumes,
        mode: 'lines',
        name: 'V Bid',
        line: { color: 'green', width: 2, simplify: true },
        yaxis: 'y2' // Zweite Skala
    };

    // Liquidationen farblich nach Seite differenzieren
    const traceLiquidationBuy = {
        x: liquidationTimes.filter((_, idx) => liquidationSides[idx] === 'Buy'),
        y: liquidationPrices.filter((_, idx) => liquidationSides[idx] === 'Buy'),
        mode: 'markers',
        name: 'Long-Liq',
        marker: { color: 'green', size: 10 }
    };

    const traceLiquidationSell = {
        x: liquidationTimes.filter((_, idx) => liquidationSides[idx] === 'Sell'),
        y: liquidationPrices.filter((_, idx) => liquidationSides[idx] === 'Sell'),
        mode: 'markers',
        name: 'Short-Liq',
        marker: { color: 'red', size: 10 }
    };

    const layout = {
        title: `${pair}´Price&Vol`,
        xaxis: { title: '', gridcolor: 'rgba(200, 200, 200, 0.3)' },
        yaxis: { title: '', side: 'left', gridcolor: 'rgba(200, 200, 200, 0.3)', },
        yaxis2: {
            title: 'Vol',
            overlaying: 'y',
            side: 'right',
            gridcolor: 'rgba(200, 200, 200, 0.3)',
        },
        width: 2000,
        height: 1100,
        showlegend: true,
        font: {
            family: 'Arial, sans-serif',
            size: 14,
            color: '#ecf0f1',
        },
        plot_bgcolor: '#2c3e50', // Dunkelblauer Hintergrund
        paper_bgcolor: '#34495e', // Papierfarbe
        showlegend: true,
        margin: {
            l: 50, // Links
            r: 50, // Rechts
            t: 50, // Oben
            b: 50  // Unten
        },
    };

    const fig = { data: [tracePrice, traceSellVolume, traceBuyVolume, traceLiquidationBuy, traceLiquidationSell], layout };

    // HTML-Content generieren
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 15);

    // Erstellen des Pfades mit dem Timestamp
   /* const htmlPath = `./plots/VP${pair}_${timestamp}.html`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.plot.ly/plotly-2.20.0.min.js"></script>
        </head>
        <body>
            <div id="plot" style="width:2000,px;height:1100px;"></div>
            <script>
                const fig = ${JSON.stringify(fig)};
                Plotly.newPlot('plot', fig.data, fig.layout);
            </script>
        </body>
        </html>
    `;*/
    `;*/
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    //var t = new TelegramConnector("8101205770:AAH_shtMS7SJlXwrUCC2fPgFtpRS2_S2V2Y", /*"394159898"*/cfg.channel);
    //t.sendDocument(htmlPath, 'Latest Volume');
    console.log(`Diagramm gespeichert: ${htmlPath}`);
})();
