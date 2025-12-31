const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // Zum Ausführen externer Skripte

// Server-Einstellungen
const hostname = '0.0.0.0'; // Lauscht auf alle Schnittstellen
const port = 8090;
const filePath = '/home/netschlurf/MT415886910/pnl_report.html'; // Pfad zur Datei
const volumeStatsScript = path.join(__dirname, 'PnLReport.js'); // Pfad zum Script

// HTTP-Server erstellen
const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        console.log("GET request received. Regenerating pnl_report.html...");

        // `volumeStats.js` ausführen, um die Datei zu generieren
        exec(`node ${volumeStatsScript}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing volumeStats.js: ${error.message}`);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Internal Server Error: Could not generate pnl_report.html');
                return;
            }
            if (stderr) {
                console.error(`Stderr from volumeStats.js: ${stderr}`);
            }
            console.log(`Stdout from volumeStats.js: ${stdout}`);

            // Wenn das Skript erfolgreich war, die Datei lesen und senden
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    // Fehler beim Lesen der Datei
                    console.error(`Error reading pnl_report.html: ${err.message}`);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Internal Server Error: Could not read pnl_report.html');
                } else {
                    // Erfolgreich, Datei senden
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html'); // HTML-Inhalt
                    res.end(data); // Dateiinhalt als Antwort senden
                }
            });
        });
    } else {
        // Nur GET-Anfragen erlauben
        res.statusCode = 405; // Method not allowed
        res.setHeader('Content-Type', 'text/plain');
        res.end('Only GET method is allowed');
    }
});

// Server starten
server.listen(port, hostname, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
