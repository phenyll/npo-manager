# ⚽ Fußballverein Schlöben - Vereinsverwaltung

Moderne Webanwendung zur Verwaltung von Mitgliedern, Beiträgen und Vereinsangelegenheiten des Fußballvereins Schlöben.

## 📋 Überblick

Diese Vereinsverwaltungssoftware bietet eine umfassende Lösung für die tägliche Vereinsarbeit:

- **👥 Mitgliederverwaltung** - Vollständige Mitgliederdaten mit Ein-/Austritt
- **💰 Beitragsverwaltung** - Automatisierte Zahlungsverfolgung
- **📧 Mahnung-System** - Professionelle Zahlungserinnerungen mit rechtlichen Grundlagen
- **📁 Dokumentenverwaltung** - Sichere Verwaltung von Mitgliederdokumenten
- **📊 Statistiken** - Übersichten und Berichte für Vorstand und Verwaltung
- **👤 Benutzerverwaltung** - Rollenbasierte Zugriffskontrolle

## 🚀 Schnellstart

### Installation

```bash
# Repository klonen
git clone [repository-url]
cd fv-schloeben

# Dependencies installieren
npm install

# Server starten
npm run dev
```

### Erste Anmeldung

1. Browser öffnen: `http://localhost:3000`
2. Login mit Standard-Zugangsdaten:
   - **Benutzername:** `admin`
   - **Passwort:** `password`
3. Sofort Passwort ändern (empfohlen)

## 📚 Dokumentation

Die vollständige Dokumentation finden Sie im **[docs/](./docs/)** Verzeichnis:

### 🎯 Für Benutzer
- **[📖 Benutzerhandbuch](./docs/benutzerhandbuch.md)** - Komplette Anleitung für alle Funktionen
- **[📮 Mahnung-System](./docs/mahnung-system.md)** - Automatisches Mahnwesen verstehen
- **[📁 Dokumentenverwaltung](./docs/dokumentenverwaltung.md)** - Dokumente verwalten

### 🔧 Für Entwickler
- **[🛠️ Entwicklerhandbuch](./docs/entwicklung.md)** - Setup, Installation und Entwicklung
- **[🔌 API-Referenz](./docs/api-referenz.md)** - Vollständige API-Dokumentation
- **[🏗️ Architektur](./docs/architektur.md)** - System-Design und Technologie-Stack
- **[🗄️ Datenbank](./docs/datenbank.md)** - Schema und Queries

### 🧪 Für Administratoren
- **[✅ Validierung](./docs/validierung.md)** - Checkliste vor Produktivnutzung
- **[🤖 Copilot-Instruktionen](./docs/copilot-instruktionen.md)** - KI-Entwicklungsrichtlinien

## ⭐ Hauptfunktionen

### 👥 Mitgliederverwaltung
- Vollständige Mitgliederdaten mit flexiblen Suchfiltern
- Ein- und Austrittsverwaltung mit Automatisierung
- Import/Export von Mitgliederdaten (Excel)
- Dokumenten-Upload für jeden Mitglied (PDF, Bilder)
- Kategorisierte Notizen-Historie mit Zeitstempel

### 💰 Zahlungsverwaltung
- Automatische Beitragserstellung für Mitglieder
- Flexible Zahlungsverfolgung (offen/gezahlt)
- Mahnung-Historie mit mehreren Erinnerungsstufen
- Excel-Export für Buchhaltung
- Statistiken und Berichte

### 📧 Professionelles Mahnung-System
- **Server-seitiger E-Mail-Versand** über SMTP
- **Rechtskonforme Ausschluss-Androhungen** mit Fristsetzung
- **Automatisches Auto-Austritt-Datum** bei Zahlungsverzug
- **Vollständige Dokumentation** aller Mahnschritte
- **Zweistufiger Bestätigungsprozess** für sichere Bedienung

