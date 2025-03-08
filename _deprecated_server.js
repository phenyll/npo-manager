const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(logRequest);

// Datenbank initialisieren
const dbPath = path.resolve(__dirname, "database", "club.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Fehler beim Öffnen der Datenbank:", err.message);
  } else {
    console.log("Datenbank verbunden.");
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
        autoExit DATE
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
    // users table with username, salt, hash
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

// Middleware für Datei-Uploads
const upload = multer({ dest: "uploads/" });

app.use(session({
    secret: 'qp47flzrqblciuvbaoqrzblqWAERBSTOAIRNVY LI<BARUAÖuaruöARUHGSEURÖbalrhfbvlsiearbvajbrl<', // Ändere dies zu einem sicheren geheimen Schlüssel
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setze auf true, wenn HTTPS verwendet wird
}));

// Middleware zur Überprüfung der Authentifizierung
function isAuthenticated(req, res, next) {
    if (req.session.user || req.path === '/login' || req.path === '/authenticate') {
        return next();
    } else {
        res.status(401).send('Nicht authentifiziert');
    }
}

function logRequest(req, res, next) {
    // apache-style logging, mit response time, length und status code
    console.log(`[${new Date().toISOString()}] ${req.method} - ${req.path} - ${req.ip} - ${res.statusCode}`);
    next();
}

// Login-Seite
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Login-Handler
app.post('/authenticate', (req, res) => {
    const { username, password } = req.body;
    // Überprüfe die Anmeldedaten (hier ein einfaches Beispiel)
    if (username){
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error("SQL-Fehler beim Abrufen des Benutzers:", err.message);
                res.status(500).redirect('/login');
            } else if (row) {
                // Überprüfe das Passwort
                const hash = hashPassword(username, password, row.salt);
                if (row.hash === hash) {
                    console.log('Anmeldung erfolgreich');
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
});

function hashPassword(username, password, salt) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update
    (username + password + salt).digest
    ('hex');
}

// Logout-Handler
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Schütze die Routen
app.use(isAuthenticated);

// API: Benutzer abrufen
app.get("/users/me", (req, res) => {
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

// API: Mitglieder abrufen
app.get("/members", (req, res) => {
  db.all("SELECT * FROM members", [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ members: rows });
    }
  });
});

// API: Mitglied hinzufügen
app.post("/members", (req, res) => {
    const {
      firstName,
      lastName,
      city,
      email,
      phone,
      childName,
      enrollmentYear,
      joinDate,
      expectedExitDate,
      autoExit,
    } = req.body;
  
    db.run(
      `INSERT INTO members (firstName, lastName, city, email, phone, childName, enrollmentYear, joinDate, expectedExitDate, actualExit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        city,
        email,
        phone,
        childName,
        enrollmentYear,
        joinDate,
        expectedExitDate,
        autoExit,
      ],
      function (err) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(201).json({ id: this.lastID });
        }
      }
    );
  });
  

// API: Beiträge abrufen
// API: Beiträge abrufen
app.get("/payments", (req, res) => {
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
  

// API: Beitrag hinzufügen
app.post("/payments", (req, res) => {
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
  

// API: Excel-Import
app.post("/import-members", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("Keine Datei hochgeladen.");
  }

  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const sheetData = xlsx.utils.sheet_to_json(sheet);

  let maxId = 0;

  db.serialize(() => {
    // Get the current max ID from the database
    db.get("SELECT MAX(id) as maxId FROM members", (err, row) => {
      if (err) {
        console.error("Fehler beim Abrufen der max ID:", err.message);
      } else {
        maxId = row.maxId || 0;

        const stmt = db.prepare(
          `
            INSERT INTO members (
              id,
              firstName,
              lastName,
              city,
              email,
              phone,
              childName,
              enrollmentYear,
              joinDate,
              expectedExitDate,
              autoExit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
        );

        sheetData.forEach((row) => {
          const id = row["Nr."] || ++maxId;
          const firstName = row["Vorname"] || "Unbekannt"; // Standardwert setzen
          const lastName = row["Nachname"];
          if (!lastName) {
            console.log("Zeile übersprungen, da Nachname fehlt.");
            return;
          }
          const city = row["Ort"];
          const email = row["E-Mail"];
          const phone = row["Telefon"];
          const childName = row["Kind"];
          const enrollmentYear = row["Einschulung"];
          
          const joinDate = convertExcelDate(row["Eintrittsdatum"]);
          const expectedExitDate = convertExcelDate(row["Voraussichtlicher Austritt"]);
          const autoExit = convertExcelDate(row["Austritt (ja)"]);

          stmt.run(
            id,
            firstName,
            lastName,
            city,
            email,
            phone,
            childName || null,
            enrollmentYear || null,
            joinDate,
            expectedExitDate,
            autoExit,
            (err) => {
              if (err) {
                console.error("Fehler beim Importieren in 'members':", err.message);
              }
            }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error("Fehler beim Finalisieren des Statements:", err.message);
            return res.status(500).send("Fehler beim Importieren der Mitglieder.");
          } else {
            console.log("Mitglieder erfolgreich importiert.");
            return res.status(200).send("Mitglieder erfolgreich importiert.");
          }
        });
      }
    });
  });

  fs.unlink(file.path, (err) => {
    if (err) {
      console.error("Fehler beim Löschen der hochgeladenen Datei:", err.message);
    }
  });
});

function convertExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    if (excelDate >= 1000 && excelDate <= 9999) {
      // Wenn die Zahl eine 4-stellige Jahreszahl ist
      return `${excelDate}-12-31`;
    } else {
      // Wenn die Zahl ein Excel-Datum ist
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
  } else if (typeof excelDate === 'string') {
    if (/^\d{4}$/.test(excelDate)) {
      // Wenn die Zelle nur eine Jahreszahl enthält
      const year = parseInt(excelDate, 10);
      return `${year}-12-31`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
      // Wenn die Zelle ein Datum im Format YYYY-MM-DD enthält
      return excelDate;
    } else {
      const date = new Date(excelDate);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
  } else {
    return null;
  }
}
  
  // API: Einzelnes Mitglied abrufen
  app.get("/members/:id", (req, res) => {
    db.get("SELECT * FROM members WHERE id = ?", [req.params.id], (err, row) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json(row);
      }
    });
  });
  

  // API: Mitgliedsdaten aktualisieren
  app.put("/members/:id", (req, res) => {
    const {
      firstName,
      lastName,
      city,
      email,
      phone,
      childName,
      enrollmentYear,
      joinDate,
      expectedExitDate,
      autoExit,
    } = req.body;
  
    db.run(
      `UPDATE members
       SET firstName = ?, lastName = ?, city = ?, email = ?, phone = ?, childName = ?, enrollmentYear = ?, joinDate = ?, expectedExitDate = ?, actualExit = ?
       WHERE id = ?`,
      [
        firstName,
        lastName,
        city,
        email,
        phone,
        childName,
        enrollmentYear,
        joinDate,
        expectedExitDate,
        autoExit,
        req.params.id,
      ],
      function (err) {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.json({ message: "Mitglied aktualisiert", changes: this.changes });
        }
      }
    );
  });
  

// API: Beitragsforderungen für ein Jahr anlegen
app.post("/payments/create-bulk", (req, res) => {
    const { year, amount } = req.body;
  
    // Finde alle aktiven Mitglieder (nicht ausgetreten)
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
  
// API: Einzelnen Beitrag abrufen
app.get("/payments/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM payments WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.json(row);
      }
    });
  });
  
  // API: Beitrag aktualisieren
  app.put("/payments/:id", (req, res) => {
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
  
  
  // API: Beitrag als bezahlt markieren
app.put("/payments/:id/pay", (req, res) => {
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

  // API: Export offene Beiträge
app.get("/export-open-payments", (req, res) => {
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
  
        const filePath = path.join(__dirname, "uploads", "offene_beitraege.xlsx");
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
  

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
