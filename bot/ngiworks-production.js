const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ngiworks Production Server for ngiworks.com
// Robust web server with comprehensive error handling and debugging

class ProductionNgiworksServer {
    constructor() {
        this.app = express();
        this.httpPort = 80;
        this.httpsPort = process.env.HTTPS_PORT || 443;
        this.websiteDir = this.findWebsiteDirectory();
        this.startupTime = new Date();
        
        console.log('🚀 ngiworks Production Server initializing...');
        console.log(`📁 Website directory: ${this.websiteDir}`);
        console.log(`🌐 HTTP Port: ${this.httpPort}`);
        console.log(`🔐 HTTPS Port: ${this.httpsPort}`);
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    findWebsiteDirectory() {
        // Try multiple possible paths for website files
        const possiblePaths = [
            path.join(__dirname, '../werbsite'),           // Local development
            path.join(__dirname, 'werbsite'),              // Same directory
            path.join(process.cwd(), 'werbsite'),          // Working directory
            '/var/www/html',                               // Standard web root
            '/var/www/ngiworks',                           // Custom web root
            path.join(__dirname, 'public'),                // Alternative public
            path.join(__dirname, '../public')              // Parent public
        ];

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                const indexPath = path.join(testPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    console.log(`✅ Found website files at: ${testPath}`);
                    return testPath;
                }
            }
        }

        console.warn('⚠️  Website files not found in any standard location');
        console.warn('📍 Checked paths:', possiblePaths);
        
