const WebSocket = require('ws');
const crypto = require('crypto');
const Logger = require('./Logger');

class Wallet {
    /**
     * @param {string} apiKey - Dein API-Key.
     * @param {string} apiSecret - Dein API-Secret.
     * @param {Function} callback - Die Callback-Funktion, die beim Erhalt von Wallet-Updates aufgerufen wird.
     */
    constructor(apiKey, apiSecret, callback) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.callback = callback;

        this.url = 'wss://stream.bybit.com/v5/private'; // Wallet-Stream-Endpunkt
        this.reconnectInterval = 5000; // Zeit in Millisekunden für erneuten Verbindungsversuch
        this.isReconnecting = false;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        // WebSocket-Event: Verbindung geöffnet
        this.ws.on('open', () => {
            Logger.log('WebSocket connection for Wallet opened.');

            // Authentifiziere die Verbindung (nötig für den Wallet-Stream)
            const expires = Date.now() + 5000;
            const authMessage = {
                op: 'auth',
                args: [this.apiKey, expires, this._generateSignature(this.apiKey, this.apiSecret, expires)],
            };

            this.ws.send(JSON.stringify(authMessage));
        });

        // WebSocket-Event: Nachricht empfangen
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);

                // Prüfen, ob die Verbindung erfolgreich authentifiziert wurde
                if (message.success && message.op === 'auth') {
                    Logger.log('WebSocket authentication successful.');

                    // Abonniere den Wallet-Stream
                    const subscribeMsg = {
                        op: 'subscribe',
                        args: ['wallet'],
                    };

                    this.ws.send(JSON.stringify(subscribeMsg));
                }

                // Handle Wallet-Updates
                if (message.topic === 'wallet' && message.data) {
                    this.callback(message.data);
                }
            } catch (err) {
                Logger.error('Error parsing WebSocket message:', err);
            }
        });

        // WebSocket-Event: Fehler
        this.ws.on('error', (error) => {
            Logger.error('WebSocket error:', error);
            this.ws.close(); // Erzwinge das Schließen, um Wiederverbindung einzuleiten
        });

        // WebSocket-Event: Verbindung geschlossen
        this.ws.on('close', () => {
            Logger.log('WebSocket connection closed.');
            this.reconnect();
        });
    }

    reconnect() {
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            Logger.log(`Reconnecting Wallet in ${this.reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                this.isReconnecting = false;
                this.connect();
            }, this.reconnectInterval);
        }
    }

    /**
     * Generiert die Signatur für die Authentifizierung.
     * @param {string} apiKey - Dein API-Key.
     * @param {string} apiSecret - Dein API-Secret.
     * @param {number} expires - Der Zeitstempel, wann die Signatur abläuft.
     * @returns {string} Die generierte Signatur.
     */
    _generateSignature(apiKey, apiSecret, expires) {
        const payload = `GET/realtime${expires}`;
        return crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');
    }
}

module.exports = Wallet;
