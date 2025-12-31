const WebSocket = require('ws');
const Logger = require('./Logger');
class Ticker {
    constructor(symbol, callback) {
        this.symbol = symbol;
        this.callback = callback;

        this.url = 'wss://stream.bybit.com/v5/public/linear';
        this.reconnectInterval = 1000; // Zeit in Millisekunden für erneuten Verbindungsversuch
        this.isReconnecting = false;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            Logger.log('WebSocket connection for Ticker opened.');

            // Abonniere das Ticker-Topic für das spezifische Symbol
            const subscribeMsg = {
                op: 'subscribe',
                args: [`tickers.${this.symbol}`],
            };
            this.ws.send(JSON.stringify(subscribeMsg));
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                // Überprüfe, ob die Nachricht das relevante Symbol betrifft
                if (message.topic === `tickers.${this.symbol}`) {
                    if (message.data?.lastPrice !== undefined) {
                        this.callback(message);
                    }
                }
            } catch (err) {
                Logger.error('Error parsing WebSocket message:', err);
            }
        });

        this.ws.on('close', () => {
            Logger.log('WebSocket connection Ticker closed.');
            this.reconnect();
        });

        this.ws.on('error', (err) => {
            Logger.error('WebSocket error:', err);
            this.ws.close(); // Schließe Verbindung bei Fehler und initialisiere Reconnect
        });
    }

    reconnect() {
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            Logger.log(`Reconnecting Ticker in ${this.reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                this.isReconnecting = false;
                this.connect();
            }, this.reconnectInterval);
        }
    }
}

module.exports = Ticker;
