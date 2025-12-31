const Logger = require('./Logger');
const fs = require('fs');
const path = require('path');

class BybitConfig {
    static loadConfig(filePath) {
        try {
            // Standardpfad, falls kein Pfad übergeben wird
            const resolvedPath = path.resolve(filePath || './config.json');

            // Datei lesen
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

            // JSON parsen
            let config = JSON.parse(fileContent);

            // Prüfen, ob apiKey und apiSecret existieren, sonst ergänzen
            if (!config.apiKey) {
                //console.warn('apiKey fehlt in der Konfigurationsdatei. Standardwert wird hinzugefügt.');
                config.apiKey = 'YOUR_API_KEY';
            }

            if (!config.apiSecret) {
                //console.warn('apiSecret fehlt in der Konfigurationsdatei. Standardwert wird hinzugefügt.');
                config.apiSecret = 'YOUR_API_SECRET';
            }

            // Config zurückgeben
            return config;
        } catch (error) {
            Logger.error('Fehler beim Laden der Konfigurationsdatei:', error.message);
            throw error;
        }
    }
}

module.exports = BybitConfig;