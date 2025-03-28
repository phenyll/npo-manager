// server/email.js
const nodemailer = require('nodemailer');
const db = require('./db');

// Create transporter (configure once during application startup)
let transporter = null;

// Initialize email settings from database
function initializeTransporter() {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM email_settings LIMIT 1", [], (err, settings) => {
      if (err) {
        console.error("Error loading email settings:", err);
        return reject(err);
      }

      if (!settings) {
        console.warn("No email settings found in database");
        return resolve(null);
      }

      transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.secure === 1,
        auth: {
          user: settings.username,
          pass: settings.password
        }
      });

      resolve(transporter);
    });
  });
}

// Send reminder email
async function sendReminderEmail(memberId, paymentId, year) {
  // Get member and organization details
  try {
    if (!transporter) {
      await initializeTransporter();
      if (!transporter) {
        throw new Error("Email transporter not configured");
      }
    }

    const member = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM members WHERE id = ?", [memberId], (err, member) => {
        if (err) reject(err);
        else resolve(member);
      });
    });

    const organization = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM organization_details LIMIT 1", [], (err, org) => {
        if (err) reject(err);
        else resolve(org);
      });
    });

    const payment = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM payments WHERE id = ?", [paymentId], (err, payment) => {
        if (err) reject(err);
        else resolve(payment);
      });
    });

    if (!member.email) {
      throw new Error("Member has no email address");
    }

    // Build email content
    const mailContent = `
<p>Liebes Mitglied des Schulfördervereins,</p>

<p>wir hoffen, dass es Ihnen gut geht und Sie das vergangene Jahr gut überstanden haben. Wir möchten Sie daran erinnern, dass der <strong>jährliche Mitgliedsbeitrag in Höhe von nur ${payment.amount} Euro für das Jahr ${year} noch offen</strong> ist. Mit Ihrem Beitrag unterstützen Sie unsere Schule und tragen dazu bei, dass wir weiterhin wertvolle Projekte und Aktivitäten für unsere Schülerinnen und Schüler anbieten können.</p>

<p>Um Ihnen die Zahlung so einfach wie möglich zu machen, haben wir folgende Optionen für Sie vorbereitet:</p>

<ol>
  <li><strong>Überweisung:</strong> Bitte überweisen Sie den Betrag von ${payment.amount} Euro auf folgendes Konto:<br>
  Kontoinhaber: ${organization.name}<br>
  IBAN: ${organization.iban}<br>
  BIC: ${organization.bic}<br>
  Verwendungszweck: Mitgliedsbeitrag ${member.childName || member.lastName} ${year}</li>

  <li><strong>Dauerauftrag:</strong> Richten Sie einen Dauerauftrag ein, um den Beitrag jährlich automatisch zu überweisen. So müssen Sie sich keine Gedanken mehr über die Zahlung machen.</li>

  <li><strong>Barzahlung:</strong> Sie können den Betrag auch bar im Sekretariat der Schule entrichten. Bitte geben Sie den Betrag in einem Umschlag mit Ihrem Namen und dem Verwendungszweck "Mitgliedsbeitrag ${year}" ab.</li>
</ol>

<p>Wir danken Ihnen herzlich für Ihre Unterstützung und Ihr Engagement. Bei Fragen oder Anliegen stehen wir Ihnen gerne zur Verfügung.</p>

<p>Mit freundlichen Grüßen,</p>

<p>${organization.name_kassenwart}<br>
Kassenwart<br>
${organization.name}<br>
${organization.address}</p>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"${organization.name} - ${organization.name_kassenwart}" <${organization.email}>`,
      to: member.email,
      subject: `Erinnerung an die Zahlung des jährlichen Mitgliedsbeitrags für ${year}`,
      html: mailContent,
      text: mailContent.replace(/<[^>]*>/g, '')
    });

    console.log(`Email sent to ${member.email}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: member.email
    };
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    throw error;
  }
}

module.exports = {
  initializeTransporter,
  sendReminderEmail
};