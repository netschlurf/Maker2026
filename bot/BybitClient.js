const { DefaultLogger, RestClientV5 } = require('bybit-api');
const Logger = require('./Logger');

class BybitClient {
    constructor(apiKey, apiSecret, testnet = false) {
        this.client = new RestClientV5({
            key: apiKey,
            secret: apiSecret,
            testnet,
        }, DefaultLogger);
    }

    async PlaceLimitOrder(symbol, side, quantity, price, positionIndex = 0, stopLoss = null) {
        try {
            // Order erstellen mit SL und TP
            const orderParams = {
                category: 'linear',
                symbol: symbol.toString(),
                orderType: 'Limit',
                price: price.toString(),
                qty: quantity.toString(),
                side: side.toString(),
                positionIdx: positionIndex
            };

            if (stopLoss) {
                orderParams.stopLoss = stopLoss.toString();
            }

            const orderResult = await this.client.submitOrder(orderParams);
            if (orderResult.retCode != 0)
            {
                Logger.error(orderResult.retMsg);
            }

            return orderResult.result;
        } catch (error) {
            Logger.error('Error placing limit order with SL/TP:', error);
            throw error;
        }
    }

    async AmendLimitOrder(orderId, symbol, price = null, quantity = null, stopLoss = null) {
        try {
            // Parameter f�r die �nderung des Auftrags
            const amendParams = {
                category: 'linear',
                symbol: symbol.toString(),
                orderId: orderId.toString(),
            };

            if (stopLoss) {
                amendParams.stopLoss = stopLoss.toFixed(4).toString();
            }

            if (price) {
                amendParams.price = price.toString();
            }

            if (quantity) {
                amendParams.qty = quantity.toString();
            }

            const amendResult = await this.client.amendOrder(amendParams);
            if (amendResult.retCode != 0) {
                // Suppress noisy benign message from Bybit when order cannot be modified
                // e.g., "order not modified" which can happen when price/qty unchanged or
                // order already filled. Only log other error messages.
                try {
                    const msg = amendResult.retMsg ? String(amendResult.retMsg).toLowerCase() : '';
                    if (!msg.includes('order not modified') && !msg.includes('no need to modify') && !msg.includes('nothing to modify')) {
                        Logger.error(amendResult.retMsg);
                    }
                } catch (e) {
                    Logger.error(amendResult.retMsg);
                }
            }
            return amendResult;
        } catch (error) {
            // Filter out benign errors that indicate nothing to change
            try {
                const emsg = error && error.message ? String(error.message).toLowerCase() : '';
                if (!emsg.includes('order not modified') && !emsg.includes('no need to modify') && !emsg.includes('nothing to modify')) {
                    Logger.error('Error amending limit order:', error);
                }
            } catch (e) {
                Logger.error('Error amending limit order:', error);
            }
            throw error;
        }
    }

    async CancelLimitOrder(orderId, symbol) {
        try {
            // Parameter zum Stornieren des Auftrags
            const cancelParams = {
                category: 'linear',
                symbol: symbol.toString(),
                orderId: orderId.toString(),
            };

            const cancelResult = await this.client.cancelOrder(cancelParams);
            if (cancelResult.retCode != 0) {
                Logger.error(cancelResult.retMsg);
            }
            return cancelResult;
        } catch (error) {
            Logger.error('Error cancelling limit order:', error);
            throw error;
        }
    }

    async SetStopLoss(symbol, stopLossPrice, positionIdx) {
        try {
            const response = await this.client.setTradingStop({
                category: 'linear', // Kategorie der M�rkte, z.B., 'linear' f�r USDT-Perpetuals
                symbol: symbol,
                stopLoss: parseFloat(stopLossPrice).toFixed(5), // Stop-Loss-Preis
                positionIdx: positionIdx,
                tpslMode: "Full"
            });
            //Logger.log('Stop-Loss gesetzt:', response);
            return response;
        } catch (error) {
            Logger.error('Fehler beim Setzen des Stop-Loss:', error);
            throw error;
        }
    }

    async UpdateStopLoss(symbol, stopLoss) {
        try {
            const updateResult = await this.client.updateOrder({
                category: 'linear',
                symbol: symbol.toString(),
                stopLoss: stopLoss.toString(),
            });

            return updateResult;
        } catch (error) {
            Logger.error('Error updating stop loss:', error);
            throw error;
        }
    } 



