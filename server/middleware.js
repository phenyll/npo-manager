// server/middleware.js
function isAuthenticated(req, res, next) {
    if (req.session.user || req.path === '/login' || req.path === '/authenticate') {
        return next();
    } else {
        res.status(401).send('Nicht authentifiziert');
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