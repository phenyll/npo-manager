# GitHub Copilot Instruktionen

**Sprache:** Alle Kommentare, Dokumentation und Commit-Nachrichten auf **Deutsch**.

## Projektkontext
Dies ist eine Vereinsverwaltung für Fußballverein Schlöben mit:
- Mitgliederverwaltung
- Dokumentenupload
- Benutzerrollen und -berechtigungen
- Zahlungsabwicklung
- E-Mail-Funktionalität

## Tech Stack
- **Frontend:** Vue.js + Quasar Framework
- **Backend:** Node.js mit Express
- **Datenbank:** SQLite
- **Tests:** Cypress
- **Deployment:** Docker Compose
- **Session Management:** express-session
- **Upload:** multer

## Code-Prinzipien
- **Einzelne Verantwortlichkeit:** Eine Funktion = eine Aufgabe
- **Dokumentation:** Kommentiere komplexe Logik auf Deutsch
- **DRY:** Keine Code-Duplikate
- **KISS:** Einfachheit vor Cleverness
- **TDD:** Test zuerst, dann implementieren
- **YAGNI:** Nur implementieren was nötig ist
- **Sicherheit:** Immer Input-Validierung und SQL-Injection-Schutz

## Coding-Standards
- Verwende `const` und `let` statt `var`
- Async/await statt Promise.then()
- Deutschsprachige Variablen- und Funktionsnamen wo sinnvoll
- Konsistente Fehlerbehandlung mit try/catch
- Logging für wichtige Operationen

## Beispiel-Struktur
```javascript
// Benutzer-Authentifizierung prüfen
const benutzerPruefen = async (benutzername, passwort) => {
    try {
        // Eingaben validieren
        if (!benutzername || !passwort) {
            throw new Error('Benutzername und Passwort sind erforderlich');
        }
        
        // Datenbankabfrage mit Prepared Statement
        const benutzer = await db.get(
            'SELECT * FROM benutzer WHERE benutzername = ?', 
            [benutzername]
        );
        
        return benutzer;
    } catch (fehler) {
        console.error('Fehler bei Benutzerprüfung:', fehler.message);
        throw fehler;
    }
};
```

## Commit-Nachrichten
**Immer auf Deutsch** mit Struktur: `Kurzbeschreibung der Änderung (Zweck/Issue-Ref)`

Beispiele:
- `Benutzer-Authentifizierung implementiert – Login-System (#42)`
- `SQL-Injection Schwachstelle behoben – Sicherheit`
- `Mitglieder-Upload-Funktionalität erweitert – Dokumentenverwaltung`

## Ziel
Code immer besser hinterlassen als vorgefunden.