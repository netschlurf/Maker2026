const axios = require('axios');
const Logger = require('./Logger');
const FormData = require('form-data');
class TelegramConnector {
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        this.baseUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    }

    async sendMessage(message) {
        try {
            // Enkodiere die Nachricht für URL-Sicherheit
            const encodedMessage = encodeURIComponent(message);

            // Konstruiere die vollständige URL
            const url = `${this.baseUrl}?chat_id=${this.chatId}&text=${encodedMessage}`;

            // Sende die Nachricht mit axios
            const response = await axios.get(url, {
                // Optional: SSL-Zertifikatsprüfung konfigurieren
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: true
                })
            });

            // Erfolgreiche Antwort loggen
            //Logger.log('Telegram Nachricht gesendet:', response.data);

            return response.data;
        } catch (error) {
            // Fehlerbehandlung
            Logger.error('Fehler beim Senden der Telegram-Nachricht:', error.message);

            // Optional: Detaillierte Fehlerbehandlung
            if (error.response) {
                Logger.error('Antwort-Daten:', error.response.data);
                Logger.error('Antwort-Status:', error.response.status);
            }


        }
    }

    // Methode zum Senden von formatierten Nachrichten
    async sendFormattedMessage(message, parseMode = 'HTML') {
        try {
            const encodedMessage = encodeURIComponent(message);

            const url = `${this.baseUrl}?chat_id=${this.chatId}&text=${encodedMessage}&parse_mode=${parseMode}`;

            const response = await axios.get(url);

            //Logger.log('Formatierte Telegram-Nachricht gesendet');
            return response.data;
        } catch (error) {
            Logger.error('Fehler beim Senden der formatierten Nachricht:', error.message);

        }
    }

    // Methode zum Senden von Nachrichten mit zusätzlichen Optionen
    async sendAdvancedMessage(options = {}) {
        try {
            const defaultOptions = {
                text: '',
                parse_mode: 'HTML',
                disable_web_page_preview: false,
                disable_notification: false
            };

            const mergedOptions = { ...defaultOptions, ...options };

            const params = new URLSearchParams({
                chat_id: this.chatId,
                ...mergedOptions
            }).toString();

            const url = `${this.baseUrl}?${params}`;

            const response = await axios.get(url);

            //Logger.log('Erweiterte Telegram-Nachricht gesendet');
            return response.data;
        } catch (error) {
            Logger.error('Fehler beim Senden der erweiterten Nachricht:', error.message);
        }
    }

    async sendDocument(filePath, caption = '') {
        try {
            const form = new FormData();
            form.append('chat_id', this.chatId);
            form.append('caption', caption); // Optional: Bildbeschriftung
            form.append('document', require('fs').createReadStream(filePath)); // Datei anhängen

            // Definiere die vollständige URL, die den Token und den Endpunkt enthält
            const baseUrlWithAttachment = `https://api.telegram.org/bot${this.token}/sendDocument`;

            // Header manuell erstellen
            const headers = form.getHeaders ? form.getHeaders() : {};
            headers['Content-Type'] = 'multipart/form-data';

            const response = await axios.post(baseUrlWithAttachment, form, {
                headers: headers
            });

            return response.data;
        } catch (error) {
            Logger.error('Fehler beim Senden des Dokuments:', error.message);
        }
    }

}

module.exports = TelegramConnector;