/**
 * ESC/POS Thermal Printer Command Formatter
 * Optimized for Android network printing with comprehensive command support
 */

import { ReceiptData, ReceiptSection, ReceiptItem, ESC_POS } from './types';

export class ESCPOSFormatter {
  private commands: number[] = [];
  
  constructor() {
    this.init();
  }

  /**
   * Initialize printer with standard settings
   */
  init(): ESCPOSFormatter {
    this.commands.push(...ESC_POS.INIT);
    this.commands.push(...ESC_POS.SET_CODEPAGE_CP850); // Set CP850 for European characters
    this.commands.push(...ESC_POS.ALIGN_LEFT);
    this.commands.push(...ESC_POS.SIZE_NORMAL);
    return this;
  }

  /**
   * Set text alignment
   */
  align(alignment: 'left' | 'center' | 'right'): ESCPOSFormatter {
    switch (alignment) {
      case 'left':
        this.commands.push(...ESC_POS.ALIGN_LEFT);
        break;
      case 'center':
        this.commands.push(...ESC_POS.ALIGN_CENTER);
        break;
      case 'right':
        this.commands.push(...ESC_POS.ALIGN_RIGHT);
        break;
    }
    return this;
  }

  /**
   * Set text size
   */
  size(size: 'normal' | 'large' | 'small' | 'double'): ESCPOSFormatter {
    switch (size) {
      case 'normal':
        this.commands.push(...ESC_POS.SIZE_NORMAL);
        break;
      case 'large':
        this.commands.push(...ESC_POS.SIZE_DOUBLE_BOTH);
        break;
      case 'double':
        this.commands.push(...ESC_POS.SIZE_DOUBLE_BOTH);
        break;
      case 'small':
        this.commands.push(...ESC_POS.SIZE_NORMAL);
        break;
    }
    return this;
  }

  /**
   * Set bold text
   */
  bold(enabled: boolean = true): ESCPOSFormatter {
    if (enabled) {
      this.commands.push(...ESC_POS.BOLD_ON);
    } else {
      this.commands.push(...ESC_POS.BOLD_OFF);
    }
    return this;
  }

  /**
   * Set underline text
   */
  underline(enabled: boolean = true): ESCPOSFormatter {
    if (enabled) {
      this.commands.push(...ESC_POS.UNDERLINE_ON);
    } else {
      this.commands.push(...ESC_POS.UNDERLINE_OFF);
    }
    return this;
  }

  /**
   * Add text with proper encoding for thermal printers
   */
  text(content: string): ESCPOSFormatter {
    // Convert to bytes using proper encoding for thermal printers with Finnish characters
    const bytes = this.encodeForThermalPrinter(content);
    this.commands.push(...bytes);
    return this;
  }

  /**
   * Encode text for thermal printer with proper character mapping for Finnish characters
   */
  private encodeForThermalPrinter(text: string): number[] {
    const bytes: number[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const code = text.charCodeAt(i);
      
      // Handle special characters for thermal printers
      switch (char) {
        // Euro symbol - remove completely to avoid display issues
        case '€':
          // Skip Euro symbol entirely - don't add any bytes
          break;
        // Finnish characters
        case 'ä':
          bytes.push(0x84); // CP850 encoding for ä
          break;
        case 'Ä':
          bytes.push(0x8E); // CP850 encoding for Ä
          break;
        case 'ö':
          bytes.push(0x94); // CP850 encoding for ö
          break;
        case 'Ö':
          bytes.push(0x99); // CP850 encoding for Ö
          break;
        case 'å':
          bytes.push(0x86); // CP850 encoding for å
          break;
        case 'Å':
          bytes.push(0x8F); // CP850 encoding for Å
          break;
        // Bullet point for toppings
        case '•':
          bytes.push(0x07); // Use bullet character
          break;
        // Standard ASCII characters (0-127)
        default:
          if (code < 128) {
            bytes.push(code);
          } else {
            // For other characters, try to use closest ASCII equivalent or question mark
            bytes.push(0x3F); // Question mark for unknown characters
          }
          break;
      }
    }
    
    return bytes;
  }

  /**
   * Add a line of text with newline
   */
  line(content: string = ''): ESCPOSFormatter {
    this.text(content);
    this.commands.push(...ESC_POS.FEED_LINE);
    return this;
  }

