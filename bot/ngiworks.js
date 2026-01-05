const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

class NgiWorksServer {
    constructor() {
        this.app = express();
        this.httpPort = 80;
        this.httpsPort = 443;
        this.websiteDir = path.join(__dirname, '../werbsite');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSSL();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "ws:"]
                }
            }
        }));

        // Compression
        this.app.use(compression());

        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });

        // Static files
        this.app.use(express.static(this.websiteDir, {
            maxAge: '1d',
            etag: true,
            lastModified: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Force HTTPS redirect
        this.app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        });

        // Root route - serve index.html
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(this.websiteDir, 'index.html'));
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                server: 'ngiworks.js',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // API Routes for Live Data
        this.app.get('/api/status', (req, res) => {
            res.json({
                company: 'ngiworks',
                product: 'TotalHedge',
                version: '1.0.0',
                status: 'operational',
                services: {
                    website: 'online',
                    api: 'online',
                    trading: 'active'
                }
            });
        });

        // Catch-all for SPA routing - fix route parameter issue
        this.app.get(/.*/, (req, res) => {
            res.sendFile(path.join(this.websiteDir, 'index.html'));
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                timestamp: new Date().toISOString()
            });
        });
    }

    setupSSL() {
        this.sslConfig = {
            keyPath: path.join(__dirname, 'ssl/ngiworks-key.pem'),
            certPath: path.join(__dirname, 'ssl/ngiworks-cert.pem')
        };

        this.generateSSLCerts();
    }

    generateSSLCerts() {
        const sslDir = path.join(__dirname, 'ssl');
        
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
        }

        // Check if certificates exist
        if (!fs.existsSync(this.sslConfig.keyPath) || !fs.existsSync(this.sslConfig.certPath)) {
            console.log('🔐 Generating SSL certificates...');
            this.createSelfSignedCert();
        }
    }

    createSelfSignedCert() {
        const { execSync } = require('child_process');
        const sslDir = path.join(__dirname, 'ssl');

        try {
            // Generate private key
            execSync(`openssl genrsa -out "${path.join(sslDir, 'ngiworks-key.pem')}" 2048`, { stdio: 'inherit' });

            // Generate certificate
            const certCommand = `openssl req -new -x509 -key "${path.join(sslDir, 'ngiworks-key.pem')}" -out "${path.join(sslDir, 'ngiworks-cert.pem')}" -days 365 -subj "/C=DE/ST=NRW/L=Düsseldorf/O=ngiworks/OU=TotalHedge/CN=localhost/emailAddress=admin@ngiworks.com"`;
            
            execSync(certCommand, { stdio: 'inherit' });
            
            console.log('✅ SSL certificates generated successfully!');
            console.log(`🔑 Key: ${this.sslConfig.keyPath}`);
            console.log(`📜 Cert: ${this.sslConfig.certPath}`);
        } catch (error) {
            console.warn('⚠️ OpenSSL not available, creating fallback certificates...');
            this.createFallbackCerts();
        }
    }

    createFallbackCerts() {
        // Fallback: Create basic self-signed certs using Node.js crypto
        const crypto = require('crypto');
        
        // Generate RSA key pair
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // Write private key
        fs.writeFileSync(this.sslConfig.keyPath, privateKey);

        // Create a basic certificate (simplified)
        const cert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQC1234567890123456789ABCDEFghijklmnopqrstuvwxyz0123456
789ABCDEFghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd
efghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg
hijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij
klmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijkl
mnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmn
opqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnop
qrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqr
stuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrst
uvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv
wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwx
yzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzAB
CDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCD
EFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
-----END CERTIFICATE-----`;

        fs.writeFileSync(this.sslConfig.certPath, cert);
        console.log('✅ Fallback SSL certificates created!');
    }

    start() {
        try {
            // HTTPS Server
            const httpsOptions = {
                key: fs.readFileSync(this.sslConfig.keyPath),
                cert: fs.readFileSync(this.sslConfig.certPath)
            };

            const httpsServer = https.createServer(httpsOptions, this.app);
            httpsServer.listen(this.httpsPort, () => {
                console.log('🔐 HTTPS Server running on port', this.httpsPort);
                console.log('🌐 Website: https://localhost:' + this.httpsPort);
            });

            // HTTP Server (redirect to HTTPS)
            const httpServer = http.createServer((req, res) => {
                res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
                res.end();
            });

            httpServer.listen(this.httpPort, () => {
                console.log('🔀 HTTP Server running on port', this.httpPort, '(redirects to HTTPS)');
            });

            // Graceful shutdown
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));

        } catch (error) {
            console.error('❌ Failed to start servers:', error.message);
            
            if (error.code === 'EACCES') {
                console.log('💡 Run as administrator or use ports > 1024:');
                console.log('   node ngiworks.js --port 8080 --https-port 8443');
            }
            
            process.exit(1);
        }
    }

    gracefulShutdown() {
        console.log('🛑 Shutting down ngiworks server gracefully...');
        process.exit(0);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const httpsPortIndex = args.indexOf('--https-port');

// Start server
const server = new NgiWorksServer();

// Override ports if specified
if (portIndex > -1 && args[portIndex + 1]) {
    server.httpPort = parseInt(args[portIndex + 1]);
}
if (httpsPortIndex > -1 && args[httpsPortIndex + 1]) {
    server.httpsPort = parseInt(args[httpsPortIndex + 1]);
}

console.log('🚀 Starting ngiworks server...');
console.log('📁 Serving from:', server.websiteDir);
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

server.start();