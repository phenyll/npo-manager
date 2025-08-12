# 🗄️ Datenbank-Dokumentation

Vollständige Dokumentation der SQLite-Datenbankstruktur und Schemas.

## 📊 Datenbank-Übersicht

### Grundlagen
- **Typ:** SQLite (Embedded Database)
- **Datei:** `server/database/club.db`
- **Schema-Version:** Automatische Initialisierung in `server/db.js`
- **Encoding:** UTF-8
- **Foreign Keys:** Aktiviert

### Kernentitäten
- **Mitglieder** (`members`) - Zentrale Mitgliederdaten
- **Zahlungen** (`payments`) - Beitragsverwaltung
- **Dokumente** (`member_documents`) - Dateimetadaten
- **Notizen** (`member_notes`) - Mitglieder-Historie
- **Benutzer** (`users`, `roles`, `permissions`) - Zugriffskontrolle

## 📋 Tabellen-Schemas

### Mitgliederverwaltung

#### `members` - Mitgliederstammdaten
```sql
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,              -- Vorname
    lastName TEXT NOT NULL,               -- Nachname
    city TEXT,                           -- Wohnort
    email TEXT,                          -- E-Mail-Adresse
    phone TEXT,                          -- Telefonnummer
    childName TEXT,                      -- Name des Kindes (bei Jugendmitgliedern)
    enrollmentYear INTEGER,              -- Aufnahmejahr
    joinDate DATE,                       -- Eintrittsdatum
    expectedExitDate DATE,               -- Geplantes Austrittsdatum
    autoExit DATE,                       -- Automatischer Austritt (bei Mahnung)
    actualExit DATE                      -- Tatsächlicher Austritt
);
```

**Indizes:**
```sql
CREATE INDEX idx_members_name ON members(lastName, firstName);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_auto_exit ON members(autoExit);
```

**Beispieldaten:**
```sql
INSERT INTO members VALUES (
    1, 'Max', 'Mustermann', 'Schlöben', 'max@example.com', 
    '01234567890', 'Leo Mustermann', 2024, '2024-01-15', 
    NULL, NULL, NULL
);
```

#### `payments` - Beitragszahlungen
```sql
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memberId INTEGER NOT NULL,            -- Verweis auf members.id
    year INTEGER NOT NULL,                -- Beitragsjahr
    paymentDate DATE,                     -- Zahlungsdatum (NULL = offen)
    amount REAL NOT NULL,                 -- Beitragshöhe
    status TEXT,                          -- 'offen' oder 'gezahlt'
    paymentMethod TEXT DEFAULT 'Bank',    -- Zahlungsart
    FOREIGN KEY (memberId) REFERENCES members (id)
);
```

**Indizes:**
```sql
CREATE INDEX idx_payments_member ON payments(memberId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_year ON payments(year);
CREATE INDEX idx_payments_member_status ON payments(memberId, status);
```

**Beispieldaten:**
```sql
INSERT INTO payments VALUES (
    1, 1, 2024, '2024-02-15', 50.00, 'gezahlt', 'Bank'
);
INSERT INTO payments VALUES (
    2, 1, 2025, NULL, 50.00, 'offen', 'Bank'
);
```

#### `reminder_history` - Mahnung-Historie
```sql
CREATE TABLE reminder_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,          -- Verweis auf payments.id
    reminder_date DATE NOT NULL,          -- Mahnung-Datum
    reminder_method TEXT NOT NULL,        -- 'E-Mail', 'Brief', 'Telefon'
    reminder_notes TEXT,                  -- Zusätzliche Notizen
    created_by TEXT,                      -- Benutzer der Mahnung erstellt hat
    FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
);
```

**Beispieldaten:**
```sql
INSERT INTO reminder_history VALUES (
    1, 2, '2025-01-15', 'E-Mail', 'Erste Mahnung versendet', 'admin'
);
```

### Dokumentenverwaltung

#### `member_documents` - Dokumenten-Metadaten
```sql
CREATE TABLE member_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,           -- Verweis auf members.id
    filename TEXT NOT NULL,               -- Gespeicherter Dateiname
    original_filename TEXT NOT NULL,      -- Original-Dateiname
    file_type TEXT NOT NULL,              -- MIME-Type
    file_size INTEGER NOT NULL,           -- Dateigröße in Bytes
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,                     -- Uploader-Benutzername
    description TEXT,                     -- Dokumentenbeschreibung
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
```

