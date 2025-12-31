const fs = require('fs');

class Logger {
    // Optionale Variable für die Log-Datei, die standardmäßig auf "log.txt" gesetzt ist.
    static logFile = 'log.txt';

    // Die Methode loggt Nachrichten
    static log(...args) {
        const timestamp = new Date().toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

        // Stringifizieren der Argumente: Wenn es ein Objekt ist, wird es als JSON stringifiziert
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); // Formatieren von Objekten mit Einrückung
                } catch (e) {
                    return '[Objekt konnte nicht serialisiert werden]'; // Fehlerbehandlung, falls JSON.stringify fehlschlägt
                }
            }
            return arg; // Wenn es kein Objekt ist, einfach zurückgeben
        });

        // Die formatierte Nachricht, die alle Argumente umfasst
        const formattedMessage = `[${timestamp}] ${formattedArgs.join(' ')}`;

        // Log in die Konsole schreiben
        console.log(formattedMessage);

        // Log in die Datei schreiben
        fs.appendFile(Logger.logFile, formattedMessage + '\n', (err) => {
            if (err) {
                console.error("Fehler beim Schreiben in die Logdatei:", err);
            }
        });
    }

    static error(...args) {
        const timestamp = new Date().toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

        // Stringifizieren der Argumente: Wenn es ein Objekt ist, wird es als JSON stringifiziert
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); // Formatieren von Objekten mit Einrückung
                } catch (e) {
                    return '[Objekt konnte nicht serialisiert werden]'; // Fehlerbehandlung, falls JSON.stringify fehlschlägt
                }
            }
            return arg; // Wenn es kein Objekt ist, einfach zurückgeben
        });
 
        // Die formatierte Nachricht, die alle Argumente umfasst
        const formattedMessage = `[${timestamp}] "ERROR: " ${formattedArgs.join(' ')}`;

        // Log in die Konsole schreiben
        console.log(formattedMessage);

        // Log in die Datei schreiben
        fs.appendFile(Logger.logFile, formattedMessage + '\n', (err) => {
            if (err) {
                console.error("Fehler beim Schreiben in die Logdatei:", err);
            }
        });
    }
}

module.exports = Logger;

//// Beispiel-Verwendung der Logger Klasse
//Logger.log('Dies ist eine Log-Nachricht');
//Logger.log('Eine weitere Log-Nachricht');

//// Zum Setzen einer anderen Log-Datei kannst du den Pfad anpassen
//Logger.logFile = 'mein_logfile.txt';
//Logger.log('Diese Nachricht wird jetzt in mein_logfile.txt geschrieben');
