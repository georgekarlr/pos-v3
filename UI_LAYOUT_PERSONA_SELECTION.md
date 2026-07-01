# Persona Selection UI Layout

This document describes the UI layout and component structure for the `PersonaSelection` component, which handles role-based access control (RBAC) within the application.

## Overall Structure
- **Container**: Full-screen flex container (`min-h-screen`) with a light blue gradient background (`bg-gradient-to-br from-blue-50 via-white to-blue-50`).
- **Card**: A centered, maximum-width card (`max-w-md`) with white background, rounded corners (`rounded-xl`), and shadow (`shadow-lg`).
- **Icons**: Uses `lucide-react` for visual representation (Shield for Admin, Users for Staff).

---

## UI States

### 1. Role Selection View
The initial state where the user chooses their persona type.
- **Header**: 
    - Title: "Select Your Role"
    - Subtitle: "Choose your access level to continue"
    - Info: Displays the currently signed-in account email.
    - Logout Button: Quick access to sign out of the main account.
- **Role Cards**:
    - **Administrator**: Blue-themed card with a `Shield` icon. Highlights on hover. Indicates "Full system access".
    - **Staff Member**: Green-themed card with a `Users` icon. Highlights on hover. Indicates "Limited access".

### 2. Authentication Form View
Triggered after selecting a persona type.
- **Header**:
    - Back Button: Returns to Role Selection.
    - Role Indicator: Icon and text (e.g., "Admin Access" or "Staff Access").
- **Fields**:
    - **Login Name** (Staff Only): Text input for the staff member's unique identifier.
    - **Password**: Password input with a visibility toggle (`Eye`/`EyeOff` icons). Label changes based on role ("Admin Password" vs "Staff Password").
- **Submit Button**:
    - Dynamic text: "Continue as admin" or "Continue as staff".
    - Dynamic color: Blue for Admin, Green for Staff.
    - Loading state: Shows a spinner when validating.
- **Error Messages**: Red-bordered alert box showing validation errors.

### 3. Active Persona / Switch View
Shown when a persona is already authenticated and stored in the context.
- **Header**:
    - Welcome message with the persona's display name.
    - Status icon (Shield/Users) inside a green circular background.
- **Actions**:
    - **Switch Persona**: Button to return to the selection flow.
    - **Logout**: Red-themed button to sign out of the account entirely.

---

## Technical Details
- **Styling**: Tailwind CSS
- **Framework**: React (Functional Component)
- **Context**: Integrates with `useAuth` for state management and validation.
- **Transitions**: Uses `transition-all` and `transition-colors` for smooth interactive feedback.
