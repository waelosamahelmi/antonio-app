/**
 * Star Printer Test - Star Graphic Mode
 * Using Star's native raster graphics commands
 * 
 * This mode should work on all Star printers
 */

import net from 'net';

const ESC = 0x1B;
const LF = 0x0A;

function encode(text) {
  return Array.from(text).map(c => c.charCodeAt(0));
}

function generateStarGraphicReceipt() {
  const cmd = [];
  
  console.log('Building Star Graphic Mode commands...\n');
  
  // Initialize
  console.log('→ ESC @ (Initialize)');
  cmd.push(ESC, 0x40);
  
  // Star Line Mode initialization
  console.log('→ ESC RS a 0 (Star Line Mode ON)');
  cmd.push(ESC, 0x1E, 0x61, 0x00);
  
  cmd.push(LF, LF);
  
  // Center alignment
  console.log('→ ESC GS a 1 (Center)');
  cmd.push(ESC, 0x1D, 0x61, 0x01);
  
  cmd.push(...encode('*** STAR LINE MODE TEST ***'));
  cmd.push(LF, LF);
  
  // Test character emphasis (Star Line Mode)
  console.log('→ ESC E (Emphasis ON)');
  cmd.push(ESC, 0x45);
  cmd.push(...encode('EMPHASIS TEST'));
  cmd.push(ESC, 0x46);
  console.log('→ ESC F (Emphasis OFF)');
  cmd.push(LF, LF);
  
  // Test character size (Star Line Mode: ESC i)
  console.log('→ ESC i 1 1 (Width 1, Height 1 = normal)');
  cmd.push(ESC, 0x69, 0x01, 0x01);
  cmd.push(...encode('Normal 1x1'));
  cmd.push(LF);
  
  console.log('→ ESC i 2 1 (Width 2, Height 1 = wide)');
  cmd.push(ESC, 0x69, 0x02, 0x01);
  cmd.push(...encode('Wide 2x1'));
  cmd.push(LF);
  
  console.log('→ ESC i 1 2 (Width 1, Height 2 = tall)');
  cmd.push(ESC, 0x69, 0x01, 0x02);
  cmd.push(...encode('Tall 1x2'));
  cmd.push(LF);
  
  console.log('→ ESC i 2 2 (Width 2, Height 2 = large)');
  cmd.push(ESC, 0x69, 0x02, 0x02);
  cmd.push(...encode('Large 2x2'));
  cmd.push(LF);
  
  console.log('→ ESC i 3 3 (Width 3, Height 3 = huge)');
  cmd.push(ESC, 0x69, 0x03, 0x03);
  cmd.push(...encode('HUGE 3x3'));
  cmd.push(LF);
  
  // Back to normal
  cmd.push(ESC, 0x69, 0x01, 0x01);
  cmd.push(LF, LF);
  
  // Test alignment
  console.log('→ ESC GS a 0 (Left align)');
  cmd.push(ESC, 0x1D, 0x61, 0x00);
  cmd.push(...encode('Left aligned text'));
  cmd.push(LF);
  
  console.log('→ ESC GS a 1 (Center align)');
  cmd.push(ESC, 0x1D, 0x61, 0x01);
  cmd.push(...encode('Center aligned text'));
  cmd.push(LF);
  
  console.log('→ ESC GS a 2 (Right align)');
  cmd.push(ESC, 0x1D, 0x61, 0x02);
  cmd.push(...encode('Right aligned text'));
  cmd.push(LF, LF, LF);
  
  // Combined test
  cmd.push(ESC, 0x1D, 0x61, 0x01); // Center
  cmd.push(ESC, 0x45); // Emphasis on
  cmd.push(ESC, 0x69, 0x02, 0x02); // 2x2
  cmd.push(...encode('FINAL TEST'));
  cmd.push(LF);
  cmd.push(...encode('2x2 + BOLD + CENTER'));
  cmd.push(ESC, 0x46); // Emphasis off
  cmd.push(ESC, 0x69, 0x01, 0x01); // Normal
  cmd.push(LF, LF, LF);
  
  // Feed and cut
  console.log('→ ESC d 2 (Feed and cut)');
  cmd.push(ESC, 0x64, 0x02);
  
  console.log('');
  return Buffer.from(cmd);
}

function sendToPrinter(host, port) {
  console.log(`🖨️  ===== STAR LINE MODE TEST =====`);
  console.log(`📍 Target: ${host}:${port}\n`);
  
  const receipt = generateStarGraphicReceipt();
  console.log(`📦 Generated ${receipt.length} bytes\n`);
  console.log(`Hex preview: ${receipt.toString('hex').substring(0, 100)}...\n`);
  
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
    console.log(`📤 Sending Star Line Mode commands...\n`);
    
    client.write(receipt, () => {
      console.log(`✅ Sent successfully!\n`);
      console.log(`Expected output:`);
      console.log(`  1. "EMPHASIS TEST" should be BOLD/DARK`);
      console.log(`  2. "Normal 1x1" - regular size`);
      console.log(`  3. "Wide 2x1" - stretched horizontally`);
      console.log(`  4. "Tall 1x2" - stretched vertically`);
      console.log(`  5. "Large 2x2" - doubled in both directions`);
      console.log(`  6. "HUGE 3x3" - tripled in both directions`);
      console.log(`  7. Three alignment tests (left/center/right)`);
      console.log(`  8. "FINAL TEST" - centered, bold, 2x2\n`);
      console.log(`If this STILL shows all same size,`);
      console.log(`check printer web UI at http://192.168.1.106`);
      console.log(`and verify emulation mode settings.\n`);
      
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
