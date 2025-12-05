import { BLEConfig, PrinterConfig, PrinterTransport, SerialConfig, USBConfig, loadReceiptDesign, type ReceiptDesign } from './types'
import { BLETransport, SerialTransport, USBTransport } from './transports'
import { joinBytes, SimpleESCPOSEncoder } from './escpos'
import type { ReceiptData } from '../../components/pos/Receipt'

export function createTransport(cfg: PrinterConfig): PrinterTransport {
  switch (cfg.type) {
    case 'serial':
      return new SerialTransport(cfg as SerialConfig)
    case 'usb':
      return new USBTransport(cfg as USBConfig)
    case 'ble':
      return new BLETransport(cfg as BLEConfig)
    default:
      // @ts-ignore
      throw new Error('Unknown transport type: ' + (cfg as any)?.type)
  }
}

export function buildEscposFromReceipt(data: ReceiptData): Uint8Array {
  const enc = new SimpleESCPOSEncoder()
  const parts: Uint8Array[] = []
  const pushText = (t: string) => parts.push(enc.text(t))

  const design = withDesignDefaults(loadReceiptDesign())

  parts.push(enc.initialize())
  // Header (customizable block)
  if (design.headerText && design.headerText.trim().length > 0) {
    parts.push(enc.align((design.headerAlign ?? 'center') as any))
    parts.push(enc.bold(!!design.headerBold))
    parts.push(enc.size(design.headerSize === 'double' ? 2 : 1, design.headerSize === 'double' ? 2 : 1))
    pushText(design.headerText + '\n')
    parts.push(enc.bold(false))
    parts.push(enc.size(1, 1))
    parts.push(enc.newline())
  }

  // Business heading
  parts.push(enc.align('center'))
  parts.push(enc.bold(true))
  const storeName = (design as any).storeName?.trim() || data.businessName || 'POS Receipt'
  const storeAddress1 = (design as any).storeAddress1?.trim() || data.businessAddress1
  const storeAddress2 = (design as any).storeAddress2?.trim() || data.businessAddress2
  pushText(storeName + '\n')
  parts.push(enc.bold(false))
  if (storeAddress1) pushText(storeAddress1 + '\n')
  if (storeAddress2) pushText(storeAddress2 + '\n')
  parts.push(enc.newline())

  // Meta
  parts.push(enc.align('left'))
  const date = new Date(data.dateISO)
  pushText(`Order: #${data.orderId ?? '—'}\n`)
  pushText(`Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`)
  if (data.cashier) pushText(`Cashier: ${data.cashier}\n`)
  parts.push(enc.newline())

  // Main lines and totals formatted per design
  const lines = layoutReceiptLines(data, design)
  for (const line of lines) pushText(line + '\n')

  // Notes
  if (data.notes) {
    pushText(data.notes + '\n')
    parts.push(enc.newline())
  }
  // Footer
  if (design.footerText && design.footerText.trim().length > 0) {
    parts.push(enc.align((design.footerAlign ?? 'center') as any))
    parts.push(enc.bold(!!design.footerBold))
    parts.push(enc.size(design.footerSize === 'double' ? 2 : 1, design.footerSize === 'double' ? 2 : 1))
    pushText(design.footerText + '\n')
    parts.push(enc.bold(false))
    parts.push(enc.size(1, 1))
  } else {
    parts.push(enc.align('center'))
    pushText('Thank you for your business!\n')
  }
  parts.push(enc.newline(3))
  parts.push(enc.cut())
  return joinBytes(parts)
}

export async function printReceiptWithConfig(cfg: PrinterConfig, receipt: ReceiptData): Promise<void> {
  const transport = createTransport(cfg)
  await transport.connect({ requestDevice: true })
  try {
    const payload = buildEscposFromReceipt(receipt)
    await transport.write(payload)
  } finally {
    await transport.close()
  }
}

// --- Shared layout helpers ---
export function withDesignDefaults(design?: ReceiptDesign): Required<Pick<ReceiptDesign,
  'paperWidth' | 'itemLabel' | 'qtyLabel' | 'totalLabel' |
  'itemWidth' | 'qtyWidth' | 'totalWidth' |
  'itemAlign' | 'qtyAlign' | 'totalAlign' |
  'separatorChar' | 'showTopSeparator' | 'showHeaderSeparator' | 'showItemsSeparatorBottom'
