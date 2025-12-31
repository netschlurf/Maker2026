const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 3000;

// SSL-Zertifikate laden
const options = {
    key: fs.readFileSync('certs/privkey.pem'),
    cert: fs.readFileSync('certs/fullchain.pem')
};

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Route to get the list of PM2 processes
app.get('/api/processes', (req, res) => {
    exec('pm2 jlist', (err, stdout, stderr) => {
        if (err) {
            console.error('Error fetching PM2 processes:', stderr);
            return res.status(500).json({ error: 'Failed to fetch processes' });
        }
        const processes = JSON.parse(stdout);
        res.json(processes);
    });
});

// Route to start a process
app.post('/api/start', (req, res) => {
    const { processName } = req.body;
    if (!processName) {
        return res.status(400).json({ error: 'Process name is required' });
    }

    exec(`pm2 start ${processName}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error starting process ${processName}:`, stderr);
            return res.status(500).json({ error: `Failed to start process ${processName}` });
        }
        res.json({ message: `Process ${processName} started successfully` });
    });
});

// Route to stop a process
app.post('/api/stop', (req, res) => {
    const { processId } = req.body;
    if (!processId) {
        return res.status(400).json({ error: 'Process ID is required' });
    }

    exec(`pm2 stop ${processId}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error stopping process ${processId}:`, stderr);
            return res.status(500).json({ error: `Failed to stop process ${processId}` });
        }
        res.json({ message: `Process ${processId} stopped successfully` });
    });
});

// Frontend
app.get('/', (req, res) => {
    res.sendFile('/home/netschlurf/pm2mon/index.html');
});

// HTTPS-Server starten
https.createServer(options, app).listen(port, () => {
    console.log(`?? HTTPS-Server läuft auf https://187.188.205.92.host.secureserver.net:${port}`);
});
