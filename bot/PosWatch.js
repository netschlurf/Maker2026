//const Ticker = require("./Ticker");
const Logger = require('./Logger');
const fs = require('fs');
const path = require('path');
const BybitClient = require('./BybitClient');
const Wallet = require('./Wallet');
const Position = require('./Position');

var g_positionSize = 0;
var g_numOrders = 0;
var g_orderSize = 0;
var g_exchange = null;
var g_cfg = null;
var g_timeFrame = 10000;
var g_PositionTP = 0;
var g_PositionIndex = 0;

// Periodic REST-based position report every 10s - returns structured data
async function periodicPositionReport() {
    if (!g_exchange) return [];

    const watchSymbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SUIUSDT', 'SOLUSDT', 'MNTUSDT'];
    const now = new Date().toISOString();
    const nowTs = Date.now();
    const positions = [];

    Logger.log(`=== [${now}] Position Report ===`);

    for (const symbol of watchSymbols) {
        try {
            // Get position for positionIdx 0 (one-way mode)
            const pos = await g_exchange.GetPosition(symbol, 0);
            const sizeNum = parseFloat(pos.size || '0');

            if (sizeNum !== 0) {
                const side = pos.side || (sizeNum > 0 ? 'Long' : 'Short');
                const avg = parseFloat(pos.avgPrice || pos.entryPrice || '0');
                const upl = parseFloat(pos.unrealisedPnl || pos.unrealizedPnl || '0');
                const cum = parseFloat(pos.cumRealisedPnl || pos.cumRealisedPnl || '0');
                
                // Calculate position runtime
                const updatedTime = parseInt(pos.updatedTime || pos.createdTime || '0');
                const createdTime = parseInt(pos.createdTime || '0');
                const runtimeMs = updatedTime > 0 ? (nowTs - updatedTime) : 0;
                const runtimeMinutes = Math.floor(runtimeMs / 60000);
                const runtimeHours = Math.floor(runtimeMinutes / 60);
                const remainingMinutes = runtimeMinutes % 60;

                // Get active orders for this symbol
                let orders = [];
                try {
                    const orderResponse = await g_exchange.GetOpenOrders(symbol);
                    if (orderResponse && orderResponse.list && orderResponse.list.length > 0) {
                        orders = orderResponse.list.map(order => {
                            const orderAge = parseInt(order.updatedTime || order.createdTime || '0');
                            const orderAgeMs = orderAge > 0 ? (nowTs - orderAge) : 0;
                            const orderAgeMin = Math.floor(orderAgeMs / 60000);
                            
                            return {
                                orderId: order.orderId || '',
                                side: order.side || '',
                                qty: parseFloat(order.qty || '0'),
                                price: parseFloat(order.price || '0'),
                                orderType: order.orderType || '',
                                orderStatus: order.orderStatus || '',
                                timeInForce: order.timeInForce || '',
                                createdTime: parseInt(order.createdTime || '0'),
                                updatedTime: parseInt(order.updatedTime || '0'),
                                ageMs: orderAgeMs,
                                ageMinutes: orderAgeMin,
                                reduceOnly: order.reduceOnly || false
                            };
                        });
                    }
                } catch (orderErr) {
                    Logger.log(`  Orders: error fetching - ${orderErr.message}`);
                }

                // Create structured position data
                const positionData = {
                    timestamp: now,
                    timestampMs: nowTs,
                    symbol: symbol,
                    side: side,
                    size: sizeNum,
                    avgPrice: avg,
                    unrealisedPnl: upl,
                    cumRealisedPnl: cum,
                    positionIdx: parseInt(pos.positionIdx || '0'),
                    leverage: parseFloat(pos.leverage || '1'),
                    markPrice: parseFloat(pos.markPrice || '0'),
                    positionValue: parseFloat(pos.positionValue || '0'),
                    positionIM: parseFloat(pos.positionIM || '0'),
                    positionMM: parseFloat(pos.positionMM || '0'),
                    liqPrice: parseFloat(pos.liqPrice || '0'),
                    bustPrice: parseFloat(pos.bustPrice || '0'),
                    tpslMode: pos.tpslMode || '',
                    takeProfit: parseFloat(pos.takeProfit || '0'),
                    stopLoss: parseFloat(pos.stopLoss || '0'),
                    trailingStop: parseFloat(pos.trailingStop || '0'),
                    createdTime: createdTime,
                    updatedTime: updatedTime,
                    runtimeMs: runtimeMs,
                    runtimeMinutes: runtimeMinutes,
                    runtimeFormatted: `${runtimeHours}h${remainingMinutes}m`,
                    orders: orders,
                    orderCount: orders.length
                };

                positions.push(positionData);

                // Console output (keeping existing format for readability)
                Logger.log(`${symbol}  ${side}  size=${positionData.size}  avg=${avg}  unrealised=${upl}  runtime=${positionData.runtimeFormatted}`);
                if (orders.length > 0) {
                    Logger.log(`  Orders: ${orders.length} active`);
                    orders.forEach(order => {
                        Logger.log(`    ${order.side} ${order.qty} @ ${order.price} (${order.orderStatus}, age=${order.ageMinutes}min)`);
                    });
                } else {
                    Logger.log(`  Orders: none active`);
                }
            }
        } catch (err) {
            // Skip logging for symbols with no positions/errors (reduces noise)
            if (err.message && !err.message.includes('position not found')) {
                Logger.error(`Error fetching ${symbol}:`, err.message);
            }
        }
    }

    Logger.log('================================');
    return positions;
}

