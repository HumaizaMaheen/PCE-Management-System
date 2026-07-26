# 🇵🇰 Pakistan Chamber of Education (PCE) — Division Bahawalpur
## Enterprise Membership & Finance Management System

An end-to-end full-stack ERP web application for the **Pakistan Chamber of Education (Division Bahawalpur)** to streamline public marketing, membership registration, application review workflows, PDF fee challan generation, WhatsApp payment receipt verification, General Ledger accounting, and digital membership identity management.

---

## 🌟 Key Modules & Features

### 🌐 1. Public Portal & Registration Wizard
* **14 Responsive Marketing Pages**: Home, About Us, Vision & Mission, Chairman Message, Executive Committee, Benefits, News & Events, Photo Gallery, Downloads, Contact, FAQ, Privacy Policy, Terms & Conditions.
* **Public Membership Wizard (`/apply`)**: Multi-step application collecting educator credentials, institute info, and file uploads (CNIC, Degree Certificates).
* **Public Tracking Portal (`/portal`)**: Real-time status lookup searchable by Reference Number (e.g. `PCE-APP-2026-000001`) with PDF Challan download and Verified Member Badge.

### 🛡️ 2. Administrative ERP & Role-Based Access Control (RBAC)
* **Secure Auth**: JWT Authentication with bcrypt password hashing and rate-limited endpoints.
* **Enforced Roles**: `Super Admin`, `Finance Officer`, `Membership Officer`, `Viewer` (Member).
* **Application Review Queue (`/admin/applications`)**: Officer action modal for Approving, Rejecting, or Requesting Information.

### 📄 3. Automated PDF Challan Engine
* **A4 PDF Invoice Generator**: Generates official fee challans complete with itemized dues breakdown, HBL Bank deposit credentials, and scannable QR codes.
* **Multi-channel Actions**: Download PDF, Email Challan, and WhatsApp Sharing.

### 💳 4. WhatsApp Receipt Bridge & Member Activation Engine
* **Manual Receipt Upload (`/admin/payments`)**: Upload deposit screenshots received from payers on WhatsApp.
* **Atomic Case A Activation**: Approving a payment automatically:
  1. Generates a unique **Membership ID** (format: `PCE-BWP-2026-XXXXXX`).
  2. Creates a member portal login account.
  3. Converts applicant into an active **Member Record**.
  4. Auto-syncs an Income Transaction in the General Ledger.
  5. Displays a **1-Click WhatsApp Credentials Dispatcher** to send login ID & password to the member on WhatsApp!

### 📊 5. General Ledger Accounting & Financial Reporting
* **Income Auto-Sync**: Approved payment receipts automatically populate the General Ledger as Income.
* **Manual Ledger Entries (`/admin/accounting`)**: Log non-challan income (grants, donations) and operational expenses (rent, utility bills, salaries).
* **Financial Statements**: Real-time Total Income, Total Expenses, Net Balance (Surplus/Deficit) cards, and CSV export.

### 🪪 6. Member Workspace & Digital Identity Card
* **Digital Membership Card (`/admin/dashboard`)**: Dedicated member portal featuring an official green/gold digital identity card with Membership ID (`PCE-BWP-2026-000001`), CNIC, and verified member badge.

### 🔍 7. Audit Trail, Notifications Log & System Settings
* **Audit Trail (`/admin/audit-logs`)**: Complete action trail with IP signatures and expandable JSON payload diff viewer.
* **Notifications Queue Log (`/admin/notifications`)**: Dispatch history of outgoing email and WhatsApp notifications.
* **System Settings (`/admin/settings`)**: Configurable Chamber branding, fee tariffs, and HBL bank deposit details.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Material Icons, Poppins & Inter Typography.
* **Backend**: Node.js, Express, TypeScript, Multer, PDFKit, QRCode, bcryptjs, JSON Web Tokens (JWT).
* **Database**: MySQL 8.0 / MariaDB (3NF Normalized Relational Schema).

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MySQL](https://www.mysql.com/) server running locally or on cloud

### 2. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🔑 Default Dev Access Credentials

* **Admin Portal Login**: `http://localhost:5173/login`
* **Super Admin Email**: `admin@pce.org.pk`
* **Super Admin Password**: `AdminPCE@2026`

* **Member Test Login**: `maheenhumaiza@gmail.com`
* **Member Test Password**: `PCE@2026`

---

© 2026 **Pakistan Chamber of Education (PCE) — Division Bahawalpur**. All rights reserved.
