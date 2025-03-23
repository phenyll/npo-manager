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
const organizationRouter = require('./organization');
const { isAuthenticated, logRequest } = require('./middleware');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, '../static'), { extensions: ['html', 'js', 'css']}));
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

// Registrierungsseite
app.get('/create-user', (req, res) => {
    if (!req.session.rights.includes('create-user')) {
        res.status(403).sendFile(path.join(__dirname, '../public', '403.html'));
        return;
    }

    res.sendFile(path.join(__dirname, '../public', 'createUser.html'));
});

app.get('/user-list', (req, res) => {
    if (!req.session?.rights?.includes('list-user')) {
        res.status(403).sendFile(path.join(__dirname, '../public', '403.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public', 'userList.html'));
    }
});

app.get('/edit-user-permissions', (req, res) => {
    if (!req.session?.rights?.includes('edit-user')) {
        res.status(403).sendFile(path.join(__dirname, '../public', '403.html'));
        return;
    }
    res.sendFile(path.join(__dirname, '../public', 'editUserPermissions.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Login-Handler
app.post('/authenticate', (req, res) => {
    userRoutes.login(req, res);
});

app.get('/change-password', (req, res) => {
    if (!req.session.user) {
        return res.status(401).sendFile(path.join(__dirname, '../public', '401.html'));
    }
    res.sendFile(path.join(__dirname, '../public', 'changePassword.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/statistics', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'statistics.html'));
});

// Globale Authentifizierungs-Middleware
app.use((req, res, next) => {
    if (!req.session.user && req.url !== '/' && req.url !== '/login' && req.url !== '/authenticate') {
        return res.status(401).sendFile(path.join(__dirname, '../public', '401.html'));
    }
    next();
});

// Schütze die Routen
app.use(isAuthenticated);

// API Endpunkte verwenden
app.use('/payments', paymentRoutes);
app.use('/members', memberRoutes.router);
app.use('/organization', organizationRouter);
app.use('/', userRoutes.router);

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

module.exports = { app };