# 📁 Dokumentenverwaltung

Vollständige Verwaltung von Mitgliederdokumenten mit Upload, Download, Metadaten und Beschreibungen.

## 🎯 Überblick

Die Dokumentenverwaltung ermöglicht das sichere Hochladen, Verwalten und Abrufen von Dokumenten für jedes Vereinsmitglied. Alle Dokumente werden mit Metadaten und optionalen Beschreibungen versehen.

## ✨ Funktionen

### 📤 Dokument-Upload
- **Unterstützte Formate:** PDF, JPEG, PNG, GIF, BMP, WebP
- **Maximale Dateigröße:** 10 MB
- **Sichere Speicherung:** `uploads/members/` Verzeichnis
- **Eindeutige Dateinamen:** Zeitstempel + Zufallszahl
- **Metadaten-Erfassung:** Automatisch bei Upload

### 📋 Dokumenten-Metadaten
- **Original-Dateiname:** Ursprünglicher Name bei Upload
- **Dateigröße:** In Bytes gespeichert
- **Upload-Datum:** Automatischer Zeitstempel
- **Hochgeladen von:** Benutzername des Uploaders
- **Beschreibung:** Optionale Dokumentenbeschreibung
- **Dateityp:** MIME-Type der Datei

### 🔍 Dokumenten-Verwaltung
- **Anzeige:** Liste aller Dokumente eines Mitglieds
- **Download:** Sichere Datei-Downloads
- **Vorschau:** Browser-Anzeige für unterstützte Formate
- **Löschen:** Entfernung von Dokumenten und Metadaten
- **Filterung:** Nach Dateityp oder Upload-Datum

## 🚀 Verwendung

### Dokument hochladen

1. **Mitglied-Detailansicht öffnen:**
   ```
   Mitgliederliste → 📝 Button → Mitglied-Details
   ```

2. **Dokumente-Bereich:**
   ```
   Zum Bereich "📁 Dokumente" scrollen
   ```

3. **Datei auswählen:**
   ```
   "Datei auswählen" → PDF oder Bilddatei wählen
   ```

4. **Beschreibung hinzufügen (optional):**
   ```
   Textfeld: "Beschreibung eingeben..."
   ```

5. **Upload starten:**
   ```
   "📤 Hochladen" Button klicken
   ```

### Dokument anzeigen/herunterladen

```
Dokumentenliste → "📥 Download" oder "👁️ Anzeigen"
```

- **Download:** Datei wird heruntergeladen
- **Anzeigen:** Datei wird im Browser geöffnet (falls unterstützt)

### Dokument löschen

```
Dokumentenliste → "🗑️ Löschen" → Bestätigung
```

## 🔧 Technische Implementierung

### API-Endpunkte

#### Dokument hochladen
```http
POST /members/:id/documents
Content-Type: multipart/form-data

FormData:
- document: [FILE]
- description: "Optionale Beschreibung"
```

**Response:**
```json
{
  "message": "Dokument erfolgreich hochgeladen",
  "documentId": 123
}
```

#### Dokumente abrufen
```http
GET /members/:id/documents
```

**Response:**
```json
{
  "documents": [
    {
      "id": 123,
      "original_filename": "anmeldeformular.pdf",
      "file_type": "application/pdf",
      "file_size": 245760,
      "upload_date": "2024-08-12T10:30:00.000Z",
      "uploaded_by": "admin",
      "description": "Ausgefülltes Anmeldeformular"
    }
  ]
}
```

#### Dokument herunterladen
```http
GET /members/:id/documents/:docId/download
```

**Response:** Datei-Download mit korrekten Headers

#### Dokument anzeigen
```http
GET /members/:id/documents/:docId/view
```

**Response:** Datei wird im Browser angezeigt

#### Dokument löschen
```http
DELETE /members/:id/documents/:docId
```

**Response:**
```json
{
  "message": "Dokument erfolgreich gelöscht"
}
```

### Datenbankschema

#### member_documents Tabelle
```sql
CREATE TABLE member_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    filename TEXT NOT NULL,               -- Gespeicherter Dateiname
    original_filename TEXT NOT NULL,      -- Original-Dateiname
    file_type TEXT NOT NULL,              -- MIME-Type
    file_size INTEGER NOT NULL,           -- Dateigröße in Bytes
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,                     -- Username des Uploaders
    description TEXT,                     -- Optionale Beschreibung
    FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
);
```

### File Storage

#### Multer-Konfiguration
```javascript
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const memberDocDir = path.join(__dirname, '../uploads/members');
    if (!fs.existsSync(memberDocDir)) {
      fs.mkdirSync(memberDocDir, { recursive: true });
    }
    cb(null, memberDocDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
```

#### File Validation
```javascript
const uploadDocument = multer({ 
  storage: documentStorage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Nur Bilder und PDF-Dateien sind erlaubt!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

### Frontend-Integration

#### HTML-Interface
```html
<div class="document-upload">
    <div class="mb-3">
        <label for="documentFile" class="form-label">Dokument hochladen</label>
        <input type="file" class="form-control" id="documentFile" 
               accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp">
    </div>
    <div class="mb-3">
        <label for="documentDescription" class="form-label">Beschreibung (optional)</label>
        <input type="text" class="form-control" id="documentDescription" 
               placeholder="Beschreibung eingeben...">
    </div>
    <button type="button" class="btn btn-primary" onclick="uploadDocument()">
        📤 Hochladen
    </button>
