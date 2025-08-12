# 🔌 API-Referenz

Vollständige Dokumentation aller verfügbaren API-Endpunkte der Vereinsverwaltung.

## 🏠 Basis-URL

```
http://localhost:3000
```

## 🔐 Authentifizierung

Alle API-Endpunkte (außer Login) erfordern eine aktive Session. Die Authentifizierung erfolgt über Express-Session mit Cookies.

## 👥 Mitglieder-API (`/members`)

### Mitglieder-Übersicht

#### `GET /members/`
Alle Mitglieder abrufen
```json
{
  "members": [
    {
      "id": 1,
      "firstName": "Max",
      "lastName": "Mustermann",
      "city": "Schlöben",
      "email": "max@example.com",
      "phone": "0123456789",
      "joinDate": "2024-01-01",
      "openPayments": 50.00
    }
  ]
}
```

#### `GET /members/filtered`
Gefilterte Mitgliederliste mit Suchparametern
**Query Parameters:**
- `search` - Suchtext für Name, E-Mail, etc.
- `hasOpenPayments` - "true"/"false" für offene Zahlungen
- `hasAutoExit` - "true"/"false" für Auto-Austritt
- `exitedThisYear` - "true"/"false" für Austritte dieses Jahr

#### `POST /members/`
Neues Mitglied erstellen
```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "city": "Schlöben",
  "email": "max@example.com",
  "phone": "0123456789",
  "childName": "",
  "enrollmentYear": 2024,
  "joinDate": "2024-01-01"
}
```

#### `GET /members/:id`
Einzelnes Mitglied abrufen

#### `PUT /members/:id`
Mitglied bearbeiten

#### `PUT /members/:id/exit`
Mitglied-Austritt setzen
```json
{
  "exitDate": "2024-12-31",
  "isAutoExit": false
}
```

### Statistiken

#### `GET /members/stats`
Mitglieder-Statistiken
```json
{
  "totalMembers": 150,
  "newMembersThisYear": 12,
  "exitedMembersThisYear": 5,
  "membersWithAutoExit": 3
}
```

#### `GET /members/yearly-movements`
Jährliche Ein- und Austritte

### Import/Export

#### `POST /members/import-members`
Excel-Import für Mitglieder
**Content-Type:** `multipart/form-data`
**Body:** Excel-Datei

#### `GET /members/export`
Excel-Export aller Mitglieder

### Dokumentenverwaltung

#### `POST /members/:id/documents`
Dokument für Mitglied hochladen
**Content-Type:** `multipart/form-data`
```
document: [FILE] (PDF, JPEG, PNG, GIF, BMP, WebP, max 10MB)
description: "Optionale Beschreibung"
```

#### `GET /members/:id/documents`
Alle Dokumente eines Mitglieds abrufen

#### `GET /members/:id/documents/:docId/download`
Dokument herunterladen

#### `GET /members/:id/documents/:docId/view`
Dokument im Browser anzeigen

#### `DELETE /members/:id/documents/:docId`
Dokument löschen

### Notizen-System

#### `POST /members/:id/notes`
Notiz für Mitglied erstellen
```json
{
  "noteText": "Notiz-Inhalt",
  "noteType": "allgemein"
}
```
**Verfügbare noteType-Werte:**
- `allgemein`
- `eintritt`
- `austritt`
- `dokument`
- `antrag`
- `zahlung`
- `korrespondenz`

#### `GET /members/:id/notes`
Alle Notizen eines Mitglieds

#### `PUT /members/:id/notes/:noteId`
Notiz bearbeiten

#### `DELETE /members/:id/notes/:noteId`
Notiz löschen

### Zahlungen pro Mitglied

#### `GET /members/:id/payments`
Alle Zahlungen eines Mitglieds

#### `GET /members/:id/open-payments`
Offene Zahlungen eines Mitglieds

### Mahnung-System

#### `POST /members/:id/send-dunning-email`
Mahn-E-Mail versenden
```json
{
  "includeExclusionThreat": true
}
```

#### `POST /members/:id/dunning`
Mahnung in Datenbank hinterlegen
```json
{
  "reminderMethod": "E-Mail",
  "reminderNotes": "Mahnung mit Ausschluss-Androhung versendet",
  "setAutoExit": true
}
```

## 💰 Zahlungen-API (`/payments`)

### Zahlungs-Übersicht

#### `GET /payments/`
Alle Zahlungen abrufen

#### `POST /payments/`
Neue Zahlung erstellen
```json
{
  "memberId": 1,
  "year": 2024,
  "amount": 50.00,
  "status": "offen",
  "paymentMethod": "Bank"
}
```

#### `GET /payments/:id`
Einzelne Zahlung abrufen

