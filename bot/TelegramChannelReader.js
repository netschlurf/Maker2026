const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const fs = require("fs");
const input = require("input");

class TelegramChannelReader {
    constructor(apiId, apiHash, sessionFile = "session.txt") {
        this.apiId = apiId;
        this.apiHash = apiHash;
        this.sessionFile = sessionFile;

        // Vorhandene Sitzung laden oder neue erstellen
        const savedSession = fs.existsSync(this.sessionFile) ? fs.readFileSync(this.sessionFile, "utf8") : "";
        this.client = new TelegramClient(new StringSession(savedSession), this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
    }

    /**
     * Startet die Verbindung zum Telegram-Client
     */
    async connect() {
        Logger.log("Verbinde mit Telegram...");

        if (!this.client.session.authKey) {
            // Nur Eingabe, wenn keine Sitzung vorhanden ist
            await this.client.start({
                phoneNumber: async () => await input.text("Bitte gib deine Telefonnummer ein: "),
                password: async () => await input.text("Bitte gib dein Passwort ein (falls 2FA aktiv): "),
                phoneCode: async () => await input.text("Gib den Code ein, den du per Telegram erhalten hast: "),
                onError: (err) => Logger.error("Fehler beim Verbinden:", err),
            });

            // Sitzung speichern
            fs.writeFileSync(this.sessionFile, this.client.session.save());
            Logger.log("Sitzung gespeichert!");
        } else {
            Logger.log("Sitzung geladen!");
            await this.client.connect();
        }

        Logger.log("Eingeloggt!");
    }

    /**
     * Ruft Nachrichten aus einem Kanal ab
     * @param {string} channelHandle - Der Kanal-Handle, z.B. "@dein_kanal"
     * @param {number} limit - Die Anzahl der Nachrichten, die abgerufen werden sollen
     * @returns {Promise<Array>} - Array der Nachrichten
     */
    async getChannelMessages(channelHandle, limit = 10) {
        if (!this.client.connected) {
            throw new Error("Client ist nicht verbunden. Bitte zuerst connect() aufrufen.");
        }

        Logger.log(`Hole die letzten ${limit} Nachrichten aus dem Kanal ${channelHandle}...`);
        const messages = await this.client.getMessages(channelHandle, { limit });
        return messages.map((msg) => ({
            id: msg.id,
            date: msg.date,
            message: msg.message,
        }));
    }

    /**
     * Beendet die Verbindung zum Telegram-Client
     */
    async disconnect() {
        await this.client.disconnect();
        Logger.log("Verbindung beendet.");
    }
}

module.exports = TelegramChannelReader;

// Beispiel-Nutzung:
// (In einer separaten Datei ausführen, nachdem die Klasse exportiert wurde)
//
// const TelegramChannelReader = require("./TelegramChannelReader");
// (async () => {
//     const reader = new TelegramChannelReader("deine_api_id", "dein_api_hash");
//     await reader.connect();
//     const messages = await reader.getChannelMessages("@dein_kanal", 5);
//     Logger.log("Nachrichten:", messages);
//     await reader.disconnect();
// })();
