import React, { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, FileDown } from 'lucide-react'
import { OverviewSection } from '../components/usermanual/OverviewSection'
import { AuthSection } from '../components/usermanual/AuthSection'
import { DashboardSection } from '../components/usermanual/DashboardSection'
import { PosSection } from '../components/usermanual/PosSection'
import { CatalogSection } from '../components/usermanual/CatalogSection'
import { PromotionsSection } from '../components/usermanual/PromotionsSection'
import { InventorySection } from '../components/usermanual/InventorySection'
import { SalesSection } from '../components/usermanual/SalesSection'
import { DebtSection } from '../components/usermanual/DebtSection'
import { InstallmentSection } from '../components/usermanual/InstallmentSection'
import { ComplianceSection } from '../components/usermanual/ComplianceSection'
import { SettingsSection } from '../components/usermanual/SettingsSection'
import { OfflineSection } from '../components/usermanual/OfflineSection'
import { ArchitectureSection } from '../components/usermanual/ArchitectureSection'

interface ManualChapter {
  id: string
  title: string
  component: React.ReactNode
  rawHtml: string
}

const chapters: ManualChapter[] = [
  {
    id: 'overview',
    title: '1. System Overview & Tech Stack',
    component: <OverviewSection />,
    rawHtml: `
      <h2>1. System Overview & Tech Stack</h2>
      <p><strong>CPOS Pro</strong> is an offline-first Point of Sale (POS) system designed for retail and service businesses. It runs as a Progressive Web App (PWA) with client-side database caching via IndexedDB, enabling uninterrupted operations even when internet connection is lost. Real-time background sync kicks in automatically when connectivity is restored.</p>
      <h3>System Key Capabilities</h3>
      <table>
        <thead>
          <tr>
            <th>Feature Group</th>
            <th>Detailed Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Point of Sale (POS)</td><td>High-speed order entry, camera/hardware barcode scanning, split payments, cash tendering, and direct thermal printing.</td></tr>
          <tr><td>Inventory & Batches</td><td>Batch-level stock tracking, expiration tracking for perishables, write-offs, stock adjustments, and history log.</td></tr>
          <tr><td>Customer & Debt Management</td><td>Built-in accounts registry, credit limit enforcement, debt Wizard for credit sales, and multi-action debt settlements.</td></tr>
          <tr><td>Installment Contracts</td><td>Custom layaway agreements, downpayment recording, flat interest rates, monthly schedules, and late/default statuses.</td></tr>
          <tr><td>BIR Reports & Compliance</td><td>Government compliant printouts, PTU numbers, invoice serialization, X-Reading, Z-Reading, and audit Electronic Journal (E-Journal).</td></tr>
          <tr><td>Role-Based Access Control</td><td>Multi-persona system (Admin vs Staff) with PIN code/password gates protecting sensitive pages.</td></tr>
          <tr><td>Offline Database Cache</td><td>Automatic detection of offline state, IndexedDB local queue storage, and background sync to Supabase (PostgreSQL).</td></tr>
        </tbody>
      </table>
      <h3>Technology Architecture</h3>
      <table>
        <thead>
          <tr>
            <th>Stack Layer</th>
            <th>Technologies Utilized</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Frontend Framework</td><td>React 18, TypeScript, Vite</td></tr>
          <tr><td>Styling Engine</td><td>Tailwind CSS, Lucide React Icons</td></tr>
          <tr><td>Cloud Backend</td><td>Supabase (Auth, Postgres SQL, Database Functions/RPCs)</td></tr>
          <tr><td>Offline Database</td><td>IndexedDB (via custom OfflineDB controller)</td></tr>
          <tr><td>Hardware API Integrations</td><td>Web USB API, Web Serial API, Web Bluetooth API (BLE)</td></tr>
          <tr><td>Deployment Target</td><td>Vercel Edge Platform</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: 'auth',
    title: '2. Getting Started — Authentication & Personas',
    component: <AuthSection />,
    rawHtml: `
      <h2>2. Getting Started — Authentication & Personas</h2>
      <h3>1. User Authentication (Login & Signup)</h3>
      <p>The first layer of security uses Supabase email-based and Google OAuth accounts. All users must register and sign in to connect to the store environment.</p>
      <ul>
        <li><strong>Email & Password Login:</strong> Enter your registered store email and password. Click "Sign In".</li>
        <li><strong>Google Sign-In:</strong> Click the "Sign In with Google" button to authenticate seamlessly using your corporate or personal Google account.</li>
        <li><strong>Signup Page:</strong> If you are a new tenant or account holder, register via email/password by clicking "Sign Up", or use "Sign Up with Google" to automatically link your Google profile.</li>
      </ul>
      <div class="note">
        <strong>Note:</strong> Your login account is your Supabase user account. This is separate from the persona/role used inside the app.
      </div>
      <h3>2. Role Selection (Personas)</h3>
      <p>Once signed in to the main user account, the system prompts for a <strong>Persona</strong> to dictate operational limits (Role-Based Access Control).</p>
      <h4>🛡️ Administrator Persona</h4>
      <p>For store managers and system developers. Full access to inventory, pricing, terminals, analytics reports, staff setup, and BIR settings. Required verification via the Admin PIN/Password.</p>
      <h4>👥 Staff Member Persona</h4>
      <p>For cashiers and shift staff. Operational focus on checkout transactions, sales tracking, customers registry, and X-Readings. Requires matching login name and staff credentials configured by Admin.</p>
      <h3>3. Session Actions</h3>
      <ul>
        <li><strong>Switch Persona:</strong> In the global header, clicking the 🔄 (RefreshCw) icon returns you to the role selection gate. Use this when cashiers switch shifts without requiring a full logout from the user email.</li>
        <li><strong>Sign Out:</strong> Click the ↪ (LogOut) icon to terminate the account session and return to the primary login window.</li>
      </ul>
    `
  },
  {
    id: 'dashboard',
    title: '3. Dashboard KPI metrics',
    component: <DashboardSection />,
    rawHtml: `
      <h2>3. Dashboard KPI metrics</h2>
      <p>The <strong>Dashboard</strong> serves as a high-level operational overview for current store performance.</p>
      <h3>KPI Scorecards</h3>
      <ul>
        <li><strong>Today's Revenue:</strong> Total monetary sales recorded starting at 12:00 AM of the current day. Displays in Philippine Peso (PHP).</li>
        <li><strong>Today's Orders:</strong> Total count of invoices/receipts generated today. Both online transactions and synced offline sales are counted.</li>
        <li><strong>Average Sale:</strong> Today's total revenue divided by today's total orders. Gives a benchmark on customer purchasing baskets.</li>
      </ul>
      <h3>Dashboard Analytics</h3>
      <ul>
        <li><strong>Top Products Today:</strong> Shows the top 5 product rows ranked by total item count sold. Provides quick stock awareness on trending products.</li>
        <li><strong>Recent Orders:</strong> A chronological list of the 5 most recent sales orders. Displays the Order ID, Timestamp, Customer name (Guest if unregistered), and total receipt amount.</li>
      </ul>
    `
  },
  {
    id: 'pos',
    title: '4. Point of Sale (POS) Order Entry',
    component: <PosSection />,
    rawHtml: `
      <h2>4. Point of Sale (POS) Order Entry</h2>
      <h3>1. Action Modes</h3>
      <p>The <strong>Action Mode Bar</strong> changes how clicking items or scanning barcodes behaves:</p>
      <ul>
        <li><strong>Add (+):</strong> Clicks or barcode scans increment the product quantity by 1 unit.</li>
        <li><strong>Deduct (-):</strong> Decrements product quantity in the cart. If quantity drops to zero, the item is removed.</li>
        <li><strong>Bundle:</strong> Opens a numeric modal. Enter exact quantities directly (supports decimal inputs for measured items like kilograms).</li>
        <li><strong>Clear:</strong> Immediately deletes the selected product from the cart session.</li>
      </ul>
      <h3>2. Interface Layout View Modes</h3>
      <p>Toggle view settings via the **View Mode Switcher** to optimize for your device form-factor:</p>
      <ul>
        <li><strong>Everything:</strong> Displays the product catalog on the left and the transaction cart on the right. Best for desktops.</li>
        <li><strong>Products:</strong> Maximizes catalog grid space. Best for selecting items on tablets or touch displays.</li>
        <li><strong>Cart &amp; Payments:</strong> Maximizes checkout panel, discounts, and payment methods list.</li>
      </ul>
      <h3>3. Barcode Scanning</h3>
      <ul>
        <li><strong>Hardware Scanner:</strong> Plug-and-play keyboard emulation HID scanners. Set scanner mode to "Hardware" in Settings. Scans trigger the current action mode instantly.</li>
        <li><strong>Camera Scanner:</strong> Activate by toggling "Camera Scanner" in Settings. Click **Open Scanner** on the POS page to scan barcodes using your tablet/phone built-in camera feed. Supports single and multi-barcode scan queues.</li>
      </ul>
      <h3>4. Cart Calculations, Discounts, and Loyalty</h3>
      <p><strong>Discount Types:</strong></p>
      <ul>
        <li><strong>Promotions (Coupon Code Gated):</strong> Active promotions are only applied if a matching coupon code is entered in the cart. The best discount is selected per product among the matches. A <em>Save ₱X</em> badge appears on qualifying items in the cart, and a <strong>Coupon Discount</strong> line is shown in the order summary and receipt.
          <br/><em>Offline Support:</em> Promotions are cached in IndexedDB when loaded online. Validity (start/end dates, active status, product eligibility, and coupon codes) is enforced client-side while offline, using the same logic as the server.
        </li>
        <li><strong>Senior Citizen (SC) / Person with Disability (PWD):</strong> Applies a 20% discount on VAT-exclusive price and waives tax calculations for BIR compliance.
          <br/><em>⚠ BIR Compliance:</em> You must provide the beneficiary's <strong>Full Name</strong> and <strong>ID Number</strong> during checkout. The checkout action is disabled until both are entered.
        </li>
      </ul>
      <p><strong>Loyalty Program:</strong></p>
      <ul>
        <li><strong>Customer ID:</strong> Entering a registered Customer ID displays their current points balance.</li>
        <li><strong>Earn:</strong> Earn points automatically at a rate of 1 point per ₱1 of the net total.</li>
        <li><strong>Redeem:</strong> Redeem points to reduce the order total (1 point = ₱1 discount). Max redemption is limited to their points balance.</li>
      </ul>
      <p><strong>Split Payments:</strong></p>
      <p>Click "+ Add Payment" to allocate split payments (e.g. paying PHP 500 in Cash and PHP 200 via GCash). Enter Cash Tendered to automatically show change due.</p>
      <p><strong>Completion:</strong></p>
      <p>Ensure an active terminal is selected. Click "Complete Sale" to trigger the database transaction, update inventory batches, log loyalty points, and open the ESC/POS Receipt printing prompt.</p>
    `
  },
  {
    id: 'catalog',
    title: '5. Catalog & Product Setup',
    component: <CatalogSection />,
    rawHtml: `
      <h2>5. Catalog & Product Setup</h2>
      <p><strong>Route:</strong> <code>/management/products</code> | <strong>Access:</strong> Admin (Full CRUD), Staff (Read-only catalog view)</p>
      <h3>1. Product Directory</h3>
      <p>The directory adapts gracefully: presenting detailed columns on desktop tables, and shifting to simplified cards on mobile devices.</p>
      <ul>
        <li><strong>Search Bar:</strong> Real-time filtering by Product Name or exact Barcode values.</li>
        <li><strong>Refresh:</strong> Triggers ProductService.getAllProducts() to load updates from the Postgres database.</li>
      </ul>
      <h3>2. Product Configuration Fields</h3>
      <p>Creating or editing a product opens a sidebar modal with the following parameters:</p>
      <table>
        <thead>
          <tr>
            <th>Config Parameter</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Selling Method</td><td>Unit (discrete counts e.g., pieces, cans) or Measured (fractional values e.g., kg, liters).</td></tr>
          <tr><td>Inventory Type</td><td>Perishable (tracks batches and expiration dates) or Non-perishable (general stock count).</td></tr>
          <tr><td>Pricing Logic</td><td>Base Price is entered manually. Entering a Tax Rate (e.g. 12%) automatically computes and previews the tax-inclusive Display Price.</td></tr>
          <tr><td>Identifiers</td><td>SKU and Barcode inputs to hook items to POS barcode scan listeners.</td></tr>
          <tr><td>Sale Status</td><td>A toggle to set products as For Sale. Non-retail items (such as raw materials) can be configured and are filtered out from the cashier POS screen.</td></tr>
          <tr><td>Active Status</td><td>A checkbox to set products as Active. Inactive (archived) items are hidden from all cashier POS and inventory screens, but remain editable by administrators.</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: 'promotions',
    title: '6. Promotions & Discounts',
    component: <PromotionsSection />,
    rawHtml: `
      <h2>6. Promotions & Discounts</h2>
      <p><strong>Route:</strong> <code>/management/promotions</code> | <strong>Access:</strong> Admin (Full CRUD), Staff (Read-only promotions view)</p>
      <h3>1. Promotions Overview</h3>
      <p>The <strong>Promotions & Discounts</strong> page allows management of promotional campaigns, discount periods, and coupon codes. The system requires a valid, matching coupon code to be entered in the POS cart to activate promotion discounts.</p>
      <h3>2. Promotion Configuration Fields</h3>
      <p>Creating or editing a promotion opens a sidebar modal with the following parameters:</p>
      <table>
        <thead>
          <tr>
            <th>Config Parameter</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Promotion Name</td><td>Descriptive name of the campaign (e.g., Summer Sale 20% Off).</td></tr>
          <tr><td>Coupon Code</td><td>Optional alphanumeric code (e.g. SUMMER20). Must be unique. Cashiers must input this in the cart to trigger the promo discount.</td></tr>
          <tr><td>Discount Type</td><td>Percentage (%) or Fixed Amount (₱). Defines how the discount is computed.</td></tr>
          <tr><td>Value</td><td>The numeric value of the discount. Percentage is capped at 100%.</td></tr>
          <tr><td>Start Date &amp; End Date</td><td>The duration of the promotion. Automatically transitions between statuses based on the current time.</td></tr>
          <tr><td>Applies To</td><td>Define scope: All Products (entire store catalog) or Specific Products (using an interactive product multi-selector).</td></tr>
          <tr><td>Active Status</td><td>A toggle to activate or deactivate the promotion. Inactive promotions will not be applied under any condition.</td></tr>
        </tbody>
      </table>
      <h3>3. Promotion Statuses</h3>
      <p>Promotions are categorized into one of four statuses:</p>
      <ul>
        <li><strong>Active:</strong> Currently running promotions. Discount is applied during checkouts.</li>
        <li><strong>Upcoming:</strong> Scheduled promotions with start dates in the future.</li>
        <li><strong>Expired:</strong> Past promotions whose end dates have passed.</li>
        <li><strong>Deactivated:</strong> Disabled promotions (where the active toggle is turned off).</li>
      </ul>
      <h3>4. POS Integration &amp; Offline Mode</h3>
      <ul>
        <li><strong>Coupon Code Requirement:</strong> Promotions do not auto-apply. Cashiers must input the coupon code and click **Apply** in the cart area. Multiple coupon codes can be applied simultaneously to a single transaction.</li>
        <li><strong>Best Discount Selection:</strong> If a product qualifies for multiple active promotions matching any of the applied coupon codes, the system automatically calculates and applies the best discount per product.</li>
        <li><strong>Offline Support:</strong> Active promotions (including coupon codes) are stored in IndexedDB. Validity is verified locally client-side when offline, and promotional discount is saved to the local sync queue.</li>
        <li><strong>Receipt &amp; Invoices:</strong> Promo discounts are itemized, showing a "Save ₱X" badge in the cart, listing "Coupon Discounts" in totals, and mapping the Promo ID in the database.</li>
      </ul>
    `
  },
  {
    id: 'inventory',
    title: '7. Inventory Adjustments & Batches',
    component: <InventorySection />,
    rawHtml: `
      <h2>7. Inventory Adjustments & Batches</h2>
      <p><strong>Route:</strong> <code>/management/inventory</code> | <strong>Access:</strong> Admin, Staff</p>
      <h3>1. Stock Status Indicators</h3>
      <p>Each product shows a visual badge representing availability status: Healthy, Low Stock, or Out of Stock.</p>
      <h3>2. Batch Tracking &amp; Expirations</h3>
      <p>For perishable items, the system requires batch tracking. Each batch has a unique identification key, quantity, and expiration timestamp. Sales automatically deduct stock from the earliest expiring batch (FIFO logic). The total product stock calculation automatically excludes expired batches (where the expiration date has passed).</p>
      <h3>3. Stock Adjustments</h3>
      <table>
        <thead>
          <tr>
            <th>Adjustment Tool</th>
            <th>Operational Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Adjust Quantity</td><td>Instantly update the stock count of an existing batch to match physical inventories.</td></tr>
          <tr><td>Adjust Batch</td><td>Add a new inventory batch with a custom expiration date, or edit the date of an existing batch.</td></tr>
          <tr><td>Write Off Batch</td><td>Deduct stock for spoilage, theft, damage, or expiration. Requires recording an official reason. Updates the ledger history automatically.</td></tr>
        </tbody>
      </table>
      <h3>4. Activity Movement Logs</h3>
      <ul>
        <li><strong>All Activity List:</strong> A centralized chronological record displaying movement type (Sale, Manual Adjustment, Batch Intake, Write-off), unit changes, timestamps, and the logged-in staff persona.</li>
        <li><strong>Product History Drawer:</strong> Open any inventory page card to reveal a sidebar history trail detailing historical adjustments specific only to that item.</li>
      </ul>
    `
  },
  {
    id: 'sales',
    title: '8. Sales History, Void, & Refunds',
    component: <SalesSection />,
    rawHtml: `
      <h2>8. Sales History, Void, & Refunds</h2>
      <p><strong>Route:</strong> <code>/management/sales-history</code> | <strong>Access:</strong> Admin, Staff</p>
      <h3>1. Sales History Directory</h3>
      <p>A searchable ledger of every completed order. Rows show Order ID, timestamp, cashier name, customer name, transaction totals, and payment status.</p>
      <h3>2. Filter &amp; Search Tools</h3>
      <p>Narrow down transactions using the filters block: search by order IDs, customer names, or cashier names; or bound by custom date ranges.</p>
      <h3>3. Sales Row Actions</h3>
      <table>
        <thead>
          <tr>
            <th>Action Link</th>
            <th>Operation details</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>View Receipt</td><td>Re-open the thermal receipt format for printout or customer reference.</td></tr>
          <tr><td>Refund Item</td><td>Perform partial or full itemized refunds. Select exact line items and quantities, then select a reason.</td></tr>
          <tr><td>View Applied Refunds</td><td>Lists refund logs associated with this specific order.</td></tr>
          <tr><td>Void Transaction</td><td>Fully invalidate a transaction. Reverts inventory stock deductions and balances. Requires confirmation.</td></tr>
        </tbody>
      </table>
      <h3>4. Manual Sales Logs &amp; Refunds Ledger</h3>
      <ul>
        <li><strong>Record Manual Sale:</strong> Backdate or log a sales record completed outside the terminal interface. Form requires adding items, amounts, and customer context.</li>
        <li><strong>View All Refunds:</strong> Open a centralized refunds audit log auditing all partial/full transaction returns in the system.</li>
      </ul>
    `
  },
  {
    id: 'debt',
    title: '9. Customer Debt & Wizard',
    component: <DebtSection />,
    rawHtml: `
      <h2>9. Customer Debt & Wizard</h2>
      <h3>1. Customers Directory</h3>
      <p><strong>Route:</strong> <code>/management/customers</code> | <strong>Access:</strong> Admin, Staff</p>
      <p>Manage customer registration profiles: Name, Phone, Email, and physical Address. Includes actions to:</p>
      <ul>
        <li><strong>Edit Details:</strong> Update customer contact info and address.</li>
        <li><strong>Delete Profile:</strong> Permanently remove a customer profile (only if there are no outstanding financial ties).</li>
        <li><strong>Loyalty Points Indicator:</strong> View the customer's total accumulated rewards balance directly in the list table and the expanded details drawer.</li>
        <li><strong>Financial Overview:</strong> Click the TrendingUp graph icon to open a unified financial snapshot containing a combined Total Outstanding amount (running tab balance + remaining installment balances), running tab balance details, credit limit, unsettled item registers, and a status summary of active installment contracts.</li>
      </ul>
      <h3>2. Debt Wizard</h3>
      <p><strong>Route:</strong> <code>/debt-management/wizard</code></p>
      <p>A 4-step wizard to file an official credit transaction:</p>
      <ol>
        <li><strong>Customer:</strong> Search and select from the registry (displays loyalty points balance alongside their current ledger balance), or immediately click "+ Add New Customer" to register a profile.</li>
        <li><strong>Items:</strong> Add catalog items to the debt order. This records product units being released on credit.</li>
        <li><strong>Loan:</strong> Set an optional Cash Loan Amount (e.g. lending money), add descriptive notes, and select the transaction date.</li>
        <li><strong>Summary:</strong> Displays total items, cash loan value, and customer detail. Click Submit to create the debt record.</li>
      </ol>
      <h3>3. Customer Debt Accounts</h3>
      <p><strong>Route:</strong> <code>/debt-management/debts</code></p>
      <p>Lists all customers with debt accounts. Balance color: Red (positive balance) means the customer owes money. Green (negative balance) means they have a deposit credit.</p>
      <p>Click the Eye icon to view detailed unsettled credit purchases and settled history logs. Click Manage Account to execute:</p>
      <table>
        <thead>
          <tr>
            <th>Account Action</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>PAYMENT</td><td>Reduces customer balance. Records amount and method (Cash, Card, GCash, Bank).</td></tr>
          <tr><td>DEPOSIT</td><td>Customer advances cash. Decreases balance into negative/credit territory.</td></tr>
          <tr><td>WITHDRAW_DEPOSIT</td><td>Customer withdraws their advance credit.</td></tr>
          <tr><td>SETTLE</td><td>Admin/Staff clicks this to wipe customer balance to zero and mark all unsettled invoices as paid.</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: 'installments',
    title: '10. Installment Plans & Interests',
    component: <InstallmentSection />,
    rawHtml: `
      <h2>10. Installment Plans & Interests</h2>
      <p><strong>Route:</strong> <code>/installments</code> | <strong>Access:</strong> Admin, Staff</p>
      <p>Installments support purchasing inventory items via custom layaway contracts with monthly payments.</p>
      <h3>1. Contracts Directory Layout</h3>
      <p>The page is split into two functional panels:</p>
      <ul>
        <li><strong>Left Panel (Contracts List):</strong> Shows all system layaway contracts (paginated, 20 items per page). It features a debounced search filter (by customer or invoice), status tabs (All, Active, Completed, Defaulted), and a payment progress bar tracking total paid amount and percentage.</li>
        <li><strong>Right Panel (Contract Detail):</strong> Displays schedules and actions for the selected contract. If no contract is selected, it hosts the "+ New Installment Sale" wizard trigger.</li>
      </ul>
      <h3>2. Creating an Installment Sale</h3>
      <p>Click **+ New Installment Sale** in the right panel to launch the 4-step creation wizard:</p>
      <ol>
        <li><strong>Customer:</strong> Search and select from the registered customer profiles.</li>
        <li><strong>Products:</strong> Add catalog products and specify item quantities.</li>
        <li><strong>Terms:</strong> Configure the downpayment amount, payment method (Cash, GCash, Card, etc.), contract duration (months), and flat interest rate (%).</li>
        <li><strong>Confirm:</strong> Review the calculated monthly due and total interest (computed in real-time) before creating the contract.</li>
      </ol>
      <h3>3. Contract Schedule Logs</h3>
      <p>Selecting a contract from the list reveals its schedule breakdown: Month number, Due Date, Amount Due, Amount Paid, and Payment Status (Pending, Partial, Paid, Late, or Defaulted).</p>
      <h3>4. Contract Operations</h3>
      <table>
        <thead>
          <tr>
            <th>Contract Action</th>
            <th>Method details</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Record Payment</td><td>Receives a payment amount from the customer. The engine automatically cascades the money starting from the oldest outstanding monthly schedule.</td></tr>
          <tr><td>Write Off Contract</td><td>Mark a defaulted agreement as uncollectable. Wipes active schedules and changes status to Defaulted. Requires recording a write-off justification.</td></tr>
          <tr><td>Recover Debt</td><td>Enables receiving payments on a defaulted/written-off contract. Decreases loss values in database ledger reporting.</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: 'compliance',
    title: '11. BIR Compliance (X, Z-Reading & Journals)',
    component: <ComplianceSection />,
    rawHtml: `
      <h2>11. BIR Compliance (X, Z-Reading & Journals)</h2>
      <p><strong>Sub-Menu:</strong> Reports &amp; Compliance | <strong>Access:</strong> X-Reading (Admin, Staff), Z-Reading &amp; E-Journal (Admin only)</p>
      <h3>1. X-Reading</h3>
      <p><strong>Route:</strong> <code>/reports-compliance/x-reading</code></p>
      <p>Generates a temporary snapshot report of the selected terminal's daily activity: gross sales, net sales, voids, refunds, senior citizen discounts, tax values, and payment collections breakdown (Cash, Card, GCash, etc.). Non-persistent: no database commits.</p>
      <h3>2. Z-Reading</h3>
      <p><strong>Route:</strong> <code>/reports-compliance/z-reading</code></p>
      <p>The official daily closing procedure required for tax registry and audit logs: compiles active sales transactions, writes them into a permanent ledger lock, increments the Z-Counter, and resets daily counts. Non-reversible transaction.</p>
      <h3>3. Electronic Journal (E-Journal)</h3>
      <p><strong>Route:</strong> <code>/reports-compliance/e-journal</code></p>
      <p>A complete audit log of all system actions: logs transactions, refunds, logins, settings modifications, voided sales, and stock adjustments. Search and filter by keywords, terminal IDs, or cashier names.</p>
    `
  },
  {
    id: 'settings',
    title: '12. Terminals, Printers & Staff Configuration',
    component: <SettingsSection />,
    rawHtml: `
      <h2>12. Terminals, Printers & Staff Configuration</h2>
      <h3>1. System Settings Pages</h3>
      <p><strong>Route:</strong> <code>/settings</code> | <strong>Access:</strong> Admin, Staff (limited)</p>
      <ul>
        <li><strong>Scanner Selection Tab:</strong> Choose between Hardware Scanner (keyboard emulation) and Camera Scanner (using browser camera scanning overlay).</li>
        <li><strong>Business Profile (Admin Only):</strong> Configure Business Name, Address, TIN, MIN, and PTU authority. Toggle VAT Registered.</li>
        <li><strong>Register Terminals (Admin Only):</strong> Create and edit terminals. Select a terminal to assign the current browser device to that register instance.</li>
        <li><strong>Receipt Printer Tab:</strong> Set up connection configs: Serial (Baud Rate), USB (using WebUSB; requires Chrome or Edge), and Bluetooth (BLE Service/Characteristic UUIDs). Click Save & Connect to pair, and Test Print.</li>
        <li><strong>Subscription & Billing Status:</strong> Displays active account tier, billing type (VAT-registered or Non-VAT), subscription status (Active, Trial, Expired), and the expiry or renewal timestamp. The latest subscription details and expiration date are automatically retrieved from the online database and cached locally on user login. Features an external link to Ceintelly to extend billing or change plans.</li>
      </ul>
      <h3>2. Subscription Expiry Enforcement</h3>
      <p>The system enforces strict payment validation:</p>
      <ul>
        <li><strong>Blocking Redirect:</strong> If subscription status is marked as Expired, an overlay blocks all core actions (POS register, sales listings, reports).</li>
        <li><strong>Limited Settings View:</strong> Admins can still access the Settings page to inspect settings fields and click Extend Subscription to renew via the external payment portal.</li>
        <li><strong>Service-level Restriction:</strong> Core database services deny execution of new operations if the tenant subscription is expired.</li>
      </ul>
      <h3>3. Staff Accounts Registry</h3>
      <p><strong>Route:</strong> <code>/persona-management</code> | <strong>Access:</strong> Admin only</p>
      <p>Lists all registered staff users, passwords, display names, and roles. Manage creation, modification, credential resets, and account deletions.</p>
    `
  },
  {
    id: 'offline',
    title: '13. Offline Cache & Syncing',
    component: <OfflineSection />,
    rawHtml: `
      <h2>13. Offline Cache &amp; Syncing</h2>
      <h3>1. Offline State Execution</h3>
      <p>The application listens to network connection state changes. When offline, an amber "Offline" alert banner is shown. The catalog displays locally cached products stored in the browser's IndexedDB. Checkout operations save sale JSON payloads to a local sync queue in IndexedDB instead of failing.</p>
      <h3>2. Promotions Offline Cache</h3>
      <p>Active promotions (and their coupon codes) are cached in IndexedDB when loaded online. While offline, the system enforces promotion validity locally (matching coupon codes, start/end dates, active flag, product eligibility) using the same rules as the server-side database function. Discounts are calculated and displayed on the cart and receipt without requiring a network connection once a valid code is entered.</p>
      <h3>3. Sales Sync Queue</h3>
      <p>Click View Offline Sales in the alert banner to open the Offline Sales queue and review all transactions waiting to upload.</p>
      <h3>4. Background Upload Sync</h3>
      <p>Once internet connectivity is restored, the system displays a blue "Syncing N offline sales..." spinner alert. A background scheduler processes queued orders, sending each one to the server using the pos2_create_sale database function. Once uploaded, items are cleared from IndexedDB.</p>
    `
  },
  {
    id: 'architecture',
    title: '14. Security Guards & System Architecture',
    component: <ArchitectureSection />,
    rawHtml: `
      <h2>14. Security Guards & System Architecture</h2>
      <h3>1. Security Guard Wrappers</h3>
      <p>The system uses a nested routing wrapper layout in React Router: ProtectedRoute (validates Supabase auth token) → PersonaProtectedRoute (validates admin/staff PIN session) → Layout (renders sidebar and header context).</p>
      <h3>2. Client Cache Mapping</h3>
      <p>Local browser caches store offline values to maintain system performance: localStorage (terminal ID, business settings, printer config) and IndexedDB (catalog, customer tables, offline sales queue).</p>
      <h3>3. Troubleshooting Flow</h3>
      <ul>
        <li><strong>Receipt printer fails:</strong> Verify you are on a Chromium browser (Chrome or Edge). WebUSB/WebSerial are blocked on Firefox/Safari.</li>
        <li><strong>POS Checkout button disabled:</strong> A terminal MUST be selected in Settings. The system requires an active PTU profile to serialize invoice IDs correctly.</li>
        <li><strong>Sales Sync failures:</strong> If the connection cuts out mid-sync, the queue remains safely stored in IndexedDB. Reloading or reconnecting resumes syncing safely.</li>
      </ul>
    `
  }
]

