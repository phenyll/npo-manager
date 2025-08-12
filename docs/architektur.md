# 🏗️ System-Architektur

Technische Architektur und Design-Entscheidungen der Vereinsverwaltungssoftware.

## 🎯 Architektur-Übersicht

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Datenbank     │
│   (Browser)     │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │    │ • Express.js    │    │ • Local File    │
│ • Bootstrap UI  │    │ • Session Mgmt  │    │ • SQL Queries   │
│ • Fetch API     │    │ • File Upload   │    │ • Transactions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Static Assets   │    │ Email Service   │    │ File Storage    │
│ • CSS/JS Files  │    │ • SMTP Client   │    │ • Member Docs   │
│ • Bootstrap     │    │ • Templates     │    │ • Sessions      │
│ • Images        │    │ • Nodemailer    │    │ • Uploads       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **HTML5**: Semantische Struktur
- **CSS3**: Styling mit Bootstrap Framework
- **Vanilla JavaScript**: Keine Frontend-Frameworks
- **Bootstrap 5**: Responsive UI-Komponenten
- **Fetch API**: HTTP-Client für Backend-Kommunikation

#### Backend
- **Node.js**: JavaScript-Runtime
- **Express.js**: Web-Framework
- **SQLite**: Embedded Datenbank
- **Multer**: File-Upload Middleware
- **Nodemailer**: E-Mail-Service
- **Express-Session**: Session-Management

#### Datenbank
- **SQLite**: Lokale Datenbankdatei
- **Direct SQL**: Keine ORM, direkte Queries
- **Transactions**: Für kritische Operationen
- **Foreign Keys**: Referentielle Integrität

## 🏛️ Backend-Architektur

### Modular Structure

```
server/
├── index.js              # Main application entry point
├── db.js                 # Database connection & schema
├── middleware.js         # Authentication & logging
├── utils.js              # Shared utilities
│
├── member.js             # Member management routes
├── payment.js            # Payment processing routes
├── user.js               # User authentication routes
├── email.js              # Email service
├── email-settings.js     # SMTP configuration
└── organization.js       # Organization data routes
```

### Request Flow

```
1. HTTP Request
   ↓
2. Express Middleware Stack
   ├── Session Validation
   ├── Authentication Check
   ├── Request Logging
   └── Route Handler
   ↓
3. Business Logic
   ├── Input Validation
   ├── Database Operations
   ├── External Service Calls
   └── Response Generation
   ↓
4. HTTP Response
```

### Session Management

```javascript
// File-based session storage
{
  store: FileStore('./sessions'),
  secret: 'secure-key',
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  cookie: { secure: false }      // true for HTTPS
}
```

### Error Handling Pattern

```javascript
try {
  // Database operation
  const result = await db.run(sql, params);
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({ 
    error: 'Datenbankfehler',
    details: error.message 
  });
}
```

## 🗄️ Datenbank-Design

### Schema Overview

```sql
-- Core Entities
members (id, firstName, lastName, email, joinDate, exitDate)
    ↓ 1:N
payments (id, memberId, year, amount, status)
    ↓ 1:N
reminder_history (id, payment_id, reminder_date)

-- Document Management
member_documents (id, member_id, filename, upload_date)
member_notes (id, member_id, note_text, note_type)

-- User Management
users (id, username, hash, salt)
    ↓ N:1
user_roles (user_id, role_id)
    ↓ 1:N
role_permissions (role_id, permission_id)

-- Configuration
organization_details (name, address, bank_details)
email_settings (smtp_host, smtp_port, credentials)
```

### Normalization Strategy

- **3NF Normalization**: Vermeidung von Redundanzen
- **Foreign Key Constraints**: Referentielle Integrität
- **Indexes**: Performance-Optimierung für häufige Queries
- **Triggers**: Automatische Zeitstempel und Validierung

### Transaction Patterns

```javascript
// Critical operations with rollback capability
db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  try {
    // Multiple related operations
    db.run(sql1, params1);
    db.run(sql2, params2);
    db.run(sql3, params3);
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
});
```

## 🎨 Frontend-Architektur