#### `PUT /payments/:id`
Zahlung bearbeiten

#### `DELETE /payments/:id`
Zahlung löschen

#### `PUT /payments/:id/pay`
Zahlung als bezahlt markieren
```json
{
  "paymentDate": "2024-08-12",
  "paymentMethod": "Bank"
}
```

### Bulk-Operationen

#### `POST /payments/create-bulk`
Zahlungen für mehrere Mitglieder erstellen
```json
{
  "memberIds": [1, 2, 3],
  "year": 2024,
  "amount": 50.00
}
```

### Statistiken

#### `GET /payments/stats`
Zahlungs-Statistiken
```json
{
  "totalRevenueThisYear": 7500.00,
  "paidMembers": 142,
  "totalMembers": 150,
  "totalOutstandingAmount": 400.00,
  "membersWithOutstandingPayments": 8
}
```

### Export

#### `GET /payments/export-open-payments`
Excel-Export offener Zahlungen

### Mahnungen

#### `GET /payments/:id/reminders`
Mahnung-Historie für Zahlung

#### `POST /payments/:id/remind`
Mahnung für Zahlung hinzufügen
```json
{
  "reminderMethod": "E-Mail",
  "reminderNotes": "Erste Mahnung versendet"
}
```

#### `POST /payments/:id/send-reminder-email`
Erinnerungs-E-Mail für einzelne Zahlung

## 👤 Benutzer-API

### Benutzerverwaltung

#### `GET /users`
Alle Benutzer abrufen (nur mit entsprechender Berechtigung)

#### `POST /users`
Neuen Benutzer erstellen
```json
{
  "username": "newuser",
  "password": "password123"
}
```

#### `GET /users/me`
Aktuell angemeldeten Benutzer abrufen

#### `DELETE /users/:id`
Benutzer löschen

#### `PUT /users/me/password`
Passwort des aktuellen Benutzers ändern
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Rollen und Berechtigungen

#### `GET /users-with-roles`
Alle Benutzer mit ihren Rollen

#### `PUT /users/:id/role`
Benutzerrolle ändern
```json
{
  "roleId": 2
}
```

**Verfügbare Rollen:**
- `1` - Admin (alle Berechtigungen)
- `2` - Editor (Benutzerliste einsehen)
- `3` - None (nur Login)

## 🏢 Organisation-API (`/organization`)

#### `GET /organization/details`
Organisationsdetails abrufen

#### `PUT /organization/details`
Organisationsdetails aktualisieren
```json
{
  "name": "Fußballverein Schlöben e.V.",
  "address": "Musterstraße 1, 12345 Schlöben",
  "email": "kontakt@fv-schloeben.de",
  "phone": "0123456789",
  "website": "www.fv-schloeben.de",
  "account_name": "FV Schlöben",
  "iban": "DE89 3704 0044 0532 0130 00",
  "bic": "COBADEFFXXX",
  "bank_name": "Commerzbank",
  "tax_id": "123/456/78901",
  "registration_number": "VR 12345",
  "name_kassenwart": "Max Mustermann"
}
```

## 📧 E-Mail-Einstellungen (`/email-settings`)

#### `GET /email-settings/`
E-Mail-Einstellungsseite (HTML)

#### `GET /email-settings/data`
SMTP-Konfiguration abrufen

#### `POST /email-settings/`
SMTP-Konfiguration speichern
```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "secure": false,
  "username": "your-email@gmail.com",
  "password": "your-app-password",
  "defaultSender": "Fußballverein Schlöben <noreply@fv-schloeben.de>"
}
```

#### `POST /email-settings/test`
Test-E-Mail senden
```json
{
  "testEmail": "test@example.com"
}
```

## 🔐 Authentifizierung

#### `POST /authenticate`
Benutzer anmelden
```json
{
  "username": "admin",
  "password": "password"
}
```

#### `GET /logout`
Benutzer abmelden

## 📊 Statische Routen

#### `GET /main`
Hauptanwendung (HTML)

#### `GET /statistics`
Statistik-Seite (HTML)

#### `GET /login`
Login-Seite (HTML)

## ⚠️ Fehlerbehandlung

Alle API-Endpunkte verwenden standardmäßige HTTP-Statuscodes:

- `200` - Erfolg
- `201` - Erfolgreich erstellt
- `400` - Ungültige Anfrage
- `401` - Nicht authentifiziert
- `403` - Nicht autorisiert
- `404` - Nicht gefunden
- `500` - Serverfehler

Fehlermeldungen werden als Text oder JSON zurückgegeben:
```json
{
  "error": "Fehlerbe schreibung",
  "details": "Zusätzliche Details zum Fehler"
}
```