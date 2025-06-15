// member.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Spezielle Multer-Konfiguration für Mitglieder-Dokumente
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const memberDocDir = path.join(__dirname, '../uploads/members');
    // Stelle sicher, dass das Verzeichnis existiert
    if (!fs.existsSync(memberDocDir)) {
      fs.mkdirSync(memberDocDir, { recursive: true });
    }
    cb(null, memberDocDir);
  },
  filename: function (req, file, cb) {
    // Eindeutiger Dateiname mit Zeitstempel
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocument = multer({ 
  storage: documentStorage,
  fileFilter: function (req, file, cb) {
    // Nur PDF und Bilder erlauben
    const allowedTypes = /jpeg|jpg|png|pdf|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Nur Bilder (JPEG, PNG, GIF, BMP, WebP) und PDF-Dateien sind erlaubt!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB Limit
  }
});

router.get("/stats", (req, res) => {
    const currentYear = new Date().getFullYear();

    db.get("SELECT COUNT(*) AS totalMembers FROM members", (err, totalMembersRow) => {
        if (err) {
            return res.status(500).send(err.message);
        } else {
            db.get(`SELECT COUNT(*) AS newMembersThisYear FROM members WHERE strftime('%Y', joinDate) = ?`, [currentYear], (err, newMembersRow) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                const totalMembers = totalMembersRow.totalMembers;
                const newMembersThisYear = newMembersRow.newMembersThisYear;

                res.json({
                    totalMembers: totalMembers,
                    newMembersThisYear: newMembersThisYear
                });
            });
        }
    });
});

// Neue Route: Jährliche Mitgliederbewegungen für die letzten 3 Jahre + aktuelles Jahr + 3 Jahre Zukunft
router.get("/yearly-movements", (req, res) => {
    const currentYear = new Date().getFullYear();
    
    const sql = `
        SELECT 
            jahre.jahr,
            COALESCE(zugaenge.count, 0) as zugaenge,
            COALESCE(abgaenge.count, 0) as abgaenge,
            COALESCE(erwartete_abgaenge.count, 0) as erwarteteAbgaenge,
            COALESCE(zahlungseingaenge.total_amount, 0) as zahlungseingaenge,
            (
                SELECT COUNT(*) 
                FROM members 
                WHERE (joinDate IS NULL OR joinDate = '' OR joinDate <= (jahre.jahr || '-12-31'))
                  AND (
                    -- Für vergangene/aktuelle Jahre: nur tatsächliche Austritte berücksichtigen
                    (jahre.jahr <= ? AND (actualExit IS NULL OR actualExit = '' OR actualExit > (jahre.jahr || '-12-31')))
                    OR
                    -- Für Zukunftsjahre: sowohl tatsächliche als auch erwartete Austritte berücksichtigen
                    (jahre.jahr > ? AND (
                      (actualExit IS NULL OR actualExit = '' OR actualExit > (jahre.jahr || '-12-31'))
                      AND (expectedExitDate IS NULL OR expectedExitDate = '' OR expectedExitDate > (jahre.jahr || '-12-31'))
                    ))
                  )
            ) as standJahresende
        FROM (
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr UNION ALL
            SELECT ? as jahr
        ) jahre
        LEFT JOIN (
            SELECT 
                strftime('%Y', joinDate) as jahr,
                COUNT(*) as count
            FROM members 
            WHERE joinDate IS NOT NULL AND joinDate != ''
            GROUP BY strftime('%Y', joinDate)
        ) zugaenge ON CAST(jahre.jahr as TEXT) = zugaenge.jahr
        LEFT JOIN (
            SELECT 
                strftime('%Y', actualExit) as jahr,
                COUNT(*) as count
            FROM members 
            WHERE actualExit IS NOT NULL AND actualExit != ''
            GROUP BY strftime('%Y', actualExit)
        ) abgaenge ON CAST(jahre.jahr as TEXT) = abgaenge.jahr
        LEFT JOIN (
            SELECT 
                strftime('%Y', expectedExitDate) as jahr,
                COUNT(*) as count
            FROM members 
            WHERE expectedExitDate IS NOT NULL AND expectedExitDate != ''
              AND (actualExit IS NULL OR actualExit = '')
            GROUP BY strftime('%Y', expectedExitDate)
        ) erwartete_abgaenge ON CAST(jahre.jahr as TEXT) = erwartete_abgaenge.jahr
        LEFT JOIN (
            SELECT 
                strftime('%Y', paymentDate) as jahr,
                SUM(amount) as total_amount
            FROM payments 
            WHERE paymentDate IS NOT NULL AND paymentDate != ''
              AND status = 'gezahlt'
            GROUP BY strftime('%Y', paymentDate)
        ) zahlungseingaenge ON CAST(jahre.jahr as TEXT) = zahlungseingaenge.jahr
        ORDER BY jahre.jahr
    `;
    
    const params = [
        currentYear, currentYear, // für die standJahresende Berechnung
        currentYear - 3, 
        currentYear - 2, 
        currentYear - 1, 
        currentYear,
        currentYear + 1,
        currentYear + 2,
        currentYear + 3
    ];
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Fehler bei yearly-movements:", err.message);
            return res.status(500).send(err.message);
        }
        
        const movements = rows.map(row => ({
            jahr: parseInt(row.jahr),
            zugaenge: row.zugaenge,
            abgaenge: row.abgaenge,
            erwarteteAbgaenge: row.erwarteteAbgaenge,
            zahlungseingaenge: parseFloat(row.zahlungseingaenge) || 0,
            standJahresende: row.standJahresende
        }));
        
        res.json({
            movements,
            generatedAt: new Date().toISOString(),
            referenceDate: new Date().toISOString().split('T')[0]
        });
    });
});

