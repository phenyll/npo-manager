# 👥 Benutzerhandbuch

Vollständige Anleitung für die Verwendung der Vereinsverwaltungssoftware des Fußballvereins Schlöben.

## 🚀 Erste Schritte

### Anmeldung

1. **Browser öffnen** und zur Anwendung navigieren: `http://localhost:3000`
2. **Login-Seite** wird automatisch geöffnet
3. **Anmeldedaten eingeben:**
   - Benutzername: `admin`
   - Passwort: `password` (Standardpasswort)
4. **"Anmelden"** klicken

### Hauptnavigation

Nach der Anmeldung stehen folgende Bereiche zur Verfügung:

- **📊 Statistiken** - Überblick über Mitglieder und Zahlungen
- **👥 Mitglieder** - Mitgliederverwaltung und -details
- **💰 Zahlungen** - Beitragsverwaltung und Zahlungsübersicht
- **⚙️ Einstellungen** - System- und E-Mail-Konfiguration
- **👤 Benutzerverwaltung** - Benutzer und Berechtigungen

## 📊 Statistiken-Dashboard

### Übersichtskarten
- **Gesamtmitglieder** - Aktuelle Mitgliederzahl
- **Einnahmen dieses Jahr** - Gesamte Beitragszahlungen
- **Offene Beiträge** - Ausstehende Zahlungen
- **Neue Mitglieder** - Zugang im aktuellen Jahr

### Filterbare Ansichten
- **Ein-/Austritte** - Monatliche Entwicklung
- **Zahlungsstatus** - Übersicht über Zahlungsverhalten

## 👥 Mitgliederverwaltung

### Mitgliederliste anzeigen

1. **"Mitglieder"** Tab anklicken
2. **Filtermöglichkeiten** nutzen:
   - **Suche**: Name, E-Mail oder Telefon eingeben
   - **Offene Beiträge**: Nur Mitglieder mit ausstehenden Zahlungen
   - **Auto-Austritt**: Mitglieder mit drohendem Ausschluss
   - **Ausgetreten**: Ehemalige Mitglieder anzeigen

### Neues Mitglied hinzufügen

1. **"+ Neues Mitglied"** Button klicken
2. **Pflichtfelder ausfüllen:**
   - Vorname und Nachname
   - E-Mail-Adresse (empfohlen)
   - Eintrittsdatum
3. **Optionale Felder:**
   - Ort/Stadt
   - Telefonnummer
   - Name des Kindes (bei Jugendmitgliedern)
   - Aufnahmejahr
4. **"Speichern"** klicken

### Mitglied bearbeiten

1. **📝 Symbol** neben dem Mitglied klicken
2. **Daten ändern** in der Detailansicht
3. **"Speichern"** klicken

### Mitglied-Austritt verwalten

1. **Mitglied-Detailansicht** öffnen
2. **"Austritt setzen"** Button klicken
3. **Austrittsdatum** eingeben
4. **Grund auswählen** (regulär/Auto-Austritt)
5. **Bestätigen**

## 📄 Dokumentenverwaltung

### Dokument hochladen

1. **Mitglied-Detailansicht** öffnen (📝 Button)
2. **Zum Bereich "📁 Dokumente"** scrollen
3. **"Datei auswählen"** klicken
   - **Erlaubte Formate**: PDF, JPEG, PNG, GIF, BMP, WebP
   - **Maximale Größe**: 10 MB
4. **Beschreibung eingeben** (optional aber empfohlen)
5. **"📤 Hochladen"** klicken

### Dokument anzeigen/herunterladen

- **👁️ Anzeigen**: Dokument im Browser öffnen
- **📥 Download**: Datei auf Computer speichern
- **🗑️ Löschen**: Dokument permanent entfernen (mit Bestätigung)

## 📝 Notizen-System

### Notiz hinzufügen

1. **Mitglied-Detailansicht** öffnen
2. **Zum Bereich "📝 Notizen-Historie"** scrollen
3. **Kategorie auswählen:**
   - 📋 Allgemein
   - ➡️ Eintritt
   - ⬅️ Austritt
   - 📄 Dokument
   - 📋 Antrag
   - 💰 Zahlung
   - ✉️ Korrespondenz
