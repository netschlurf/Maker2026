const fs = require('fs');

class Logger {
    // Optionale Variable f�r die Log-Datei, die standardm��ig auf "log.txt" gesetzt ist.
    static logFile = 'log.txt';

    // Die Methode loggt Nachrichten
    static log(...args) {
        const timestamp = new Date().toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

        // Stringifizieren der Argumente: Wenn es ein Objekt ist, wird es als JSON stringifiziert
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); // Formatieren von Objekten mit Einr�ckung
                } catch (e) {
                    return '[Objekt konnte nicht serialisiert werden]'; // Fehlerbehandlung, falls JSON.stringify fehlschl�gt
                }
            }
            return arg; // Wenn es kein Objekt ist, einfach zur�ckgeben
        });

        // Die formatierte Nachricht, die alle Argumente umfasst
        const formattedMessage = `[${timestamp}] ${formattedArgs.join(' ')}`;

        // Log in die Konsole schreiben
        console.log(formattedMessage);

        // Datei-Logging deaktiviert (nur Konsole)
    }

    static error(...args) {
        const timestamp = new Date().toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

        // Stringifizieren der Argumente: Wenn es ein Objekt ist, wird es als JSON stringifiziert
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); // Formatieren von Objekten mit Einr�ckung
                } catch (e) {
                    return '[Objekt konnte nicht serialisiert werden]'; // Fehlerbehandlung, falls JSON.stringify fehlschl�gt
                }
            }
            return arg; // Wenn es kein Objekt ist, einfach zur�ckgeben
        });
 
        // Die formatierte Nachricht, die alle Argumente umfasst
        const formattedMessage = `[${timestamp}] "ERROR: " ${formattedArgs.join(' ')}`;

        // Nur Konsole (Error Stream)
        console.error(formattedMessage);
    }
}

module.exports = Logger;

//// Beispiel-Verwendung der Logger Klasse
//Logger.log('Dies ist eine Log-Nachricht');
//Logger.log('Eine weitere Log-Nachricht');

//// Zum Setzen einer anderen Log-Datei kannst du den Pfad anpassen
//Logger.logFile = 'mein_logfile.txt';
//Logger.log('Diese Nachricht wird jetzt in mein_logfile.txt geschrieben');
