// Minimal ESC/POS encoder for basic thermal printing
// Note: Many printers expect code pages other than UTF-8. For a baseline,
// we will send UTF-8 bytes which works on a subset of devices. Advanced
// mapping to specific code pages can be added later.

import type { ESCPOSEncoder } from './types'

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

export class SimpleESCPOSEncoder implements ESCPOSEncoder {
  private encoder = new TextEncoder()

  initialize(): Uint8Array {
    // Initialize printer, set default line spacing
    return new Uint8Array([0x1b, 0x40]) // ESC @
  }

  text(text: string): Uint8Array {
    return this.encoder.encode(text)
  }

  bold(on: boolean): Uint8Array {
    return new Uint8Array([0x1b, 0x45, on ? 1 : 0]) // ESC E n
  }

  align(mode: 'left' | 'center' | 'right'): Uint8Array {
    const m = mode === 'left' ? 0 : mode === 'center' ? 1 : 2
    return new Uint8Array([0x1b, 0x61, m]) // ESC a m
  }

  // Set character size.
  // widthMul: 1|2, heightMul: 1|2
  // ESC/POS uses GS ! n where n = (widthMul-1)<<4 | (heightMul-1)
  size(widthMul: 1 | 2, heightMul: 1 | 2): Uint8Array {
    const n = ((widthMul - 1) << 4) | (heightMul - 1)
    return new Uint8Array([0x1d, 0x21, n]) // GS ! n
  }

  newline(lines: number = 1): Uint8Array {
    return new Uint8Array(Array(lines).fill(0x0a))
  }

  cut(): Uint8Array {
    // Partial cut
    return new Uint8Array([0x1d, 0x56, 0x42, 0x10])
  }

  static join(parts: Uint8Array[]): Uint8Array {
    return concat(...parts)
  }
}

export function joinBytes(parts: Uint8Array[]): Uint8Array {
  return SimpleESCPOSEncoder.join(parts)
}