**Indizes:**
```sql
CREATE INDEX idx_member_documents_member ON member_documents(member_id);
CREATE INDEX idx_member_documents_date ON member_documents(upload_date);
```

**Beispieldaten:**
```sql
INSERT INTO member_documents VALUES (
    1, 1, 'document-1692708123456-789012345.pdf', 
    'anmeldeformular_max_mustermann.pdf', 'application/pdf', 
    245760, '2024-08-12 10:30:00', 'admin', 
    'Ausgefülltes Anmeldeformular'
);
```

#### `member_notes` - Mitglieder-Notizen
```sql
CREATE TABLE member_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,           -- Verweis auf members.id
    note_text TEXT NOT NULL,              -- Notiz-Inhalt
    note_type TEXT DEFAULT 'allgemein',   -- Kategorie der Notiz
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,                      -- Ersteller-Benutzername
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
```

**Notiz-Kategorien:**
- `allgemein` - Allgemeine Notizen
- `eintritt` - Eintrittsbezogene Notizen
- `austritt` - Austrittsbezogene Notizen
- `dokument` - Dokumentenbezogene Notizen
- `antrag` - Antragsbezogene Notizen
- `zahlung` - Zahlungsbezogene Notizen
- `korrespondenz` - Kommunikationsnotizen

**Indizes:**
```sql
CREATE INDEX idx_member_notes_member ON member_notes(member_id);
CREATE INDEX idx_member_notes_date ON member_notes(created_date);
CREATE INDEX idx_member_notes_type ON member_notes(note_type);
```

### Benutzerverwaltung

#### `users` - Benutzer-Accounts
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,               -- Eindeutiger Benutzername
    salt TEXT NOT NULL,                   -- Password-Salt
    hash TEXT NOT NULL                    -- Password-Hash (SHA-256)
);
```

**Standard-Admin:**
```sql
INSERT INTO users VALUES (
    1, 'admin', '81dc4eb6a1928d496298430039c84bf8',
    '75e4dc687ed0f5b6d26c57b45fd7a0931e9c0a5ba8a079bd91edbb0efd22f96d'
);
-- Passwort: 'password'
```

#### `roles` - Benutzerrollen
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,            -- Rollenname
    description TEXT                      -- Rollenbeschreibung
);
```

**Standard-Rollen:**
```sql
INSERT INTO roles VALUES (1, 'admin', 'Administrator');
INSERT INTO roles VALUES (2, 'editor', 'Verwalter');
INSERT INTO roles VALUES (3, 'none', 'Keine bestimmte Rolle');
```

