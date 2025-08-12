# 📮 Mahnung-System - Vollständige Dokumentation

Das automatisierte Mahnwesen der Vereinsverwaltung ermöglicht professionelle Zahlungserinnerungen mit rechtlich relevanten Ausschluss-Androhungen.

## 🎯 Überblick

Das Mahnung-System vereint E-Mail-Versendung und Datenbank-Dokumentation in einem integrierten Workflow. Es unterstützt sowohl einfache Zahlungserinnerungen als auch rechtliche Ausschlussverfahren gemäß Vereinssatzung.

## ✨ Funktionen

### 📧 E-Mail-Versendung
- **Server-seitiger SMTP-Versand** (nicht lokaler E-Mail-Client)
- **Personalisierte E-Mail-Templates** mit allen offenen Beiträgen
- **Ausschluss-Androhung** mit rechtlichen Grundlagen
- **Automatische Kontodetails** aus Vereinseinstellungen

### 📊 Datenbank-Hinterlegung
- **Vollständige Dokumentation** aller Mahnungen
- **Audit-Trail** in Mitglieder-Historie
- **Auto-Austritt-Datum** bei Ausschluss-Androhung
- **Transaktionale Sicherheit** bei Fehlern

### 🔄 Workflow-Integration
- **Zweistufiger Bestätigungsprozess**
- **Selektive Mahnung-Hinterlegung**
- **Automatische Historien-Einträge**
- **Filter-Integration** für betroffene Mitglieder

## 🚀 Verwendung

### Voraussetzungen

1. **E-Mail-Konfiguration:** SMTP-Einstellungen müssen konfiguriert sein
2. **Vereinsdaten:** Kontodetails in den Organisationseinstellungen
3. **Offene Beiträge:** Mitglied muss unbezahlte Beiträge haben

### Schritt-für-Schritt Anleitung

#### 1. Mitglied auswählen
```
Mitglieder-Tab → Filter "Offene Beiträge: Ja" → 📮-Button klicken
```

#### 2. Ausschluss-Entscheidung
**Dialog:** "Ausscheiden aus Verein ankündigen?"
- **JA:** E-Mail mit Ausschluss-Androhung und Frist bis 30.08.
- **NEIN:** Standard-Mahnung ohne rechtliche Konsequenzen

#### 3. Automatischer E-Mail-Versand
Das System:
- Sammelt alle offenen Beiträge des Mitglieds
- Generiert personalisierten E-Mail-Text
- Versendet E-Mail über konfigurierten SMTP-Server
- Zeigt Erfolgs-/Fehlermeldung mit Details

#### 4. Mahnung dokumentieren
**Dialog:** "Mahnung in Datenbank hinterlegen?"
- **JA:** Mahnung wird bei allen offenen Beiträgen vermerkt
- **NEIN:** Nur E-Mail versendet, keine DB-Dokumentation

#### 5. Auto-Austritt (bei Ausschluss-Androhung)
Automatisch gesetzt:
- **Datum:** 30.08.2025 (aktuelles Jahr)
- **Filterbar:** "Auto-Austritt: Ja"
- **Entfernbar:** Bei Zahlungseingang

## 📝 E-Mail-Templates

### Standard-Mahnung
```
Betreff: Zahlungserinnerung - Offene Beiträge Fußballverein Schlöben

Liebe/r [Vorname] [Nachname],

wir müssen Sie daran erinnern, dass folgende Beiträge noch nicht beglichen wurden:

• Beitrag 2023: 50,00 €
• Beitrag 2024: 50,00 €

Gesamtsumme: 100,00 €

Bitte überweisen Sie den Betrag zeitnah auf unser Vereinskonto:
Kontoinhaber: [Vereinsname]
IBAN: [IBAN aus Einstellungen]
BIC: [BIC aus Einstellungen]
Verwendungszweck: "Beitrag 2023,2024 - [Nachname]"

Mit freundlichen Grüßen
[Vereinsname]
```