    async GetOpenOrders(symbol) {
        try {
            const response = await this.client.getActiveOrders({
                category: 'linear',
                symbol: symbol,
                //openOnly: 1,
                limit: 10,
            });
            
            // Besseres Error Handling
            if (response && response.retCode === 0 && response.result) {
                return response.result;
            } else if (response && response.retCode !== 0) {
                Logger.error(`GetOpenOrders: API Error ${response.retCode}: ${response.retMsg}`);
                if (response.retCode === 33004) {
                    Logger.error("🚨 API KEY EXPIRED! Please generate new API keys in Bybit dashboard!");
                }
                return { list: [] };
            } else {
                Logger.error(`GetOpenOrders: Invalid response format: ${JSON.stringify(response)}`);
                return { list: [] }; // Return empty structure instead of undefined
            }
        } catch (error) {
            Logger.error(`GetOpenOrders: Exception caught: ${error.message}`);
            return { list: [] }; // Return empty structure instead of undefined
        }
    }



    async SetTakeProfit(symbol, takeProfitPrice) {
        try {
            const response = await this.client.setTradingStop({
                category: 'linear', // Category of markets, e.g., 'linear' for USDT-Perpetuals
                symbol: symbol,
                takeProfit: takeProfitPrice, // Take-Profit price
            });
            Logger.log('Take-Profit gesetzt:', response);
            return response;
        } catch (error) {
            Logger.error('Fehler beim Setzen des Take-Profit:', error);
            throw error;
        }
    }

    CalcPositionPnL(pos)
    {
        if (pos.positionIM == 0) {
            return "Fehler: positionIM darf nicht 0 sein!";
        }

        let pnlPercentage = (parseFloat(pos.unrealisedPnl) / parseFloat(pos.positionIM));
        return pnlPercentage * 100;
    }

    CalcPositionAgeInSeconds(pos) {
        var now = Date.now();
        var start = parseInt(pos.updatedTime);
        var dur = (now - start) / 1000;
        return dur;
    }

    CalcOrderAgeInSeconds(order) {
        var now = Date.now();
        var start = parseInt(order.updatedTime);
        var dur = (now - start) / 1000;
        return dur;
    }

    async GetPosition(symbol, positonIdx) {
        try {
            const response = await this.client.getPositionInfo({
                category: 'linear',
                symbol: symbol,
            });
            
            if (response && response.retCode === 0 && response.result && response.result.list.length > 0) {
                // Suche nach passender Position mit dem Index
                for (let pos of response.result.list) {
                    if (pos.positionIdx == positonIdx) {
                        return pos;
                    }
                }
                // Return empty position structure instead of null
                return { size: '0', avgPrice: '0', positionIdx: positonIdx };
            } else if (response && response.retCode !== 0) {
                Logger.error(`GetPosition: API Error ${response.retCode}: ${response.retMsg}`);
                return { size: '0', avgPrice: '0', positionIdx: positonIdx };
            } else {
                return { size: '0', avgPrice: '0', positionIdx: positonIdx };
            }
        } catch (error) {
            Logger.error(`GetPosition: Exception: ${error.message}`);
            return { size: '0', avgPrice: '0', positionIdx: positonIdx };
        }
    }

    async GetActiveOrders(symbol,  limit = 1) {
        try {
            const response = await this.client.getActiveOrders({
                category: 'linear',
                symbol: symbol,
                openOnly: 1,
                limit: limit,
            });

            if (response.result && response.result.list.length > 0) {
                return response.result.list;
            } else {
                Logger.log('Keine aktiven Orders f�r Symbol:', symbol);
                return [];
            }
        } catch (error) {
            Logger.error('Fehler beim Abrufen der aktiven Orders:', error);
            throw error;
        }
    }

    async GetAllClosedPnLs(category = 'linear', startTime, limit = 50) {
        const fullResult = { list: [] }; // Speichert alle PnLs
        const increment = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
        let now = Date.now(); // Aktueller Zeitpunkt
        let cursor = ""; // F�r Paging

        try {
            do {
                const response = await this.client.getClosedPnL({
                    category: category,
                    startTime: startTime,
                    limit: limit,
                    cursor: cursor,
                });

                if (response.retCode !== 0) {
                    console.error(`Error fetching closed PnL: ${response.retMsg}`);
                    return null;
                }

                const resultList = response.result.list || [];

                // Ergebnisse der aktuellen Seite hinzuf�gen
                if (resultList.length > 0) {
                    fullResult.list.push(...resultList);
                }

                // Cursor aktualisieren, falls vorhanden
                cursor = response.result.nextPageCursor || "";

                // Pr�fen, ob weder Cursor noch Ergebnisse vorhanden sind
                if (!cursor && resultList.length === 0) {
                    // Zeitstempel inkrementieren und erneut versuchen
                    startTime += increment;

                    // Abbrechen, wenn der Startzeitpunkt �ber "jetzt" hinausgeht
                    if (startTime >= now) {
                        break;
                    }

                    console.log(`No results or cursor, moving startTime to: ${new Date(startTime).toISOString()}`);
                }

            } while (cursor || startTime < now);

            return fullResult.list; // Gibt die vollst�ndige Liste der PnLs zur�ck
        } catch (error) {
            console.error('Error fetching closed PnLs:', error);
            throw error;
        }
    }



