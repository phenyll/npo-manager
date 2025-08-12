# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server Operations
- **Start development server:** `npm run dev` or `npm run watch` (uses nodemon)
- **Start production server:** `npm start`
- **Clear user sessions:** `npm run clear-sessions`

### Database Management
- **Database file location:** `server/database/club.db` (SQLite)
- **Migration script:** `node server/database/migrate.js`

### Testing
- **No automated tests configured** - package.json shows placeholder test script
- Manual testing required for all features

## High-Level Architecture

### Technology Stack
- **Frontend:** Vanilla JavaScript with Bootstrap UI framework
- **Backend:** Node.js with Express.js
- **Database:** SQLite with direct SQL queries (no ORM)
- **Session Management:** express-session with file store
- **File Uploads:** multer for document management
- **Email:** nodemailer for SMTP functionality

### Application Structure
```
/server/
├── index.js          # Main Express app and routing
├── db.js             # Database connection and schema setup
├── member.js         # Member management API routes
├── payment.js        # Payment and billing functionality
├── user.js           # User authentication and roles
├── email.js          # Email service functionality
├── email-settings.js # SMTP configuration management
├── organization.js   # Organization details management
├── middleware.js     # Authentication and logging middleware
└── utils.js          # Shared utilities

/public/              # Static HTML pages
/static/              # CSS, JavaScript, and static assets
/uploads/members/     # Member document storage
/sessions/            # Session file storage
```

### Core Business Logic

**Member Management:**
- Complete member lifecycle (registration, payments, exit)
- Document upload and management for each member
- Notes history with categorization (entry, exit, payment, correspondence)
- Payment tracking with reminder history

**Dunning Process (Mahnung-Funktionalität):**
- Automated email sending via server SMTP
- Multi-step confirmation workflow
- Auto-exit date setting for non-payment
- Complete audit trail in member notes

**User Management:**
- Role-based permissions (admin, editor, none)
- Session-based authentication
- User creation and permission editing

### Database Schema Highlights
- `members` - Core member information with auto-exit functionality
- `payments` - Payment tracking with status and reminder history
- `member_documents` - File metadata for uploaded documents
- `member_notes` - Categorized notes with audit trail
- `reminder_history` - Payment reminder tracking
- `users`, `roles`, `permissions` - Role-based access control
- `organization_details` - Club/organization information
- `email_settings` - SMTP configuration

### Key Features
1. **Document Management**: Upload PDFs and images with descriptions
2. **Payment Tracking**: Annual membership payments with reminder system
3. **Dunning Process**: Automated warning emails with legal termination notices
4. **Excel Import/Export**: Member and payment data handling
5. **Email Integration**: Server-side SMTP for professional communication
6. **Audit Trail**: Complete history of all member interactions

### Code Conventions
- **Language:** All comments, variables, and documentation in German
- **Error Handling:** Try/catch blocks with German error messages
- **Database:** Direct SQL queries without ORM
- **Sessions:** File-based storage in `/sessions` directory
- **Security:** Input validation and authentication middleware

### Important Notes
- No automated testing framework - manual validation required
- Session files accumulate and should be cleared periodically
- SMTP settings must be configured for email functionality
- Member documents stored in filesystem, not database
- Auto-exit functionality for payment enforcement (legal compliance)