        // Create fallback directory
        const fallback = path.join(__dirname, 'public');
        if (!fs.existsSync(fallback)) {
            fs.mkdirSync(fallback, { recursive: true });
        }
        return fallback;
    }

    setupMiddleware() {
        // Request logging with detailed information
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            const userAgent = req.get('User-Agent') || 'Unknown';
            const realIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || 'Unknown';
            
            console.log(`[${timestamp}] ${req.method} ${req.url}`);
            console.log(`  └─ IP: ${realIP}, User-Agent: ${userAgent.substring(0, 50)}...`);
            
            next();
        });

        // CORS - Allow all origins for testing
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Custom headers for debugging
        this.app.use((req, res, next) => {
            res.setHeader('X-Powered-By', 'ngiworks-server');
            res.setHeader('X-Server-Time', new Date().toISOString());
            next();
        });
    }

    setupRoutes() {
        // Comprehensive health check with system information
        this.app.get('/health', (req, res) => {
            const healthData = {
                status: 'healthy',
                server: 'ngiworks-production',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                startupTime: this.startupTime.toISOString(),
                memory: process.memoryUsage(),
                environment: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    cwd: process.cwd(),
                    httpPort: this.httpPort,
                    httpsPort: this.httpsPort
                },
                websiteInfo: {
                    directory: this.websiteDir,
                    directoryExists: fs.existsSync(this.websiteDir),
                    indexExists: fs.existsSync(path.join(this.websiteDir, 'index.html')),
                    availableFiles: this.getAvailableFiles()
                }
            };

            res.status(200).json(healthData);
        });

        // API status endpoint
        this.app.get('/api/status', (req, res) => {
            res.json({
                server: 'ngiworks TotalHedge Production Server',
                domain: 'ngiworks.com',
                version: '1.0.0',
                mode: 'production',
                status: 'operational',
                timestamp: new Date().toISOString(),
                services: {
                    website: fs.existsSync(path.join(this.websiteDir, 'index.html')) ? 'online' : 'offline',
                    api: 'online',
                    server: 'online'
                }
            });
        });

        // Debug endpoint to show current directory and files
        this.app.get('/debug', (req, res) => {
            res.json({
                currentWorkingDirectory: process.cwd(),
                serverDirectory: __dirname,
                websiteDirectory: this.websiteDir,
                availableFiles: this.getAvailableFiles(),
                environmentVariables: {
                    NODE_ENV: process.env.NODE_ENV,
                    PORT: process.env.PORT,
                    HTTP_PORT: process.env.HTTP_PORT,
                    HTTPS_PORT: process.env.HTTPS_PORT
                },
                serverDetails: {
                    httpPort: this.httpPort,
                    httpsPort: this.httpsPort,
                    startupTime: this.startupTime
                }
            });
        });

        // Serve static files from website directory
        if (fs.existsSync(this.websiteDir)) {
            this.app.use(express.static(this.websiteDir, {
                maxAge: '1d',
                etag: true,
                lastModified: true,
                dotfiles: 'deny',
                index: ['index.html']
            }));
            console.log(`📂 Static files serving from: ${this.websiteDir}`);
        } else {
            console.warn(`⚠️  Static directory not found: ${this.websiteDir}`);
        }

        // Root route with detailed fallback
        this.app.get('/', (req, res) => {
            const indexPath = path.join(this.websiteDir, 'index.html');
            
            if (fs.existsSync(indexPath)) {
                console.log(`✅ Serving index.html from: ${indexPath}`);
                res.sendFile(indexPath);
            } else {
                console.warn(`❌ index.html not found at: ${indexPath}`);
                
                // Detailed fallback page with debugging information
                res.status(404).send(`
                    <!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>ngiworks - Server Debug</title>
                        <style>
                            body { 
                                font-family: 'Segoe UI', Arial, sans-serif; 
                                background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
                                color: white; 
                                margin: 0; 
                                padding: 20px;
                                line-height: 1.6;
                            }
                            .container { max-width: 800px; margin: 0 auto; }
                            .logo { 
                                color: #00ffff; 
                                font-size: 3em; 
                                font-weight: bold; 
                                text-align: center; 
                                margin-bottom: 10px;
                                text-shadow: 0 0 20px #00ffff50;
                            }
                            .subtitle { 
                                text-align: center; 
                                color: #ccc; 
                                margin-bottom: 40px; 
                                font-size: 1.2em;
                            }
                            .debug-info { 
                                background: #333; 
                                padding: 20px; 
                                border-radius: 10px; 
                                margin: 20px 0;
                                border-left: 4px solid #00ffff;
                            }
                            .status { 
                                display: inline-block; 
                                padding: 5px 15px; 
                                background: #ff4444; 
                                color: white; 
                                border-radius: 20px; 
                                margin: 5px;
                            }
                            .status.ok { background: #44ff44; color: black; }
                            h2 { color: #00ffff; }
                            ul { text-align: left; }
                            .file { color: #ffff44; }
                            .link { color: #00ffff; text-decoration: none; }
                            .link:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="logo">ngiworks</div>
                            <div class="subtitle">TotalHedge Production Server</div>
                            
                            <div class="debug-info">
                                <h2>🔧 Server Status</h2>
                                <div class="status">Server: Online</div>
                                <div class="status">Website: Offline</div>
                                <div class="status">API: Online</div>
                                <p><strong>Zeit:</strong> ${new Date().toISOString()}</p>
                                <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} Sekunden</p>
                            </div>

                            <div class="debug-info">
                                <h2>📁 Dateisystem</h2>
                                <p><strong>Erwarteter Pfad:</strong> <span class="file">${indexPath}</span></p>
                                <p><strong>Working Directory:</strong> <span class="file">${process.cwd()}</span></p>
                                <p><strong>Server Directory:</strong> <span class="file">${__dirname}</span></p>
                                <p><strong>Website Directory:</strong> <span class="file">${this.websiteDir}</span></p>
                                
                                <h3>📂 Verfügbare Dateien:</h3>
                                <ul>
                                    ${this.getAvailableFiles().map(file => `<li class="file">${file}</li>`).join('') || '<li>❌ Keine Dateien gefunden</li>'}
                                </ul>
                            </div>

                            <div class="debug-info">
                                <h2>🔗 Debug Links</h2>
                                <p><a href="/health" class="link">🔧 Health Check</a></p>
                                <p><a href="/api/status" class="link">📊 API Status</a></p>
                                <p><a href="/debug" class="link">🐛 Debug Info</a></p>
                            </div>

                            <div class="debug-info">
                                <h2>💡 Lösungsvorschläge</h2>
                                <ul>
                                    <li>Prüfe ob die Website-Dateien im richtigen Verzeichnis liegen</li>
                                    <li>Stelle sicher, dass index.html existiert</li>
                                    <li>Überprüfe Dateiberechtigungen</li>
                                    <li>Restart des Servers versuchen</li>
                                </ul>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            }
        });

        // Remove problematic 404 handler that causes path-to-regexp error
        // Express static middleware will handle file serving automatically

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('❌ Server Error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Ein Server-Fehler ist aufgetreten',
                server: 'ngiworks-production',
                timestamp: new Date().toISOString()
            });
        });
    }

    getAvailableFiles() {
        try {
            if (fs.existsSync(this.websiteDir)) {
                const files = fs.readdirSync(this.websiteDir);
                return files.filter(file => !file.startsWith('.')); // Filter hidden files
            }
        } catch (error) {
            console.error('Error reading directory:', error);
        }
        return [];
    }

    async startServer() {
        try {
            console.log('🚀 Starting ngiworks Production Server...');
            
            // Start HTTP server
            const httpServer = http.createServer(this.app);
            
            httpServer.listen(this.httpPort, '0.0.0.0', () => {
                console.log(`✅ HTTP Server running on port ${this.httpPort}`);
                console.log(`🌐 Website: http://ngiworks.com`);
                console.log(`💡 Health Check: http://ngiworks.com/health`);
                console.log(`🔧 Debug Info: http://ngiworks.com/debug`);
                
                // Log server startup success
                console.log('📊 Server startup completed successfully');
                console.log(`📁 Serving from: ${this.websiteDir}`);
                console.log(`📋 Available files: ${this.getAvailableFiles().join(', ') || 'none'}`);
            });

            httpServer.on('error', (error) => {
                console.error('❌ HTTP Server Error:', error);
                if (error.code === 'EACCES') {
                    console.error(`💡 Permission denied for port ${this.httpPort}. Try running with sudo or use a different port.`);
                } else if (error.code === 'EADDRINUSE') {
                    console.error(`💡 Port ${this.httpPort} is already in use. Stop other services or use a different port.`);
                }
            });

            // Try to start HTTPS server if certificates exist
            this.tryStartHTTPS();

            // Graceful shutdown handlers
            process.on('SIGINT', this.shutdown.bind(this));
            process.on('SIGTERM', this.shutdown.bind(this));

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    tryStartHTTPS() {
        const certPaths = [
            { key: '/etc/ssl/private/ngiworks.key', cert: '/etc/ssl/certs/ngiworks.crt' },
            { key: path.join(__dirname, 'ssl/ngiworks-key.pem'), cert: path.join(__dirname, 'ssl/ngiworks-cert.pem') },
            { key: '/etc/letsencrypt/live/ngiworks.com/privkey.pem', cert: '/etc/letsencrypt/live/ngiworks.com/fullchain.pem' }
        ];

        for (const certPath of certPaths) {
            if (fs.existsSync(certPath.key) && fs.existsSync(certPath.cert)) {
                try {
                    const httpsOptions = {
                        key: fs.readFileSync(certPath.key),
                        cert: fs.readFileSync(certPath.cert)
                    };

                    const httpsServer = https.createServer(httpsOptions, this.app);
                    httpsServer.listen(this.httpsPort, '0.0.0.0', () => {
                        console.log(`🔐 HTTPS Server running on port ${this.httpsPort}`);
                        console.log(`🌐 Secure Website: https://ngiworks.com`);
                    });

                    return; // Successfully started HTTPS
                } catch (error) {
                    console.warn(`⚠️  Failed to start HTTPS with certs from ${certPath.key}:`, error.message);
                }
            }
        }

        console.warn('⚠️  No valid SSL certificates found. HTTPS server not started.');
        console.warn('💡 For HTTPS support, please install SSL certificates.');
    }

    shutdown() {
        console.log('\\n🛑 Shutting down ngiworks server...');
        console.log('💾 Saving logs and cleaning up...');
        console.log('👋 ngiworks server stopped. Visit us again soon!');
        process.exit(0);
    }
}

// Auto-start if this file is executed directly
if (require.main === module) {
    const server = new ProductionNgiworksServer();
    server.startServer();
}

module.exports = ProductionNgiworksServer;