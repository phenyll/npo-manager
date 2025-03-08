// payment.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

router.get("/", (req, res) => {
    const { memberId } = req.query;
    let sql = "SELECT * FROM payments";
    const params = [];

    if (memberId) {
        sql += " WHERE memberId = ?";
        params.push(memberId);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json({ payments: rows });
        }
    });
});

router.post("/", (req, res) => {
    const { memberId, year, amount, status, paymentMethod } = req.body;

    db.run(
        "INSERT INTO payments (memberId, year, amount, status, paymentMethod) VALUES (?, ?, ?, ?, ?)",
        [memberId, year, amount, status, paymentMethod || "Bank"],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

router.post("/create-bulk", (req, res) => {
    const { year, amount } = req.body;

    db.all(
        "SELECT id FROM members WHERE id NOT IN (SELECT memberId FROM payments WHERE year = ?)",
        [year],
        (err, rows) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            if (rows.length === 0) {
                return res.status(400).send("Keine neuen Beitragsforderungen zu erstellen.");
            }

            db.serialize(() => {
                const stmt = db.prepare(
                    "INSERT INTO payments (memberId, year, amount, status) VALUES (?, ?, ?, ?)"
                );

                rows.forEach((row) => {
                    stmt.run([row.id, year, amount, "offen"]);
                });

                stmt.finalize(() => {
                    res.status(201).send("Beitragsforderungen erfolgreich erstellt!");
                });
            });
        }
    );
});

router.get("/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM payments WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(row);
        }
    });
});

router.put("/:id", (req, res) => {
    const { year, amount, status, paymentMethod } = req.body;

    db.run(
        "UPDATE payments SET year = ?, amount = ?, status = ?, paymentMethod = ? WHERE id = ?",
        [year, amount, status, paymentMethod, req.params.id],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.json({ message: "Beitrag aktualisiert", changes: this.changes });
            }
        }
    );
});

router.put("/:id/pay", (req, res) => {
    const { id } = req.params;
    const { paymentDate, paymentMethod } = req.body;
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
        ? paymentDate
        : /^\d{2}\.\d{2}\.\d{4}$/.test(paymentDate)
            ? paymentDate.split('.').reverse().join('-')
            : null;
    const amount = req.body.amount;

    if (!parsedDate) {
        return res.status(400).send("Ungültiges Datum.");
    }

    db.run(
        "UPDATE payments SET status = ?, paymentDate = ?, paymentMethod = ?, amount = ? WHERE id = ?",
        ["gezahlt", parsedDate, paymentMethod, amount, id],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.json({ message: "Beitrag als bezahlt markiert", changes: this.changes });
            }
        }
    );
});

router.get("/export-open-payments", (req, res) => {
    db.all(
        `SELECT members.id, members.firstName, members.lastName, payments.year, payments.amount, payments.status
         FROM payments
                  JOIN members ON payments.memberId = members.id
         WHERE payments.status = 'offen'`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(rows);
            xlsx.utils.book_append_sheet(workbook, worksheet, "Offene Beiträge");

            const filePath = path.join(__dirname, "../uploads", "offene_beitraege.xlsx");
            xlsx.writeFile(workbook, filePath);

            res.download(filePath, "offene_beitraege.xlsx", (err) => {
                if (err) {
                    console.error("Fehler beim Herunterladen der Datei:", err.message);
                }
                fs.unlinkSync(filePath); // Temporäre Datei löschen
            });
        }
    );
});

module.exports = router;