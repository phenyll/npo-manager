// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'club.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Datenbank verbunden.');
        // Funktion zum Ausführen von SQL-Abfragen als Promise
        const runAsync = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('SQL-Fehler:', sql, err.message);
                        reject(err);
                    } else {
                        resolve(this);
                    }
                });
            });
        };

        // Funktion zum Ausführen von SQL-Abfragen als Promise
        const getAsync = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, function (err, row) {
                    if (err) {
                        console.error('SQL-Fehler:', sql, err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        };

        // Tabellen erstellen
        const createTables = async () => {
            try {
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS members (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        firstName TEXT NOT NULL,
                        lastName TEXT NOT NULL,
                        city TEXT,
                        email TEXT,
                        phone TEXT,
                        childName TEXT,
                        enrollmentYear INTEGER,
                        joinDate DATE,
                        expectedExitDate DATE,
                        autoExit DATE,
                        actualExit DATE
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS payments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        memberId INTEGER NOT NULL,
                        year INTEGER NOT NULL,
                        paymentDate DATE,
                        amount REAL NOT NULL,
                        status TEXT,
                        paymentMethod TEXT DEFAULT 'Bank',
                        FOREIGN KEY (memberId) REFERENCES members (id)
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        hash TEXT NOT NULL
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS roles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL,
                        description TEXT
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS permissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL,
                        description TEXT
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS user_roles (
                        user_id INTEGER NOT NULL,
                        role_id INTEGER NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (role_id) REFERENCES roles (id),
                        PRIMARY KEY (user_id) -- Ein Benutzer kann nur eine Rolle haben
                    )
                `);
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS role_permissions (
                        role_id INTEGER NOT NULL,
                        permission_id INTEGER NOT NULL,
                        FOREIGN KEY (role_id) REFERENCES roles (id),
                        FOREIGN KEY (permission_id) REFERENCES permissions (id),
                        PRIMARY KEY (role_id, permission_id)
                    )
                `);

                // Standardrollen und -berechtigungen
                await runAsync(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (1, 'admin', 'Administrator');`);
                await runAsync(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (2, 'editor', 'Verwalter');`);
                await runAsync(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (3, 'none', 'Keine bestimmte Rolle');`);
                await runAsync(`INSERT OR IGNORE INTO permissions (id, name, description) VALUES (1, 'login', 'Darf sich einloggen');`);
                await runAsync(`INSERT OR IGNORE INTO permissions (id, name, description) VALUES (2, 'create-user', 'Andere Benutzer erstellen');`);
                await runAsync(`INSERT OR IGNORE INTO permissions (id, name, description) VALUES (3, 'list-user', 'Andere Benutzer auflisten');`);
                await runAsync(`INSERT OR IGNORE INTO permissions (id, name, description) VALUES (4, 'delete-user', 'Andere Benutzer löschen');`);
                await runAsync(`INSERT OR IGNORE INTO permissions (id, name, description) VALUES (5, 'edit-user', 'Andere Benutzer ändern');`);

                // Standardbenutzer anlegen, wenn dieser nicht existiert
                const admin = await getAsync(`SELECT * FROM users WHERE id = 1`);
                if (admin) {
                    console.log('Admin existiert bereits');
                } else {
                    console.log('Admin wird erstellt');
                    await runAsync(`INSERT OR IGNORE INTO users (id, username, salt, hash) VALUES (1, 'admin', '81dc4eb6a1928d496298430039c84bf8', '75e4dc687ed0f5b6d26c57b45fd7a0931e9c0a5ba8a079bd91edbb0efd22f96d');`);
                }

                // Admin darf alles
                await runAsync(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);`); // Erster Nutzer ist Admin
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 1);`); //einloggen
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 2);`); //Benutzer erstellen
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 3);`); //Benutzer auflisten
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 4);`); //Benutzer löschen
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 5);`); //Benutzer ändern
                // Editor darf nur Benutzer auflisten
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 1);`); //einloggen
                await runAsync(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 3);`); //Benutzer auflisten

                console.log('Datenbank initialisiert.');

            } catch (error) {
                console.error('Fehler beim Erstellen der Tabellen:', error);
            }
        };

        createTables();
    }
});

module.exports = db;