router.get("/", (req, res) => {
  let sql = `
    SELECT 
      m.*,
      CASE WHEN op.open_payments > 0 THEN 1 ELSE 0 END as has_open_payments,
      COALESCE(op.open_payments, 0) as open_payments_count,
      COALESCE(op.total_open_amount, 0) as total_open_amount,
      CASE WHEN m.actualExit IS NOT NULL AND m.actualExit != '' THEN 1 ELSE 0 END as has_actual_exit,
      CASE WHEN m.expectedExitDate IS NOT NULL AND m.expectedExitDate != '' THEN 1 ELSE 0 END as has_expected_exit,
      CASE WHEN m.autoExit IS NOT NULL AND m.autoExit != '' THEN 1 ELSE 0 END as has_auto_exit,
      CASE WHEN m.email IS NOT NULL AND m.email != '' THEN 1 ELSE 0 END as has_email
    FROM members m
    LEFT JOIN (
      SELECT 
        memberId,
        COUNT(*) as open_payments,
        SUM(amount) as total_open_amount
      FROM payments 
      WHERE status = 'offen'
      GROUP BY memberId
    ) op ON m.id = op.memberId
    ORDER BY m.lastName, m.firstName
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      // Statistiken berechnen
      const totalCount = rows.length;
      const totalOpenAmount = rows.reduce((sum, member) => sum + (member.total_open_amount || 0), 0);
      const exitedCount = rows.filter(member => member.has_actual_exit).length;
      const autoExitCount = rows.filter(member => member.has_auto_exit).length;

      const response = {
        members: rows,
        statistics: {
          totalCount,
          totalOpenAmount,
          exitedCount,
          autoExitCount
        }
      };
      
      res.json(response);
    }
  });
});

router.post("/", (req, res) => {
  const {
    firstName,
    lastName,
    city,
    email,
    phone,
    childName,
    enrollmentYear,
    joinDate,
    expectedExitDate,
    autoExit,
    actualExit
  } = req.body;

  db.run(
      `INSERT INTO members (firstName, lastName, city, email, phone, childName, enrollmentYear, joinDate, expectedExitDate, autoExit, actualExit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        city,
        email,
        phone,
        childName,
        enrollmentYear,
        joinDate,
        expectedExitDate,
        autoExit,
        actualExit
      ],
      function (err) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(201).json({ id: this.lastID });
        }
      }
  );
});

