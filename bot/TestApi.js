const BybitClient = require('./BybitClient');
const Logger = require('./Logger');
const fs = require('fs');

function loadConfig(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        Logger.error('Error loading config:', error.message);
        throw error;
    }
}

async function testAPI() {
    try {
        const config = loadConfig('../sui.json');
        Logger.log(`Testing API with symbol: ${config.symbol}`);
        
        const client = new BybitClient(config.apiKey, config.apiSecret);
        
        Logger.log("1. Testing GetOpenOrders...");
        const orders = await client.GetOpenOrders(config.symbol);
        Logger.log(`Orders result: ${JSON.stringify(orders, null, 2)}`);
        
        Logger.log("2. Testing GetPosition...");
        const position = await client.GetPosition(config.symbol, 0);
        Logger.log(`Position result: ${JSON.stringify(position, null, 2)}`);
        
        Logger.log("✅ API Test completed successfully!");
        
    } catch (error) {
        Logger.error(`❌ API Test failed: ${error.message}`);
        Logger.error(`Full error: ${JSON.stringify(error, null, 2)}`);
    }
}

testAPI();