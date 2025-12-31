const WebSocket = require('ws');
const crypto = require('crypto');
const Logger = require('./Logger');

class Position {
    /**
     * @param {string} apiKey - Dein API-Key.
     * @param {string} apiSecret - Dein API-Secret.
     * @param {Function} callback - Die Callback-Funktion, die Positions-Updates verarbeitet.
     */
    constructor(apiKey, apiSecret, callback) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.callback = callback;

        this.url = 'wss://stream.bybit.com/v5/private'; // Position-Stream-Endpunkt
        this.reconnectInterval = 5000; // Zeit in Millisekunden für erneuten Verbindungsversuch
        this.isReconnecting = false;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            Logger.log('WebSocket connection for Position opened.');

            // Authentifiziere die Verbindung
            const expires = Date.now() + 5000;
            const authMessage = {
                op: 'auth',
                args: [this.apiKey, expires, this._generateSignature(this.apiKey, this.apiSecret, expires)],
            };

            this.ws.send(JSON.stringify(authMessage));
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);

                // Erfolgreiche Authentifizierung
                if (message.success && message.op === 'auth') {
                    Logger.log('WebSocket authentication for Position successful.');

                    // Abonniere den Position-Stream
                    const subscribeMsg = {
                        op: 'subscribe',
                        args: ['position'],
                    };

                    this.ws.send(JSON.stringify(subscribeMsg));
                }

                // Verarbeite Positions-Updates
                if (message.topic === 'position' && message.data) {
                    this.callback(message.data);
                }
            } catch (err) {
                Logger.error('Error parsing WebSocket message for Position:', err);
            }
        });

        this.ws.on('error', (error) => {
            Logger.error('WebSocket error for Position:', error);
            this.ws.close();
        });

        this.ws.on('close', () => {
            Logger.log('WebSocket connection for Position closed.');
            this.reconnect();
        });
    }

    reconnect() {
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            Logger.log(`Reconnecting Position stream in ${this.reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                this.isReconnecting = false;
                this.connect();
            }, this.reconnectInterval);
        }
    }

    _generateSignature(apiKey, apiSecret, expires) {
        const payload = `GET/realtime${expires}`;
        return crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');
    }
}

module.exports = Position;