// Gefilterte Mitgliederliste mit Statistiken
router.get("/filtered", (req, res) => {
  const {
    hasOpenPayments,
    hasActualExit,
    hasExpectedExit,
    joinDateFrom,
    joinDateTo,
    hasAutoExit,
    hasEmail
  } = req.query;

  let sql = `
    SELECT 
      m.*,
      CASE WHEN op.open_payments > 0 THEN 1 ELSE 0 END as has_open_payments,
      COALESCE(op.open_payments, 0) as open_payments_count,
      COALESCE(op.total_open_amount, 0) as total_open_amount,
      CASE WHEN m.actualExit IS NOT NULL AND m.actualExit != '' THEN 1 ELSE 0 END as has_actual_exit,
      CASE WHEN m.expectedExitDate IS NOT NULL AND m.expectedExitDate != '' THEN 1 ELSE 0 END as has_expected_exit,
      CASE WHEN m.autoExit IS NOT NULL AND m.autoExit != '' THEN 1 ELSE 0 END as has_auto_exit,
      CASE WHEN m.email IS NOT NULL AND m.email != '' THEN 1 ELSE 0 END as has_email
    FROM members m
    LEFT JOIN (
      SELECT 
        memberId,
        COUNT(*) as open_payments,
        SUM(amount) as total_open_amount
      FROM payments 
      WHERE status = 'offen'
      GROUP BY memberId
    ) op ON m.id = op.memberId
    WHERE 1=1
  `;

  const params = [];

  // Filter anwenden
  if (hasOpenPayments === 'true') {
    sql += " AND op.open_payments > 0";
  } else if (hasOpenPayments === 'false') {
    sql += " AND (op.open_payments IS NULL OR op.open_payments = 0)";
  }

  if (hasActualExit === 'true') {
    sql += " AND m.actualExit IS NOT NULL AND m.actualExit != ''";
  } else if (hasActualExit === 'false') {
    sql += " AND (m.actualExit IS NULL OR m.actualExit = '')";
  }

  if (hasExpectedExit === 'true') {
    sql += " AND m.expectedExitDate IS NOT NULL AND m.expectedExitDate != ''";
  } else if (hasExpectedExit === 'false') {
    sql += " AND (m.expectedExitDate IS NULL OR m.expectedExitDate = '')";
  }

  if (hasAutoExit === 'true') {
    sql += " AND m.autoExit IS NOT NULL AND m.autoExit != ''";
  } else if (hasAutoExit === 'false') {
    sql += " AND (m.autoExit IS NULL OR m.autoExit = '')";
  }

  if (hasEmail === 'true') {
    sql += " AND m.email IS NOT NULL AND m.email != ''";
  } else if (hasEmail === 'false') {
    sql += " AND (m.email IS NULL OR m.email = '')";
  }

  if (joinDateFrom) {
    sql += " AND m.joinDate >= ?";
    params.push(joinDateFrom);
  }

  if (joinDateTo) {
    sql += " AND m.joinDate <= ?";
    params.push(joinDateTo);
  }

  sql += " ORDER BY m.lastName, m.firstName";

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Statistiken berechnen
    const totalCount = rows.length;
    const totalOpenAmount = rows.reduce((sum, member) => sum + (member.total_open_amount || 0), 0);
    const exitedCount = rows.filter(member => member.has_actual_exit).length;
    const autoExitCount = rows.filter(member => member.has_auto_exit).length;

    const response = {
      members: rows,
      statistics: {
        totalCount,
        totalOpenAmount,
        exitedCount,
        autoExitCount
      }
    };
    
    res.json(response);
  });
});

