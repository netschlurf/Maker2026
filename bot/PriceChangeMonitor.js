class PriceChangeMonitor {
    constructor(options = {}) {
        this.config = {
            percentageThreshold: options.percentageThreshold || 2,
            timeWindowMs: options.timeWindowMs || 5000,
            priceHistory: [],
            onPriceChangeCallback: options.onPriceChangeCallback || null,
            lastCallbackTime: 0 // Zeitstempel für die Callback-Sperre
        };
    }

    processPrice(currentPrice, timestamp = Date.now()) {
        if (!this.config.priceHistory) {
            this.config.priceHistory = [];
        }

        // Alte Preise aus dem Zeitfenster entfernen
        const now = Date.now();
        this.config.priceHistory = this.config.priceHistory.filter(
            entry => now - entry.timestamp <= this.config.timeWindowMs
        );

        if (this.config.priceHistory.length > 0) {
            const firstPrice = this.config.priceHistory[0].price;
            const percentageChange = Math.abs((currentPrice - firstPrice) / firstPrice * 100);

            if (percentageChange >= this.config.percentageThreshold) {
                const direction = currentPrice > firstPrice ? 'up' : 'down';

                // Nur Callback auslösen, wenn seit dem letzten Mal mindestens 1 Minute vergangen ist
                if (this.config.onPriceChangeCallback && now - this.config.lastCallbackTime >= 30000) {
                    this.config.onPriceChangeCallback({
                        currentPrice,
                        percentageChange,
                        direction,
                        firstPrice
                    });

                    // Letzten Callback-Zeitstempel aktualisieren
                    this.config.lastCallbackTime = now;
                }
            }
        }

        // Aktuellen Preis zur Historie hinzufügen
        this.config.priceHistory.push({
            price: currentPrice,
            timestamp: now
        });
    }

    // Setter für Callback
    onPriceChange(callback) {
        this.config.onPriceChangeCallback = callback;
    }

    // Dynamische Konfigurationsanpassung
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = PriceChangeMonitor;
