const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ngiworks Simple Web Server (HTTP Only)
// Einfacher Webserver für TotalHedge Marketing Website

class SimpleNgiworksServer {
    constructor() {
        this.app = express();
        this.port = 80;
        this.websiteDir = path.join(__dirname, '../werbsite');
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });

        // Body parsing
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
            next();
        });

        // Static files from werbsite directory
        this.app.use(express.static(this.websiteDir, {
            maxAge: '1d',
            etag: true,
            lastModified: true
        }));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                server: 'ngiworks-simple',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                websiteDir: this.websiteDir,
                filesExist: fs.existsSync(path.join(this.websiteDir, 'index.html'))
            });
        });

        // API status endpoint
        this.app.get('/api/status', (req, res) => {
            res.json({
                server: 'ngiworks TotalHedge Web Server',
                version: '1.0.0',
                mode: 'HTTP',
                status: 'online',
                timestamp: new Date().toISOString()
            });
        });

        // Root route - explicitly serve index.html
        this.app.get('/', (req, res) => {
            const indexPath = path.join(this.websiteDir, 'index.html');
            
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>ngiworks - TotalHedge</title>
                        <style>
                            body { font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: white; }
                            .logo { color: #00ffff; font-size: 2em; margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="logo">ngiworks</div>
                        <h1>TotalHedge</h1>
                        <p>🚧 Website wird geladen...</p>
                        <p>Bitte stelle sicher, dass die Website-Dateien im werbsite-Ordner vorhanden sind.</p>
                        <p>📁 Erwarteter Pfad: ${indexPath}</p>
                        <p>📂 Verfügbare Dateien:</p>
                        <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
                            ${this.getAvailableFiles()}
                        </ul>
                        <p><a href="/health" style="color: #00ffff;">🔧 Server Status</a></p>
                    </body>
                    </html>
                `);
            }
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Server Error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: err.message,
                server: 'ngiworks-simple',
                timestamp: new Date().toISOString()
            });
        });
    }

    getAvailableFiles() {
        try {
            if (fs.existsSync(this.websiteDir)) {
                const files = fs.readdirSync(this.websiteDir);
                return files.map(file => `<li>📄 ${file}</li>`).join('');
            } else {
                return '<li>❌ Website-Verzeichnis nicht gefunden</li>';
            }
        } catch (error) {
            return '<li>❌ Fehler beim Lesen des Verzeichnisses</li>';
        }
    }

    async start() {
        try {
            console.log('🚀 Starting ngiworks TotalHedge Web Server (Simple HTTP)...');
            console.log(`📁 Website directory: ${this.websiteDir}`);
            
            // Check if website files exist
            if (!fs.existsSync(this.websiteDir)) {
                console.warn(`⚠️  Website directory not found: ${this.websiteDir}`);
                console.warn('📁 Creating directory...');
                fs.mkdirSync(this.websiteDir, { recursive: true });
            }

            const indexPath = path.join(this.websiteDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                console.log('✅ index.html found');
            } else {
                console.warn('⚠️  index.html not found - will show directory listing');
            }

            // Start HTTP server
            const server = http.createServer(this.app);
            
            server.listen(this.port, () => {
                console.log(`🌐 HTTP Server läuft auf Port ${this.port}`);
                console.log(`📱 Website: http://localhost`);
                console.log(`💡 Health Check: http://localhost/health`);
                console.log(`📊 TotalHedge Marketing Website ist online!`);
            });

            server.on('error', (error) => {
                if (error.code === 'EACCES') {
                    console.error(`❌ Keine Berechtigung für Port ${this.port}`);
                    console.error('💡 Versuche einen anderen Port oder starte als Administrator');
                    
                    // Fallback to port 8080
                    console.log('🔄 Fallback auf Port 8080...');
                    this.port = 8080;
                    server.listen(this.port, () => {
                        console.log(`🌐 HTTP Server läuft auf Port ${this.port}`);
                        console.log(`📱 Website: http://localhost:${this.port}`);
                        console.log(`💡 Health Check: http://localhost:${this.port}/health`);
                    });
                } else if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${this.port} ist bereits in Verwendung`);
                    console.error('💡 Stoppe andere Prozesse oder verwende einen anderen Port');
                    process.exit(1);
                } else {
                    console.error('❌ Server Error:', error);
                    process.exit(1);
                }
            });

            // Graceful shutdown
            process.on('SIGINT', this.shutdown.bind(this));
            process.on('SIGTERM', this.shutdown.bind(this));

        } catch (error) {
            console.error('❌ Server konnte nicht gestartet werden:', error);
            process.exit(1);
        }
    }

    shutdown() {
        console.log('\\n🛑 ngiworks Server wird heruntergefahren...');
        console.log('👋 Bis bald!');
        process.exit(0);
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new SimpleNgiworksServer();
    server.start();
}

module.exports = SimpleNgiworksServer;