### Mahnung mit Ausschluss-Androhung
```
Betreff: WICHTIG: Ausschluss-Androhung - Offene Beiträge

Liebe/r [Vorname] [Nachname],

[Standard-Mahnungstext wie oben]

⚠️ WICHTIGER HINWEIS:
Sollte bis zum 30.08.2025 kein Zahlungseingang zu verzeichnen sein, 
werden wir gemäß unserer Satzung und dem Beschluss der 
Mitgliederversammlung vom 16.06.2025 Ihren Ausschluss aus dem 
Verein vollziehen müssen.

Ein Wiedereintritt ist jederzeit möglich.

Mit freundlichen Grüßen
[Vereinsname]
```

## 🔧 Technische Implementierung

### API-Endpunkte

#### E-Mail versenden
```http
POST /members/:memberNumber/send-dunning-email
Content-Type: application/json

{
  "includeExclusionThreat": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "E-Mail erfolgreich versendet",
  "details": {
    "recipient": "max@example.com",
    "openPaymentCount": 2,
    "totalAmount": 100.00
  }
}
```

#### Mahnung hinterlegen
```http
POST /members/:memberNumber/dunning
Content-Type: application/json

{
  "reminderMethod": "E-Mail",
  "reminderNotes": "Mahnung mit Ausschluss-Androhung versendet",
  "setAutoExit": true
}
```

### Datenbank-Änderungen

#### reminder_history
Jeder offene Beitrag erhält einen Eintrag:
```sql
INSERT INTO reminder_history (
  payment_id, 
  reminder_date, 
  reminder_method, 
  reminder_notes, 
  created_by
) VALUES (?, ?, ?, ?, ?)
```

#### member_notes
Vollständige Historie in Mitglieder-Notizen:
```sql
INSERT INTO member_notes (
  member_id, 
  note_text, 
  note_type, 
  created_by
) VALUES (?, ?, 'korrespondenz', ?)
```

#### members (Auto-Austritt)
```sql
UPDATE members 
SET autoExit = ? 
WHERE id = ?
```

### Frontend-Implementation

#### JavaScript-Workflow
```javascript
// 1. Ausschluss-Dialog
const includeExclusion = confirm("Ausscheiden aus Verein ankündigen?");

// 2. E-Mail versenden
const emailResponse = await fetch(`/members/${memberNumber}/send-dunning-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ includeExclusionThreat: includeExclusion })
});

// 3. Erfolg anzeigen
alert(`E-Mail versendet an ${recipient} (${count} offene Beiträge, ${total}€)`);

// 4. Dokumentations-Dialog
const shouldDocument = confirm("Mahnung in Datenbank hinterlegen?");