// External system integration - placeholder for your system
async function sendPositionsToExternalSystem(positions) {
    // Debug: Show the exact structure that will be sent
    console.log('\n=== STRUCTURED DATA FOR EXTERNAL SYSTEM ===');
    console.log('Number of positions:', positions.length);
    positions.forEach((pos, index) => {
        console.log(`\nPosition ${index + 1}:`);
        console.log(JSON.stringify(pos, null, 2));
    });
    console.log('=== END STRUCTURED DATA ===\n');

    // TODO: Implement your system integration here
    // Examples:
    // - await httpClient.post('http://your-system/api/positions', { positions });
    // - await database.updatePositions(positions);
    // - await messageQueue.publish('position-updates', positions);
}

main();
function main()
{
    if (process.argv.length < 3) {
        Logger.log("missing args")
    }
    g_cfg = loadConfig(process.argv[2]);

    // Initialize exchange client for REST queries
    g_exchange = new BybitClient(g_cfg.apiKey, g_cfg.apiSecret, false);

    Logger.log("Starting periodic position reports every 10 seconds...");
    
    // Start periodic position reporting every 10 seconds
    setInterval(async () => {
        try {
            const positions = await periodicPositionReport();
            // Optional: Call external system integration here
            // await sendPositionsToExternalSystem(positions);
        } catch (err) {
            Logger.error("Error in periodic position report:", err.message);
        }
    }, 10000);
    
    // Initial report after 2 seconds
    setTimeout(async () => {
        try {
            const positions = await periodicPositionReport();
            // Optional: Initial system integration call
            await sendPositionsToExternalSystem(positions);
        } catch (err) {
            Logger.error("Error in initial position report:", err.message);
        }
    }, 2000);
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
// Debug flag: when true, print raw WS position payloads
const DEBUG_WS_RAW = false;

// Exchange client for REST queries - already initialized in main()

const walletMonitor = new Wallet(g_cfg.apiKey, g_cfg.apiSecret, (data) => {
    // Wallet updates can be verbose; print a short hint only to avoid flooding the console
    try {
        Logger.log(`Wallet update received (${new Date().toISOString()})`);
    } catch (e) {
        console.log('Wallet update received');
    }
});

const posMonitor = new Position(g_cfg.apiKey, g_cfg.apiSecret, (data) => {
    if (DEBUG_WS_RAW) {
        try {
            Logger.log('RAW POSITION WS PAYLOAD:');
            console.log(JSON.stringify(data, null, 2));
        } catch (e) {
            Logger.error('Failed to print raw WS payload:', e.message);
        }
    }

    // --- Compact console summary for watched positions (ETH, BTC, XRP) ---
    try {
        printCompactPositions(data);
    } catch (err) {
        Logger.error('Error printing compact positions:', err.message);
    }
});

// Debug: print the full raw positions payload once so user can inspect what symbols/sizes arrive
let _printedPositionsSnapshot = false;
// Insert snapshot printer inside Position callback by wrapping constructor to allow one-shot log
// We add an additional Position watcher that prints once on first update if not yet printed.
const posSnapshotPrinter = new Position(g_cfg.apiKey, g_cfg.apiSecret, (data) => {
    if (_printedPositionsSnapshot) return;
    _printedPositionsSnapshot = true;
    try {
        Logger.log('Full positions snapshot (first update) — printing to console for debugging');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        Logger.error('Failed to print positions snapshot:', e.message);
    }
});

// REST fallback: query positions for a list of symbols at startup and periodically
const bybit = new BybitClient(g_cfg.apiKey, g_cfg.apiSecret, false);
const restWatchSymbols = ['BTCUSDT','ETHUSDT','XRPUSDT','SUIUSDT','SOLUSDT','MNTUSDT'];
async function restSnapshot() {
    try {
        Logger.log('REST snapshot: checking watched symbols for open positions');
        const results = [];
        for (const s of restWatchSymbols) {
            for (let idx = 0; idx <= 1; idx++) {
                const p = await bybit.GetPosition(s, idx);
                if (p && parseFloat(p.size || '0') !== 0) {
                    results.push({ symbol: s, positionIdx: idx, size: p.size, side: p.side || (parseFloat(p.size) > 0 ? 'Buy' : 'Sell'), avgPrice: p.avgPrice || p.entryPrice, unrealisedPnl: p.unrealisedPnl });
                }
            }
        }

        if (results.length === 0) {
            Logger.log('REST snapshot: no open positions found for watched symbols');
        } else {
            Logger.log(`REST snapshot: found ${results.length} open positions`);
            results.forEach(r => Logger.log(`${r.symbol}  ${r.side}  size=${r.size}  avg=${r.avgPrice}  unrealised=${r.unrealisedPnl}`));
        }
    } catch (e) {
        Logger.error('REST snapshot failed:', e && e.message ? e.message : e);
    }
}

// Run rest snapshot immediately and every 30s
restSnapshot();
setInterval(restSnapshot, 30000);

// Print a short, human-friendly summary for all open positions in the payload
function printCompactPositions(positions) {
    const now = new Date().toISOString();
    const open = positions.filter(p => parseFloat(p.size || '0') !== 0);

    if (open.length === 0) {
        Logger.log(`[${now}] Open positions: none`);
        return;
    }

    Logger.log(`--- [${now}] Open positions (${open.length}) ---`);
    open.forEach(p => {
        const sym = p.symbol || 'unknown';
        const side = p.side || (parseFloat(p.size || 0) > 0 ? 'Long' : 'Short');
        const size = p.size || '0';
        const avg = p.avgPrice || p.entryPrice || p.price || 'n/a';
        const upl = p.unrealisedPnl || p.unrealizedPnl || '0';
        const cum = p.cumRealisedPnl || p.cumRealisedPnl || '0';
        Logger.log(`${sym}  ${side}  size=${size}  avg=${avg}  unrealised=${upl}  cumRealised=${cum}`);
    });
    Logger.log('-------------------------------');
}