#### `permissions` - Berechtigungen
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,            -- Berechtigungsname
    description TEXT                      -- Beschreibung
);
```

**Standard-Berechtigungen:**
```sql
INSERT INTO permissions VALUES (1, 'login', 'Darf sich einloggen');
INSERT INTO permissions VALUES (2, 'create-user', 'Andere Benutzer erstellen');
INSERT INTO permissions VALUES (3, 'list-user', 'Andere Benutzer auflisten');
INSERT INTO permissions VALUES (4, 'delete-user', 'Andere Benutzer löschen');
INSERT INTO permissions VALUES (5, 'edit-user', 'Andere Benutzer ändern');
```

#### `user_roles` - Benutzer-Rollen-Zuordnung
```sql
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (role_id) REFERENCES roles (id),
    PRIMARY KEY (user_id)                 -- Ein Benutzer = eine Rolle
);
```

#### `role_permissions` - Rollen-Berechtigungen
```sql
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id),
    PRIMARY KEY (role_id, permission_id)
);
```

**Admin-Berechtigungen:**
```sql
-- Admin hat alle Berechtigungen
INSERT INTO role_permissions VALUES (1, 1); -- login
INSERT INTO role_permissions VALUES (1, 2); -- create-user
INSERT INTO role_permissions VALUES (1, 3); -- list-user
INSERT INTO role_permissions VALUES (1, 4); -- delete-user
INSERT INTO role_permissions VALUES (1, 5); -- edit-user
```

### Konfiguration

#### `organization_details` - Vereinsdaten
```sql
CREATE TABLE organization_details (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton-Tabelle
    name TEXT NOT NULL,                   -- Vereinsname
    address TEXT,                         -- Adresse
    email TEXT,                           -- Vereins-E-Mail
    phone TEXT,                           -- Telefonnummer
    website TEXT,                         -- Webseite
    account_name TEXT,                    -- Kontoinhaber
    iban TEXT,                            -- IBAN
    bic TEXT,                             -- BIC
    bank_name TEXT,                       -- Bankname
    tax_id TEXT,                          -- Steuernummer
    registration_number TEXT,             -- Registernummer
    name_kassenwart TEXT                  -- Name des Kassenwarts
);
```

**Standard-Daten:**
```sql
INSERT INTO organization_details VALUES (
    1, 'Mein toller Demo-Förderverein e.V.', '00000 Super-Ort',
    'toller-verein@grundschule-super-ort.de', '012345/12345678',
    'www.grundschule-super-ort.de', 'Schulförderverein',
    'DE00 0000 0000 0000 0000 99', 'ABCDEFH9JXX',
    'Sparkasse Super-Ort', '', 'VR 999009', 'Bart Kasenwart'
);
```

#### `email_settings` - SMTP-Konfiguration
```sql
CREATE TABLE email_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    smtpHost TEXT NOT NULL,               -- SMTP-Server
    smtpPort INTEGER NOT NULL,            -- SMTP-Port
    secure INTEGER DEFAULT 1,             -- TLS/SSL aktiviert
    username TEXT NOT NULL,               -- SMTP-Benutzername
    password TEXT NOT NULL,               -- SMTP-Passwort
    defaultSender TEXT                    -- Standard-Absender
);
```

## 🔍 Wichtige Queries

### Mitglieder-Statistiken
```sql
-- Gesamtanzahl aktiver Mitglieder
SELECT COUNT(*) as active_members 
FROM members 
WHERE actualExit IS NULL;

-- Neue Mitglieder dieses Jahr
SELECT COUNT(*) as new_members
FROM members 
WHERE strftime('%Y', joinDate) = strftime('%Y', 'now')
AND actualExit IS NULL;

-- Mitglieder mit offenen Beiträgen
SELECT m.*, COUNT(p.id) as open_payments, SUM(p.amount) as total_amount
FROM members m
JOIN payments p ON m.id = p.memberId
WHERE p.status = 'offen'
GROUP BY m.id;

-- Mitglieder mit Auto-Austritt (Mahnung-Folge)
SELECT m.firstName, m.lastName, m.autoExit, 
       COUNT(p.id) as open_payments
FROM members m
JOIN payments p ON m.id = p.memberId
WHERE m.autoExit IS NOT NULL 
AND p.status = 'offen'
GROUP BY m.id;
```

### Zahlungs-Statistiken
```sql
-- Einnahmen nach Jahr
SELECT year, SUM(amount) as revenue, COUNT(*) as payment_count
FROM payments 
WHERE status = 'gezahlt'
GROUP BY year
ORDER BY year DESC;

-- Offene Beiträge nach Jahr
SELECT year, COUNT(*) as open_count, SUM(amount) as open_amount
FROM payments 
WHERE status = 'offen'
GROUP BY year;

-- Zahlungsverhalten eines Mitglieds
SELECT p.year, p.amount, p.status, p.paymentDate,
       COUNT(rh.id) as reminder_count
FROM payments p
LEFT JOIN reminder_history rh ON p.id = rh.payment_id
WHERE p.memberId = ?
GROUP BY p.id
ORDER BY p.year DESC;
```

### Dokumenten-Statistiken
```sql
-- Dokumente pro Mitglied
SELECT m.firstName, m.lastName, 
       COUNT(md.id) as document_count,
       SUM(md.file_size) as total_size_bytes
FROM members m
LEFT JOIN member_documents md ON m.id = md.member_id
GROUP BY m.id
HAVING document_count > 0
ORDER BY document_count DESC;

