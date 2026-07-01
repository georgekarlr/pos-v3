# App Structure and Navigation Guide

This document provides a comprehensive overview of the application's structure, navigation, and user roles.

## 🚀 App Overview
The application is a Point of Sale (POS) system built with React, Vite, and Supabase. It features offline capabilities, PWA support, and a role-based access control system.

---

## 👥 User Roles & Access
The application uses a "Persona" based system to manage access levels:

### 1. Admin
- Full access to all features.
- Can manage products, inventory, and personas.
- Access to detailed analytics and reports.

### 2. Staff
- Restricted access.
- Primary focus on POS and Sales History.
- Limited access to management and settings.

---

## 🗺️ Navigation Map

### Public Routes
- `/login`: User authentication page.
- `/signup`: New user registration.

### Protected Routes (Require Authentication & Persona)
The following routes are wrapped in `ProtectedRoute` and `PersonaProtectedRoute`:

| Route | Page | Description | Role Access |
|-------|------|-------------|-------------|
| `/dashboard` | Dashboard | Overview of sales, activity, and key metrics. | Admin, Staff |
| `/pos` | POS | The main sales interface for processing transactions. | Admin, Staff |
| `/persona-management` | Persona Management | Create and manage user personas (PIN-protected). | Admin |
| `/management/products` | Products | Product catalog management (Add/Edit/Delete). | Admin |
| `/management/inventory` | Inventory | Stock management and activity tracking. | Admin |
| `/management/sales-history` | Sales History | View and manage past transactions. | Admin, Staff |
| `/management/customers` | Customers | Customer information management. | Admin |
| `/debt-management/wizard` | Debt Wizard | Step-by-step process for managing debts. | Admin, Staff |
| `/debt-management/debts` | Debts | List and status of customer debts. | Admin, Staff |
| `/analytics-reports` | Reports | Detailed business analytics and downloadable reports. | Admin |
| `/settings` | Settings | General application configuration. | Admin, Staff |
| `/settings/receipt-printer` | Receipt Printer | Configuration for ESC/POS printers. | Admin, Staff |

---

## 📖 Detailed Page Guide

### 1. POS (Point of Sale)
- **Product Grid:** Browse or search for products.
- **Scanner Support:** Integration with hardware barcode scanners.
- **Cart Panel:** Manage current transaction, apply discounts, or bundles.
- **Payment Modal:** Supports various payment methods and handles offline sync.

### 2. Management
- **Products:** Manage product details, categories, and pricing.
- **Inventory:** Track stock levels, adjust quantities, and view stock history.
- **Sales History:** Search and filter past sales, process refunds, and reprint receipts.

### 3. Debt Management
- **Debt Wizard:** Simplifies the process of recording and tracking customer debts.
- **Customer List:** Linked to debts for better tracking.

### 4. Settings
- **Receipt Printer:** Configure USB/Bluetooth/Network printers using ESC/POS commands.
- **Sync Status:** Monitor offline/online database synchronization with Supabase.

---

## 📂 Directory Structure

```text
src/
├── components/     # Reusable UI components
│   ├── auth/       # Login, Signup, Persona selection
│   ├── inventory/  # Inventory specific modals and lists
│   ├── layout/     # Header, Sidebar, Main Layout
│   ├── pos/        # Cart, Payment, Scanning logic
│   └── sales/      # Sales table and refund modals
├── contexts/       # React Contexts (Auth, Scanner Settings)
├── db/             # IndexedDB logic for offline support
├── hooks/          # Custom React hooks
├── lib/            # External library configs (Supabase)
├── pages/          # Full page components (Routes)
├── services/       # Business logic and API calls
├── types/          # TypeScript definitions
└── utils/          # Helper functions (Encryption, Sound, etc.)
```

---

## 🛠️ Technical Implementation
- **Routing:** Handled by `react-router-dom`.
- **State Management:** React Context API for global state.
- **Database:** Supabase (PostgreSQL) for cloud storage, IndexedDB for offline support.
- **Styling:** Tailwind CSS for a modern, responsive UI.
