# Products & Inventory UI Structure

This document details the UI structure, management workflows, and navigation patterns within the Products and Inventory modules.

## 1. Products Management Page (`Products.tsx`)

The Products page is the central hub for managing the item catalog. It adapts its capabilities based on the user's persona (Admin vs. Staff).

### Header & Controls
- **Page Title**: "Products" with a dynamic subtitle based on persona.
- **Refresh Button**: `RefreshCw` icon to manually reload the product list from `ProductService`.
- **Add Product Button** (Admin Only): Opens the `ProductForm` in creation mode.

### Product List (`ProductList.tsx`)
Displays the catalog using a responsive layout that switches between table and card views.
- **Desktop View**: A detailed table containing:
  - Product Info (Image, Name, Description)
  - SKU / Barcode
  - Financials (Base Price, Tax Rate, Display Price)
  - Inventory Type & Sale Status
  - Status Badge (Active/Inactive)
- **Mobile View**: Simplified card layout optimized for touch.
- **Actions**:
  - **Edit** (Admin): Opens `ProductForm` to modify existing details.
  - **View** (Staff): Opens `ProductForm` in read-only mode.

### Product Form (`ProductForm.tsx`)
A modal interface for creating or editing product definitions.
- **Field Groups**:
  - **Basic Info**: Name, Description, Image URL.
  - **Identifiers**: SKU, Barcode.
  - **Pricing**: Base Price, Tax Rate (calculates Display Price in real-time).
  - **Configuration**:
    - Selling Method (Unit vs. Measured).
    - Inventory Type (Perishable vs. Non-perishable).
    - Unit Type (e.g., kg, pieces).
    - Sale Status (Is for Sale toggle).
- **Permissions**: Fields are disabled if the user is not an Admin.

---

## 2. Inventory Management Page (`Inventory.tsx`)

The Inventory page focuses on stock level tracking, batch management, and historical movement.

### Core Components
- **Product Card (`ProductCard.tsx`)**: High-level summary of stock levels for a specific product.
- **Product Details (`ProductDetailsModal.tsx`)**: Deep dive into a product's stock including batch breakdowns.
- **Adjustment Dialogs**:
  - `AdjustQuantityDialog`: Quick adjustment of stock levels.
  - `AdjustBatchModal`: Modify specific batch details (e.g., expiration dates).
  - `WriteOffBatchModal`: Record stock loss/wastage.

### Tracking & History
- **Activity List (`AllActivityList.tsx`)**: Chronological log of all inventory movements.
- **History Drawer (`ProductHistoryDrawer.tsx`)**: Filtered history view specific to a single product.
- **Stock Status**: Visual indicators (`StockStatusBadge`) for Low Stock, Out of Stock, or Healthy levels.

---

## 3. Data Integration (Supabase API)

### Product Service (`productService.ts`)
| Method | RPC / Action | Description |
|--------|--------------|-------------|
| `getAllProducts` | `pos2_get_product_details` | Fetches the complete catalog. |
| `createProduct` | `pos2_create_product` | Adds a new product definition. |
| `updateProduct` | `pos2_update_product` | Updates existing product metadata. |

### Inventory Service (`inventoryService.ts`)
| Method | RPC / Action | Description |
|--------|--------------|-------------|
| `addInventoryBatch` | `pos2_add_inventory_batch` | Adds a new batch of stock. |
| `writeOffInventoryBatch`| `pos2_write_off_inventory_batch`| Records stock loss/wastage. |
| `adjustInventoryBatches`| `pos2_adjust_inventory_batches` | Modifies existing batch quantities. |
| `getAllProductActivity` | `pos2_get_product_activity_history`| Retrieves global movement history. |
| `getProductActivityById`| `pos2_get_product_activity_by_id` | Retrieves history for a specific item. |

---

## 4. Persona-Based Access Control

| Feature | Admin | Staff |
|---------|:---:|:---:|
| View Catalog | ✓ | ✓ |
| Add/Edit Products | ✓ | ✗ |
| Adjust Stock | ✓ | ✓ |
| View Financials | ✓ | ✓ |
| Delete/Archive | ✓ | ✗ |
