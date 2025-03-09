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

router.get("/users", (req, res) => {
    if (!req.session.rights.includes('list-user')) {
        res.status(403).send('Nicht autorisiert');
        return;
    }
    db.all("SELECT id, username FROM users", (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

router.post("/users", (req, res) => {
    if (!req.session.rights.includes('create-user')) {
        res.status(403).send('Nicht autorisiert');
        return;
    }

    const { username, password } = req.body;
    const salt = require('crypto').randomBytes(16).toString('hex');
    const hash = hashPassword(username, password, salt);

    if (username && password) {
        db.run("INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)", [username, salt, hash], function (err) {
            if (err) {
                console.error("SQL-Fehler beim Erstellen des Benutzers:", err.message);
                res.status(500).send(err.message);
            } else {
                db.run("INSERT INTO user_roles (user_id, role_id) VALUES (?, 3)", [this.lastID], function (err) {
                    console.log(`Benutzer ${username} erfolgreich erstellt mit ID ${this.lastID}`);
                    res.status(201).send(`Benutzer ${username} erfolgreich erstellt`);
                });
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

router.delete("/users/:id", (req, res) => {
    if (!req.session.rights.includes('delete-user')) {
        res.status(403).send('Nicht autorisiert');
        return;
    }
    const { id } = req.params;

    // niemand darf sich selbst löschen
    if (id === req.session.user) {
        res.status(403).send('Nicht autorisiert');
        return;
    }

    // niemand darf den Admin löschen
    if (id === 1) {
        res.status(403).send('Nicht autorisiert');
        return
    }

    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
        if (err) {
            res.status(500).send(err.message);
        } else if (this.changes > 0) {
            db.run("DELETE FROM user_roles WHERE user_id = ?", [id], function (err) {
                if (err) {
                    res.status(500).send(err.message);
                    return;
                }
                res.send(`Benutzer mit ID ${id} erfolgreich gelöscht`);
            });
        } else {
            res.status(404).send(`Benutzer mit ID ${id} nicht gefunden`);
        }
    });
});

router.put("/users/me/password", (req, res) => {
    if (!req.session.user) {
        return res.status(401).sendFile(path.join(__dirname, '../public', '401.html'));
    }

    const { oldPassword, newPassword } = req.body;
    const username = req.session.user;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error("SQL-Fehler beim Abrufen des Benutzers:", err.message);
            return res.status(500).send(err.message);
        }

        if (!row) {
            return res.status(404).send("Benutzer nicht gefunden.");
        }

        const hash = hashPassword(username, oldPassword, row.salt);
        if (row.hash === hash) {
            // Altes Passwort stimmt, neues Passwort hashen und speichern
            const newSalt = require('crypto').randomBytes(16).toString('hex');
            const newHash = hashPassword(username, newPassword, newSalt);

            db.run("UPDATE users SET salt = ?, hash = ? WHERE username = ?", [newSalt, newHash, username], function (err) {
                if (err) {
                    console.error("SQL-Fehler beim Aktualisieren des Passworts:", err.message);
                    return res.status(500).send(err.message);
                }

                console.log(`Passwort erfolgreich geändert für Benutzer: ${username}`);
                res.send("Passwort erfolgreich geändert");
            });
        } else {
            console.log(`Passwort ändern fehlgeschlagen, Passwort falsch für Benutzer ${username}`);
            res.status(400).send("Falsches Passwort");
        }
    });
});

// user.js
// Alle Benutzer mit ihren Rollen abrufen
router.get("/users-with-roles", (req, res) => {
    if (!req.session.rights.includes('list-user')) {
        res.status(403).send('Nicht autorisiert');
        return;
    }
    db.all(`
        SELECT 
            users.id, 
            users.username, 
            roles.name AS role 
        FROM users
        LEFT JOIN user_roles ON users.id = user_roles.user_id
        LEFT JOIN roles ON user_roles.role_id = roles.id
    `, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.json(rows);
    });
});

// Rolle eines Benutzers aktualisieren
router.put("/users/:id/role", (req, res) => {
    if (!req.session.rights.includes('edit-user')) {
        res.status(403).send('Nicht autorisiert');
        return;
    }
    const { id } = req.params;
    const { role } = req.body;

    // Überprüfe, ob die Rolle gültig ist
    const validRoles = ['admin', 'editor', 'none'];
    if (!validRoles.includes(role)) {
        return res.status(400).send("Ungültige Rolle");
    }

    // Hole die Rollen-ID aus der Datenbank
    db.get("SELECT id FROM roles WHERE name = ?", [role], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }

        if (!row) {
            return res.status(404).send("Rolle nicht gefunden");
        }

        const roleId = row.id;

        // Aktualisiere die Rolle des Benutzers in der user_roles Tabelle
        db.run(`
            REPLACE INTO user_roles (user_id, role_id)
            VALUES (?, ?)
        `, [id, roleId], function (err) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.send(`Benutzerrolle für Benutzer mit ID ${id} erfolgreich aktualisiert`);
        });
    });
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
                    db.all(`
                                SELECT permissions.name
                                FROM users
                                         JOIN user_roles ON users.id = user_roles.user_id
                                         JOIN roles ON user_roles.role_id = roles.id
                                         JOIN role_permissions ON roles.id = role_permissions.role_id
                                         JOIN permissions ON role_permissions.permission_id = permissions.id
                                WHERE users.username = ?
                    `, [username], (err, rows) => {
                            if (err) {
                                console.error("SQL-Fehler beim Abrufen der Berechtigungen:", err.message);
                                res.status(500).redirect('/login');
                            } else {
                                req.session.rights = rows.map(row => row.name);
                                if(!req.session.rights.includes('login')){
                                    req.session.destroy();
                                    res.status(401).redirect('/login');
                                } else {
                                    res.status(307).redirect('/main');
                                }
                            }
                        }
                    )
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