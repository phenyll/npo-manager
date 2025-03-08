// user.js
const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const db = require('./db');

function hashPassword(username, password, salt) {
    return crypto.createHash('sha256').update
    (username + password + salt).digest
    ('hex');
}

router.post("/users", (req, res) => {
    const { username, password } = req.body;
    const salt = require('crypto').randomBytes(16).toString('hex');
    const hash = hashPassword(username, password, salt);

    if (username && password) {
        db.run("INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)", [username, salt, hash], function (err) {
            if (err) {
                console.error("SQL-Fehler beim Erstellen des Benutzers:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log(`Benutzer ${username} erfolgreich erstellt mit ID ${this.lastID}`);
                res.status(201).send(`Benutzer ${username} erfolgreich erstellt`);
            }
        })
    }
});

router.get("/users/me", (req, res) => {
    db.get("SELECT id, username FROM users WHERE username = ?", [req.session.user], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else if (!row) {
            res.status(404).send("Benutzer nicht gefunden.");
        } else {
            res.json({username: row.username});
        }
    })
});

function login(req, res) {
    const { username, password } = req.body;
    if (username) {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error("SQL-Fehler beim Abrufen des Benutzers:", err.message);
                res.status(500).redirect('/login');
            } else if (row) {
                const hash = hashPassword(username, password, row.salt);
                if (row.hash === hash) {
                    console.log('Anmeldung erfolgreich für Benutzer:', username);
                    req.session.user = username;
                    res.status(307).redirect('/');
                } else {
                    console.log(`Anmeldung fehlgeschlagen, Passwort falsch für Benutzer ${username}, versuchte hash '${hash}'`);
                    res.status(401).redirect('/login');
                }
            } else {
                console.log('Anmeldung fehlgeschlagen, Benutzer nicht gefunden:', username);
                res.status(401).redirect('/login');
            }
        })
    }
}

module.exports = {router, login};