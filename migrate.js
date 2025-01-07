const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Verbindung zur bestehenden Datenbank
const dbPath = path.resolve(__dirname, "database", "club.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Fehler beim Verbinden mit der Datenbank:", err.message);
  } else {
    console.log("Datenbank erfolgreich verbunden.");
  }
});

// Migration: Spalten hinzufügen
const migrations = [
  /** example:
  {
    table: "payments",
    name: "paymentMethod",
    sql: "ALTER TABLE payments ADD COLUMN paymentMethod TEXT DEFAULT 'Bank';",
    defaultValue: "Bank",
  },*/
];

// Migration ausführen
db.serialize(() => {
  migrations.forEach(({ table, name, sql, defaultValue }) => {
    // Spalte hinzufügen
    db.run(sql, (err) => {
      if (err) {
        if (err.message.includes("duplicate column name")) {
          console.log(`[SKIP] Spalte ${name} existiert bereits in ${table}.`);
        } else {
          console.error(`[ERROR] Fehler beim Hinzufügen der Spalte ${name} in ${table}: ${err.message}`);
        }
      } else {
        console.log(`[ADD] Spalte ${name} erfolgreich hinzugefügt in ${table}.`);
      }
    });

    // Standardwerte setzen
    if (defaultValue !== null) {
      db.run(
        `UPDATE ${table} SET ${name} = ? WHERE ${name} IS NULL;`,
        [defaultValue],
        (err) => {
          if (err) {
            console.error(`[ERROR] Fehler beim Setzen der Standardwerte für ${name} in ${table}: ${err.message}`);
          } else {
            console.log(`[SET DEFAULT] Standardwert für ${name} in ${table} erfolgreich gesetzt.`);
          }
        }
      );
    }
  });
});

// Verbindung schließen
db.close((err) => {
  if (err) {
    console.error("Fehler beim Schließen der Datenbank:", err.message);
  } else {
    console.log("Migration abgeschlossen und Datenbank geschlossen.");
  }
});
