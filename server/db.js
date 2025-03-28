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
                
                // Add new table for reminder history
                await runAsync(`
                    CREATE TABLE IF NOT EXISTS reminder_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        payment_id INTEGER NOT NULL,
                        reminder_date DATE NOT NULL,
                        reminder_method TEXT NOT NULL,
                        reminder_notes TEXT,
                        created_by TEXT,
                        FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
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

                await runAsync(`
                    CREATE TABLE IF NOT EXISTS organization_details (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        name TEXT NOT NULL,
                        address TEXT,
                        email TEXT,
                        phone TEXT,
                        website TEXT,
                        account_name TEXT,
                        iban TEXT,
                        bic TEXT,
                        bank_name TEXT,
                        tax_id TEXT,
                        registration_number TEXT,
                        name_kassenwart TEXT
                    )
                `);

                await runAsync(`
                    CREATE TABLE IF NOT EXISTS email_settings (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      smtpHost TEXT NOT NULL,
                      smtpPort INTEGER NOT NULL,
                      secure INTEGER DEFAULT 1,
                      username TEXT NOT NULL,
                      password TEXT NOT NULL,
                      defaultSender TEXT
                    );
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

                // Check if organization details exist, if not insert default values
                const orgDetails = await getAsync(`SELECT * FROM organization_details WHERE id = 1`);
                    if (!orgDetails) {
                        console.log('Organization details werden erstellt');
                        await runAsync(`
                            INSERT INTO organization_details (id, name, address, email, phone, website,
                                                              account_name, iban, bic, bank_name,
                                                              tax_id, registration_number, name_kassenwart)
                            VALUES (1,
                                    'Mein toller Demo-Förderverein e.V.',
                                    '00000 Super-Ort',
                                    'toller-verein@grundschule-super-ort.de',
                                    '012345/12345678',
                                    'www.grundschule-super-ort.de',
                                    'Schulförderverein',
                                    'DE00 0000 0000 0000 0000 99',
                                    'ABCDEFH9JXX',
                                    'Sparkasse Super-Ort',
                                    '',
                                    'VR 999009',
                                    'Bart Kasenwart')
                        `);
                    }

                console.log('Datenbank initialisiert.');

            } catch (error) {
                console.error('Fehler beim Erstellen der Tabellen:', error);
            }
        };

        createTables();
    }
});

module.exports = db;
