# 🛠️ Entwicklerhandbuch

Anleitung für die Einrichtung und Entwicklung der Vereinsverwaltungssoftware.

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** (Version 16+)
- **npm** (normalerweise mit Node.js installiert)
- **Git** für Versionskontrolle

### Installation

1. **Repository klonen:**
```bash
git clone [repository-url]
cd fv-schloeben
```

2. **Dependencies installieren:**
```bash
npm install
```

3. **Datenbank initialisieren:**
Die SQLite-Datenbank wird automatisch beim ersten Start erstellt.

4. **Server starten:**
```bash
# Entwicklungsmodus (mit automatischem Neustart)
npm run dev
# oder
npm run watch

# Produktionsmodus
npm start
```

5. **Anwendung öffnen:**
```
http://localhost:3000
```

**Standard-Login:**
- Benutzername: `admin`
- Passwort: `password` (Hash: `75e4dc687ed0f5b6d26c57b45fd7a0931e9c0a5ba8a079bd91edbb0efd22f96d`)

## 📁 Projektstruktur

```
fv-schloeben/
├── docs/                    # Dokumentation
├── server/                  # Backend (Node.js/Express)
│   ├── index.js            # Hauptserver und Routing
│   ├── db.js               # Datenbankverbindung und Schema
│   ├── member.js           # Mitgliederverwaltung API
│   ├── payment.js          # Zahlungsverwaltung API
│   ├── user.js             # Benutzerverwaltung API
│   ├── email.js            # E-Mail-Service
│   ├── email-settings.js   # SMTP-Konfiguration
│   ├── organization.js     # Vereinsdaten-API
│   ├── middleware.js       # Authentifizierung und Logging
│   ├── utils.js            # Hilfsfunktionen
│   └── database/
│       ├── club.db         # SQLite-Datenbankdatei
│       └── migrate.js      # Datenbank-Migrationen
├── public/                  # Frontend HTML-Seiten
│   ├── index.html          # Hauptanwendung
│   ├── login.html          # Login-Seite
│   ├── statistics.html     # Statistiken
│   └── ...
├── static/                  # CSS, JavaScript, Assets
│   ├── script.js           # Hauptfrontend-Logik
│   ├── styles.css          # Custom CSS
│   └── bootstrap.*         # Bootstrap Framework
├── uploads/members/         # Mitgliederdokumente
├── sessions/               # Session-Dateien
├── package.json            # Node.js Dependencies
├── nodemon.json            # Nodemon-Konfiguration
└── CLAUDE.md              # KI-Entwicklungsrichtlinien
```

## 🔧 Verfügbare npm Scripts

```json
{
  "dev": "nodemon server/index.js",      // Entwicklungsserver mit Auto-Reload
  "watch": "nodemon server/index.js",    // Alias für dev
  "start": "node server",                // Produktionsserver
  "test": "echo \"Error: no test specified\" && exit 1",
  "clear-sessions": "rm -rf sessions && mkdir -p sessions"
}
```

## 🗄️ Datenbank

### SQLite-Setup
- **Datei:** `server/database/club.db`
- **Automatische Initialisierung** beim ersten Start
- **Schema-Definition** in `server/db.js`

### Wichtige Tabellen
- `members` - Mitgliederdaten
- `payments` - Zahlungsinformationen
- `member_documents` - Dokumenten-Metadaten
- `member_notes` - Notizen-Historie
- `reminder_history` - Mahnung-Historie
- `users`, `roles`, `permissions` - Benutzerverwaltung
- `organization_details` - Vereinsinformationen
- `email_settings` - SMTP-Konfiguration

### Datenbank-Reset
```bash
# Datenbank löschen (Vorsicht!)
rm server/database/club.db

# Server neustarten für Neuinitialisierung
npm run dev
```

## 🌐 Frontend-Entwicklung

### Technologie-Stack
- **Framework:** Vanilla JavaScript (kein Framework)
- **UI:** Bootstrap 5
- **HTTP-Client:** Fetch API
- **Module-System:** Kein Bundler, direkte Script-Tags

### Wichtige Frontend-Dateien
- `public/index.html` - Hauptanwendung
- `static/script.js` - Hauptlogik
- `static/styles.css` - Custom Styles

### Frontend-Konventionen
- Alle Texte und Kommentare auf Deutsch
- Bootstrap-Klassen für UI-Komponenten
- Fetch API für AJAX-Requests
- Einfache DOM-Manipulation ohne Framework

## 🔐 Authentifizierung & Sessions

### Session-Management
- **Library:** express-session mit session-file-store
- **Speicherort:** `./sessions/` Verzeichnis
- **Lebensdauer:** 24 Stunden
- **Session-Clearing:** `npm run clear-sessions`

### Berechtigungen
```javascript
// Beispiel für Berechtigung-Check
if (!req.session?.rights?.includes('create-user')) {
    return res.status(403).send('Nicht autorisiert');
}
```

### Verfügbare Berechtigungen
- `login` - Grundlegendes Login
- `create-user` - Benutzer erstellen
- `list-user` - Benutzer auflisten
- `delete-user` - Benutzer löschen
- `edit-user` - Benutzer bearbeiten

## 📧 E-Mail-System

