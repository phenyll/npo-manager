// payment.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const util = require('./utils');
const emailService = require('./email');

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
                db.get(`SELECT SUM(amount) AS totalOutstandingAmount FROM payments WHERE status = 'offen'`, (err, totalOutstandingAmountRow) => {
                    if (err) {
                        console.error("Fehler beim Abrufen des ausstehenden Gesamtbetrags:", err.message);
                        return res.status(500).send(err.message);
                    }

                    db.get(`SELECT COUNT(DISTINCT memberId) AS membersWithOutstandingPayments FROM payments WHERE status = 'offen'`, (err, membersWithOutstandingPaymentsRow) => {
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
    //const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
    const currentYearStart = `${year}-01-01`; // First day of the current year
    const currentYearEnd = `${year}-12-31`; // Last day of the current year

    // First get all eligible members
    db.all(
        `SELECT id FROM members 
         WHERE (actualExit IS NULL OR actualExit >= ?)
         AND (autoExit IS NULL OR autoExit >= ?)
         AND (joinDate IS NULL OR joinDate <= ?)`,
        [currentYearStart, currentYearStart, currentYearEnd],
        (err, allEligibleMembers) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            if (allEligibleMembers.length === 0) {
                return res.status(400).send("Keine Mitglieder für Beitragsforderungen gefunden.");
            }

            // Get member IDs that already have payments for this year
            db.all(
                `SELECT DISTINCT memberId FROM payments WHERE year = ?`,
                [year],
                (err, existingPaymentMembers) => {
                    if (err) {
                        return res.status(500).send(err.message);
                    }

                    // Create a set of member IDs with existing payments for easy lookup
                    const membersWithPayments = new Set(existingPaymentMembers.map(row => row.memberId));
                    
                    // Filter out members who already have payments for this year
                    const membersNeedingPayments = allEligibleMembers.filter(member => !membersWithPayments.has(member.id));

                    if (membersNeedingPayments.length === 0) {
                        return res.status(400).send("Alle in Frage kommenden Mitglieder haben bereits Beitragsforderungen für das Jahr " + year);
                    }

                    db.serialize(() => {
                        const stmt = db.prepare(
                            "INSERT INTO payments (memberId, year, amount, status) VALUES (?, ?, ?, ?)"
                        );

                        membersNeedingPayments.forEach((member) => {
                            stmt.run([member.id, year, amount, "offen"]);
                        });

                        stmt.finalize(() => {
                            res.status(201).send(`${membersNeedingPayments.length} Beitragsforderungen erfolgreich erstellt!`);
                        });
                    });
                }
            );
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

// New route to get reminder history for a payment
router.get("/:id/reminders", (req, res) => {
    const { id } = req.params;
    db.all(
        "SELECT * FROM reminder_history WHERE payment_id = ? ORDER BY reminder_date DESC",
        [id],
        (err, rows) => {
            if (err) {
                console.error("Fehler beim Abrufen der Mahnungshistorie:", err.message);
                return res.status(500).send(err.message);
            }
            res.json({ reminders: rows });
        }
    );
});

// New route to add a reminder for a payment
router.post("/:id/remind", (req, res) => {
    const { id } = req.params;
    const { reminderMethod, reminderNotes } = req.body;
    const reminderDate = req.body.reminderDate || new Date().toISOString().split('T')[0];
    const createdBy = req.session?.user?.username || 'System';

    if (!reminderMethod) {
        return res.status(400).send("Mahnungsart ist erforderlich");
    }

    db.run(
        "INSERT INTO reminder_history (payment_id, reminder_date, reminder_method, reminder_notes, created_by) VALUES (?, ?, ?, ?, ?)",
        [id, reminderDate, reminderMethod, reminderNotes, createdBy],
        function (err) {
            if (err) {
                console.error("Fehler beim Hinzufügen der Mahnung:", err.message);
                return res.status(500).send(err.message);
            }
            res.status(201).json({ id: this.lastID, message: "Mahnung erfolgreich erfasst" });
        }
    );
});

// Get a single payment with its reminders
router.get("/:id", (req, res) => {
    const { id } = req.params;
    
    // Get payment details
    db.get("SELECT * FROM payments WHERE id = ?", [id], (err, payment) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        
        if (!payment) {
            return res.status(404).send("Beitrag nicht gefunden");
        }
        
        // Get reminder history for this payment
        db.all(
            "SELECT * FROM reminder_history WHERE payment_id = ? ORDER BY reminder_date DESC", 
            [id], 
            (err, reminders) => {
                if (err) {
                    return res.status(500).send(err.message);
                }
                
                // Add reminder history to payment object
                payment.reminders = reminders || [];
                res.json(payment);
            }
        );
    });
});

// List payments with latest reminder info
router.get("/", (req, res) => {
    const { memberId } = req.query;
    let sql = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM reminder_history WHERE payment_id = p.id) AS reminder_count,
               (SELECT MAX(reminder_date) FROM reminder_history WHERE payment_id = p.id) AS last_reminder_date
        FROM payments p
    `;
    const params = [];

    if (memberId) {
        sql += " WHERE p.memberId = ?";
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

    // Check if this member already has a payment record for this year
    db.get(
        "SELECT id FROM payments WHERE memberId = ? AND year = ?",
        [memberId, year],
        (err, existingPayment) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            if (existingPayment) {
                return res.status(400).send(`Es existiert bereits eine Beitragsforderung für das Mitglied mit der ID ${memberId} für das Jahr ${year}`);
            }

            // If no existing payment, create a new one
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
    });

    // New route to send a reminder email
    router.post("/:id/send-reminder-email", async (req, res) => {
        const { id } = req.params;
        const createdBy = req.session?.user?.username || 'System';

        try {
            // Get payment details
            const payment = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM payments WHERE id = ?", [id], (err, payment) => {
                    if (err) reject(err);
                    else if (!payment) reject(new Error("Payment not found"));
                    else resolve(payment);
                });
            });

            // Send email
            const emailResult = await emailService.sendReminderEmail(
                payment.memberId,
                id,
                payment.year
            );

            // Record reminder in history
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO reminder_history (payment_id, reminder_date, reminder_method, reminder_notes, created_by) VALUES (?, ?, ?, ?, ?)",
                    [id, new Date().toISOString().split('T')[0], "Email", `Email sent to member's address`, createdBy],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            res.status(200).json({
                success: true,
                message: "Reminder email sent successfully",
                emailDetails: emailResult
            });
        } catch (error) {
            console.error("Error sending reminder email:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

module.exports = router;