  /**
   * Add multiple empty lines
   */
  lines(count: number): ESCPOSFormatter {
    for (let i = 0; i < count; i++) {
      this.commands.push(...ESC_POS.FEED_LINE);
    }
    return this;
  }

  /**
   * Add a separator line
   */
  separator(char: string = '-', width: number = 48): ESCPOSFormatter {
    const separatorLine = char.repeat(width);
    this.line(separatorLine);
    return this;
  }

  /**
   * Format two-column text (item and price)
   */
  columns(left: string, right: string, width: number = 48): ESCPOSFormatter {
    const rightLen = right.length;
    const leftLen = Math.max(0, width - rightLen);
    const leftText = left.length > leftLen ? left.substring(0, leftLen - 3) + '...' : left;
    const padding = ' '.repeat(Math.max(0, width - leftText.length - rightLen));
    this.line(leftText + padding + right);
    return this;
  }

  /**
   * Cut paper
   */
  cut(full: boolean = false): ESCPOSFormatter {
    if (full) {
      this.commands.push(...ESC_POS.CUT_PAPER_FULL);
    } else {
      this.commands.push(...ESC_POS.CUT_PAPER);
    }
    return this;
  }

  /**
   * Format a complete receipt with enhanced ESC/POS commands for professional presentation
   */
  static formatReceipt(receiptData: ReceiptData, originalOrder?: any): Uint8Array {
    const formatter = new ESCPOSFormatter();

    // Header - Restaurant name with enhanced formatting
    formatter
      .align('center')
      .size('double')
      .bold(true)
      .underline(true)
      .line('Pizzeria Antonio')
      .underline(false)
      .bold(false)
      .size('normal')
      .lines(1)
      .separator('=', 48)
      .lines(1);

    // Order info with enhanced formatting
    formatter
      .align('left')
      .bold(true)
      .size('large')
      .line(`TILAUS #: ${receiptData.orderNumber}`)
      .size('normal')
      .bold(false)
      .line(`${receiptData.timestamp.toLocaleDateString('fi-FI')} ${receiptData.timestamp.toLocaleTimeString('fi-FI')}`)
      .lines(1)
      .separator('=', 48)
      .lines(1);

    // Customer information section with enhanced formatting
    if (receiptData.customerName || receiptData.customerPhone || receiptData.customerEmail) {
      formatter
        .bold(true)
        .size('large')
        .underline(true)
        .line('ASIAKASTIEDOT')
        .underline(false)
        .bold(false)
        .size('normal')
        .separator('-', 48)
        .lines(1);

      if (receiptData.customerName) {
        formatter.bold(true).line(`Nimi: ${receiptData.customerName}`).bold(false);
      }

      if (receiptData.customerPhone) {
        formatter.bold(true).line(`Puh: ${receiptData.customerPhone}`).bold(false);
      }

      if (receiptData.customerEmail) {
        const emailLine = `Email: ${receiptData.customerEmail}`;
        if (emailLine.length > 48) {
          formatter.bold(true).line(emailLine.substring(0, 48)).bold(false);
          formatter.line(emailLine.substring(48));
        } else {
          formatter.bold(true).line(emailLine).bold(false);
        }
      }

      if (receiptData.deliveryAddress) {
        formatter.bold(true).size('double').line(`Osoite:`).size('normal').bold(false);
        const addressLines = receiptData.deliveryAddress.split('\n');
        addressLines.forEach(line => {
          formatter.bold(true).size('double').line(line.trim()).size('normal').bold(false);
        });
      }

      formatter.lines(1).separator('-', 48).lines(1);
    }

    // Order type and payment with enhanced formatting
    const orderTypeText = receiptData.orderType === 'delivery' ? 'KOTIINKULJETUS' : 'NOUTO';
    formatter
      .bold(true)
      .size('large')
      .line(`Tyyppi: ${orderTypeText}`)
      .bold(false)
      .size('normal');

    // Payment method with enhanced formatting
    if (receiptData.paymentMethod) {
      formatter
        .bold(true)
        .size('large')
        .line(`Maksutapa: ${receiptData.paymentMethod.toUpperCase()}`)
        .bold(false)
        .size('normal');
      if (receiptData.paymentStatus) {
        formatter.line(`Maksun tila: ${receiptData.paymentStatus}`);
      }
    }

    if (receiptData.tableNumber) {
      formatter.bold(true).line(`Pöytä: ${receiptData.tableNumber}`).bold(false);
    }

    formatter.lines(2);

    // Items section with enhanced formatting
    formatter
      .separator('=', 48)
      .align('center')
      .bold(true)
      .size('double')
      .underline(true)
      .line('TUOTTEET')
      .underline(false)
      .bold(false)
      .size('normal')
      .separator('=', 48)
      .align('left')
      .lines(1);

    console.log(`🖨️ [ESC/POS] Formatting ${receiptData.items.length} items`);
    
    for (const item of receiptData.items) {
      console.log(`🖨️ [ESC/POS] Processing item: "${item.name}"`);
      
      // Extract size information for better display
      let displayName = item.name;
      let itemSize = 'normal';
      
      // Method 1: Check if item name already contains size in parentheses
      const sizeInNameMatch = item.name.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (sizeInNameMatch) {
        displayName = sizeInNameMatch[1].trim();
        itemSize = sizeInNameMatch[2].trim();
      } else if (item.notes) {
        // Method 2: Extract size from notes/special instructions
        const sizeMatch = item.notes.match(/Size:\s*([^;]+)/i);
        if (sizeMatch) {
          itemSize = sizeMatch[1].trim();
          if (itemSize && itemSize !== 'normal' && itemSize !== 'regular') {
            displayName = `${displayName} (${itemSize})`;
          }
        }
      } else if (originalOrder) {
        // Method 3: Check original order item data for size information
        const originalItems = originalOrder.orderItems || originalOrder.order_items || originalOrder.items || [];
        const matchingOriginalItem = originalItems.find((oi: any) => 
          (oi.menuItems?.name || oi.menu_items?.name || oi.name) === item.name.replace(/\s*\([^)]+\)$/, '')
        );
        
        if (matchingOriginalItem) {
          const specialInstructions = matchingOriginalItem.specialInstructions || 
                                    matchingOriginalItem.special_instructions || '';
          const sizeMatch = specialInstructions.match(/Size:\s*([^;]+)/i);
          if (sizeMatch) {
            itemSize = sizeMatch[1].trim();
            if (itemSize && itemSize !== 'normal' && itemSize !== 'regular') {
              displayName = `${displayName} (${itemSize})`;
            }
          }
        }
      }

      // Item separator with visual enhancement
      formatter.separator('-', 48);
      
      // Main item line - extra bold and large
      formatter
        .bold(true)
        .size('double')
        .columns(
          `${item.quantity}x ${displayName}`,
          `${item.totalPrice.toFixed(2)}`
        )
        .bold(false)
        .size('normal');

      // Toppings with enhanced formatting and conditional pricing support
      if (item.toppings && item.toppings.length > 0) {
        formatter
          .lines(1)
          .bold(true)
          .size('large')
          .line('  Lisätäytteet:')
          .bold(false)
          .size('normal');
        
        // Check for conditional pricing or legacy "Your Choice Pizza" (product ID 93)
        const originalItems = originalOrder ? (originalOrder.orderItems || originalOrder.order_items || originalOrder.items || []) : [];
        const matchingOriginalItem = originalItems.find((oi: any) => 
          (oi.menuItems?.name || oi.menu_items?.name || oi.name) === item.name.replace(/\s*\([^)]+\)$/, '')
        );
        
        // Check for conditional pricing
        const menuItemData = matchingOriginalItem ? 
          (matchingOriginalItem.menuItems || matchingOriginalItem.menu_items || matchingOriginalItem.menuItem || {}) : {};
        const hasConditionalPricing = menuItemData.hasConditionalPricing || menuItemData.has_conditional_pricing || false;
        const includedToppingsCount = menuItemData.includedToppingsCount || menuItemData.included_toppings_count || 0;
        
        // Legacy support: Check if this is "Your Choice Pizza" (product ID 93)
        const isYourChoicePizza = matchingOriginalItem && 
                 (matchingOriginalItem.menuItemId === 93 || 
                  matchingOriginalItem.menu_item_id === 93 ||
                  matchingOriginalItem.menuItems?.id === 93 ||
                  matchingOriginalItem.menu_items?.id === 93);
        
        // Determine number of free toppings
        const freeToppingCount = hasConditionalPricing ? includedToppingsCount : (isYourChoicePizza ? 4 : 0);
        
        // Count how many paid toppings have been made free so far
        let freeCount = 0;
        
        for (let i = 0; i < item.toppings.length; i++) {
          const topping = item.toppings[i];
          let adjustedPrice = topping.price;
          
          // Apply conditional pricing or legacy "first 4 free" logic
          // Only paid toppings (price > 0) count toward the free limit
          if (freeToppingCount > 0 && topping.price > 0 && freeCount < freeToppingCount) {
            adjustedPrice = 0; // Make this paid topping free
            freeCount++; // Count this as one of the free toppings
          } else {
            // Apply size-based pricing adjustments for paid toppings
            if (itemSize === "perhe" || itemSize === "family") {
              adjustedPrice = topping.price * 2;
            } else if ((itemSize === "large" || itemSize === "iso") && Math.abs(topping.price - 1.00) < 0.01) {
              adjustedPrice = 2.00;
            }
          }
          
          const toppingLine = `    + ${topping.name}`;
          let toppingPrice = '';
          
          if (freeToppingCount > 0 && topping.price > 0 && freeCount <= freeToppingCount && adjustedPrice === 0) {
            toppingPrice = 'ILMAINEN'; // Free in Finnish
          } else if (adjustedPrice > 0) {
            toppingPrice = `+${adjustedPrice.toFixed(2)}`;
          }
          
          if (toppingPrice) {
            formatter.bold(true).columns(toppingLine, toppingPrice).bold(false);
          } else {
            formatter.line(toppingLine);
          }
        }
      }

