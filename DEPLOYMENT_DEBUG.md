# ngiworks.com Deployment Troubleshooting Guide

## 🚨 Problem: Website zeigt nichts an
Die Website https://ngiworks.com/ ist nicht erreichbar.

## 🔧 Mögliche Ursachen und Lösungen

### 1. Server läuft nicht
```bash
# Prüfe ob der Server läuft
pm2 status
pm2 logs ngiworks-web

# Server neu starten
pm2 restart ngiworks-web
# oder komplett neu
pm2 delete ngiworks-web
pm2 start ecosystem.config.js --only ngiworks-web
```

### 2. Falsche Dateipfade
```bash
# Prüfe wo die Website-Dateien sind
ls -la /var/www/html/
ls -la ./werbsite/
ls -la /home/user/ngiworks/werbsite/

# Erstelle symbolischen Link falls nötig
ln -s /pfad/zu/werbsite /var/www/html
```

### 3. Port-Weiterleitung
```bash
# Prüfe ob Port 80 und 443 offen sind
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Öffne Ports in der Firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 4. Nginx/Apache Proxy
Möglicherweise läuft ein Reverse Proxy vor dem Node.js Server.

**Nginx Konfiguration (/etc/nginx/sites-available/ngiworks.com):**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name ngiworks.com www.ngiworks.com;

    # SSL certificates (falls vorhanden)
    ssl_certificate /etc/ssl/certs/ngiworks.crt;
    ssl_certificate_key /etc/ssl/private/ngiworks.key;

    location / {
        proxy_pass http://localhost:3000;  # Oder der Port deines Node.js Servers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Domain/DNS Probleme
```bash
# Prüfe DNS-Auflösung
nslookup ngiworks.com
dig ngiworks.com

# Prüfe ob Domain auf die richtige IP zeigt
ping ngiworks.com
```

### 6. Verbesserte Server-Konfiguration verwenden
Der neue `ngiworks-production.js` Server hat besseres Debugging:

```bash
# Aktuellen Server stoppen
pm2 stop ngiworks-web

# Neuen Production Server starten
pm2 start ecosystem.config.js --only ngiworks-web

# Debug-Informationen abrufen
curl http://localhost/health
curl http://localhost/debug
```

## 🔍 Debug-Endpunkte

- **Health Check:** https://ngiworks.com/health
- **Debug Info:** https://ngiworks.com/debug  
- **API Status:** https://ngiworks.com/api/status

## 📞 Quick Fix Commands

```bash
# Kompletter Neustart
pm2 delete ngiworks-web
cd /pfad/zu/projekt
pm2 start ecosystem.config.js --only ngiworks-web
pm2 save

# Server-Logs live anzeigen
pm2 logs ngiworks-web --lines 50

# System-Status prüfen
pm2 monit
```

## 🎯 Nächste Schritte

1. **Server-Logs prüfen** mit `pm2 logs ngiworks-web`
2. **Debug-Endpoint aufrufen** um Dateipfade zu prüfen
3. **Firewall/Proxy-Konfiguration** überprüfen
4. **Website-Dateien** an den korrekten Ort kopieren
5. **DNS/Domain-Einstellungen** validieren