4. **Notiz-Text eingeben**
5. **"➕ Hinzufügen"** klicken

### Notiz bearbeiten/löschen

- **✏️ Symbol**: Notiz bearbeiten
- **🗑️ Symbol**: Notiz löschen (mit Bestätigung)

## 💰 Zahlungsverwaltung

### Neue Zahlung/Beitrag erstellen

#### Einzelzahlung
1. **"Zahlungen"** Tab öffnen
2. **"+ Neue Zahlung"** klicken
3. **Mitglied auswählen** (Dropdown)
4. **Jahr und Betrag** eingeben
5. **Status setzen** (offen/gezahlt)
6. **"Speichern"** klicken

#### Massen-Beitragserstellung
1. **"📋 Bulk-Zahlungen erstellen"** klicken
2. **Mitglieder auswählen** (mehrfach möglich)
3. **Jahr und Betrag** für alle eingeben
4. **"Für ausgewählte Mitglieder erstellen"** klicken

### Zahlung als bezahlt markieren

1. **Zahlung in der Liste finden**
2. **"✅ Als bezahlt markieren"** klicken
3. **Zahlungsdatum eingeben** (Standard: heute)
4. **Zahlungsmethode auswählen** (Bank/Bar)
5. **Bestätigen**

### Zahlungsübersicht

- **Filter nach Status**: Alle/Offen/Gezahlt
- **Filter nach Jahr**: Bestimmtes Beitragsjahr
- **Filter nach Mitglied**: Suche nach Name
- **Export**: Excel-Download für Buchhaltung

## 📮 Mahnung-System

### Mahnung versenden

1. **Mitgliederliste öffnen**
2. **Filter "Offene Beiträge: Ja"** aktivieren
3. **📮 Symbol** neben Mitglied mit offenen Beiträgen klicken
4. **Erste Entscheidung**: "Ausscheiden aus Verein ankündigen?"
   - **JA**: E-Mail mit Ausschluss-Androhung bis 30.08.
   - **NEIN**: Standard-Zahlungserinnerung
5. **E-Mail wird automatisch versendet**
6. **Zweite Entscheidung**: "Mahnung in Datenbank hinterlegen?"
   - **JA**: Mahnung bei allen offenen Beiträgen vermerken
   - **NEIN**: Nur E-Mail versendet, keine DB-Dokumentation

### Auto-Austritt überwachen

- **Filter "Auto-Austritt: Ja"** für bedrohte Mitglieder
- **Stichtag**: 30. August des aktuellen Jahres
- **Nach Zahlungseingang**: Auto-Austritt automatisch entfernen

## ⚙️ System-Einstellungen

### E-Mail-Konfiguration

1. **"E-Mail-Einstellungen"** öffnen
2. **SMTP-Server konfigurieren:**
   - Host (z.B. smtp.gmail.com)
   - Port (587 für TLS, 465 für SSL)
   - Benutzername und Passwort
   - Absenderadresse
3. **"Test-E-Mail senden"** zur Überprüfung
4. **"Einstellungen speichern"**

### Vereinsdaten verwalten

1. **"Organisation"** Bereich öffnen
2. **Vereinsinformationen eingeben:**
   - Name und Adresse
   - Kontaktdaten
   - Bankverbindung (für Mahnung-E-Mails)
   - Kassenwart-Name
3. **"Speichern"** klicken

## 👤 Benutzerverwaltung

### Neuen Benutzer erstellen

1. **"Benutzer erstellen"** öffnen (nur Admin)
2. **Benutzername und Passwort** eingeben
3. **"Benutzer erstellen"** klicken
4. **Rolle zuweisen** in der Benutzerliste

### Benutzerrollen

- **Admin**: Vollzugriff auf alle Funktionen
- **Editor**: Kann Mitglieder und Zahlungen verwalten, aber keine Benutzer
- **None**: Nur Login-Berechtigung

### Passwort ändern

1. **"Passwort ändern"** Link klicken
2. **Aktuelles Passwort** eingeben
3. **Neues Passwort** (zweimal) eingeben
4. **"Ändern"** klicken

