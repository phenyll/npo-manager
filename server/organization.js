// server/organization.js
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('./db');

// Endpoint to get organization details - protected by authentication
router.get("/details", (req, res) => {
    if (!req.session.user) {
        return res.status(401).sendFile(path.join(__dirname, '../public', '401.html'));
    }

    db.get("SELECT * FROM organization_details WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error("Fehler beim Abrufen der Vereinsdaten:", err.message);
            return res.status(500).send("Datenbankfehler");
        }

        if (!row) {
            return res.status(404).send("Vereinsdaten nicht gefunden");
        }

        // Convert database row to expected format
        const organizationDetails = {
            name: row.name,
            address: row.address,
            email: row.email,
            phone: row.phone,
            website: row.website,
            bankDetails: {
                accountName: row.account_name,
                iban: row.iban,
                bic: row.bic,
                bankName: row.bank_name
            },
            taxId: row.tax_id,
            registrationNumber: row.registration_number,
            nameKassenwart: row.name_kassenwart
        };

        res.json(organizationDetails);
    });
});

// Optional: Add admin endpoint to update organization details
router.put("/details", (req, res) => {
    if (!req.session.user || !req.session.rights.includes('edit-user')) {
        return res.status(403).send('Nicht autorisiert');
    }

    const {
        name, address, email, phone, website,
        bankDetails, taxId, registrationNumber, nameKassenwart
    } = req.body;

    db.run(`
        UPDATE organization_details
        SET name                = ?,
            address             = ?,
            email               = ?,
            phone               = ?,
            website             = ?,
            account_name        = ?,
            iban                = ?,
            bic                 = ?,
            bank_name           = ?,
            tax_id              = ?,
            registration_number = ?,
            name_kassenwart     = ?
        WHERE id = 1
    `, [
        name,
        address,
        email,
        phone,
        website,
        bankDetails.accountName,
        bankDetails.iban,
        bankDetails.bic,
        bankDetails.bankName,
        taxId,
        registrationNumber,
        nameKassenwart
    ], function (err) {
        if (err) {
            console.error("Fehler beim Aktualisieren der Vereinsdaten:", err.message);
            return res.status(500).send("Datenbankfehler");
        }

        res.send("Vereinsdaten erfolgreich aktualisiert");
    });
});

module.exports = router;