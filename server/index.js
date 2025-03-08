// server/index.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const db = require('./db'); // Datenbankverbindung importieren
const paymentRoutes = require('./payment');
const memberRoutes = require('./member');
const userRoutes = require('./user');
const { isAuthenticated, logRequest } = require('./middleware');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(logRequest);

// Middleware für Datei-Uploads
const upload = multer({ dest: "uploads/" });

app.use(session({
    secret: 'qp47flzrqblciuvbaoqrzblqWAERBSTOAIRNVY LI<BARUAÖuaruöARUHGSEURÖbalrhfbvlsiearbvajbrl<', // Ändere dies zu einem sicheren geheimen Schlüssel
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setze auf true, wenn HTTPS verwendet wird
}));

// Login-Seite
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Login-Handler
app.post('/authenticate', (req, res) => {
    userRoutes.login(req, res);
});

// Logout-Handler
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Schütze die Routen
app.use(isAuthenticated);

// API Endpunkte verwenden
app.use('/payments', paymentRoutes);
app.use('/members', memberRoutes.router);
app.use('/', userRoutes.router);

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

module.exports = { app };