## 📊 Import/Export-Funktionen

### Excel-Import (Mitglieder)

1. **"📂 Import/Export"** Button in Mitgliederliste
2. **"Mitglieder importieren"** wählen
3. **Excel-Datei auswählen** (mit Standard-Spalten)
4. **Upload starten**
5. **Ergebnis überprüfen** (Erfolg/Fehler-Meldungen)

### Excel-Export

#### Mitglieder exportieren
- **"📤 Exportieren"** in Mitgliederliste
- Alle aktuellen Filter werden berücksichtigt

#### Offene Zahlungen exportieren
- **"📤 Offene Zahlungen exportieren"** in Zahlungsbereich
- Automatische Generierung für Buchhaltung

## 🔍 Suchfunktionen

### Mitgliedersuche
- **Globale Suche**: Name, E-Mail, Telefon
- **Erweiterte Filter**: Kombinierbar
- **Echtzeit-Filterung**: Sofortige Ergebnisse

### Zahlungssuche
- **Nach Mitglied**: Name eingeben
- **Nach Status**: Offen/Gezahlt
- **Nach Jahr**: Beitragsjahr
- **Nach Betrag**: Min/Max-Bereich

## 📱 Mobile Nutzung

### Responsive Design
- **Smartphone-optimiert**: Alle Funktionen verfügbar
- **Touch-freundlich**: Große Buttons und Eingabefelder
- **Schnellzugriff**: Wichtigste Funktionen leicht erreichbar

### Mobile Workflows
- **Mitglied schnell hinzufügen**: Optimierte Eingabemasken
- **Zahlung markieren**: Ein-Klick-Bestätigung
- **Dokument-Upload**: Kamera-Integration (je nach Browser)

## 🚨 Fehlerbehebung

### Häufige Probleme

#### Login funktioniert nicht
1. **Browser-Cache leeren**
2. **Cookies aktivieren**
3. **JavaScript aktiviert?**
4. **Korrektes Passwort?** (Standard: `password`)

#### E-Mails werden nicht versendet
1. **E-Mail-Einstellungen überprüfen**
2. **Test-E-Mail senden**
3. **SMTP-Credentials korrekt?**
4. **Firewall-Blockierung?**

#### Dokument-Upload schlägt fehl
1. **Dateigröße unter 10MB?**
2. **Erlaubtes Dateiformat?** (PDF, Bilder)
3. **Browser-Berechtigungen?**
4. **Speicherplatz ausreichend?**

#### Mitglied nicht gefunden
1. **Suchbegriff überprüfen**
2. **Filter zurücksetzen**
3. **Vollständigen Namen versuchen**
4. **Nach E-Mail suchen**

### Support kontaktieren

Bei weiteren Problemen:
1. **Browser-Konsole** öffnen (F12) und Fehlermeldungen notieren
2. **Screenshot** des Problems erstellen
3. **Schritte zur Reproduktion** dokumentieren
4. **System-Administrator** kontaktieren

## 📋 Keyboard-Shortcuts

### Allgemeine Shortcuts
- **Tab**: Zwischen Eingabefeldern wechseln
- **Enter**: Formular absenden
- **Escape**: Dialog schließen

### Mitgliederliste
- **Strg + F**: Suche fokussieren
- **Strg + N**: Neues Mitglied (falls implementiert)

## 🔒 Datenschutz und Sicherheit

### Datenschutz-Hinweise
- **Sensible Daten**: Mitgliederdaten sicher gespeichert
- **Zugriffskontrolle**: Nur autorisierte Benutzer
- **Backup-Empfehlung**: Regelmäßige Datensicherung
- **Löschung**: Mitgliederdaten bei Austritt anonymisieren

### Sicherheits-Best-Practices
- **Starke Passwörter** verwenden
- **Regelmäßig abmelden** nach Nutzung
- **Browser aktuell halten**
- **Keine öffentlichen Computer** für sensible Daten

---

**Version**: 1.0  
**Zielgruppe**: Vereinsmitarbeiter und Vorstände  
**Support**: Siehe Dokumentation oder System-Administrator