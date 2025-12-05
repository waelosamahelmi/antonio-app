/**
 * Star Printer Test - Pure ESC/POS Mode
 * Testing basic ESC/POS commands
 * 
 * Usage: node test-escpos.js
 */

import net from 'net';

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

function encode(text) {
  return Array.from(text).map(c => c.charCodeAt(0));
}

function generateEscPosReceipt() {
  const cmd = [];
  
  console.log('Building ESC/POS commands...\n');
  
  // Initialize
  console.log('→ ESC @ (Initialize)');
  cmd.push(ESC, 0x40);
  
  // Center alignment
  console.log('→ ESC a 1 (Center align)');
  cmd.push(ESC, 0x61, 0x01);
  
  cmd.push(LF, LF);
  cmd.push(...encode('=== SIZE TEST ==='));
  cmd.push(LF, LF);
  
  // Test 1: Normal size (default)
  console.log('→ Normal size text');
  cmd.push(...encode('Normal Size (1x1)'));
  cmd.push(LF, LF);
  
  // Test 2: Double width and height (2x2)
  console.log('→ GS ! 0x11 (2x2 size)');
  cmd.push(GS, 0x21, 0x11);
  cmd.push(...encode('2x2 SIZE'));
  cmd.push(LF);
  
  // Back to normal
  console.log('→ GS ! 0x00 (back to normal)');
  cmd.push(GS, 0x21, 0x00);
  cmd.push(LF);
  
  // Test 3: Triple width and height (3x3)
  console.log('→ GS ! 0x22 (3x3 size)');
  cmd.push(GS, 0x21, 0x22);
  cmd.push(...encode('3x3'));
  cmd.push(LF);
  
  // Back to normal
  cmd.push(GS, 0x21, 0x00);
  cmd.push(LF, LF);
  
  // Test 4: Bold
  console.log('→ ESC E 1 (Bold on)');
  cmd.push(ESC, 0x45, 0x01);
  cmd.push(...encode('BOLD TEXT'));
  cmd.push(ESC, 0x45, 0x00);
  cmd.push(LF, LF);
  
  // Test 5: Underline
  console.log('→ ESC - 1 (Underline)');
  cmd.push(ESC, 0x2D, 0x01);
  cmd.push(...encode('UNDERLINED'));
  cmd.push(ESC, 0x2D, 0x00);
  cmd.push(LF, LF);
  
  // Test 6: Combined
  console.log('→ Combined: 2x2 + Bold');
  cmd.push(GS, 0x21, 0x11);
  cmd.push(ESC, 0x45, 0x01);
  cmd.push(...encode('LARGE BOLD'));
  cmd.push(ESC, 0x45, 0x00);
  cmd.push(GS, 0x21, 0x00);
  cmd.push(LF, LF, LF);
  
  // Test 7: Left align
  console.log('→ ESC a 0 (Left align)');
  cmd.push(ESC, 0x61, 0x00);
  cmd.push(...encode('Left aligned text'));
  cmd.push(LF);
  
  // Test 8: Right align
  console.log('→ ESC a 2 (Right align)');
  cmd.push(ESC, 0x61, 0x02);
  cmd.push(...encode('Right aligned'));
  cmd.push(LF, LF, LF);
  
  // Feed and cut
  console.log('→ GS V 0 (Cut paper)');
  cmd.push(GS, 0x56, 0x00);
  
  console.log('');
  return Buffer.from(cmd);
}

function sendToPrinter(host, port) {
  console.log(`🖨️  ===== ESC/POS MODE TEST =====`);
  console.log(`📍 Target: ${host}:${port}\n`);
  
  const receipt = generateEscPosReceipt();
  console.log(`📦 Generated ${receipt.length} bytes\n`);
  console.log(`First 50 bytes (hex): ${receipt.toString('hex').substring(0, 100)}\n`);
  
  const client = new net.Socket();
  
  client.setTimeout(5000);
  
  client.on('timeout', () => {
    console.error('❌ Timeout');
    client.destroy();
    process.exit(1);
  });
  
  client.on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  });
  
  client.on('connect', () => {
    console.log(`✅ Connected!`);
    console.log(`📤 Sending...\n`);
    
    client.write(receipt, () => {
      console.log(`✅ Sent successfully!\n`);
      console.log(`Expected output:`);
      console.log(`  ✓ "Normal Size (1x1)" - small text`);
      console.log(`  ✓ "2x2 SIZE" - medium text (2x normal)`);
      console.log(`  ✓ "3x3" - large text (3x normal)`);
      console.log(`  ✓ "BOLD TEXT" - darker/thicker`);
      console.log(`  ✓ "UNDERLINED" - with underline`);
      console.log(`  ✓ "LARGE BOLD" - big and dark\n`);
      console.log(`If ALL text looks the same size,`);
      console.log(`your printer may be in Line Mode or`);
      console.log(`needs ESC/POS emulation enabled.\n`);
      
      setTimeout(() => {
        client.end();
        process.exit(0);
      }, 1000);
    });
  });
  
  console.log(`🔌 Connecting...`);
  client.connect(port, host);
}

sendToPrinter('192.168.1.106', 9100);
