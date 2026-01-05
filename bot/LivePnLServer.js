const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const BybitClient = require('./BybitClient');
const moment = require('moment');

class LivePnLServer {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.config = this.loadConfig();
        this.client = new BybitClient(this.config.apiKey, this.config.apiSecret);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startPeriodicUpdate();
    }

    loadConfig(filePath = './config.json') {
        try {
            const resolvedPath = path.resolve(filePath);
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
            throw error;
        }
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('../werbsite')); // Serve website files
    }

    setupRoutes() {
        // Live PnL API Endpoint
        this.app.get('/api/pnl/live', async (req, res) => {
            try {
                const pnlData = await this.getLivePnLData();
                res.json(pnlData);
            } catch (error) {
                console.error('Error fetching PnL data:', error);
                res.status(500).json({ error: 'Failed to fetch PnL data' });
            }
        });

        // Historical PnL API Endpoint
        this.app.get('/api/pnl/history', async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 7;
                const fromDate = Date.now() - (days * 24 * 60 * 60 * 1000);
                const pnlData = await this.getHistoricalPnL(fromDate);
                res.json(pnlData);
            } catch (error) {
                console.error('Error fetching historical PnL:', error);
                res.status(500).json({ error: 'Failed to fetch historical PnL' });
            }
        });

        // Trading Summary API
        this.app.get('/api/trading/summary', async (req, res) => {
            try {
                const summary = await this.getTradingSummary();
                res.json(summary);
            } catch (error) {
                console.error('Error fetching trading summary:', error);
                res.status(500).json({ error: 'Failed to fetch trading summary' });
            }
        });
    }

    async getLivePnLData() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today.getTime();
        
        const pnlData = await this.client.GetAllClosedPnLs('linear', startOfDay);
        
        const totalPnL = pnlData.reduce((sum, trade) => sum + parseFloat(trade.closedPnl), 0);
        const totalTrades = pnlData.length;
        const winningTrades = pnlData.filter(trade => parseFloat(trade.closedPnl) > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
        
        return {
            totalPnL: totalPnL.toFixed(4),
            totalTrades,
            winRate: winRate.toFixed(1),
            timestamp: Date.now(),
            currency: 'USDT',
            symbol: this.config.symbol || 'MULTIPLE',
            recentTrades: pnlData.slice(-5).map(trade => ({
                symbol: trade.symbol,
                side: trade.side === 'Buy' ? 'SHORT' : 'LONG',
                pnl: parseFloat(trade.closedPnl).toFixed(4),
                time: moment(parseInt(trade.updatedTime)).format('HH:mm:ss'),
                qty: parseFloat(trade.qty).toFixed(3)
            }))
        };
    }

    async getHistoricalPnL(fromDate) {
        const pnlData = await this.client.GetAllClosedPnLs('linear', fromDate);
        
        // Group by day
        const dailyPnL = {};
        pnlData.forEach(trade => {
            const date = moment(parseInt(trade.updatedTime)).format('YYYY-MM-DD');
            if (!dailyPnL[date]) {
                dailyPnL[date] = { pnl: 0, trades: 0 };
            }
            dailyPnL[date].pnl += parseFloat(trade.closedPnl);
            dailyPnL[date].trades++;
        });

        const chartData = Object.entries(dailyPnL).map(([date, data]) => ({
            date,
            pnl: data.pnl.toFixed(4),
            trades: data.trades
        }));

        return {
            totalPnL: pnlData.reduce((sum, trade) => sum + parseFloat(trade.closedPnl), 0).toFixed(4),
            totalTrades: pnlData.length,
            dailyData: chartData,
            period: `${chartData.length} days`
        };
    }

    async getTradingSummary() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const last7d = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const [pnl24h, pnl7d] = await Promise.all([
            this.client.GetAllClosedPnLs('linear', last24h),
            this.client.GetAllClosedPnLs('linear', last7d)
        ]);

        const summary24h = this.calculateSummary(pnl24h);
        const summary7d = this.calculateSummary(pnl7d);

        return {
            last24h: summary24h,
            last7d: summary7d,
            status: 'active',
            lastUpdate: new Date().toISOString()
        };
    }

    calculateSummary(trades) {
        if (trades.length === 0) {
            return {
                totalPnL: '0.0000',
                totalTrades: 0,
                winRate: '0.0',
                avgTrade: '0.0000',
                bestTrade: '0.0000',
                worstTrade: '0.0000'
            };
        }

        const totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.closedPnl), 0);
        const winningTrades = trades.filter(trade => parseFloat(trade.closedPnl) > 0).length;
        const winRate = (winningTrades / trades.length * 100);
        const avgTrade = totalPnL / trades.length;
        const bestTrade = Math.max(...trades.map(trade => parseFloat(trade.closedPnl)));
        const worstTrade = Math.min(...trades.map(trade => parseFloat(trade.closedPnl)));

        return {
            totalPnL: totalPnL.toFixed(4),
            totalTrades: trades.length,
            winRate: winRate.toFixed(1),
            avgTrade: avgTrade.toFixed(4),
            bestTrade: bestTrade.toFixed(4),
            worstTrade: worstTrade.toFixed(4)
        };
    }

    startPeriodicUpdate() {
        // Update every 30 seconds
        setInterval(() => {
            this.broadcastUpdate();
        }, 30000);
    }

    async broadcastUpdate() {
        try {
            const liveData = await this.getLivePnLData();
            // In a real implementation, you might use WebSockets here
            console.log(`[${new Date().toISOString()}] Live PnL: ${liveData.totalPnL} USDT`);
        } catch (error) {
            console.error('Error in periodic update:', error);
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Live PnL Server running on http://localhost:${this.port}`);
            console.log(`Website available at: http://localhost:${this.port}`);
            console.log(`Live PnL API: http://localhost:${this.port}/api/pnl/live`);
        });
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new LivePnLServer();
    server.start();
}

module.exports = LivePnLServer;