      // Special instructions (clean notes only, excluding size and toppings info)
      if (item.notes) {
        const cleanedNotes = item.notes
          .split(';')
          .filter(part => !part.trim().toLowerCase().startsWith('size:'))
          .filter(part => !part.trim().toLowerCase().startsWith('toppings:'))
          .map(part => part.trim())
          .filter(part => part.length > 0)
          .join('; ');
          
        if (cleanedNotes) {
          formatter
            .lines(1)
            .bold(true)
            .line(`  Huom: ${cleanedNotes}`)
            .bold(false);
        }
      }
      
      formatter.lines(1);
    }

    // Order-level Special Instructions with enhanced formatting
    if (originalOrder?.specialInstructions || originalOrder?.special_instructions) {
      const instructions = originalOrder.specialInstructions || originalOrder.special_instructions;
      formatter
        .lines(1)
        .separator('=', 48)
        .bold(true)
        .size('large')
        .underline(true)
        .line('TILAUKSEN ERIKOISOHJEET')
        .underline(false)
        .bold(false)
        .size('normal')
        .separator('-', 48)
        .lines(1);
      
      // Split long instructions into multiple lines
      const words = instructions.split(' ');
      let currentLine = '';
      
      words.forEach((word: string) => {
        if ((currentLine + ' ' + word).length > 48) {
          if (currentLine) {
            formatter.bold(true).line(currentLine).bold(false);
            currentLine = word;
          } else {
            formatter.bold(true).line(word.substring(0, 48)).bold(false);
          }
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        }
      });
      
      if (currentLine) {
        formatter.bold(true).line(currentLine).bold(false);
      }
      
      formatter.lines(1).separator('-', 48).lines(1);
    }

    // Totals section with enhanced formatting
    formatter.lines(1);
    
    if (originalOrder) {
      formatter
        .separator('=', 48)
        .align('center')
        .bold(true)
        .size('double')
        .underline(true)
        .line('YHTEENVETO')
        .underline(false)
        .bold(false)
        .size('normal')
        .separator('=', 48)
        .align('left')
        .lines(1);

      if (originalOrder.subtotal) {
        formatter.bold(true).size('large').columns('Välisumma:', `${parseFloat(originalOrder.subtotal).toFixed(2)}`).bold(false).size('normal');
      }

      if (originalOrder.deliveryFee && parseFloat(originalOrder.deliveryFee) > 0) {
        formatter.bold(true).size('large').columns('Toimitusmaksu:', `${parseFloat(originalOrder.deliveryFee).toFixed(2)}`).bold(false).size('normal');
      }

      if (originalOrder.smallOrderFee && parseFloat(originalOrder.smallOrderFee) > 0) {
        formatter.bold(true).size('large').columns('Pientilauslisa:', `${parseFloat(originalOrder.smallOrderFee).toFixed(2)}`).bold(false).size('normal');
      }

      if (originalOrder.discount && parseFloat(originalOrder.discount) > 0) {
        formatter.bold(true).size('large').columns('Alennus:', `-${parseFloat(originalOrder.discount).toFixed(2)}`).bold(false).size('normal');
      }

      formatter.lines(1);
      formatter.separator('=', 48);
      formatter
        .bold(true)
        .size('double')
        .columns('YHTEENSÄ:', `${receiptData.total.toFixed(2)}`)
        .bold(false)
        .size('normal');
      formatter.separator('=', 48);
    } else {
      formatter.separator('=', 48);
      formatter
        .bold(true)
        .size('double')
        .columns('YHTEENSÄ:', `${receiptData.total.toFixed(2)}`)
        .bold(false)
        .size('normal');
      formatter.separator('=', 48);
    }

    // Footer with enhanced thank you message
    formatter
      .lines(2)
      .separator('=', 48)
      .align('center')
      .bold(true)
      .size('large')
      .line('Kiitos tilauksestasi!')
      .line('Tervetuloa uudelleen!')
      .bold(false)
      .size('normal')
      .separator('=', 48)
      .lines(2);

    // Final spacing and cut
    formatter
      .lines(3)
      .cut();

    return new Uint8Array(formatter.commands);
  }

  /**
   * Format a test receipt
   */
  static formatTestReceipt(printerName: string, address: string, port: number): Uint8Array {
    const formatter = new ESCPOSFormatter();

    formatter
      .align('center')
      .size('large')
      .bold(true)
      .line('TEST PRINT')
      .bold(false)
      .size('large')
      .lines(1)
      .separator('=')
      .align('left')
      .line(`Printer: ${printerName}`)
      .line(`Address: ${address}:${port}`)
      .line(`Time: ${new Date().toLocaleString()}`)
      .line(`Status: CONNECTED`)
      .lines(1)
      .separator()
      .align('center')
      .line('Print Test Successful!')
      .line('All systems working correctly.')
      .lines(2)
      .align('left')
      .line('Characters: ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .line('Numbers: 0123456789')
      .line('Symbols: !@#$%^&*()_+-={}[]|\\:";\'<>?,./')
      .lines(1)
      .separator()
      .align('center')
      .line('Thank you for testing!')
      .lines(3)
      .cut();

    return new Uint8Array(formatter.commands);
  }

  /**
   * Format simple text content
   */
  static formatText(content: string): Uint8Array {
    const formatter = new ESCPOSFormatter();
    
    formatter
      .align('left')
      .size('large')
      .text(content)
      .lines(3)
      .cut();

    return new Uint8Array(formatter.commands);
  }

  /**
   * Format QR code (if printer supports it)
   */
  qrCode(data: string, size: number = 3): ESCPOSFormatter {
    // QR Code commands for ESC/POS printers that support it
    // GS ( k pL pH cn fn n1 n2 [data]
    const qrCommands = [
      0x1D, 0x28, 0x6B, // GS ( k
      0x04, 0x00, // pL pH (data length + 2)
      0x31, 0x41, // cn fn (QR code model)
      size, 0x00  // n1 n2 (module size)
    ];
    
    this.commands.push(...qrCommands);
    
    // Add data
    const dataBytes = new TextEncoder().encode(data);
    const dataLength = dataBytes.length + 3;
    
    this.commands.push(
      0x1D, 0x28, 0x6B, // GS ( k
      dataLength & 0xFF, (dataLength >> 8) & 0xFF, // pL pH
      0x31, 0x50, 0x30, // cn fn n (store QR data)
      ...Array.from(dataBytes)
    );
    
    // Print QR code
    this.commands.push(
      0x1D, 0x28, 0x6B, // GS ( k
      0x03, 0x00, // pL pH
      0x31, 0x51, 0x30 // cn fn n (print QR)
    );
    
    return this;
  }

  /**
   * Get the formatted commands as Uint8Array
   */
  build(): Uint8Array {
    return new Uint8Array(this.commands);
  }

  /**
   * Get the formatted commands as base64 string for Android bridge
   */
  buildBase64(): string {
    const uint8Array = this.build();
    const binary = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }

  /**
   * Reset the formatter
   */
  reset(): ESCPOSFormatter {
    this.commands = [];
    this.init();
    return this;
  }

  /**
   * Get command length
   */
  length(): number {
    return this.commands.length;
  }
}
