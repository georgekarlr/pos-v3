# POS Page UI Structure & Internal Navigation

This document details the internal UI structure and navigation patterns within the Point of Sale (POS) interface (`POS.tsx`).

## 1. Page Layout Structure

The POS page is designed for high-efficiency interaction, featuring a flexible workspace that adapts to different screen sizes and workflows.

### Global POS Controls (Top Bar)
A horizontal bar at the top of the POS interface containing operational status and mode selectors.
- **Offline Sync Status**: Shows pending offline sales and a sync indicator (`RefreshCw` animate-spin).
  - "View Offline Sales" button opens `OfflineSalesModal`.
- **Action Mode Selector** (`ActionModeBar`): Controls what happens when a product is clicked/scanned.
- **View Mode Switcher** (`ViewModeSwitcher`): Toggles between different layout configurations.
- **Camera Scanner**: Toggle button (if camera mode is enabled) to open `CameraScanner`.

### Toolbar & Search
- **Search Bar**: Real-time filtering of products by name or barcode.
- **Manual Refresh**: `RefreshCw` button to reload the product list from the server/local cache.
- **Feedback Notifications**: 
  - `successMessage`: Green alert for successful sale completion.
  - `scanSuccess`: Blue animated alert confirming product addition/deduction.
  - `error`: Red alert for errors (e.g., product not found).

---

## 2. Operational Modes

### Action Modes (`PosAction`)
Managed by `ActionModeBar`, these modes define the behavior of product interactions (clicks or barcode scans).

| Mode | Icon | Behavior on Interaction |
|------|------|------------------------|
| **Add** | `Plus` | Increases item quantity in cart by 1. (Default) |
| **Deduct** | `Minus` | Decreases item quantity in cart by 1. |
| **Bundle** | `Layers` | Opens `BundleModal` for bulk quantity entry or custom pricing. |
| **Clear** | `X` | Completely removes the item from the cart. |

### View Modes (`PosViewMode`)
Managed by `ViewModeSwitcher`, these modes reorganize the workspace based on the user's focus.

- **Everything**: Splits the screen between the `ProductGrid` (Left/Top) and `CartPanel` (Right/Bottom).
- **Products**: Full-screen `ProductGrid` for browsing.
- **Cart & Payments**: Full-screen `CartPanel` and payment interface for checkout.

---

## 3. Core POS Components

### Product Grid (`ProductGrid.tsx`)
- Displays `ProductTile` components.
- Supports visual indicators for stock levels and active cart quantities.
- Responsive grid (1 column on mobile, multiple columns on desktop).

### Cart Panel (`CartPanel.tsx`)
- **Line Items**: Lists all products currently in the order with quantity controls.
- **Summary Section**: 
  - Subtotal, Tax, and Grand Total calculations.
- **Action Buttons**:
  - "Clear All": Resets the entire order.
  - "Checkout": Opens the `PaymentModal`.

### Payment Interface (`PaymentModal.tsx`)
- **Multi-Payment Support**: Allows splitting payments across different methods (Cash, Card, etc.).
- **Tendered Input**: Quick-entry fields for cash payments to calculate change.
- **Finalize Sale**: Submits the transaction to `PosService`.

### Receipt Modal (`ReceiptModal.tsx`)
- Displays the final `Receipt` after a successful transaction.
- Options to Print or Close.

---

## 4. Hardware Integration

### Barcode Scanning
- **Hardware Scanners**: Listened via `useHardwareScanner` hook (HID/Keyboard emulation).
- **Camera Scanning**: Integrated via `CameraScanner` using the device's camera.
- **Logic**: Scanning a barcode automatically triggers the current `selectedAction` (Add/Deduct).

### Offline Support
- **IndexedDB**: Uses `OfflineDB` to store sales when the navigator is offline.
- **Auto-Sync**: Background interval checks for connection to sync pending sales to Supabase via `PosService.createSale`.

---

## 5. Data Integration (Supabase API)

The POS interface interacts with Supabase via specialized services that wrap Remote Procedure Calls (RPCs).

### Product Fetching (`ProductService`)
- **Method**: `getAllProducts()`
- **Supabase RPC**: `pos2_get_product_details`
- **Functionality**: Retrieves products with details like base price, tax rate, and barcodes. Supports filtering and pagination.

### Sale Processing (`PosService`)
- **Method**: `createSale()`
- **Supabase RPC**: `pos2_create_sale`
- **Functionality**:
  - Validates cart items, quantities, and prices server-side.
  - Records multiple payment methods.
  - Updates inventory levels automatically.
  - Returns a success status and generated order ID.
- **Offline Handling**: If `navigator.onLine` is false, `createSale` redirects the payload to `OfflineDB` (IndexedDB) for later synchronization.
