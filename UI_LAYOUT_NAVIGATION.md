# Navigation UI Layout Structure

This document outlines the navigation system of the POS Pro v3 application, covering the structural components, role-based navigation, and routing.

## 1. Primary Navigation Components

### Layout Shell (`Layout.tsx`)
- **Wrapper**: Flexbox container that manages the sidebar and main content area.
- **Sidebar State**: Managed globally to allow toggling on mobile and persistence on desktop.
- **Responsive Design**: 
  - Mobile: Sidebar is hidden by default and appears as an overlay.
  - Desktop: Sidebar can be fixed or collapsible.

### Global Header (`Header.tsx`)
Located at the top of every protected page.
- **Left Section**:
  - Menu Toggle: Hamburger icon (`Menu`) to open/close the sidebar.
  - App Branding: "POS Pro v3" title.
- **Right Section**:
  - **Persona Indicator**: 
    - Admin: Blue `Shield` icon + "Admin".
    - Staff: Green `Users` icon + Staff Name/Login.
  - **User Profile**: Displays currently logged-in account email.
  - **Quick Actions**:
    - **Switch Persona**: `RefreshCw` icon to jump back to role selection without logging out.
    - **Sign Out**: `LogOut` icon to end the session entirely.

### Sidebar Navigation (`Sidebar.tsx`)
The primary vertical navigation menu.
- **Header**: Branding and current persona role display.
- **Menu Items**: Functional links with icons (`lucide-react`).
- **States**:
  - **Active**: Highlighted with a light blue background (`bg-blue-50`) and left-accent border.
  - **Hover**: Subtle background change (`bg-gray-50`).
- **Collapsible Groups**: Used for "Management" and "Debt Management" sections.
  - Expand/Collapse toggle with `ChevronDown`/`ChevronRight`.
  - Nested children items with indentation.

---

## 2. Role-Based Navigation Mapping

Navigation items visible in the sidebar vary based on the active persona.

### Admin Persona (Full Access)
| Item | Icon | Link |
|------|------|------|
| **Dashboard** | `LayoutDashboard` | `/dashboard` |
| **POS** | `ShoppingCart` | `/pos` |
| **Management** (Group) | `Package` | - |
| ∟ Products | - | `/management/products` |
| ∟ Inventory | - | `/management/inventory` |
| ∟ Sales History | - | `/management/sales-history` |
| **Debt Management** (Group) | `Wallet` | - |
| ∟ Debt Wizard | - | `/debt-management/wizard` |
| ∟ Debts | - | `/debt-management/debts` |
| **Analytics Reports** | `BarChart3` | `/analytics-reports` |
| **Receipt Printer** | `Printer` | `/settings/receipt-printer` |
| **Settings** | `Settings` | `/settings` |
| **Persona Management** | `Shield` | `/persona-management` |

### Staff Persona (Restricted)
| Item | Icon | Link |
|------|------|------|
| **Dashboard** | `LayoutDashboard` | `/dashboard` |
| **POS** | `ShoppingCart` | `/pos` |
| **Management** (Group) | `Package` | - |
| ∟ Sales History | - | `/management/sales-history` |
| **Debt Management** (Group) | `Wallet` | - |
| ∟ Debt Wizard | - | `/debt-management/wizard` |
| ∟ Debts | - | `/debt-management/debts` |
| **Receipt Printer** | `Printer` | `/settings/receipt-printer` |
| **Settings** | `Settings` | `/settings` |

---

## 3. Routing & Guards

The application uses `react-router-dom` for client-side routing, protected by two layers of security.

### Route Protection
1. **`ProtectedRoute`**: Verifies that a valid user account is signed in (Supabase Auth). Redirects to `/login` if not.
2. **`PersonaProtectedRoute`**: Verifies that a persona (Admin or Staff) has been selected and validated (PIN/Password). Redirects to persona selection if not.

### URL Structure
- **/Public**: `/login`, `/signup`
- **/General**: `/dashboard`, `/pos`, `/settings`
- **/Management**: `/management/*` (Role-specific items)
- **/Debt Management**: `/debt-management/*`
- **/System**: `/persona-management`, `/analytics-reports`

---

## 4. Interaction Patterns
- **Mobile Menu**: Uses a backdrop overlay (`bg-gray-600/75`) that closes the sidebar on click.
- **Deep Linking**: Nested routes under "Management" and "Settings" preserve the navigation context.
- **Breadcrumbs**: (Optional/Proposed) Usually displayed in the header area or top of the main content to show current path.

## 5. POS Internal Navigation
For detailed information about the internal navigation and UI structure within the POS page, refer to [UI_LAYOUT_POS_NAVIGATION.md](./UI_LAYOUT_POS_NAVIGATION.md).
