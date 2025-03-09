// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'club.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Datenbank verbunden.');
        db.run(`
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
        db.run(`
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
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                salt TEXT NOT NULL,
                hash TEXT NOT NULL
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT
            )
        `);
        db.run(`INSERT OR IGNORE INTO roles (name, description) VALUES ('admin', 'Administrator');`);
        db.run(`INSERT OR IGNORE INTO roles (name, description) VALUES ('editor', 'Verwalter');`);
        // db.run(`INSERT OR IGNORE INTO roles (name, description) VALUES ('member', 'Mitglied');`);
        db.run(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT
            )
        `);
        db.run(`INSERT OR IGNORE INTO permissions (name, description) VALUES ('login', 'Darf sich einloggen');`);
        db.run(`INSERT OR IGNORE INTO permissions (name, description) VALUES ('create-user', 'Andere Benutzer erstellen');`);
        db.run(`INSERT OR IGNORE INTO permissions (name, description) VALUES ('list-user', 'Andere Benutzer auflisten');`);
        db.run(`INSERT OR IGNORE INTO permissions (name, description) VALUES ('delete-user', 'Andere Benutzer löschen');`);
        db.run(`INSERT OR IGNORE INTO permissions (name, description) VALUES ('edit-user', 'Andere Benutzer ändern');`);
        db.run(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (role_id) REFERENCES roles (id),
                PRIMARY KEY (user_id, role_id)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                FOREIGN KEY (role_id) REFERENCES roles (id),
                FOREIGN KEY (permission_id) REFERENCES permissions (id),
                PRIMARY KEY (role_id, permission_id)
            )
        `);
    }
});

module.exports = db;