// Excel-Export für gefilterte Mitgliederliste
router.get("/export", (req, res) => {
  const {
    hasOpenPayments,
    hasActualExit,
    hasExpectedExit,
    joinDateFrom,
    joinDateTo,
    hasAutoExit,
    hasEmail
  } = req.query;

  let sql = `
    SELECT 
      m.id as "Mitglied Nr",
      m.firstName as "Vorname",
      m.lastName as "Nachname", 
      m.city as "Ort",
      m.email as "E-Mail",
      m.phone as "Telefon",
      m.childName as "Kindesname",
      m.enrollmentYear as "Einschulungsjahr",
      m.joinDate as "Eintrittsdatum",
      m.expectedExitDate as "Voraussichtlicher Austritt",
      m.autoExit as "Automatischer Austritt",
      m.actualExit as "Tatsächlicher Austritt",
      COALESCE(op.open_payments, 0) as "Anzahl offene Beiträge",
      COALESCE(op.total_open_amount, 0) as "Summe offene Beiträge",
      CASE WHEN m.actualExit IS NOT NULL THEN 'Ja' ELSE 'Nein' END as "Ausgetreten",
      CASE WHEN m.expectedExitDate IS NOT NULL THEN 'Ja' ELSE 'Nein' END as "Voraussichtlicher Austritt gesetzt",
      CASE WHEN m.autoExit IS NOT NULL THEN 'Ja' ELSE 'Nein' END as "Automatischer Austritt gesetzt",
      CASE WHEN m.email IS NOT NULL AND m.email != '' THEN 'Ja' ELSE 'Nein' END as "Hat E-Mail-Adresse"
    FROM members m
    LEFT JOIN (
      SELECT 
        memberId,
        COUNT(*) as open_payments,
        SUM(amount) as total_open_amount
      FROM payments 
      WHERE status = 'offen'
      GROUP BY memberId
    ) op ON m.id = op.memberId
    WHERE 1=1
  `;

  const params = [];

  // Gleiche Filter wie bei /filtered anwenden
  if (hasOpenPayments === 'true') {
    sql += " AND op.open_payments > 0";
  } else if (hasOpenPayments === 'false') {
    sql += " AND (op.open_payments IS NULL OR op.open_payments = 0)";
  }

  if (hasActualExit === 'true') {
    sql += " AND m.actualExit IS NOT NULL AND m.actualExit != ''";
  } else if (hasActualExit === 'false') {
    sql += " AND (m.actualExit IS NULL OR m.actualExit = '')";
  }

  if (hasExpectedExit === 'true') {
    sql += " AND m.expectedExitDate IS NOT NULL AND m.expectedExitDate != ''";
  } else if (hasExpectedExit === 'false') {
    sql += " AND (m.expectedExitDate IS NULL OR m.expectedExitDate = '')";
  }

  if (hasAutoExit === 'true') {
    sql += " AND m.autoExit IS NOT NULL AND m.autoExit != ''";
  } else if (hasAutoExit === 'false') {
    sql += " AND (m.autoExit IS NULL OR m.autoExit = '')";
  }

  if (hasEmail === 'true') {
    sql += " AND m.email IS NOT NULL AND m.email != ''";
  } else if (hasEmail === 'false') {
    sql += " AND (m.email IS NULL OR m.email = '')";
  }

  if (joinDateFrom) {
    sql += " AND m.joinDate >= ?";
    params.push(joinDateFrom);
  }

  if (joinDateTo) {
    sql += " AND m.joinDate <= ?";
    params.push(joinDateTo);
  }

  sql += " ORDER BY m.lastName, m.firstName";

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Gefilterte Mitgliederliste");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(__dirname, "../uploads", `mitgliederliste_gefiltert_${timestamp}.xlsx`);
    
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, `mitgliederliste_gefiltert_${timestamp}.xlsx`, (err) => {
      if (err) {
        // Silent error handling
      }
      fs.unlinkSync(filePath); // Temporäre Datei löschen
    });
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM members WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(row);
    }
  });
});

router.put("/:id", (req, res) => {
  const {
    firstName,
    lastName,
    city,
    email,
    phone,
    childName,
    enrollmentYear,
    joinDate,
    expectedExitDate,
    autoExit,
    actualExit
  } = req.body;

  db.run(
      `UPDATE members
       SET firstName = ?, lastName = ?, city = ?, email = ?, phone = ?, childName = ?, enrollmentYear = ?, joinDate = ?, expectedExitDate = ?, autoExit = ?, actualExit = ?
       WHERE id = ?`,
      [
        firstName,
        lastName,
        city,
        email,
        phone,
        childName,
        enrollmentYear,
        joinDate,
        expectedExitDate,
        autoExit,
        actualExit,
        req.params.id,
      ],
      function (err) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({ message: "Mitglied aktualisiert", changes: this.changes });
        }
      }
  );
});

