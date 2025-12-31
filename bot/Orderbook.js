const WebSocket = require('ws');
const Logger = require('./Logger');

class OrderBook {
    constructor(url, depth, symbol, callback) {
        this.url = url;
        this.depth = depth; // e.g., 50, 100, etc.
        this.symbol = symbol; // e.g., BTCUSDT
        this.callback = callback; // Function to call with the updated order book

        this.bids = {}; // Local order book bids (price -> quantity)
        this.asks = {}; // Local order book asks (price -> quantity)

        this.reconnectInterval = 1000; // Time in ms for retrying connection
        this.isReconnecting = false;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            Logger.log('WebSocket connection for OrderBook opened.');

            // Subscribe to the orderbook topic for the given symbol and depth
            const subscribeMsg = {
                op: 'subscribe',
                args: [`orderbook.${this.depth}.${this.symbol}`],
            };
            this.ws.send(JSON.stringify(subscribeMsg));
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);

                // Ensure the message corresponds to the subscribed topic
                if (message.topic === `orderbook.${this.depth}.${this.symbol}`) {
                    if (message.type === 'snapshot') {
                        this.processSnapshot(message.data);
                    } else if (message.type === 'delta') {
                        this.processDelta(message.data);
                    }
                }
            } catch (err) {
                Logger.error('Error parsing WebSocket message:', err);
            }
        });

        this.ws.on('close', () => {
            Logger.log('WebSocket connection OrderBook closed.');
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
            Logger.log(`Reconnecting OrderBook in ${this.reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                this.isReconnecting = false;
                this.connect();
            }, this.reconnectInterval);
        }
    }

    processSnapshot(snapshot) {
        //Logger.log('Processing snapshot for OrderBook...');

        // Clear existing data
        this.bids = {};
        this.asks = {};

        // Add bids
        for (const [price, quantity] of snapshot.b) {
            if (parseFloat(quantity) > 0) {
                this.bids[price] = parseFloat(quantity);
            }
        }

        // Add asks
        for (const [price, quantity] of snapshot.a) {
            if (parseFloat(quantity) > 0) {
                this.asks[price] = parseFloat(quantity);
            }
        }

        // Trigger callback with the updated order book
        this.triggerCallback();
    }

    processDelta(delta) {
        //Logger.log('Processing delta for OrderBook...');

        // Update bids
        for (const [price, quantity] of delta.b) {
            if (parseFloat(quantity) > 0) {
                this.bids[price] = parseFloat(quantity); // Add or update
            } else {
                delete this.bids[price]; // Remove if quantity is 0
            }
        }

        // Update asks
        for (const [price, quantity] of delta.a) {
            if (parseFloat(quantity) > 0) {
                this.asks[price] = parseFloat(quantity); // Add or update
            } else {
                delete this.asks[price]; // Remove if quantity is 0
            }
        }

        // Trigger callback with the updated order book
        this.triggerCallback();
    }

    triggerCallback() {
        if (this.callback) {
            const bidsArray = Object.entries(this.bids).map(([price, quantity]) => ([parseFloat(price), quantity]));
            const asksArray = Object.entries(this.asks).map(([price, quantity]) => ([parseFloat(price), quantity]));

            // Sort bids in descending order and asks in ascending order
            bidsArray.sort((a, b) => b[0] - a[0]);
            asksArray.sort((a, b) => a[0] - b[0]);

            this.callback({ bids: bidsArray, asks: asksArray });
        }
    }
}

module.exports = OrderBook;
