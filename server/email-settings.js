const express = require('express');
const router = express.Router();
const db = require('./db');
const nodemailer = require('nodemailer');
const path = require('path');

// Get email settings HTML page
router.get('/', (req, res) => {
  // Check if requesting JSON format specifically
  const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');

  if (wantsJson) {
    // Return JSON data if explicitly requested
    db.get("SELECT smtpHost, smtpPort, secure, username, password, defaultSender FROM email_settings LIMIT 1", (err, settings) => {
      if (err) {
        console.error("Error loading email settings:", err);
        return res.status(500).json({ success: false, message: err.message });
      }

      res.json({ success: true, settings: settings || {} });
    });
  } else {
    // Otherwise serve the HTML page
    res.sendFile(path.join(__dirname, '../public/email-settings.html'));
  }
});

// API endpoint to get settings as JSON
router.get('/data', (req, res) => {
  db.get("SELECT smtpHost, smtpPort, secure, username, password, defaultSender FROM email_settings LIMIT 1", (err, settings) => {
    if (err) {
      console.error("Error loading email settings:", err);
      return res.status(500).json({ success: false, message: err.message });
    }

    res.json({ success: true, settings: settings || {} });
  });
});

// Save email settings
router.post('/', (req, res) => {
  const { smtpHost, smtpPort, secure, username, password, defaultSender } = req.body;

  if (!smtpHost || !smtpPort || !username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  db.get("SELECT COUNT(*) as count FROM email_settings", (err, result) => {
    if (err) {
      console.error("Error checking email settings:", err);
      return res.status(500).json({ success: false, message: err.message });
    }

    if (result.count === 0) {
      // Insert new settings
      db.run(
        "INSERT INTO email_settings (smtpHost, smtpPort, secure, username, password, defaultSender) VALUES (?, ?, ?, ?, ?, ?)",
        [smtpHost, smtpPort, secure, username, password, defaultSender],
        function(err) {
          if (err) {
            console.error("Error saving email settings:", err);
            return res.status(500).json({ success: false, message: err.message });
          }

          res.json({ success: true, message: "Email settings saved" });
        }
      );
    } else {
      // Update existing settings
      db.run(
        "UPDATE email_settings SET smtpHost = ?, smtpPort = ?, secure = ?, username = ?, password = ?, defaultSender = ?",
        [smtpHost, smtpPort, secure, username, password, defaultSender],
        function(err) {
          if (err) {
            console.error("Error updating email settings:", err);
            return res.status(500).json({ success: false, message: err.message });
          }

          res.json({ success: true, message: "Email settings updated" });
        }
      );
    }
  });
});

// Test connection
router.post('/test', (req, res) => {
  const { smtpHost, smtpPort, secure, username, password } = req.body;

  if (!smtpHost || !smtpPort || !username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: secure === 1,
    auth: {
      user: username,
      pass: password
    }
  });

  transporter.verify((error) => {
    if (error) {
      console.error("SMTP verification error:", error);
      res.json({ success: false, message: error.message });
    } else {
      res.json({ success: true, message: "Connection successful" });
    }
  });
});

module.exports = router;