### SMTP-Konfiguration
E-Mail-Einstellungen werden in der Datenbank gespeichert:
```javascript
// Beispiel SMTP-Konfiguration
{
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  secure: false,
  username: "your-email@gmail.com",
  password: "app-password",
  defaultSender: "Verein <noreply@example.com>"
}
```

### E-Mail-Templates
- Mahnung-E-Mails werden dynamisch generiert
- Templates in `server/member.js` (Mahnung-Funktionalität)
- Personalisierte Inhalte mit Mitgliedsdaten

## 🔍 Debugging

### Server-Logs
```bash
# Server mit Debug-Output starten
DEBUG=* npm run dev
```

### Häufige Probleme

**1. Datenbank-Fehler:**
```bash
# Prüfe ob Datenbankdatei existiert
ls -la server/database/club.db

# Schema-Check
sqlite3 server/database/club.db ".schema"
```

**2. Session-Probleme:**
```bash
# Sessions löschen
npm run clear-sessions
```

**3. Port bereits in Verwendung:**
```bash
# Prozess auf Port 3000 beenden
lsof -ti:3000 | xargs kill -9
```

**4. SMTP-Probleme:**
- SMTP-Einstellungen in der Anwendung überprüfen
- E-Mail-Provider-spezifische App-Passwörter verwenden
- Firewall-Einstellungen prüfen

## 🧪 Testing

### Manuelle Tests
Da keine automatisierten Tests vorhanden sind:

1. **Funktionale Tests:**
   - Alle CRUD-Operationen für Mitglieder
   - Zahlungs-Workflows
   - Dokumenten-Upload/-Download
   - E-Mail-Versand

2. **Browser-Tests:**
   - Chrome, Firefox, Safari, Edge
   - Responsive Design auf verschiedenen Bildschirmgrößen

3. **API-Tests:**
```bash
# Beispiel mit curl
curl -X GET http://localhost:3000/members/stats \
  -H "Cookie: connect.sid=your-session-id"
```

### Validierung vor Deployment
Siehe `docs/validierung.md` für vollständige Checkliste.

## 🚀 Deployment

### Produktions-Setup

1. **Environment Variables:**
```bash
export NODE_ENV=production
export PORT=3000
```

2. **HTTPS-Setup** (empfohlen):
```javascript
// In server/index.js
cookie: { 
  secure: true,  // Für HTTPS
  maxAge: 24 * 60 * 60 * 1000 
}
```

3. **Process Manager:**
```bash
# Mit PM2
npm install -g pm2
pm2 start server/index.js --name fv-schloeben

# Mit systemd
# Service-Datei erstellen
```

### Backup-Strategie

```bash
# Datenbank-Backup
cp server/database/club.db backup/club_$(date +%Y%m%d).db

# Dokumente-Backup
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz uploads/

# Sessions (optional)
tar -czf backup/sessions_$(date +%Y%m%d).tar.gz sessions/
```

## 📋 Code-Konventionen

### Backend (JavaScript/Node.js)
- **Sprache:** Alle Kommentare und Variablen auf Deutsch
- **Async/Await** statt Promise.then()
- **Try/Catch** für Fehlerbehandlung
- **const/let** statt var
- **Deutsche Fehlermeldungen**

### Frontend (JavaScript)
- **Vanilla JavaScript** ohne Framework
- **Bootstrap-Klassen** für UI
- **Fetch API** für HTTP-Requests
- **Deutsche Benutzeroberfläche**

### Datenbank
- **Direkte SQL-Queries** (kein ORM)
- **Transaktionen** bei kritischen Operationen
- **Foreign Key Constraints** aktiviert

## 🔄 Git-Workflow

### Commit-Nachrichten (Deutsch)
```bash
git commit -m "feat: Neue Mahnung-Funktionalität implementiert"
git commit -m "fix: E-Mail-Versand Fehler behoben"
git commit -m "docs: API-Dokumentation erweitert"
```

### Branch-Strategie
- `main` - Produktions-Branch
- `development` - Entwicklungs-Branch
- `feature/*` - Feature-Branches

## 🆘 Support & Troubleshooting

### Logs überwachen
```bash
# Server-Logs in Echtzeit
npm run dev

# Session-Dateien prüfen
ls -la sessions/

# Datenbank-Status
sqlite3 server/database/club.db "SELECT * FROM users;"
```

### Performance-Monitoring
- Browser Developer Tools verwenden
- Network-Tab für API-Anfragen
- Console für JavaScript-Fehler

### Häufige Entwickler-Aufgaben

**Neuen API-Endpunkt hinzufügen:**
1. Route in entsprechender Datei (`server/member.js`, etc.) hinzufügen
2. Middleware für Authentifizierung prüfen
3. Fehlerbehandlung implementieren
4. Frontend-Integration in `static/script.js`
5. Dokumentation aktualisieren

**Neue Datenbank-Tabelle:**
1. Schema in `server/db.js` hinzufügen
2. Migration-Script in `server/database/migrate.js`
3. API-Endpunkte für CRUD-Operationen
4. Frontend-Integration

**Neues E-Mail-Template:**
1. Template in `server/member.js` oder `server/email.js`
2. Personalisierung mit Mitgliedsdaten
3. Test-E-Mail-Funktionalität