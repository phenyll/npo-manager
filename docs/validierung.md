# ✅ Validierungscheckliste - Mahnung-Funktionalität

## Vor der Produktivnutzung zu testen:

### 1. Frontend-Tests in der Mitgliederliste
- [ ] **Schaltfläche 📮 sichtbar:** Nur bei Mitgliedern mit offenen Beiträgen angezeigt
- [ ] **Schaltfläche 📮 nicht sichtbar:** Bei Mitgliedern ohne offene Beiträge
- [ ] **Tooltip funktioniert:** Beim Hover über 📮 erscheint "Mahnung per E-Mail senden"

### 2. Dialog-Workflow testen
- [ ] **Erster Dialog:** "Ausscheiden aus Verein ankündigen?" erscheint
- [ ] **JA-Option:** Führt zu Ausschluss-E-Mail-Template
- [ ] **NEIN-Option:** Führt zu Standard-Mahnung-Template
- [ ] **Abbrechen-Option:** Bricht Vorgang ab

### 3. E-Mail-Versendung testen
- [ ] **Server-E-Mail-Versand:** E-Mail wird über konfigurierten SMTP-Server versendet
- [ ] **Erfolgs-Meldung:** Bestätigung mit Empfänger, Anzahl Beiträge und Gesamtbetrag
- [ ] **Betreff korrekt:** "Mahnung - Offene Mitgliedsbeiträge" oder mit "Ausschluss-Ankündigung"
- [ ] **Template-Inhalt:** Alle offenen Beiträge werden aufgelistet
- [ ] **Kontodetails:** Werden aus E-Mail-Einstellungen übernommen
- [ ] **Ausschluss-Text:** Erscheint nur bei JA-Option im ersten Dialog
- [ ] **Fehlerbehandlung:** Bei E-Mail-Fehlern wird entsprechende Meldung angezeigt

### 4. Zweiter Dialog-Workflow
- [ ] **Dialog erscheint:** "Mahnung in Datenbank hinterlegen?" nach erfolgreichem E-Mail-Versand
- [ ] **JA-Option:** Mahnung wird bei allen offenen Beiträgen vermerkt
- [ ] **NEIN-Option:** Keine Mahnung wird hinterlegt (E-Mail wurde trotzdem versendet)

### 5. Auto-Austritt-Funktion
- [ ] **Wird gesetzt:** Wenn Ausschluss-Ankündigung gewählt wurde
- [ ] **Datum korrekt:** 30.08.2025 (aktuelles Jahr)
- [ ] **Feld aktualisiert:** "Austritt automatisch am" in Mitgliederliste
- [ ] **Filter funktioniert:** "Auto-Austritt: Ja" zeigt betroffene Mitglieder

### 6. Historien-Einträge
- [ ] **Eintrag erstellt:** Neuer Eintrag in Mitglieder-Historie
- [ ] **Kategorie korrekt:** "✉️ Korrespondenz"
- [ ] **Inhalt vollständig:** Alle getroffenen Entscheidungen dokumentiert
- [ ] **Zeitstempel:** Aktuelles Datum und Uhrzeit
- [ ] **Benutzer:** Angemeldeter Benutzer wird vermerkt

### 7. Backend-API-Tests
- [ ] **E-Mail-Versand-API:** `POST /members/:id/send-dunning-email` funktioniert
- [ ] **Mahnung-Hinterlegung-API:** `POST /members/:id/dunning` funktioniert
- [ ] **SMTP-Konfiguration:** E-Mail-Server ist korrekt konfiguriert
- [ ] **Fehlerbehandlung:** Fehlermeldungen werden korrekt angezeigt

### 8. Integration mit bestehenden Funktionen
- [ ] **Filter-Funktionalität:** Alle Filter funktionieren weiterhin
- [ ] **Statistiken:** Summenbereich zeigt korrekte Werte
- [ ] **Export-Funktion:** Excel-Export funktioniert weiterhin
- [ ] **Mitglieder-Bearbeitung:** Keine Konflikte mit bestehenden Funktionen

### 9. Sicherheit und Validierung
- [ ] **Berechtigung:** Nur angemeldete Benutzer können Funktion nutzen
- [ ] **Input-Validierung:** Ungültige Mitgliedsnummern werden abgefangen
- [ ] **Fehlerbehandlung:** Datenbankfehler werden korrekt behandelt
- [ ] **Session-Schutz:** Keine unbefugten API-Aufrufe möglich

### 10. Browser-Kompatibilität
- [ ] **Chrome:** Alle Funktionen arbeiten korrekt
- [ ] **Firefox:** Alle Funktionen arbeiten korrekt
- [ ] **Safari:** Alle Funktionen arbeiten korrekt
- [ ] **Edge:** Alle Funktionen arbeiten korrekt

### 11. Spezielle Testfälle
- [ ] **Mitglied ohne E-Mail:** E-Mail wird nicht versendet, entsprechende Fehlermeldung
- [ ] **Mitglied ohne offene Beiträge:** Schaltfläche nicht sichtbar
- [ ] **E-Mail-Einstellungen leer:** Fehlermeldung bei E-Mail-Versand
- [ ] **SMTP-Server nicht erreichbar:** Entsprechende Fehlermeldung
- [ ] **Mehrfache Mahnung:** Bereits vorhandene Mahnungen werden berücksichtigt

### 12. Performance-Tests
- [ ] **Große Mitgliederliste:** Funktionalität bleibt performant
- [ ] **Viele offene Beiträge:** E-Mail-Template wird korrekt generiert
- [ ] **Gleichzeitige Benutzer:** Keine Konflikte bei paralleler Nutzung

## Bekannte Einschränkungen:
- ⚠️ **E-Mail-Konfiguration erforderlich:** SMTP-Server muss korrekt konfiguriert sein
- ⚠️ **Abhängigkeit von E-Mail-Einstellungen:** Kontodetails müssen in den E-Mail-Einstellungen gepflegt sein
- ⚠️ **Keine Test-Daten:** Bei Tests mit echten Mitgliedern werden echte E-Mails versendet

## Bei Problemen prüfen:
1. **Browser-Konsole:** Auf JavaScript-Fehler überprüfen
2. **Netzwerk-Tab:** API-Aufrufe auf Fehler prüfen
3. **Server-Logs:** Backend-Fehler und SMTP-Probleme in der Konsole suchen
4. **E-Mail-Einstellungen:** SMTP-Konfiguration in der Anwendung überprüfen
5. **Datenbank:** SQLite-Datei auf Korruption prüfen

---
**Stand:** 2. Juli 2025  
**Erstellt für:** Fußballverein Schlöben Vereinsverwaltung
