const fs = require('fs');
const BybitClient = require('./BybitClient');
const Wallet = require('./Wallet');
const Position = require('./Position');
const Order = require('./Order');
const FastExecutionStream = require('./FastExecutionStream');
const Logger = require('./Logger');
class Trader {
    constructor(signal, config)
    {
        this.isProcessing = false;
        this.config = config;
        this.signal = signal;
        //this.exchange = new BybitClient(config.apiKey, config.apiSecret);
        //this.Wallet = new Wallet(config.apiKey, config.apiSecret, this.WalletCallback);
        //this.Position = new Position(config.apiKey, config.apiSecret, this.PositionCallback);
        //this.Order = new Order(config.apiKey, config.apiSecret, this.OrderCallback);
        //this.FastExecutionStream = new FastExecutionStream(config.apiKey, config.apiSecret, this.FastExecutionStreamCallback);

        setInterval(this.OnFrame.bind(this), 3000);
    }

    WritePrice(ticker)
    {
        const startDate = new Date(this.signal.start).toISOString().slice(0, 10);
        const filename = `${startDate}_${this.signal.symbol}.txt`;
        fs.appendFile(filename, `${ticker.ts};${ticker.data.lastPrice}\n`, (err) => {
            if (err) throw err;
        });
    }

    DistributeLimitOrders(entryZone, config)
    {
        const { numberOfOrders, distributionType } = config;

        // Extrahiere den unteren und oberen Bereich der Zone
        const [minPrice, maxPrice] = entryZone;

        // Validierung der Eingaben
        if (minPrice >= maxPrice) {
            throw new Error("Die Entry-Zone ist ungültig. Der Mindestpreis muss kleiner als der Höchstpreis sein.");
        }

        if (numberOfOrders <= 0) {
            throw new Error("Die Anzahl der Orders muss größer als 0 sein.");
        }

        // Initialisiere ein Array, um die Preise der Orders zu speichern
        const orders = [];

        // Verteilungstyp bestimmen
        if (distributionType === "linear") {
            // Lineare Verteilung
            const step = (maxPrice - minPrice) / (numberOfOrders - 1);
            for (let i = 0; i < numberOfOrders; i++) {
                const price = parseFloat((minPrice + i * step).toFixed(4));
                orders.push(price);
            }
        } else if (distributionType === "exponential") {
            // Exponentielle Verteilung (mehr Orders näher am unteren Preis)
            const base = 2; // Basis für exponentielle Verteilung
            for (let i = 0; i < numberOfOrders; i++) {
                const fraction = Math.pow(base, i / (numberOfOrders - 1));
                const price = parseFloat((minPrice + (maxPrice - minPrice) * (fraction - 1) / (base - 1)).toFixed(4));
                orders.push(price);
            }
        } else {
            throw new Error("Unbekannter Verteilungstyp: " + distributionType);
        }

        return orders;
    }

    RoundToDecimal(doubleValue, maxDigits) {
        // Überprüfen, ob die Eingabe eine Zahl ist
        if (isNaN(doubleValue)) {
            return "Ungültige Eingabe";
        }

        // Runden auf die gewünschte Anzahl von Nachkommastellen
        const roundedNumber = doubleValue.toFixed(maxDigits);

        // Das Ergebnis wieder in einen String umwandeln
        return roundedNumber;
    }

    WalletCallback = (data) => {
        //Logger.log('Wallet update received:', data);
    };

    PositionCallback = (data) => {
        Logger.log('PositionCallback update received:', data);
    };

    OrderCallback = (data) => {
        //Logger.log('OrderCallback update received:', data);
    };

    FastExecutionStreamCallback = (data) => {
        //Logger.log('FastExecutionStreamCallback update received:', data);
    };


    async OnTicker(ticker)
    {
        this.WritePrice(ticker);
        this.ticker = ticker;
    }

    async OnFrame()
    {
        return;
        try {


            var openOrders = await this.exchange.GetOpenOrders(this.signal.symbol);

            // Deine Logik hier (OpenOrders und Order-Verarbeitung)
            var usdt = 0;
            for (var i = 0; i < openOrders.list.length; i++) {
                var order = openOrders.list[i];
                var buyOrdersAreOpen = false;

                if (order.side === "Buy") {
                    usdt += order.qty * order.price / this.config.leverage;
                    buyOrdersAreOpen = true;
                }

                if (buyOrdersAreOpen) {
                    // nix machen, der fuchtelt per Hand rum
                }
            }

            if (!buyOrdersAreOpen) {
                var newOrders = this.DistributeLimitOrders(this.signal.entry_zone, this.config);
                var usdtPerOrder = this.config.maxInvestment / this.config.numberOfOrders;
                var effectiveUsdtPerOrder = usdtPerOrder * this.config.leverage;
                Logger.log(newOrders);
                for (var i = 0; i < newOrders.length; i++) {
                    if (this.ticker.data.lastPrice > newOrders[i]) {
                        try {
                            var qty = effectiveUsdtPerOrder / newOrders[i];
                            Logger.log("Send order at " + newOrders[i] + " " + qty);

                            var res = await this.exchange.PlaceLimitOrder(
                                this.signal.symbol,
                                "Buy",
                                this.RoundToDecimal(qty, this.config.digits),
                                newOrders[i],
                                this.signal.stop_target
                            );

                        } catch (error) {
                            Logger.error("Fehler beim Platzieren der Order bei " + newOrders[i], error);
                        }
                    } else {
                        Logger.log("Skip order at " + newOrders[i] + " too late");
                    }
                }
            }
        } catch (error) {
            Logger.error("Error in OnFrame:", error);
        }
    }

}

module.exports = Trader;