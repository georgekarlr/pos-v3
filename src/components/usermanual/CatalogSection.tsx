import React from 'react'

export const CatalogSection: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p>
        <strong>Route:</strong> <code className="bg-gray-100 px-1 rounded">/management/products</code> | <strong>Access:</strong> Admin (Full CRUD), Staff (Read-only catalog view)
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-2">1. Product Directory</h3>
      <p>
        The directory adapts gracefully: presenting detailed columns on desktop tables, and shifting to simplified cards on mobile devices.
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Search Bar:</strong> Real-time filtering by Product Name or exact Barcode values.</li>
        <li><strong>Refresh:</strong> Triggers `ProductService.getAllProducts()` to load updates from the Postgres database.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-4">2. Product Configuration Fields</h3>
      <p>
        Creating or editing a product opens a sidebar modal with the following parameters:
      </p>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Config Parameter</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Function</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Selling Method', 'Unit (discrete counts e.g., pieces, cans) or Measured (fractional values e.g., kg, liters).'],
              ['Inventory Type', 'Perishable (tracks batches and expiration dates) or Non-perishable (general stock count).'],
              ['Pricing Logic', 'Base Price is entered manually. Entering a Tax Rate (e.g. 12%) automatically computes and previews the tax-inclusive Display Price.'],
              ['Identifiers', 'SKU and Barcode inputs to hook items to POS barcode scan listeners.'],
              ['Sale Status', "A toggle to set products as Active/For Sale. Non-retail items (such as raw materials) can be configured and are filtered out from the cashier POS screen."]
            ].map(([param, desc]) => (
              <tr key={param} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{param}</td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