### 🔐 Sicherheit & Verwaltung
- **Rollenbasierte Zugriffskontrolle** (Admin/Editor/None)
- **Session-basierte Authentifizierung**
- **Sichere Dateiverwaltung** mit Validierung
- **Audit-Trail** für alle wichtigen Aktionen
- **DSGVO-konforme Datenhaltung**

## 🔧 Technologie-Stack

- **Backend:** Node.js + Express.js
- **Frontend:** Vanilla JavaScript + Bootstrap 5
- **Datenbank:** SQLite (lokale Datei)
- **E-Mail:** Nodemailer mit SMTP
- **Upload:** Multer für Dateiverwaltung
- **Session:** Express-Session mit File-Store

## 📊 Für den Vereinsvorstand

### Statistische Auswertungen
- **Mitgliederzahlen** mit Ein-/Austrittstrends
- **Zahlungsverhalten** und Beitragseinnahmen
- **Offene Forderungen** mit Mahnstatus
- **Exportfunktionen** für Jahresberichte

### Rechtssichere Dokumentation
- **Vollständige Mahnung-Historie** für jeden Beitrag
- **Automatische Zeitstempel** und Benutzer-Zuordnung
- **Nachweis von Zahlungserinnerungen** für Ausschlussverfahren
- **Backup-fähige Datenstruktur** für Langzeitarchivierung

## ⚙️ Systemanforderungen

### Server
- **Node.js** 16+ 
- **Speicherplatz:** 1 GB (für Dokumente und Datenbank)
- **RAM:** 512 MB minimal
- **Netzwerk:** Für E-Mail-Versand (SMTP)

### Client (Browser)
- **Moderne Browser:** Chrome, Firefox, Safari, Edge
- **JavaScript:** Muss aktiviert sein
- **Cookies:** Für Session-Management erforderlich
- **Responsive:** Optimiert für Desktop und Mobile

## 🆘 Support und Hilfe

### Bei Problemen
1. **[Dokumentation](./docs/)** konsultieren
2. **Browser-Konsole** auf Fehlermeldungen prüfen (F12)
3. **Server-Logs** in der Kommandozeile beachten
4. **Backup wiederherstellen** bei Datenproblemen

### Wichtige Befehle
```bash
# Entwicklungsserver mit Auto-Reload
npm run dev

# Sessions zurücksetzen
npm run clear-sessions

# Datenbank-Backup (manuell)
cp server/database/club.db backup/club_$(date +%Y%m%d).db
```

## 🔄 Updates und Wartung

### Regelmäßige Aufgaben
- **Sessions löschen:** `npm run clear-sessions` (wöchentlich)
- **Datenbank-Backup:** Automatisierung empfohlen (täglich)
- **Dokumente-Backup:** `uploads/` Verzeichnis sichern
- **SMTP-Konfiguration:** Bei Provider-Änderungen anpassen

### Nach größeren Mahnungsaktionen
- **Auto-Austritt überwachen:** Filter "Auto-Austritt: Ja"
- **Zahlungseingang prüfen:** Auto-Austritt bei Zahlung entfernen
- **30.08. Stichtag:** Tatsächliche Austritte nach Frist setzen

## 📄 Lizenz

Entwickelt für den **Fußballverein Schlöben**  
Interne Vereinssoftware - Nicht für kommerzielle Zwecke bestimmt

## 👨‍💻 Entwicklung

Diese Software wurde mit Fokus auf **Einfachheit**, **Zuverlässigkeit** und **Rechtssicherheit** entwickelt. 

**Entwicklungsprinzipien:**
- ✅ **Keine externen Abhängigkeiten** für Frontend
- ✅ **Robuste Fehlerbehandlung** mit deutschen Meldungen  
- ✅ **Vollständige Dokumentation** aller Funktionen
- ✅ **Testbare Komponenten** für kritische Workflows
- ✅ **DSGVO-Compliance** durch Design

**Version:** 1.0  
**Letztes Update:** August 2025  
**Kompatibilität:** Node.js 16+, SQLite 3.x

---

**🎯 Ziel:** Effiziente Vereinsverwaltung mit minimalem Aufwand und maximaler Rechtssicherheit