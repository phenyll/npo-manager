# Dokumentenverwaltung und Notizen-Historie für Mitglieder

## Neue Funktionen

### 📁 Dokumentenverwaltung
- **Dokumente hochladen**: PDF und Bilder (JPEG, PNG, GIF, BMP, WebP) bis 10MB
- **Beschreibungen**: Optionale Beschreibung für jedes Dokument
- **Download**: Sichere Dokumenten-Downloads über die Benutzeroberfläche
- **Verwaltung**: Dokumente können gelöscht werden
- **Metadaten**: Automatische Speicherung von Upload-Datum, Dateigröße und Benutzer

### 📝 Notizen-Historie
- **Kategorisierte Notizen**: Verschiedene Notiz-Typen für bessere Organisation
  - 📋 Allgemein
  - ➡️ Eintritt
  - ⬅️ Austritt
  - 📄 Dokument
  - 📋 Antrag
  - 💰 Zahlung
  - ✉️ Korrespondenz
- **Zeitstempel**: Automatische Erfassung von Erstellungsdatum und Benutzer
- **Bearbeitung**: Notizen können nachträglich bearbeitet werden
- **Löschung**: Unerwünschte Notizen können entfernt werden

## Verwendung

### Dokumenten-Upload
1. Öffnen Sie die Mitglied-Detailansicht (📝 Button in der Mitgliederliste)
2. Scrollen Sie zum Bereich "📁 Dokumente"
3. Wählen Sie eine Datei aus (PDF oder Bild)
4. Geben Sie optional eine Beschreibung ein
5. Klicken Sie "📤 Hochladen"

### Notiz hinzufügen
1. Öffnen Sie die Mitglied-Detailansicht
2. Scrollen Sie zum Bereich "📝 Notizen-Historie"
3. Wählen Sie eine Kategorie aus
4. Geben Sie den Notiz-Text ein
5. Klicken Sie "➕ Hinzufügen"

## Technische Details

### Datenbank-Tabellen
- `member_documents`: Speichert Dokumenten-Metadaten
- `member_notes`: Speichert Notizen mit Kategorien und Zeitstempel

### API-Endpunkte
- `POST /members/:id/documents` - Dokument hochladen
- `GET /members/:id/documents` - Dokumente abrufen
- `GET /members/:id/documents/:docId/download` - Dokument anzeigen/öffnen
- `DELETE /members/:id/documents/:docId` - Dokument löschen
- `POST /members/:id/notes` - Notiz erstellen
- `GET /members/:id/notes` - Notizen abrufen
- `PUT /members/:id/notes/:noteId` - Notiz bearbeiten
- `DELETE /members/:id/notes/:noteId` - Notiz löschen

### Sicherheit
- Alle Endpunkte sind durch Authentifizierung geschützt
- Datei-Upload mit Typ- und Größen-Validierung
- Sichere Datei-Speicherung im `uploads/members/` Verzeichnis

## Beispiele für Verwendung

### Eintritt dokumentieren
1. Notiz erstellen: Kategorie "➡️ Eintritt", Text: "Eintritt erfolgt am 15.06.2024 nach Vorstandsbeschluss"
2. Anmeldeformular hochladen: Beschreibung "Ausgefülltes Anmeldeformular"

### Austritt verwalten
1. Notiz erstellen: Kategorie "⬅️ Austritt", Text: "Austrittswunsch erhalten am 30.05.2024, Austritt zum 31.08.2024"
2. Austrittserklärung hochladen: Beschreibung "Schriftliche Austrittserklärung"

### Korrespondenz nachverfolgen
1. Notiz erstellen: Kategorie "✉️ Korrespondenz", Text: "E-Mail wegen ausstehender Beitragszahlung gesendet"
2. E-Mail als PDF hochladen: Beschreibung "Zahlungserinnerung vom 14.06.2024"
