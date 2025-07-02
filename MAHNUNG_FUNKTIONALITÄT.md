# 📮 Mahnung-Funktionalität - Vollständige Implementierung

## Status: ✅ VOLLSTÄNDIG IMPLEMENTIERT

Die Mahnung-Funktionalität ist **vollständig implementiert** und vereint die ursprünglich separaten Funktionen "Mahnung erfassen" und "Erinnerungsmail verfassen" in einer neuen 📮-Schaltfläche in der Mitgliederliste.

## Funktionsweise

### 1. E-Mail-Versand (Endpunkt: `/send-dunning-email`)
- **Zweck**: Versendet Mahn-E-Mail über Server-SMTP (nicht lokaler Mailclient)
- **Ablauf**:
  - Lädt Mitgliedsdaten und offene Beiträge
  - Generiert personalisierte Mahn-E-Mail mit allen offenen Posten
  - Versendet E-Mail über serverseitigen SMTP
  - Optionale Ausschluss-Ankündigung mit Frist bis 30.08. des aktuellen Jahres

### 2. Datenbank-Hinterlegung (Endpunkt: `/dunning`)
- **Zweck**: Hinterlegt Mahnung in Datenbank mit vollständiger Dokumentation
- **Ablauf**:
  - **Mahnung pro Beitrag**: Jeder offene Beitrag wird in `reminder_history` erfasst
  - **Kompletter Historieneintrag**: Gesamter E-Mail-Inhalt wird in `member_notes` gespeichert
  - **Austrittsdatum**: Bei Ausschluss-Ankündigung wird `autoExit` auf 30.08. gesetzt
  - **Transaktionssicherheit**: Vollständiges Rollback bei Fehlern

## ✅ Implementierte Änderungen

### Backend-Erweiterungen (server/member.js)

1. **Neue API-Endpunkte:**
   - `POST /api/members/:memberNumber/mahnung` - Erstellt Mahnung mit E-Mail-Template
   - `POST /api/members/:memberNumber/set-auto-exit` - Setzt automatischen Austrittstermin
   - `POST /api/members/:memberNumber/add-reminder-to-payments` - Fügt Mahnung zu allen offenen Beiträgen hinzu

2. **Neues E-Mail-Template für Ausschluss-Ankündigung:**
   - Sammelt alle offenen Beiträge eines Mitglieds
   - Erstellt angepasste Überweisungsanweisung mit spezifischem Verwendungszweck
   - Fügt Ausschluss-Androhung gemäß Satzung hinzu (bis 30.08.2025)
   - Erwähnt Wiedereintritt-Möglichkeit

3. **Automatische Historieneinträge:**
   - Dokumentiert alle getroffenen Entscheidungen
   - Kategorie: "Korrespondenz"
   - Zeitstempel und Benutzer-Information

### Frontend-Erweiterungen (public/index.html & static/script.js)

1. **Neue Schaltfläche "📮" in Mitgliederliste:**
   - Nur sichtbar bei Mitgliedern mit offenen Beiträgen
   - Tooltip: "Mahnung senden"

2. **Mehrstufiger Dialog-Workflow:**
   - Schritt 1: Bestätigung "Ausscheiden aus Verein ankündigen?"
   - Schritt 2: E-Mail wird automatisch über Server versendet
   - Schritt 3: Bestätigung "Mahnung in Datenbank hinterlegen?"
   - Optional: Automatischer Austrittstermin wird gesetzt

3. **Server-seitige E-Mail-Versendung:**
   - Nutzt bestehende E-Mail-Konfiguration der Anwendung
   - Professioneller Versand über konfigurierten SMTP-Server
   - Automatische Fehlermeldungen bei Versandproblemen

## 🔧 Technische Details

### E-Mail-Template-Struktur
```
Betreff: Zahlungserinnerung - Offene Beiträge Fußballverein Schlöben

Liebe/r [Vorname] [Nachname],

wir müssen Sie daran erinnern, dass folgende Beiträge noch nicht beglichen wurden:

[Liste aller offenen Beiträge mit Jahr und Betrag]

Gesamtsumme: [Betrag] €

Bitte überweisen Sie den Betrag bis zum 30.08.2025 auf unser Vereinskonto:
- Verwendungszweck: "Beitrag [Jahre] - [Nachname]"
- [Kontodetails aus E-Mail-Einstellungen]

WICHTIGER HINWEIS: 
Sollte bis zum 30.08.2025 kein Zahlungseingang zu verzeichnen sein, 
werden wir gemäß unserer Satzung und dem Beschluss der Mitgliederversammlung 
vom 16.06.2025 Ihren Ausschluss aus dem Verein vollziehen müssen.

Ein Wiedereintritt ist jederzeit möglich.

Mit freundlichen Grüßen
Fußballverein Schlöben
```

