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
        Toggle view settings via the **View Mode Switcher** to optimize for your device form-factor:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Everything:</strong> Displays the product catalog on the left and the transaction cart on the right. Best for desktops.</li>
        <li><strong>Products:</strong> Maximizes catalog grid space. Best for selecting items on tablets or touch displays.</li>
        <li><strong>Cart &amp; Payments:</strong> Maximizes checkout panel, discounts, and payment methods list.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">3. Barcode Scanning</h3>
      <ul className="list-disc list-inside space-y-1.5 ml-2">
        <li><strong>Hardware Scanner:</strong> Plug-and-play keyboard emulation HID scanners. Set scanner mode to "Hardware" in Settings. Scans trigger the current action mode instantly.</li>
        <li><strong>Camera Scanner:</strong> Activate by toggling "Camera Scanner" in Settings. Click **Open Scanner** on the POS page to scan barcodes using your tablet/phone built-in camera feed. Supports single and multi-barcode scan queues.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">4. Cart calculations, Discounts, and Payments</h3>
      <div className="border-l-4 border-indigo-500 pl-3 py-1 space-y-2">
        <p><strong>Discount Types:</strong></p>
        <ul className="list-disc list-inside ml-2">
          <li><strong>Senior Citizen (SC) / Person with Disability (PWD):</strong> Applies a 20% discount on VAT-exclusive price and waives tax calculations for BIR compliance.</li>
          <li><strong>Regular Discount:</strong> A manual fixed Peso amount deducted from the grand total.</li>
        </ul>
        <p><strong>Split Payments:</strong></p>
        <p className="text-xs">
          Click "+ Add Payment" to allocate split payments (e.g. paying PHP 500 in Cash and PHP 200 via GCash). Enter Cash Tendered to automatically show change due.
        </p>
        <p><strong>Completion:</strong></p>
        <p className="text-xs">
          Ensure an active terminal is selected. Click "Complete Sale" to trigger the database transaction, update inventory batches, and open the ESC/POS Receipt printing prompt.
        </p>
      </div>
    </div>
  )
}