// 5. Mahnung hinterlegen
if (shouldDocument) {
  await fetch(`/members/${memberNumber}/dunning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reminderMethod: "E-Mail",
      reminderNotes: `Mahnung ${includeExclusion ? 'mit' : 'ohne'} Ausschluss-Androhung`,
      setAutoExit: includeExclusion
    })
  });
}
```

## 📊 Monitoring und Statistiken

### Filter-Optionen
- **"Auto-Austritt: Ja"** - Zeigt bedrohte Mitglieder
- **"Offene Beiträge: Ja"** - Kandidaten für Mahnungen
- **Statistik-Bereich** zeigt "Anzahl mit Auto-Austritt"

### Historien-Verfolgung
```sql
-- Alle Mahnungen eines Mitglieds
SELECT rh.*, p.year, p.amount 
FROM reminder_history rh
JOIN payments p ON rh.payment_id = p.id
WHERE p.memberId = ?
ORDER BY rh.reminder_date DESC

-- Mitglieder mit Auto-Austritt
SELECT * FROM members 
WHERE autoExit IS NOT NULL 
AND autoExit > date('now')
```

## ⚠️ Rechtliche Aspekte

### Satzungskonformität
- **Ausschluss-Verfahren** gemäß Vereinssatzung
- **Mitgliederversammlung-Beschluss** als rechtliche Grundlage
- **Frist-Einhaltung** (30.08. als Stichtag)
- **Wiedereintritt-Möglichkeit** erwähnt

### Dokumentation
- **Vollständige Nachvollziehbarkeit** aller Mahnschritte
- **Zeitstempel** für rechtliche Relevanz
- **Benutzer-Zuordnung** für Verantwortlichkeit
- **E-Mail-Nachweis** durch Server-Logs

## 🔍 Troubleshooting

### Häufige Probleme

#### E-Mail wird nicht versendet
```bash
# SMTP-Einstellungen prüfen
curl -X GET http://localhost:3000/email-settings/data

# Server-Logs überprüfen
npm run dev  # Logs in Konsole anzeigen
```

#### Mitglied ohne E-Mail-Adresse
```javascript
// Fehlerbehandlung im Code
if (!member.email) {
  return res.status(400).json({
    error: "Mitglied hat keine E-Mail-Adresse hinterlegt"
  });
}
```

#### Auto-Austritt nicht gesetzt
```sql
-- Manual Update falls nötig
UPDATE members 
SET autoExit = '2025-08-30' 
WHERE id = ?
```

### Debugging-Commands

```bash
# Alle Mitglieder mit Auto-Austritt
sqlite3 server/database/club.db "SELECT firstName, lastName, autoExit FROM members WHERE autoExit IS NOT NULL;"

# Mahnung-Historie für Mitglied
sqlite3 server/database/club.db "SELECT * FROM reminder_history WHERE payment_id IN (SELECT id FROM payments WHERE memberId = 1);"

# E-Mail-Einstellungen prüfen
sqlite3 server/database/club.db "SELECT smtpHost, smtpPort, username FROM email_settings;"
```

## 📈 Erweiterungsmöglichkeiten

### Geplante Features
1. **E-Mail-Templates-Editor** in der Benutzeroberfläche
2. **Automatische Mahnungen** nach Zeitplan
3. **PDF-Anhänge** für offizielle Dokumente
4. **Mahnung-Eskalation** (1./2./3. Mahnung)
5. **SMS-Integration** als Alternative

### Anpassbare Parameter
```javascript
// In server/member.js anpassbar:
const AUTO_EXIT_DATE = '30.08.2025';  // Stichtag
const EXCLUSION_REFERENCE = 'Beschluss MV 16.06.2025';  // Rechtliche Grundlage
const BANK_DETAILS_SOURCE = 'organization_details';  // Kontodetails-Quelle
```

## 📋 Wartung

### Regelmäßige Aufgaben

#### Nach 30.08. (Stichtag)
```sql
-- Tatsächliche Austritte setzen für säumige Zahler
UPDATE members 
SET actualExit = date('now')
WHERE autoExit <= date('now') 
AND id IN (
  SELECT DISTINCT memberId 
  FROM payments 
  WHERE status = 'offen'
);

-- Auto-Austritt zurücksetzen
UPDATE members 
SET autoExit = NULL 
WHERE autoExit <= date('now');
```

#### Bei Zahlungseingang
```sql
-- Auto-Austritt entfernen
UPDATE members 
SET autoExit = NULL 
WHERE id = ? 
AND NOT EXISTS (
  SELECT 1 FROM payments 
  WHERE memberId = ? AND status = 'offen'
);
```

### Backup-Empfehlungen
- **Vor Massen-Mahnungen:** Datenbank-Backup erstellen
- **E-Mail-Logs:** SMTP-Server-Logs archivieren
- **Rechtsdokumente:** Satzung und MV-Beschlüsse sichern

---

**Version:** 1.0  
**Entwickelt:** Juli 2025  
**Kompatibilität:** Node.js, Express, SQLite, Bootstrap