>> & ReceiptDesign {
  const d = design || {}
  const paperWidth = d.paperWidth && d.paperWidth > 16 ? d.paperWidth : 32
  // defaults that fit 32 cols: item 18, qty 5, total 7, with 1 space between columns
  const itemWidth = d.itemWidth && d.itemWidth > 4 ? d.itemWidth : 18
  const qtyWidth = d.qtyWidth && d.qtyWidth > 2 ? d.qtyWidth : 5
  const spacing = 1
  let totalWidth = d.totalWidth && d.totalWidth > 4 ? d.totalWidth : (paperWidth - itemWidth - qtyWidth - spacing * 2)
  if (totalWidth < 4) totalWidth = 4
  const fit = itemWidth + qtyWidth + totalWidth + spacing * 2
  // If overflows, shrink item first
  if (fit > paperWidth) {
    const over = fit - paperWidth
    const newItem = Math.max(4, itemWidth - over)
    totalWidth = paperWidth - newItem - qtyWidth - spacing * 2
  }
  return {
    ...d,
    paperWidth,
    itemLabel: d.itemLabel ?? 'Item',
    qtyLabel: d.qtyLabel ?? 'Qty',
    totalLabel: d.totalLabel ?? 'Total',
    itemWidth,
    qtyWidth,
    totalWidth,
    itemAlign: d.itemAlign ?? 'left',
    qtyAlign: d.qtyAlign ?? 'right',
    totalAlign: d.totalAlign ?? 'right',
    separatorChar: d.separatorChar && d.separatorChar.length > 0 ? d.separatorChar[0] : '-',
    showTopSeparator: d.showTopSeparator ?? true,
    showHeaderSeparator: d.showHeaderSeparator ?? true,
    showItemsSeparatorBottom: d.showItemsSeparatorBottom ?? true,
  }
}

function alignText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
  const clipped = text.length > width ? text.slice(0, width) : text
  const spaces = Math.max(0, width - clipped.length)
  if (align === 'left') return clipped + ' '.repeat(spaces)
  if (align === 'right') return ' '.repeat(spaces) + clipped
  const left = Math.floor(spaces / 2)
  const right = spaces - left
  return ' '.repeat(left) + clipped + ' '.repeat(right)
}

function joinColumns(cols: string[], spacing = 1): string {
  return cols.join(' '.repeat(spacing))
}

function money(n: number): string {
  return `PHP ${n.toFixed(2)}`
}

export function layoutReceiptLines(data: ReceiptData, design?: ReceiptDesign): string[] {
  const d = withDesignDefaults(design)
  const lines: string[] = []
  const sep = (d.separatorChar || '-').repeat(d.paperWidth)
  const spacing = 1
  const head = joinColumns([
    alignText(d.itemLabel!, d.itemWidth!, d.itemAlign!),
    alignText(d.qtyLabel!, d.qtyWidth!, d.qtyAlign!),
    alignText(d.totalLabel!, d.totalWidth!, d.totalAlign!),
  ], spacing)

  if (d.showTopSeparator) lines.push(sep)
  lines.push(head)
  if (d.showHeaderSeparator) lines.push(sep)

  for (const l of data.lines) {
    const row = joinColumns([
      alignText(l.name, d.itemWidth!, d.itemAlign!),
      alignText(String(l.qty), d.qtyWidth!, d.qtyAlign!),
      alignText(money(l.lineTotal), d.totalWidth!, d.totalAlign!),
    ], spacing)
    lines.push(row)
    lines.push(alignText(`@ ${money(l.unitPrice)}`, d.paperWidth!, 'left'))
    if (l.refundedAmount && l.refundedAmount > 0) {
      lines.push(alignText(`Refunded -${money(l.refundedAmount)}`, d.paperWidth!, 'left'))
    }
  }

  if (d.showItemsSeparatorBottom) lines.push(sep)

  // Totals aligned to right side as value
  const pushTotal = (label: string, value: number) => {
    const v = money(value)
    const lbl = label + ': '
    const left = d.paperWidth! - v.length
    const text = alignText(lbl, Math.max(0, left), 'left') + v
    lines.push(text)
  }
  pushTotal('Subtotal', data.subtotal)
  pushTotal('Tax', data.tax)
  pushTotal('TOTAL', data.total)
  lines.push('')
  pushTotal('Total Paid', data.totalPaid)
  pushTotal('Change', data.change)
  lines.push('')

  return lines
}