### Page Structure

```
public/
├── login.html           # Authentication page
├── index.html           # Main application SPA
├── statistics.html      # Dashboard & analytics
├── createUser.html      # User management
├── email-settings.html  # SMTP configuration
└── error pages/         # 401, 403, 404 handlers
```

### Component Pattern

```javascript
// Functional approach without frameworks
class MemberManager {
  async loadMembers(filters = {}) {
    const response = await fetch('/members/filtered?' + 
      new URLSearchParams(filters));
    return response.json();
  }
  
  renderMemberList(members) {
    const html = members.map(this.renderMemberRow).join('');
    document.getElementById('memberList').innerHTML = html;
  }
  
  renderMemberRow(member) {
    return `
      <tr>
        <td>${member.firstName} ${member.lastName}</td>
        <td>${member.email}</td>
        <td class="action-buttons">
          <button onclick="editMember(${member.id})">📝</button>
          ${member.openPayments > 0 ? 
            `<button onclick="sendDunning(${member.id})">📮</button>` : ''
          }
        </td>
      </tr>
    `;
  }
}
```

### State Management

```javascript
// Simple global state without complex frameworks
const AppState = {
  currentUser: null,
  currentPage: 'members',
  filters: {},
  
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.refreshCurrentView();
  },
  
  refreshCurrentView() {
    // Trigger page-specific refresh logic
    window.dispatchEvent(new CustomEvent('stateChanged'));
  }
};
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User Login → Credential Validation
2. Session Creation → File-based Storage
3. Request Authentication → Session Cookie
4. Role-based Authorization → Permission Check
5. Resource Access → Authorized Operation
```

### Security Layers

#### Input Validation
```javascript
// Server-side validation for all inputs
const validateMember = (data) => {
  const errors = [];
  if (!data.firstName?.trim()) errors.push('Vorname ist erforderlich');
  if (!isValidEmail(data.email)) errors.push('Ungültige E-Mail');
  return errors;
};
```

#### File Upload Security
```javascript
// Strict file type and size validation
const uploadSecurity = {
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|gif|bmp|webp/;
    const isValid = allowedTypes.test(file.mimetype);
    cb(isValid ? null : new Error('Dateityp nicht erlaubt'), isValid);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
};
```

#### SQL Injection Prevention
```javascript
// Parameterized queries exclusively
db.get("SELECT * FROM members WHERE id = ?", [memberId], callback);
// Never: "SELECT * FROM members WHERE id = " + memberId
```

### Permission Matrix

```
Permission     | Admin | Editor | None
---------------|-------|--------|------
login          |   ✓   |   ✓    |  ✓
view-members   |   ✓   |   ✓    |  ✗
edit-members   |   ✓   |   ✓    |  ✗
create-user    |   ✓   |   ✗    |  ✗
delete-user    |   ✓   |   ✗    |  ✗
send-emails    |   ✓   |   ✓    |  ✗
system-config  |   ✓   |   ✗    |  ✗
```

## 📧 Email Architecture

### SMTP Integration

```javascript
// Configurable SMTP with database settings
const createTransporter = async () => {
  const settings = await getEmailSettings();
  return nodemailer.createTransporter({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.secure,
    auth: {
      user: settings.username,
      pass: settings.password
    }
  });
};
```

### Template System

```javascript
// Dynamic email generation
const generateDunningEmail = (member, payments, includeExclusion) => {
  const paymentList = payments.map(p => 
    `• Beitrag ${p.year}: ${p.amount},00 €`
  ).join('\n');
  
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    subject: includeExclusion ? 
      'WICHTIG: Ausschluss-Androhung - Offene Beiträge' :
      'Zahlungserinnerung - Offene Beiträge',
    body: generateEmailBody(member, paymentList, total, includeExclusion)
  };
};
```

## 📁 File System Architecture

### Storage Strategy

```
uploads/
└── members/
    ├── document-1692708123456-789012345.pdf
    ├── document-1692708234567-890123456.jpg
    └── ...

sessions/
├── session-id-1.json
├── session-id-2.json
└── ...

server/database/
└── club.db
```

### File Management

