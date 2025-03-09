// server/middleware.js
const path = require("path");

function isAuthenticated(req, res, next) {
    if (req.session.user || req.path === '/login' || req.path === '/authenticate' || req.path.startsWith('/static')) {
        return next();
    } else {
        res.status(401).sendFile(path.join(__dirname, '../public', '401.html'));
    }
}

function logRequest(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} - ${req.path} - ${req.ip} - ${res.statusCode}`);
    next();
}

module.exports = {
    isAuthenticated,
    logRequest
};