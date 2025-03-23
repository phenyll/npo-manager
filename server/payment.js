// payment.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const util = require('./utils');

router.get("/stats", (req, res) => {
    const currentYear = new Date().getFullYear();

    db.get(`SELECT SUM(amount) AS totalRevenueThisYear FROM payments WHERE year = ? AND status = 'gezahlt'`, [currentYear], (err, totalRevenueRow) => {
        if (err) {
            console.error("Fehler beim Abrufen des Gesamtumsatzes:", err.message);
            return res.status(500).send(err.message);
        }

        db.get(`SELECT COUNT(DISTINCT memberId) AS paidMembers FROM payments WHERE year = ? AND status = 'gezahlt'`, [currentYear], (err, paidMembersRow) => {
            if (err) {
                console.error("Fehler beim Abrufen der Anzahl zahlender Mitglieder:", err.message);
                return res.status(500).send(err.message);
            }

            db.get("SELECT COUNT(DISTINCT id) AS totalMembers FROM members", (err, totalMembersRow) => {
                if (err) {
                    console.error("Fehler beim Abrufen der Gesamtmitgliederzahl:", err.message);
                    return res.status(500).send(err.message);
                }

                // Neue Abfragen hinzugefügt
                db.get(`SELECT SUM(amount) AS totalOutstandingAmount FROM payments WHERE year = ? AND status = 'offen'`, [currentYear], (err, totalOutstandingAmountRow) => {
                    if (err) {
                        console.error("Fehler beim Abrufen des ausstehenden Gesamtbetrags:", err.message);
                        return res.status(500).send(err.message);
                    }

                    db.get(`SELECT COUNT(DISTINCT memberId) AS membersWithOutstandingPayments FROM payments WHERE year = ? AND status = 'offen'`, [currentYear], (err, membersWithOutstandingPaymentsRow) => {
                        if (err) {
                            console.error("Fehler beim Abrufen der Anzahl der Mitglieder mit ausstehenden Zahlungen:", err.message);
                            return res.status(500).send(err.message);
                        }

                        const totalRevenueThisYear = totalRevenueRow.totalRevenueThisYear || 0;
                        const paidMembers = paidMembersRow.paidMembers || 0;
                        const totalMembers = totalMembersRow.totalMembers || 0;
                        const averagePaymentPerMember = totalMembers > 0 ? (totalRevenueThisYear / totalMembers).toFixed(2) : 0;
                        const percentagePaidMembers = totalMembers > 0 ? ((paidMembers / totalMembers) * 100).toFixed(2) : 0;

                        // Ergebnisse der neuen Abfragen
                        const totalOutstandingAmount = totalOutstandingAmountRow.totalOutstandingAmount || 0;
                        const membersWithOutstandingPayments = membersWithOutstandingPaymentsRow.membersWithOutstandingPayments || 0;

                        res.json({
                            totalRevenueThisYear: totalRevenueThisYear,
                            averagePaymentPerMember: averagePaymentPerMember,
                            percentagePaidMembers: percentagePaidMembers,
                            totalOutstandingAmount: totalOutstandingAmount,
                            membersWithOutstandingPayments: membersWithOutstandingPayments
                        });
                    });
                });
            });
        });
    });
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

router.get("/export-open-payments", (req, res) => {
    db.all(
        `SELECT members.id, members.firstName, members.lastName, members.childName, members.email, 
                    payments.year, payments.amount, payments.status
         FROM payments
                  JOIN members ON payments.memberId = members.id
         WHERE payments.status = 'offen'`,
        [],
        (err, rows) => {
            if (err) {
                console.error("Fehler beim Exportieren der offenen Beiträge:", err.message);
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
    const { year, amount, status, paymentMethod, paymentDate } = req.body;

    db.run(
        "UPDATE payments SET year = ?, amount = ?, status = ?, paymentMethod = ?, paymentDate = ? WHERE id = ?",
        [year, amount, status, paymentMethod, util.parseDate(paymentDate), req.params.id],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.json({ message: "Beitrag aktualisiert", changes: this.changes });
            }
        }
    );
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM payments WHERE id = ?", [id], function(err) {
        if (err) {
            console.error("Fehler beim Löschen des Beitrags:", err.message);
            return res.status(500).send(err.message);
        }

        if (this.changes === 0) {
            return res.status(404).send("Beitrag nicht gefunden");
        }

        res.json({ message: "Beitrag erfolgreich gelöscht", changes: this.changes });
    });
});

router.put("/:id/pay", (req, res) => {
    const { id } = req.params;
    const { paymentDate, paymentMethod } = req.body;
    const parsedDate = util.parseDate(paymentDate);
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
    const { memberId, year, amount, status, paymentMethod, paymentDate} = req.body;

    db.run(
        "INSERT INTO payments (memberId, year, amount, status, paymentMethod, paymentDate) VALUES (?, ?, ?, ?, ?, ?)",
        [memberId, year, amount, status, paymentMethod || "Bank", paymentDate || null],
        function (err) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

module.exports = router;