    async GetClosedPnLFrom(category = 'linear', ts=0)
    {
        var done = false;
        var nextCursor = "";
        var fullResult = new Object();
        fullResult.list = new Array();
        const oneHourInMilliseconds = 60 * 60 * 1000;
        var nextTs = ts;
        while (!done)
        {
            var res = await this.GetClosedPnL(category, 100, nextTs, nextTs + oneHourInMilliseconds);
            if (res.list.length > 0)
                nextTs = res.list[0].createdTime + 1;
            else
                nextTs += oneHourInMilliseconds;
            for (var i = 0; i < res.list.length; i++)
            {
                if (Number(res.list[i].createdTime) > ts)
                    fullResult.list.push(res.list[i]);
                else
                    done = true;
            }
        }
        return fullResult;
    }

    async GetClosedPnL(category = 'linear', limit = 100, startDate, endDate) {
        try {
            const response = await this.client.getClosedPnL({
                category: category,
                limit: limit,

                startTime: startDate,
                //endTime: parseInt(endDate)
            });

            if (response.retCode != 0) {
                Logger.error(`Error fetching closed PnL: ${response.retMsg}`);
                return null;
            }

            //Logger.log('Closed PnL:', response.result);
            return response.result;
        } catch (error) {
            Logger.error('Error fetching closed PnL:', error);
            throw error;
        }
    }
        
    async GetPositions() {
        try {
            const response = await this.client.getPositions({
                category: 'linear', // Kategorie der M�rkte, z.B., 'linear' f�r USDT-Perpetuals
            });

            if (response.retCode != 0) {
                Logger.error(`Error fetching all positions: ${response.retMsg}`);
                return null;
            }

            Logger.log('All Positions Info:', response.result);
            return response.result;
        } catch (error) {
            Logger.error('Error fetching all positions:', error);
            throw error;
        }
    }

    async GetWalletInfo(symbol) {
        try {
            const response = await this.client.getWalletBalance({
                accountType: 'UNIFIED',
                category: 'linear', // Kategorie der M�rkte, z.B., 'linear' f�r USDT-Perpetuals
                symbol: symbol, // Symbol f�r das Wallet
            });
            if (response.retCode != 0) {
                Logger.error(`Error fetching wallet info: ${response.retMsg}`);
                return null;
            }

            //Logger.log('Wallet Info:', response.result);
            return response.result;
        } catch (error) {
            Logger.error('Error fetching wallet info:', error);
            throw error;
        }
    }

    async GetKlines(symbol, interval, startTime, limit = 200) {
        try {
            const response = await this.client.getKline({
                category: 'linear',
                symbol: symbol,
                interval: interval.toString(),
                startTime: startTime,
                limit: limit
            });

            if (response.retCode !== 0) {
                Logger.error(`Error fetching Klines: ${response.retMsg}`);
                return null;
            }

            //Logger.log(`Fetched ${response.result.list.length} Klines for ${symbol}`);
            return response.result.list;
        } catch (error) {
            Logger.error('Error fetching Klines:', error);
            throw error;
        }
    }

    async GetAllKlines(symbol, interval, startTime, limit = 5000) {
        let allKlines = [];
        let batchSize = 1000; // Maximales API-Limit pro Anfrage
        let currentTime = startTime;

        while (allKlines.length < limit) {
            let klines = await this.GetKlines(symbol, interval, currentTime, batchSize);

            if (klines.length === 0) break; // Keine weiteren Daten vorhanden

            allKlines = allKlines.concat(klines);
            currentTime = parseInt(klines[klines.length - 1][0]); // Setze den Startzeitpunkt f�r die n�chste Anfrage

            if (klines.length < batchSize) break; // Falls weniger als batchSize zur�ckkommt, sind wir am Ende
        }

        return allKlines.slice(0, limit); // Falls mehr als ben�tigt geholt wurde, schneide es ab
    }
}

module.exports = BybitClient;