const UserManual: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']))

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setOpenSections(new Set(chapters.map((c) => c.id)))
  const collapseAll = () => setOpenSections(new Set())

  const handleExportToWord = () => {
    const bodyContent = chapters
      .map((c) => c.rawHtml)
      .join('\n<hr style="border: 1px solid #e5e7eb; margin: 30px 0;" />\n')

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>CPOS Pro — User & System Manual</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; font-size: 24pt; text-align: center; }
          h2 { color: #1e3a8a; margin-top: 25px; font-size: 18pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
          h3 { color: #2563eb; margin-top: 20px; font-size: 14pt; }
          h4 { color: #1f2937; margin-top: 15px; font-size: 12pt; font-weight: bold; }
          p { margin-bottom: 10px; font-size: 11pt; }
          ul, ol { margin-bottom: 10px; padding-left: 20px; font-size: 11pt; }
          li { margin-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 10pt; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .note { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px; margin: 15px 0; font-size: 10pt; border-radius: 4px; }
          code { font-family: Consolas, monospace; background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <h1>CPOS Pro — User & System Manual</h1>
        <p style="text-align: center; color: #666;">Generated: ${new Date().toLocaleDateString()}</p>
        <hr style="border: 2px solid #1e3a8a; margin: 20px 0;" />
        ${bodyContent}
      </body>
      </html>
    `

    const blob = new Blob(['\ufeff' + htmlTemplate], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'CPOS_User_System_Manual.doc'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User &amp; System Manual</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Interactive operational reference guide for CPOS Pro.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Collapse All
            </button>
          </div>
          <button
            onClick={handleExportToWord}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span>Export to Word</span>
          </button>
        </div>
      </div>

      {/* Chapters list */}
      <div className="space-y-3">
        {chapters.map((chapter) => {
          const isOpen = openSections.has(chapter.id)
          return (
            <div
              key={chapter.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggle(chapter.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors group"
              >
                <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                  {chapter.title}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 bg-white">
                  <div className="pt-4">
                    {chapter.component}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-center text-gray-400">
        CPOS Pro — Licensed Business Software. All Rights Reserved.
      </p>
    </div>
  )
}

export default UserManual
