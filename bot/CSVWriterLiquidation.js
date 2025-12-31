const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

class CSVWriterLiquidation {
    constructor(type, config) {
        this.config = config;
        this.currentFile = null;
        this.fileNumber = 1;
        this.type = type;
        this.timer = null;
        this.startNewFile();
        this.startTimer();
        
    }

    startNewFile() {
        if (this.currentFile) {
            this.currentFile.end();
        }

        const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
        const fileName = `${this.type}.${this.config.symbol}_${String(this.fileNumber).padStart(3, '0')}.csv`;
        const filePath = path.join(this.config.outputDir, fileName);

        this.currentFile = fs.createWriteStream(filePath, { flags: 'w' });
        this.currentFile.write('updatedTime;side;size;price;bprice\n'); // Write CSV header

        this.fileNumber++;
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.startNewFile();
        }, this.config.interval);
    }

    writeData(data, lastPrice) {
        const { updatedTime, side, size, price } = data;
        const csvLine = `${updatedTime};${side};${size};${lastPrice};${price}\n`;

        if (this.currentFile) {
            this.currentFile.write(csvLine);
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        if (this.currentFile) {
            this.currentFile.end();
        }
    }
}

/*
    // Example usage:
    const config = {
        symbol: 'BTCUSDT',
        interval: 3600000, // 1 hour in milliseconds
        outputDir: './data',
    };

    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const writer = new CSVWriter(config);

    // Simulate writing data
    setInterval(() => {
        const exampleData = {
            updatedTime: Date.now(),
            symbol: 'BTCUSDT',
            side: 'Sell',
            size: '0.003',
            price: '43511.70',
        };

        writer.writeData(exampleData);
    }, 5000); // Simulate new data every 5 seconds

    // Stop writer after some time (for demonstration purposes)
    setTimeout(() => {
        writer.stop();
    }, 1800000); // Stop after 30 minutes

*/
module.exports = CSVWriterLiquidation;