```javascript
// Secure file naming and storage
const generateSecureFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `document-${timestamp}-${random}${extension}`;
};
```

## 🔄 Data Flow Patterns

### CRUD Operations

```javascript
// Standardized CRUD pattern for all entities
class EntityManager {
  async create(data) {
    const validation = this.validate(data);
    if (!validation.isValid) throw new Error(validation.errors);
    
    const result = await db.run(this.insertSQL, this.extractValues(data));
    return { id: result.lastID, ...data };
  }
  
  async read(id) {
    return db.get(this.selectSQL, [id]);
  }
  
  async update(id, data) {
    const validation = this.validate(data);
    if (!validation.isValid) throw new Error(validation.errors);
    
    await db.run(this.updateSQL, [...this.extractValues(data), id]);
    return this.read(id);
  }
  
  async delete(id) {
    await db.run(this.deleteSQL, [id]);
    return { deleted: true, id };
  }
}
```

### Event-Driven Patterns

```javascript
// Simple event system for loose coupling
class EventBus {
  constructor() {
    this.listeners = {};
  }
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Usage examples
EventBus.on('member.created', (member) => {
  console.log(`Neues Mitglied: ${member.firstName} ${member.lastName}`);
});

EventBus.on('payment.received', (payment) => {
  // Remove auto-exit if all payments cleared
  checkAndRemoveAutoExit(payment.memberId);
});
```

## 🚀 Performance Considerations

### Database Optimization

```sql
-- Strategic indexes for common queries
CREATE INDEX idx_members_name ON members(lastName, firstName);
CREATE INDEX idx_payments_member_status ON payments(memberId, status);
CREATE INDEX idx_documents_member ON member_documents(member_id);
CREATE INDEX idx_notes_member_date ON member_notes(member_id, created_date);
```

### Memory Management

```javascript
// Efficient resource cleanup
const cleanupSession = (sessionId) => {
  // Remove old session files periodically
  const sessionPath = `./sessions/${sessionId}.json`;
  fs.unlink(sessionPath, err => {
    if (err) console.warn('Session cleanup failed:', err);
  });
};

// Automatic cleanup every 24 hours
setInterval(() => {
  cleanupOldSessions();
}, 24 * 60 * 60 * 1000);
```

### Caching Strategy

```javascript
// Simple in-memory cache for frequently accessed data
const Cache = {
  data: new Map(),
  ttl: new Map(),
  
  set(key, value, ttlMs = 300000) { // 5min default
    this.data.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  },
  
  get(key) {
    if (this.ttl.get(key) < Date.now()) {
      this.data.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.data.get(key);
  }
};
```

## 📊 Monitoring & Logging

### Application Logging

```javascript
// Structured logging for debugging and monitoring
const Logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  },
  
  audit: (action, user, target = null) => {
    console.log(`[AUDIT] ${new Date().toISOString()} ${user} ${action} ${target}`);
  }
};
```

### Health Checks

```javascript
// Basic health monitoring endpoints
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: checkDatabaseConnection(),
    diskSpace: checkDiskSpace(),
    memory: process.memoryUsage()
  };
  
  res.json(health);
});
```

## 🔄 Deployment Architecture

### Production Setup

```javascript
// Environment-specific configuration
const config = {
  development: {
    port: 3000,
    secure: false,
    logLevel: 'debug'
  },
  production: {
    port: process.env.PORT || 80,
    secure: true,
    logLevel: 'error'
  }
};
```

### Backup Strategy

```bash
#!/bin/bash
# Automated backup script
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
cp server/database/club.db "backup/db_${DATE}.db"

# Document backup
tar -czf "backup/uploads_${DATE}.tar.gz" uploads/

# Configuration backup
cp -r docs/ "backup/docs_${DATE}/"
```

---

**Design-Prinzipien:**
- **Simplicity**: Einfache, verständliche Lösungen
- **Reliability**: Robuste Fehlerbehandlung
- **Security**: Defense in depth
- **Maintainability**: Klare Code-Struktur
- **Performance**: Optimiert für Vereinsgrößen (< 1000 Mitglieder)