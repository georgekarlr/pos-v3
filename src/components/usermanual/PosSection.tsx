import React from 'react'

export const PosSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <h3 className="text-base font-semibold text-gray-800">1. Action Modes</h3>
      <p>
        The <strong>Action Mode Bar</strong> changes how clicking items or scanning barcodes behaves:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Add (+):</strong> Clicks or barcode scans increment the product quantity by 1 unit.</li>
        <li><strong>Deduct (-):</strong> Decrements product quantity in the cart. If quantity drops to zero, the item is removed.</li>
        <li><strong>Bundle:</strong> Opens a numeric modal. Enter exact quantities directly (supports decimal inputs for measured items like kilograms).</li>
        <li><strong>Clear:</strong> Immediately deletes the selected product from the cart session.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Interface Layout View Modes</h3>
      <p>
        Toggle view settings via the <strong>View Mode Switcher</strong> to optimize for your device form-factor:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Everything:</strong> Displays the product catalog on the left and the transaction cart on the right. Best for desktops.</li>
        <li><strong>Products:</strong> Maximizes catalog grid space. Best for selecting items on tablets or touch displays.</li>
        <li><strong>Cart &amp; Payments:</strong> Maximizes checkout panel, discounts, and payment methods list.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Barcode Scanning</h3>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Hardware Scanner:</strong> Plug-and-play keyboard emulation HID scanners. Set scanner mode to "Hardware" in Settings. Scans trigger the current action mode instantly.</li>
        <li><strong>Camera Scanner:</strong> Activate by toggling "Camera Scanner" in Settings. Click <strong>Open Scanner</strong> on the POS page to scan barcodes using your tablet/phone built-in camera feed. Supports single and multi-barcode scan queues.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Discounts &amp; Promos</h3>
      <div className="border-l-4 border-indigo-500 pl-3 py-1 space-y-3">
        <div>
          <p className="font-semibold">SC/PWD Discount (20% + VAT Exempt)</p>
          <p className="text-xs mt-0.5">
            Toggle the <strong>SC/PWD Discount</strong> checkbox in the Checkout modal. When enabled, the system applies a 20% discount on the VAT-exclusive base price and makes all VATable items VAT-exempt for <strong>eligible products</strong> — both required for BIR compliance.
          </p>
          <p className="text-xs mt-1 text-amber-700 font-medium">
            ⚠ BIR Compliance: You must enter the SC/PWD beneficiary's <strong>Full Name</strong> and <strong>ID/Card Number</strong>. The "Complete Sale" button stays disabled until both fields are filled.
          </p>
        </div>
        <div>
          <p className="font-semibold">Promo Discount</p>
          <p className="text-xs mt-0.5">
            Discounts automatically applied based on active promotions. If a product is eligible for an active promotion, the discount is calculated automatically.
          </p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">5. Loyalty Program</h3>
      <div className="border-l-4 border-yellow-400 pl-3 py-1 space-y-2">
        <p className="text-xs">
          To use loyalty points, enter a <strong>Customer ID</strong> in the Checkout modal. The system fetches the customer's current point balance automatically.
        </p>
        <ul className="list-disc list-inside ml-2 text-xs space-y-1">
          <li><strong>Earn:</strong> Customers earn <strong>1 point per ₱1</strong> of their net purchase total. Points are awarded automatically at checkout.</li>
          <li><strong>Redeem:</strong> Enter the number of points to redeem (max = balance). Every point redeems for ₱1 off the order total. Use <em>Use All</em> to redeem the full balance.</li>
        </ul>
        <p className="text-xs text-gray-500">
          Points redemption reduces the order total before payment. A customer must be identified (Customer ID required) to earn or redeem.
        </p>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">6. Payments &amp; Completion</h3>
      <div className="border-l-4 border-green-500 pl-3 py-1 space-y-2">
        <p className="text-xs">
          <strong>Split Payments:</strong> Click "+ Add Payment" to allocate split payments (e.g. ₱500 Cash + ₱200 GCash). For Cash, enter Cash Tendered to show change due automatically.
        </p>
        <p className="text-xs">
          <strong>Completion:</strong> Ensure an active terminal is selected. Click "Complete Sale" to trigger the server-side transaction: it validates totals, updates inventory, records loyalty, and opens the receipt printing prompt.
        </p>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mt-4">7. Petty Cash &amp; Drawer Floats</h3>
      <div className="border-l-4 border-indigo-500 pl-3 py-1 space-y-2">
        <p className="text-xs">
          <strong>Starting Drawer Float (Cash In):</strong> Before ringing up transactions, cashiers can enter a starting drawer float using the <strong>Petty Cash</strong> button next to the terminal name. This logs a <code>CASH_IN</code> transaction event and increases the cash count in the drawer.
        </p>
        <p className="text-xs">
          <strong>Paid Out / Expenses (Cash Out):</strong> Cash taken directly from the register drawer to pay for store operational expenses (e.g., water deliveries, office supplies, courier fees) can be registered as a <code>CASH_OUT</code> transaction with the amount and description.
        </p>
        <p className="text-xs text-amber-700 font-medium">
          ⚠ Compliance &amp; Auditing: Petty cash operations require an active internet connection to safely log the audit trail. All actions are immediately recorded in the <strong>Electronic Journal</strong> as <code>CASH_IN</code> or <code>CASH_OUT</code> events, and are fully factored into the Cash Drawer collections breakdown during end-of-day <strong>Z-Readings</strong> and <strong>X-Readings</strong>.
        </p>
      </div>
    </div>
  )
}
