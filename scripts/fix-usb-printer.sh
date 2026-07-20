#!/usr/bin/env bash
# fix-usb-printer.sh
# Run ONCE to permanently allow Chrome/WebUSB to claim ANY USB receipt printer
# without needing "sudo modprobe -r usblp" on every reboot.
#
# Works for ALL USB printers (Epson, Star, GDMicro, Xprinter, etc.)
#
# Usage:  bash scripts/fix-usb-printer.sh

set -e

UDEV_RULE_FILE="/etc/udev/rules.d/99-usb-printer-webusb.rules"
BLACKLIST_FILE="/etc/modprobe.d/blacklist-usblp.conf"

echo "=== USB Printer WebUSB Fix (All Printers) ==="
echo ""

# 1. Permanently blacklist usblp for ALL USB printers
echo "[1/4] Blacklisting usblp kernel module (affects all USB printers)..."
echo "blacklist usblp" | sudo tee "$BLACKLIST_FILE" > /dev/null
echo "      -> Written: $BLACKLIST_FILE"

# 2. Create a broad udev rule covering ALL USB printer class devices (class 0x07).
#    Also covers vendor-specific class (0xff) used by many ESC/POS printers.
#    MODE=0666 lets Chrome/WebUSB open the device without root.
echo "[2/4] Creating broad udev rule for all USB printers..."
sudo tee "$UDEV_RULE_FILE" > /dev/null << 'UDEVRULES'
# Allow Chrome/WebUSB to access any USB printer without root.
# USB Printer class (bInterfaceClass == 07)
SUBSYSTEM=="usb", ENV{ID_USB_INTERFACES}=="*:070101:*", MODE="0666", GROUP="plugdev"
# Vendor-specific class (0xff) used by many ESC/POS receipt printers
SUBSYSTEM=="usb", ENV{ID_USB_INTERFACES}=="*:ff0101:*", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ENV{ID_USB_INTERFACES}=="*:ff0000:*", MODE="0666", GROUP="plugdev"
# Fallback: match on bDeviceClass directly (some printers set it at device level)
SUBSYSTEM=="usb", ATTR{bDeviceClass}=="07", MODE="0666", GROUP="plugdev"
UDEVRULES
echo "      -> Written: $UDEV_RULE_FILE"

# 3. Reload udev so the rule takes effect immediately (no reboot needed)
echo "[3/4] Reloading udev rules..."
sudo udevadm control --reload-rules
sudo udevadm trigger
echo "      -> Done."

# 4. Unload usblp from the running kernel right now
echo "[4/4] Unloading usblp from the current session..."
sudo modprobe -r usblp 2>/dev/null \
  && echo "      -> usblp unloaded." \
  || echo "      -> usblp was not loaded (already clean)."

echo ""
echo "Done! ANY USB receipt printer will now work with Chrome/WebUSB."
echo "This fix survives reboots — you will never need 'sudo modprobe -r usblp' again."
echo ""
echo "Replug the USB printer cable, then click Connect in the POS app."
