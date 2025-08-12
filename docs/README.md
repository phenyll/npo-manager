# 📚 Dokumentation - Fußballverein Schlöben Vereinsverwaltung

Willkommen zur vollständigen Dokumentation der Vereinsverwaltungssoftware für den Fußballverein Schlöben.

## 📖 Übersicht

Diese Webanwendung verwaltet Mitglieder, Zahlungen und Vereinsangelegenheiten eines Fußballvereins. Das System bietet eine umfassende Lösung für die tägliche Vereinsarbeit.

## 🚀 Schnellstart

- **[Entwicklerhandbuch](./entwicklung.md)** - Setup, Installation und Entwicklung
- **[API-Dokumentation](./api-referenz.md)** - Vollständige API-Endpunkt-Referenz
- **[Benutzerhandbuch](./benutzerhandbuch.md)** - Anleitung für Endbenutzer

## 🔧 Technische Dokumentation

- **[Architektur](./architektur.md)** - Systemarchitektur und Technologie-Stack
- **[Datenbank](./datenbank.md)** - Datenbankschema und Tabellenstrukturen
- **[Copilot-Instruktionen](./copilot-instruktionen.md)** - Entwicklungsrichtlinien für KI-Tools

## 🎯 Funktionsdokumentation

- **[Mitgliederverwaltung](./mitgliederverwaltung.md)** - Alle Funktionen der Mitgliederverwaltung
- **[Dokumentenverwaltung](./dokumentenverwaltung.md)** - Upload und Verwaltung von Mitgliederdokumenten
- **[Zahlungsverwaltung](./zahlungsverwaltung.md)** - Beitragsverwaltung und Zahlungsabwicklung
- **[Mahnung-System](./mahnung-system.md)** - Automatisches Mahnwesen und Ausschlussverfahren
- **[Benutzerverwaltung](./benutzerverwaltung.md)** - Benutzer, Rollen und Berechtigungen
- **[E-Mail-System](./email-system.md)** - SMTP-Konfiguration und E-Mail-Versand

## 🧪 Testing und Qualitätssicherung

- **[Validierungscheckliste](./validierung.md)** - Checkliste für Tests vor Produktivnutzung

## 📄 Project Files

- **[CLAUDE.md](../CLAUDE.md)** - Anweisungen für Claude Code AI
- **[copilot-instructions.md](../copilot-instructions.md)** - GitHub Copilot Instruktionen

## 🗂️ Dateistruktur

```
/
├── docs/                    # Dokumentation (dieses Verzeichnis)
├── server/                  # Backend-Code
│   ├── index.js            # Hauptserver
│   ├── db.js               # Datenbankverbindung
│   ├── member.js           # Mitgliederverwaltung API
│   ├── payment.js          # Zahlungsverwaltung API
│   ├── user.js             # Benutzerverwaltung API
│   └── ...
├── public/                  # Frontend HTML-Seiten
├── static/                  # CSS, JavaScript, Assets
├── uploads/members/         # Mitgliederdokumente
└── sessions/               # Session-Dateien
```

## 🆘 Support

Bei Fragen oder Problemen:
1. Konsultieren Sie zunächst diese Dokumentation
2. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
3. Schauen Sie in die Server-Logs für Backend-Probleme

## 🏷️ Version

**Version:** 1.0  
**Entwickelt für:** Fußballverein Schlöben  
**Zuletzt aktualisiert:** August 2025