-- Speicherplatz-Verbrauch
SELECT 
    COUNT(*) as total_documents,
    SUM(file_size) as total_bytes,
    SUM(file_size) / 1024.0 / 1024.0 as total_mb
FROM member_documents;

-- Neueste Uploads
SELECT md.original_filename, md.upload_date, md.uploaded_by,
       m.firstName, m.lastName
FROM member_documents md
JOIN members m ON md.member_id = m.id
ORDER BY md.upload_date DESC
LIMIT 10;
```

## 🔧 Wartung und Optimierung

### Index-Performance
```sql
-- Analyse der Index-Nutzung
EXPLAIN QUERY PLAN SELECT * FROM members WHERE lastName = 'Mustermann';

-- Fehlende Indizes identifizieren
.expert
SELECT * FROM members m
JOIN payments p ON m.id = p.memberId
WHERE p.status = 'offen';
```

### Datenbank-Integrität
```sql
-- Foreign Key Constraints prüfen
PRAGMA foreign_key_check;

-- Tabellen-Integrität prüfen
PRAGMA integrity_check;

-- Datenbank-Statistiken
PRAGMA table_info(members);
PRAGMA index_list(members);
```

### Backup und Recovery
```bash
# Datenbank-Backup
sqlite3 server/database/club.db ".backup backup/club_$(date +%Y%m%d).db"

# SQL-Export
sqlite3 server/database/club.db ".dump" > backup/club_$(date +%Y%m%d).sql

# Wiederherstellung
sqlite3 new_club.db ".restore backup/club_20240812.db"
```

### Datenbank-Bereinigung
```sql
-- Session-Dateien regelmäßig löschen (über Filesystem)
-- Alte reminder_history-Einträge (optional, nach 2 Jahren)
DELETE FROM reminder_history 
WHERE reminder_date < date('now', '-2 years');

-- VACUUM für Datenbankoptimierung
VACUUM;

-- Statistiken aktualisieren
ANALYZE;
```

## 🚨 Troubleshooting

### Häufige Probleme

#### Datenbank gesperrt
```bash
# Prüfe laufende Prozesse
lsof server/database/club.db

# Backup und Neustart
sqlite3 club.db ".backup club_backup.db"
```

#### Korrupte Datenbank
```sql
-- Integrität prüfen
PRAGMA integrity_check;

-- Bei Korruption: Dump und Restore
.dump > recovery.sql
-- Neue Datenbank erstellen und SQL einlesen
```

#### Performance-Probleme
```sql
-- Langsame Queries identifizieren
.timer on
.explain on
SELECT * FROM members m
JOIN payments p ON m.id = p.memberId
WHERE p.status = 'offen';

-- Index-Analyse
EXPLAIN QUERY PLAN [your-query];
```

### Monitoring-Queries
```sql
-- Datenbankgröße
SELECT page_count * page_size as size_bytes 
FROM pragma_page_count(), pragma_page_size();

-- Tabellengröße
SELECT name, SUM("pgsize") as size_bytes
FROM "dbstat" 
GROUP BY name
ORDER BY size_bytes DESC;

-- Aktive Verbindungen (bei WAL-Mode)
PRAGMA wal_checkpoint;
```

## 📈 Erweiterungen und Migrationen

### Schema-Änderungen
```sql
-- Neue Spalte hinzufügen
ALTER TABLE members ADD COLUMN mobile_phone TEXT;

-- Index für neue Spalte
CREATE INDEX idx_members_mobile ON members(mobile_phone);

-- Migration-Script Pattern
BEGIN TRANSACTION;
-- Schema-Änderungen hier
UPDATE schema_version SET version = 2;
COMMIT;
```

### Datenmodell-Erweiterungen
```sql
-- Beispiel: Mitgliedschaftstypen
CREATE TABLE membership_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    annual_fee REAL NOT NULL,
    description TEXT
);

-- Referenz in members-Tabelle
ALTER TABLE members ADD COLUMN membership_type_id INTEGER
REFERENCES membership_types(id);
```

---

**Version:** 1.0  
**Letztes Update:** August 2025  
**Kompatibilität:** SQLite 3.x, Foreign Keys aktiviert