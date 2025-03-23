// member.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

router.get("/stats", (req, res) => {
    const currentYear = new Date().getFullYear();
    console.log("Mitgliederstatistiken für das Jahr", currentYear);

    db.get("SELECT COUNT(*) AS totalMembers FROM members", (err, totalMembersRow) => {
        if (err) {
            console.error("Fehler beim Abrufen der Mitglieder-Statistiken:", err.message);
            return res.status(500).send(err.message);
        } else {
            db.get(`SELECT COUNT(*) AS newMembersThisYear FROM members WHERE strftime('%Y', joinDate) = ?`, [currentYear], (err, newMembersRow) => {
                if (err) {
                    console.error("Fehler beim Abrufen der neuen Mitglieder:", err.message);
                    return res.status(500).send(err.message);
                }

                const totalMembers = totalMembersRow.totalMembers;
                const newMembersThisYear = newMembersRow.newMembersThisYear;

                console.log("Mitglieder insgesamt:", totalMembers);
                console.log("Neue Mitglieder in", currentYear, ":", newMembersThisYear);

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
  } = req.body;

  db.run(
      `INSERT INTO members (firstName, lastName, city, email, phone, childName, enrollmentYear, joinDate, expectedExitDate, actualExit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  } = req.body;

  db.run(
      `UPDATE members
       SET firstName = ?, lastName = ?, city = ?, email = ?, phone = ?, childName = ?, enrollmentYear = ?, joinDate = ?, expectedExitDate = ?, actualExit = ?
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
        console.error("Fehler beim Abrufen der max ID:", err.message);
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
            console.log("Zeile übersprungen, da Nachname fehlt.");
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
                  console.error("Fehler beim Importieren in 'members':", err.message);
                }
              }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error("Fehler beim Finalisieren des Statements:", err.message);
            return res.status(500).send("Fehler beim Importieren der Mitglieder.");
          } else {
            console.log("Mitglieder erfolgreich importiert.");
            return res.status(200).send("Mitglieder erfolgreich importiert.");
          }
        });
      }
    });
  });

  fs.unlink(file.path, (err) => {
    if (err) {
      console.error("Fehler beim Löschen der hochgeladenen Datei:", err.message);
    }
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