### Workflow-Ablauf
1. **Auswahl:** Nutzer klickt auf 📮-Button bei Mitglied
2. **Bestätigung 1:** "Ausscheiden aus Verein ankündigen?" (Ja/Nein)
3. **E-Mail-Versendung:** E-Mail wird automatisch über Server versendet
4. **Erfolgs-Meldung:** Bestätigung des E-Mail-Versands mit Details
5. **Bestätigung 2:** "Mahnung in Datenbank hinterlegen?" (Ja/Nein)
6. **Auto-Austritt:** Bei Bedarf wird 30.08.2025 als Austrittsdatum gesetzt
7. **Historie:** Automatischer Eintrag mit allen Entscheidungen

## 👥 Benutzer-Schulung

### Wann verwenden?
- Bei Mitgliedern mit mehreren offenen Beiträgen
- Wenn bisherige Erinnerungen erfolglos waren
- Als letzter Schritt vor Vereinsausschluss

### Schritt-für-Schritt Anleitung:

1. **Mitglied finden:**
   - Gehen Sie zur "Mitglieder"-Tab
   - Filtern Sie nach "Offene Beiträge: Ja"
   - Finden Sie das entsprechende Mitglied

2. **Mahnung initiieren:**
   - Klicken Sie auf die 📮-Schaltfläche in der Aktionen-Spalte
   - System prüft automatisch offene Beiträge

3. **Ausschluss-Entscheidung:**
   - Dialog fragt: "Ausscheiden aus Verein ankündigen?"
   - **JA:** Ausschluss-Drohung wird in E-Mail eingefügt
   - **NEIN:** Standard-Mahnung ohne Ausschluss-Androhung

4. **E-Mail versenden:**
   - E-Mail wird automatisch über den konfigurierten Server versendet
   - Erfolgs- oder Fehlermeldung wird angezeigt
   - Details zum Versand (Empfänger, Anzahl Beiträge, Gesamtbetrag)

5. **Mahnung dokumentieren:**
   - Nach dem automatischen Versand erscheint Dialog: "Mahnung in Datenbank hinterlegen?"
   - **JA:** Mahnung wird bei allen offenen Beiträgen vermerkt
   - **NEIN:** Keine automatische Dokumentation (E-Mail wurde trotzdem versendet)

6. **Auto-Austritt (optional):**
   - Wenn Ausschluss-Ankündigung gewählt wurde
   - System setzt automatisch "Austritt automatisch am: 30.08.2025"
   - Mitglied wird automatisch ausgeschlossen, falls nicht bezahlt

### Wichtige Hinweise:

⚠️ **Rechtliche Aspekte:**
- Ausschluss-Androhung nur bei wiederholten Mahnungen verwenden
- Satzung und Mitgliederversammlung-Beschluss beachten
- Dokumentation ist wichtig für rechtliche Nachvollziehbarkeit

📝 **Dokumentation:**
- Alle Aktionen werden automatisch in der Mitglieder-Historie erfasst
- Typ: "Korrespondenz"
- Enthält: Datum, Entscheidungen, Benutzer

🔄 **Follow-Up:**
- Regelmäßig prüfen: Mitglieder mit "Auto-Austritt" gesetzt
- Bei Zahlungseingang: Auto-Austritt-Datum entfernen
- Bei Überschreitung des Stichtags: Tatsächlichen Austritt setzen

## 🛠️ Wartung und Anpassungen

### Template-Anpassungen:
- E-Mail-Templates können in `server/member.js` angepasst werden
- Kontodetails über "E-Mail-Einstellungen" konfigurierbar
- Stichtag (30.08.) kann bei Bedarf geändert werden

### Troubleshooting:
- **E-Mail wird nicht versendet:** E-Mail-Einstellungen in der Anwendung prüfen
- **SMTP-Fehler:** Server-Logs prüfen, SMTP-Konfiguration überprüfen
- **Mitglied ohne E-Mail:** Entsprechende Fehlermeldung, E-Mail-Adresse nachtragen

## 📊 Statistiken und Monitoring

Die Funktion integriert sich in die bestehenden Filter und Statistiken:
- Filter "Auto-Austritt: Ja" zeigt bedrohte Mitglieder
- Summenbereich zeigt "Anzahl mit Auto-Austritt"
- Historien-Einträge ermöglichen Nachverfolgung

---

**Entwickelt am:** 2. Juli 2025  
**Version:** 1.0  
**Kompatibilität:** Node.js, Express, SQLite, Bootstrap
