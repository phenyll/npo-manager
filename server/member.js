// member.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

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

router.get("/", (req, res) => {
  db.all("SELECT * FROM members", [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ members: rows });
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
      CASE WHEN m.actualExit IS NOT NULL THEN 1 ELSE 0 END as has_actual_exit,
      CASE WHEN m.expectedExitDate IS NOT NULL THEN 1 ELSE 0 END as has_expected_exit,
      CASE WHEN m.autoExit IS NOT NULL THEN 1 ELSE 0 END as has_auto_exit,
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
    sql += " AND m.actualExit IS NOT NULL";
  } else if (hasActualExit === 'false') {
    sql += " AND m.actualExit IS NULL";
  }

  if (hasExpectedExit === 'true') {
    sql += " AND m.expectedExitDate IS NOT NULL";
  } else if (hasExpectedExit === 'false') {
    sql += " AND m.expectedExitDate IS NULL";
  }

  if (hasAutoExit === 'true') {
    sql += " AND m.autoExit IS NOT NULL";
  } else if (hasAutoExit === 'false') {
    sql += " AND m.autoExit IS NULL";
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
    sql += " AND m.actualExit IS NOT NULL";
  } else if (hasActualExit === 'false') {
    sql += " AND m.actualExit IS NULL";
  }

  if (hasExpectedExit === 'true') {
    sql += " AND m.expectedExitDate IS NOT NULL";
  } else if (hasExpectedExit === 'false') {
    sql += " AND m.expectedExitDate IS NULL";
  }

  if (hasAutoExit === 'true') {
    sql += " AND m.autoExit IS NOT NULL";
  } else if (hasAutoExit === 'false') {
    sql += " AND m.autoExit IS NULL";
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

module.exports = {router, convertExcelDate};