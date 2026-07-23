import React from 'react'

interface ScenarioProps {
  number: string
  title: string
  badge: string
  badgeColor: string
  children: React.ReactNode
}

const Scenario: React.FC<ScenarioProps> = ({ number, title, badge, badgeColor, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scenario {number}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
      <span className="font-semibold text-gray-800 text-sm">{title}</span>
    </div>
    <div className="p-4 space-y-3 text-sm text-gray-700">{children}</div>
  </div>
)

const ReceiptBlock: React.FC<{ lines: string[] }> = ({ lines }) => (
  <div className="bg-gray-900 text-green-300 font-mono text-xs rounded p-3 whitespace-pre leading-relaxed overflow-x-auto">
    {lines.join('\n')}
  </div>
)

const MathRow: React.FC<{ label: string; value: string; highlight?: boolean; indent?: boolean }> = ({
  label, value, highlight, indent
}) => (
  <div className={`flex justify-between items-baseline text-xs ${indent ? 'ml-4' : ''} ${highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
)

const Rule: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs bg-amber-50 border-l-4 border-amber-400 pl-3 py-1.5 text-amber-800 font-medium rounded-r">
    ⚖️ BIR Rule: {children}
  </div>
)

export const TaxScenariosSection: React.FC = () => {
  return (
    <div className="space-y-5 text-sm text-gray-700">

      {/* Reference Products */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
        <p className="font-semibold text-indigo-900 text-xs uppercase tracking-wider">Reference Products Used in All Examples</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-indigo-700 border-b border-indigo-200">
                <th className="pb-1 pr-4 font-semibold">Item</th>
                <th className="pb-1 pr-4 font-semibold">Tax Type</th>
                <th className="pb-1 pr-4 font-semibold">SC Eligible</th>
                <th className="pb-1 pr-4 font-semibold">Base Price</th>
                <th className="pb-1 font-semibold">Shelf Price (VAT-incl.)</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-indigo-100">
                <td className="py-1 pr-4 font-medium">A — Steak</td>
                <td className="py-1 pr-4">VATable (12%)</td>
                <td className="py-1 pr-4 text-green-700 font-semibold">✓ Yes</td>
                <td className="py-1 pr-4 tabular-nums">₱1,000.00</td>
                <td className="py-1 tabular-nums">₱1,120.00</td>
              </tr>
              <tr className="border-b border-indigo-100">
                <td className="py-1 pr-4 font-medium">B — Wine</td>
                <td className="py-1 pr-4">VATable (12%)</td>
                <td className="py-1 pr-4 text-red-600 font-semibold">✗ No</td>
                <td className="py-1 pr-4 tabular-nums">₱500.00</td>
                <td className="py-1 tabular-nums">₱560.00</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">C — Rice</td>
                <td className="py-1 pr-4">Zero-Rated / Exempt</td>
                <td className="py-1 pr-4 text-gray-500">N/A</td>
                <td className="py-1 pr-4 tabular-nums">₱100.00</td>
                <td className="py-1 tabular-nums">₱100.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario 1 */}
      <Scenario number="1" title="Standard Regular Sale (VAT Business, No Discounts)" badge="VAT" badgeColor="bg-blue-100 text-blue-700">
        <p><strong>Customer:</strong> Regular Walk-in &nbsp;|&nbsp; <strong>Cart:</strong> 1× Steak + 1× Wine</p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Math Breakdown</p>
          <MathRow label="Steak Shelf Price" value="₱1,120.00" />
          <MathRow label="Wine Shelf Price" value="₱560.00" />
          <MathRow label="Gross Subtotal (sum of shelf prices)" value="₱1,680.00" />
          <MathRow label="VAT Amount — (1,000 + 500) × 12%" value="₱180.00" />
          <MathRow label="TOTAL DUE" value="₱1,680.00" highlight />
          <p className="text-xs text-gray-500 italic">Note: VAT is already embedded in the shelf prices; the total does not increase further.</p>
        </div>
        <ReceiptBlock lines={[
          'Steak               1       ₱1,120.00',
          'Wine                1         ₱560.00',
          '-------------------------------------',
          'Subtotal                    ₱1,680.00',
          'TOTAL DUE                   ₱1,680.00',
          '=====================================',
          'VAT BREAKDOWN',
          'VATable Sales               ₱1,500.00',
          'VAT Amount (12%)              ₱180.00',
          'VAT-Exempt Sales                ₱0.00',
        ]} />
      </Scenario>

      {/* Scenario 2 */}
      <Scenario number="2" title="Non-VAT Business Sale" badge="NON-VAT" badgeColor="bg-gray-200 text-gray-700">
        <p><strong>Business Setting:</strong> <code className="bg-gray-100 px-1 rounded">billing_type = 'NON-VAT'</code> &nbsp;|&nbsp; <strong>Cart:</strong> 1× Steak + 1× Wine</p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Math Breakdown</p>
          <MathRow label="VAT forced to ₱0.00 — base prices used directly" value="" />
          <MathRow label="Steak Base" value="₱1,000.00" />
          <MathRow label="Wine Base" value="₱500.00" />
          <MathRow label="TOTAL DUE" value="₱1,500.00" highlight />
          <p className="text-xs text-gray-500 italic">No VAT breakdown section is printed on non-VAT receipts.</p>
        </div>
        <ReceiptBlock lines={[
          'NON-VAT Reg TIN: 123-456-789',
          '-------------------------------------',
          'Steak               1       ₱1,000.00',
          'Wine                1         ₱500.00',
          '-------------------------------------',
          'Subtotal                    ₱1,500.00',
          'TOTAL DUE                   ₱1,500.00',
          '(No VAT breakdown printed)',
        ]} />
      </Scenario>

      {/* Scenario 3 */}
      <Scenario number="3" title="Senior Citizen / PWD Sale (No Promos Active)" badge="SC/PWD" badgeColor="bg-purple-100 text-purple-700">
        <p><strong>Customer:</strong> Senior Citizen (ID provided) &nbsp;|&nbsp; <strong>Cart:</strong> 1× Steak (eligible) + 1× Wine (ineligible)</p>
        <Rule>
          VAT is ALWAYS removed for SC/PWD-eligible items. A 20% SC discount is applied on the VAT-exclusive base price.
          Ineligible items (alcohol, luxury) continue to carry standard VAT.
        </Rule>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Math Breakdown — Item by Item</p>
          <MathRow label="Steak: Remove 12% VAT  (₱1,120 → ₱1,000 base)" value="" indent />
          <MathRow label="Steak: SC 20% discount  (₱1,000 × 20%)" value="-₱200.00" indent />
          <MathRow label="Steak Net Price (VAT-Exempt)" value="₱800.00" indent />
          <MathRow label="Wine: Standard VAT retained (ineligible)" value="₱560.00" indent />
          <div className="border-t border-gray-200 my-1" />
          <MathRow label="Gross Subtotal (original shelf prices)" value="₱1,680.00" />
          <MathRow label="Less: VAT Exemption (12% on Steak)" value="-₱120.00" />
          <MathRow label="Less: SC/PWD Discount (20% on ₱1,000)" value="-₱200.00" />
          <MathRow label="TOTAL DUE" value="₱1,360.00" highlight />
        </div>
        <ReceiptBlock lines={[
          'Steak               1       ₱1,120.00  (VATable)',
          'Wine                1         ₱560.00  (VATable)',
          '-------------------------------------',
          'Subtotal                    ₱1,680.00',
          'Less: VAT Exemption          -₱120.00',
          'Less: SC/PWD Discount        -₱200.00',
          '=====================================',
          'TOTAL DUE                   ₱1,360.00',
          '=====================================',
          'VAT BREAKDOWN',
          'VATable Sales                 ₱500.00  (Wine Base)',
          'VAT Amount (12%)               ₱60.00  (Wine VAT)',
          'VAT-Exempt Sales              ₱800.00  (Steak Net After SC)',
        ]} />
      </Scenario>

      {/* Scenario 4 */}
      <Scenario number="4" title="Promotional Sale Only (No SC/PWD ID)" badge="PROMO" badgeColor="bg-green-100 text-green-700">
        <p><strong>Promo:</strong> "10% Off Everything" (SUMMER10) &nbsp;|&nbsp; <strong>Cart:</strong> 1× Steak + 1× Wine</p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Math Breakdown</p>
          <MathRow label="Steak: ₱1,000 base − 10% = ₱900 base. VAT = ₱108. Display = ₱1,008" value="" indent />
          <MathRow label="Steak promo saving (VAT-incl)" value="-₱112.00" indent />
          <MathRow label="Wine: ₱500 base − 10% = ₱450 base. VAT = ₱54. Display = ₱504" value="" indent />
          <MathRow label="Wine promo saving (VAT-incl)" value="-₱56.00" indent />
          <div className="border-t border-gray-200 my-1" />
          <MathRow label="Gross Subtotal (original shelf prices)" value="₱1,680.00" />
          <MathRow label="Less: Total Promo Discount (₱112 + ₱56)" value="-₱168.00" />
          <MathRow label="TOTAL DUE" value="₱1,512.00" highlight />
        </div>
        <ReceiptBlock lines={[
          'Steak               1       ₱1,008.00',
          'Wine                1         ₱504.00',
          '-------------------------------------',
          'Subtotal                    ₱1,680.00',
          'Less: Promo Discount         -₱168.00',
          '=====================================',
          'TOTAL DUE                   ₱1,512.00',
          '=====================================',
          'VAT BREAKDOWN',
          'VATable Sales               ₱1,350.00  (900 + 450)',
          'VAT Amount (12%)              ₱162.00  (108 + 54)',
        ]} />
      </Scenario>

      {/* Scenario 5 */}
      <Scenario number="5" title="Mixed Cart — 10% Promo AND 20% SC/PWD" badge="SC/PWD + PROMO" badgeColor="bg-orange-100 text-orange-700">
        <p><strong>Cart:</strong> 1× Steak (eligible, 10% promo) + 1× Wine (ineligible, 10% promo)</p>
        <Rule>
          "Whichever is more favorable to the Senior Citizen." Per-item evaluation — no double discounting ever.
        </Rule>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Per-Item Evaluation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white border border-gray-200 rounded p-2 space-y-1 text-xs">
              <p className="font-semibold text-gray-700">Item A — Steak (Eligible)</p>
              <MathRow label="Option A — Promo 10%: pays" value="₱1,008.00" />
              <MathRow label="Option B — SC/PWD 20% + VAT Exempt: pays" value="₱800.00" />
              <p className="text-purple-700 font-bold">✓ SC/PWD WINS → Promo dropped for Steak</p>
            </div>
            <div className="bg-white border border-gray-200 rounded p-2 space-y-1 text-xs">
              <p className="font-semibold text-gray-700">Item B — Wine (Ineligible)</p>
              <MathRow label="Option A — Promo 10%: pays" value="₱504.00" />
              <MathRow label="Option B — SC/PWD: Ineligible" value="N/A" />
              <p className="text-green-700 font-bold">✓ PROMO WINS → Applied on Wine</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-1 space-y-1">
            <MathRow label="Gross Subtotal (original shelf prices)" value="₱1,624.00" />
            <MathRow label="Less: VAT Exemption (Steak 12%)" value="-₱120.00" />
            <MathRow label="Less: SC/PWD Discount (Steak 20%)" value="-₱200.00" />
            <MathRow label="TOTAL DUE  (₱800 Steak + ₱504 Wine)" value="₱1,304.00" highlight />
          </div>
        </div>
        <ReceiptBlock lines={[
          'Steak               1       ₱1,120.00',
          'Wine                1         ₱504.00',
          '-------------------------------------',
          'Subtotal                    ₱1,624.00',
          'Less: VAT Exemption          -₱120.00',
          'Less: SC/PWD Discount        -₱200.00',
          '=====================================',
          'TOTAL DUE                   ₱1,304.00',
          '=====================================',
          'VAT BREAKDOWN',
          'VATable Sales                 ₱450.00  (Wine Base after Promo)',
          'VAT Amount (12%)               ₱54.00  (Wine VAT)',
          'VAT-Exempt Sales              ₱800.00  (Steak Base after SC)',
        ]} />
      </Scenario>

      {/* Scenario 6 */}
      <Scenario number="6" title="50% Flash Sale vs 20% SC/PWD — VAT Exemption Retention" badge="PROMO WINS + VAT EXEMPT" badgeColor="bg-red-100 text-red-700">
        <p><strong>Cart:</strong> 1× Steak (eligible, 50% Flash Promo active)</p>
        <Rule>
          When a promo is more favorable than the 20% SC discount, the promo wins — but the customer
          <strong> still retains VAT exemption</strong>. The 12% VAT is NEVER added back on top of an SC/PWD-eligible item.
        </Rule>
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-white border border-gray-200 rounded p-2 space-y-1">
              <p className="font-semibold text-gray-700">Evaluation</p>
              <MathRow label="Option A — 50% Promo Base" value="₱500.00" />
              <MathRow label="Option B — 20% SC Base" value="₱800.00" />
              <p className="text-green-700 font-bold">✓ PROMO WINS (₱500 &lt; ₱800)</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-2 space-y-1">
              <p className="font-semibold text-purple-800">VAT Exemption Retained!</p>
              <p className="text-purple-700">Because SC ID was presented, 12% VAT = ₱0.</p>
              <p className="text-purple-700">We do <strong>NOT</strong> add ₱60 VAT onto the ₱500 base.</p>
              <p className="text-purple-700">Customer pays: <strong>₱500.00 VAT-Exempt</strong></p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-1 space-y-1 text-xs">
            <MathRow label="Gross Subtotal (original shelf price)" value="₱1,120.00" />
            <MathRow label="Less: VAT Exemption (12% removed)" value="-₱120.00" />
            <MathRow label="Less: 50% Promo Discount (on ₱1,000 base)" value="-₱500.00" />
            <MathRow label="TOTAL DUE (VAT-Exempt)" value="₱500.00" highlight />
          </div>
        </div>
        <ReceiptBlock lines={[
          'Steak               1       ₱1,120.00',
          '-------------------------------------',
          'Subtotal                    ₱1,120.00',
          'Less: VAT Exemption          -₱120.00  ← (12% VAT removed)',
          'Less: Promo Discount (50%)   -₱500.00  ← (50% Promo applied)',
          '=====================================',
          'TOTAL DUE                     ₱500.00  (VAT-Exempt)',
          '=====================================',
          'VAT BREAKDOWN',
          'VATable Sales                   ₱0.00',
          'VAT Amount (12%)                ₱0.00',
          'VAT-Exempt Sales              ₱500.00  ← (Steak Base after Promo)',
        ]} />
      </Scenario>

    </div>
  )
}