// Add to the member.js file
router.put("/:id/exit", (req, res) => {
    const { id } = req.params;
    const { exitDate } = req.body;

    if (!exitDate) {
        return res.status(400).send("Austrittsdatum erforderlich");
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exitDate)) {
        return res.status(400).send("Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden.");
    }

    db.run(
        "UPDATE members SET actualExit = ? WHERE id = ?",
        [exitDate, id],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else if (this.changes > 0) {
                res.json({ message: "Austrittsdatum erfolgreich erfasst", id });
            } else {
                res.status(404).send(`Mitglied mit ID ${id} nicht gefunden`);
            }
        }
    );
});

router.post("/import-members", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("Keine Datei hochgeladen.");
  }

  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const sheetData = xlsx.utils.sheet_to_json(sheet);

  let maxId = 0;

  db.serialize(() => {
    db.get("SELECT MAX(id) as maxId FROM members", (err, row) => {
      if (err) {
        return res.status(500).send("Fehler beim Import");
      } else {
        maxId = row.maxId || 0;

        const stmt = db.prepare(
            `
              INSERT INTO members (
                id,
                firstName,
                lastName,
                city,
                email,
                phone,
                childName,
                enrollmentYear,
                joinDate,
                expectedExitDate,
                autoExit
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        );

        sheetData.forEach((row) => {
          const id = row["Nr."] || ++maxId;
          const firstName = row["Vorname"] || "Unbekannt";
          const lastName = row["Nachname"];
          if (!lastName) {
            return;
          }
          const city = row["Ort"];
          const email = row["E-Mail"];
          const phone = row["Telefon"];
          const childName = row["Kind"];
          const enrollmentYear = row["Einschulung"];

          const joinDate = convertExcelDate(row["Eintrittsdatum"]);
          const expectedExitDate = convertExcelDate(row["Voraussichtlicher Austritt"]);
          const autoExit = convertExcelDate(row["Austritt (ja)"]);

          stmt.run(
              id,
              firstName,
              lastName,
              city,
              email,
              phone,
              childName || null,
              enrollmentYear || null,
              joinDate,
              expectedExitDate,
              autoExit,
              (err) => {
                if (err) {
                  // Silent error handling for production
                }
              }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            return res.status(500).send("Fehler beim Importieren der Mitglieder.");
          } else {
            return res.status(200).send("Mitglieder erfolgreich importiert.");
          }
        });
      }
    });
  });

  fs.unlink(file.path, (err) => {
    // Silent cleanup - file deletion is not critical
  });
});

function convertExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    if (excelDate >= 1000 && excelDate <= 9999) {
      return `${excelDate}-12-31`;
    } else {
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
  } else if (typeof excelDate === 'string') {
    if (/^\d{4}$/.test(excelDate)) {
      const year = parseInt(excelDate, 10);
      return `${year}-12-31`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
      return excelDate;
    } else {
      const date = new Date(excelDate);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
  } else {
    return null;
  }
}

// ===== DOKUMENTENVERWALTUNG =====

// Dokument hochladen für ein Mitglied
router.post("/:id/documents", uploadDocument.single('document'), (req, res) => {
  const memberId = req.params.id;
  const { description } = req.body;
  
  if (!req.file) {
    return res.status(400).send("Keine Datei hochgeladen");
  }

  const { filename, originalname, mimetype, size } = req.file;
  const uploadedBy = req.session.user || 'unbekannt';

  db.run(
    `INSERT INTO member_documents (member_id, filename, original_filename, file_type, file_size, uploaded_by, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [memberId, filename, originalname, mimetype, size, uploadedBy, description || ''],
    function (err) {
      if (err) {
        console.error("Fehler beim Speichern des Dokuments:", err.message);
        return res.status(500).send(err.message);
      }
      res.status(201).json({ 
        id: this.lastID,
        message: "Dokument erfolgreich hochgeladen"
      });
    }
  );
});

// Dokumente für ein Mitglied abrufen
router.get("/:id/documents", (req, res) => {
  const memberId = req.params.id;
  
  db.all(
    `SELECT id, filename, original_filename, file_type, file_size, upload_date, uploaded_by, description
     FROM member_documents 
     WHERE member_id = ?
     ORDER BY upload_date DESC`,
    [memberId],
    (err, rows) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json(rows);
    }
  );
});

// Einzelnes Dokument herunterladen
router.get("/:id/documents/:docId/download", (req, res) => {
  const { id: memberId, docId } = req.params;
  
  db.get(
    `SELECT filename, original_filename, file_type 
     FROM member_documents 
     WHERE id = ? AND member_id = ?`,
    [docId, memberId],
    (err, row) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (!row) {
        return res.status(404).send("Dokument nicht gefunden");
      }
      
      const filePath = path.join(__dirname, '../uploads/members', row.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Datei nicht gefunden");
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${row.original_filename}"`);
      res.setHeader('Content-Type', row.file_type);
      res.sendFile(filePath);
    }
  );
});

// Dokument löschen
router.delete("/:id/documents/:docId", (req, res) => {
  const { id: memberId, docId } = req.params;
  
  // Erst Dateiinformationen abrufen
  db.get(
    `SELECT filename FROM member_documents WHERE id = ? AND member_id = ?`,
    [docId, memberId],
    (err, row) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (!row) {
        return res.status(404).send("Dokument nicht gefunden");
      }
      
      // Datei aus Dateisystem löschen
      const filePath = path.join(__dirname, '../uploads/members', row.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Datenbankeinträg löschen
      db.run(
        `DELETE FROM member_documents WHERE id = ? AND member_id = ?`,
        [docId, memberId],
        function (err) {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.json({ message: "Dokument erfolgreich gelöscht" });
        }
      );
    }
  );
});

// ===== NOTIZENVERWALTUNG =====

// Notiz für ein Mitglied erstellen
router.post("/:id/notes", (req, res) => {
  const memberId = req.params.id;
  const { noteText, noteType } = req.body;
  const createdBy = req.session.user || 'unbekannt';
  
  if (!noteText || noteText.trim() === '') {
    return res.status(400).send("Notiztext ist erforderlich");
  }

  db.run(
    `INSERT INTO member_notes (member_id, note_text, note_type, created_by)
     VALUES (?, ?, ?, ?)`,
    [memberId, noteText.trim(), noteType || 'allgemein', createdBy],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.status(201).json({ 
        id: this.lastID,
        message: "Notiz erfolgreich erstellt"
      });
    }
  );
});

// Notizen für ein Mitglied abrufen
router.get("/:id/notes", (req, res) => {
  const memberId = req.params.id;
  
  db.all(
    `SELECT id, note_text, note_type, created_date, created_by
     FROM member_notes 
     WHERE member_id = ?
     ORDER BY created_date DESC`,
    [memberId],
    (err, rows) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json(rows);
    }
  );
});

// Notiz bearbeiten
router.put("/:id/notes/:noteId", (req, res) => {
  const { id: memberId, noteId } = req.params;
  const { noteText, noteType } = req.body;
  
  if (!noteText || noteText.trim() === '') {
    return res.status(400).send("Notiztext ist erforderlich");
  }

  db.run(
    `UPDATE member_notes 
     SET note_text = ?, note_type = ?
     WHERE id = ? AND member_id = ?`,
    [noteText.trim(), noteType || 'allgemein', noteId, memberId],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (this.changes === 0) {
        return res.status(404).send("Notiz nicht gefunden");
      }
      res.json({ message: "Notiz erfolgreich aktualisiert" });
    }
  );
});

// Notiz löschen
router.delete("/:id/notes/:noteId", (req, res) => {
  const { id: memberId, noteId } = req.params;
  
  db.run(
    `DELETE FROM member_notes WHERE id = ? AND member_id = ?`,
    [noteId, memberId],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (this.changes === 0) {
        return res.status(404).send("Notiz nicht gefunden");
      }
      res.json({ message: "Notiz erfolgreich gelöscht" });
    }
  );
});

module.exports = {router, convertExcelDate};