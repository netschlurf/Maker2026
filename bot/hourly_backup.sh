#!/bin/bash

# Verzeichnisse definieren
folderPath="data"
backupPath="backups"


nodeCommand="node volumeStats.js"
$nodeCommand
timestamp=$(date +'%Y%m%d_%H%M%S') 

# Überprüfen, ob CSV-Dateien vorhanden sind
if find "$folderPath" -maxdepth 1 -type f -name "*.csv" | grep -q .; then
    tar -czvf "$backupPath/csv_backup_$timestamp.tar.gz" -C "$folderPath" .
    rm $folderPath/*.csv
    
    echo "Backup und Node-Skript erfolgreich abgeschlossen für $timestamp"
else
    echo "Keine CSV-Dateien gefunden im Verzeichnis $folderPath"
fi