</div>
```

#### JavaScript-Upload
```javascript
async function uploadDocument(memberId) {
    const fileInput = document.getElementById('documentFile');
    const descriptionInput = document.getElementById('documentDescription');
    
    if (!fileInput.files[0]) {
        alert('Bitte wählen Sie eine Datei aus.');
        return;
    }
    
    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    formData.append('description', descriptionInput.value);
    
    try {
        const response = await fetch(`/members/${memberId}/documents`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            alert('Dokument erfolgreich hochgeladen!');
            loadDocuments(memberId); // Liste aktualisieren
            fileInput.value = '';
            descriptionInput.value = '';
        } else {
            const error = await response.text();
            alert('Fehler beim Upload: ' + error);
        }
    } catch (error) {
        alert('Upload fehlgeschlagen: ' + error.message);
    }
}
```

## 🔒 Sicherheit

### Zugriffsschutz
- **Authentifizierung:** Alle Endpunkte erfordern Login
- **Autorisation:** Nur berechtigte Benutzer können Dokumente verwalten
- **File Validation:** Strenge Prüfung von Dateitypen und -größen
- **Path Traversal Schutz:** Sichere Dateiname-Generierung

### Datei-Validierung
```javascript
// Erlaubte MIME-Types
const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
];

// Maximale Dateigröße
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### Sichere Dateinamen
```javascript
// Beispiel generierter Dateiname
// Original: "Anmeldeformular Max Mustermann.pdf"
// Gespeichert: "document-1692708123456-789012345.pdf"
```

## 📊 Monitoring

### Speicherplatz-Überwachung
```bash
# Gesamtgröße aller Dokumente
du -sh uploads/members/

# Anzahl Dokumente
find uploads/members/ -type f | wc -l

# Größte Dateien finden
find uploads/members/ -type f -exec ls -lh {} \; | sort -k5 -hr | head -10
```

### Datenbank-Queries
```sql
-- Dokumenten-Statistiken
SELECT 
    COUNT(*) as total_documents,
    SUM(file_size) as total_size_bytes,
    AVG(file_size) as avg_size_bytes
FROM member_documents;

-- Dokumente pro Mitglied
SELECT 
    m.firstName, m.lastName,
    COUNT(md.id) as document_count,
    SUM(md.file_size) as total_size
FROM members m
LEFT JOIN member_documents md ON m.id = md.member_id
GROUP BY m.id
ORDER BY document_count DESC;

-- Neueste Uploads
SELECT 
    md.original_filename,
    md.upload_date,
    md.uploaded_by,
    m.firstName, m.lastName
FROM member_documents md
JOIN members m ON md.member_id = m.id
ORDER BY md.upload_date DESC
LIMIT 10;
```

## 🔧 Wartung

### Backup-Strategie
```bash
# Dokumente sichern
tar -czf backup/member_documents_$(date +%Y%m%d).tar.gz uploads/members/

# Metadaten-Backup (SQL)
sqlite3 server/database/club.db ".dump member_documents" > backup/member_documents_$(date +%Y%m%d).sql
```

### Aufräumen
```bash
# Verwaiste Dateien finden (ohne DB-Eintrag)
# Achtung: Vorsichtig verwenden!
find uploads/members/ -name "document-*" -type f > all_files.txt
sqlite3 server/database/club.db "SELECT filename FROM member_documents;" > db_files.txt
comm -23 <(sort all_files.txt) <(sort db_files.txt)
```

### Performance-Optimierung
```sql
-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_member_documents_member_id 
ON member_documents(member_id);

CREATE INDEX IF NOT EXISTS idx_member_documents_upload_date 
ON member_documents(upload_date);
```

## 🚨 Troubleshooting

### Häufige Probleme

#### Upload schlägt fehl
```javascript
// Mögliche Ursachen prüfen
1. Dateigröße > 10MB
2. Falscher Dateityp
3. Keine Schreibberechtigung für uploads/members/
4. Speicherplatz voll
```

#### Dokument nicht angezeigt
```bash
# Datei-Existenz prüfen
ls -la uploads/members/document-[timestamp]-[random].pdf

# Datenbank-Eintrag prüfen
sqlite3 server/database/club.db "SELECT * FROM member_documents WHERE id = ?;"
```

#### Berechtigung-Probleme
```bash
# Ordner-Berechtigungen setzen
chmod 755 uploads/
chmod 755 uploads/members/
chmod 644 uploads/members/*
```

## 📈 Erweiterungsmöglichkeiten

### Geplante Features
1. **Drag & Drop Upload** - Moderne Upload-Oberfläche
2. **Bildvorschau** - Thumbnails für Bilder
3. **Dokument-Kategorien** - Strukturierte Organisation
4. **Versionierung** - Mehrere Versionen eines Dokuments
5. **OCR-Integration** - Texterkennung in PDFs
6. **Cloud-Storage** - Integration mit externen Speichern

### Anpassungen
```javascript
// Neue Dateitypen hinzufügen
const allowedTypes = /jpeg|jpg|png|pdf|gif|bmp|webp|doc|docx|txt/;

// Dateigröße anpassen
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// Neue Metadaten-Felder
ALTER TABLE member_documents ADD COLUMN category TEXT;
ALTER TABLE member_documents ADD COLUMN tags TEXT;
```

---

**Entwickelt:** August 2025  
**Kompatibilität:** Node.js, Express, SQLite, Multer  
**Security:** File validation, Access control, Safe storage