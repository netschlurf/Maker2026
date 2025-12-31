const WebSocket = require('ws');
const Logger = require('./Logger');

class PublicTrade {
    constructor(url, symbol, callback) {
        this.symbol = symbol;
        this.callback = callback;

        // Bybit WebSocket URL for public trade data
        this.url = url;
        this.reconnectInterval = 1000; // Time in ms for retrying connection
        this.isReconnecting = false;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            Logger.log('WebSocket connection for PublicTrade opened.');

            // Subscribe to the public trade topic for the given symbol
            const subscribeMsg = {
                op: 'subscribe',
                args: [`publicTrade.${this.symbol}`], // Subscribe to the publicTrade topic
            };
            this.ws.send(JSON.stringify(subscribeMsg));
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);

                // Ensure the message corresponds to the subscribed topic
                if (message.topic === `publicTrade.${this.symbol}`) {
                    if (message.data && message.data.length > 0) {
                        // Invoke the callback with trade data
                        this.callback(message.data);
                    }
                }
            } catch (err) {
                Logger.error('Error parsing WebSocket message:', err);
            }
        });

        this.ws.on('close', () => {
            Logger.log('WebSocket connection PublicTrade closed.');
            this.reconnect();
        });

        this.ws.on('error', (err) => {
            Logger.error('WebSocket error:', err);
            this.ws.close(); // Close connection and trigger reconnect
        });
    }

    reconnect() {
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            Logger.log(`Reconnecting PublicTrade in ${this.reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                this.isReconnecting = false;
                this.connect();
            }, this.reconnectInterval);
        }
    }
}

module.exports = PublicTrade;
