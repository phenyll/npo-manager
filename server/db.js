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
    }
});

module.exports = db;