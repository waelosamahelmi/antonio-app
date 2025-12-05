/**
 * Finnish Character Encoding Test
 * Testing all possible encodings for ä, ö, å
 */

import net from 'net';

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

function init(cmd) {
  cmd.push(ESC, 0x40); // Initialize
  cmd.push(ESC, 0x1E, 0x61, 0x00); // Star Line Mode ON
}

function setSize(cmd, height, width) {
  cmd.push(ESC, 0x69, height, width);
}

function setAlign(cmd, align) {
  cmd.push(ESC, GS, 0x61, align);
}

function emphasisOn(cmd) {
  cmd.push(ESC, 0x45);
}

function emphasisOff(cmd) {
  cmd.push(ESC, 0x46);
}

function newline(cmd, count = 1) {
  for (let i = 0; i < count; i++) cmd.push(LF);
}

function feedAndCut(cmd) {
  cmd.push(ESC, 0x64, 0x02);
}

// Encoding test functions
const encodings = [
  {
    name: 'CP437 (IBM PC)',
    encode: (c) => {
      const map = { 'ä': 0x84, 'ö': 0x94, 'å': 0x86, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'CP850 (Multilingual)',
    encode: (c) => {
      const map = { 'ä': 0x83, 'ö': 0x94, 'å': 0x86, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'CP865 (Nordic)',
    encode: (c) => {
      const map = { 'ä': 0x84, 'ö': 0x94, 'å': 0x86, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'ISO-8859-1',
    encode: (c) => {
      const map = { 'ä': 0xE4, 'ö': 0xF6, 'å': 0xE5, 'Ä': 0xC4, 'Ö': 0xD6, 'Å': 0xC5 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Windows-1252',
    encode: (c) => {
      const map = { 'ä': 0xE4, 'ö': 0xF6, 'å': 0xE5, 'Ä': 0xC4, 'Ö': 0xD6, 'Å': 0xC5 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'ASCII Substitution',
    encode: (c) => {
      const map = { 'ä': 0x7B, 'ö': 0x7C, 'å': 0x7D, 'Ä': 0x5B, 'Ö': 0x5C, 'Å': 0x5D };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Star Nordic Alt 1',
    encode: (c) => {
      const map = { 'ä': 0x91, 'ö': 0x92, 'å': 0x93, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Star Nordic Alt 2',
    encode: (c) => {
      const map = { 'ä': 0x81, 'ö': 0x82, 'å': 0x83, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'UTF-8 Direct',
    encode: (c) => {
      const utf8 = Buffer.from(c, 'utf8');
      return utf8[0];
    }
  },
  {
    name: 'CP437 Alt Ä',
    encode: (c) => {
      const map = { 'ä': 0x84, 'ö': 0x94, 'å': 0x86, 'Ä': 0x84, 'Ö': 0x94, 'Å': 0x86 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Test 0xE0-0xE6',
    encode: (c) => {
      const map = { 'ä': 0xE0, 'ö': 0xE1, 'å': 0xE2, 'Ä': 0xE3, 'Ö': 0xE4, 'Å': 0xE5 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Test 0x80-0x85',
    encode: (c) => {
      const map = { 'ä': 0x80, 'ö': 0x81, 'å': 0x82, 'Ä': 0x83, 'Ö': 0x84, 'Å': 0x85 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Test 0x90-0x95',
    encode: (c) => {
      const map = { 'ä': 0x90, 'ö': 0x91, 'å': 0x92, 'Ä': 0x93, 'Ö': 0x94, 'Å': 0x95 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Test 0xA0-0xA5',
    encode: (c) => {
      const map = { 'ä': 0xA0, 'ö': 0xA1, 'å': 0xA2, 'Ä': 0xA3, 'Ö': 0xA4, 'Å': 0xA5 };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'CP850 Alt',
    encode: (c) => {
      const map = { 'ä': 0x91, 'ö': 0x94, 'å': 0x86, 'Ä': 0x8E, 'Ö': 0x99, 'Å': 0x8F };
      return map[c] || c.charCodeAt(0);
    }
  },
  {
    name: 'Raw UTF-8 Multi',
    encode: (c) => {
      const utf8 = Buffer.from(c, 'utf8');
      return utf8;
    },
    isMultiByte: true
  }
];

function text(cmd, str, encoder) {
  for (let c of str) {
    const encoded = encoder(c);
    if (Array.isArray(encoded)) {
      cmd.push(...encoded);
    } else if (Buffer.isBuffer(encoded)) {
      cmd.push(...encoded);
    } else {
      cmd.push(encoded);
    }
  }
}

function generateTest() {
  const cmd = [];
  
  init(cmd);
  
  setAlign(cmd, 1); // Center
  newline(cmd, 2);
  
  emphasisOn(cmd);
  setSize(cmd, 2, 2);
  text(cmd, 'FINNISH CHARACTER TEST', (c) => c.charCodeAt(0));
  newline(cmd);
  emphasisOff(cmd);
  
  setSize(cmd, 1, 1);
  newline(cmd);
  text(cmd, 'Testing: ä ö å Ä Ö Å', (c) => c.charCodeAt(0));
  newline(cmd, 2);
  
  setAlign(cmd, 0); // Left
  
  // Test each encoding
  encodings.forEach((enc, index) => {
    const num = String(index + 1).padStart(2, '0');
    
    // Method name
    text(cmd, `${num}. ${enc.name}`, (c) => c.charCodeAt(0));
    newline(cmd);
    
    // Test characters
    text(cmd, '    ', (c) => c.charCodeAt(0));
    text(cmd, 'ä ö å Ä Ö Å', enc.encode);
    newline(cmd, 2);
  });
  
  newline(cmd);
  setAlign(cmd, 1);
  emphasisOn(cmd);
  text(cmd, 'Which number works?', (c) => c.charCodeAt(0));
  newline(cmd);
  emphasisOff(cmd);
  newline(cmd, 3);
  
  feedAndCut(cmd);
  
  return Buffer.from(cmd);
}

function sendToPrinter(host, port) {
  console.log(`\n🔤 ===== FINNISH CHARACTER TEST =====`);
  console.log(`📍 Target: ${host}:${port}`);
  console.log(`🧪 Testing ${encodings.length} encoding methods\n`);
  
  const receipt = generateTest();
  console.log(`📦 Generated ${receipt.length} bytes\n`);
  
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
    console.log(`📤 Sending character encoding tests...\n`);
    
    client.write(receipt, () => {
      console.log(`✅ Test sent!\n`);
      console.log(`📋 ENCODINGS TESTED:\n`);
      encodings.forEach((enc, i) => {
        console.log(`   ${String(i + 1).padStart(2, '0')}. ${enc.name}`);
      });
      console.log(``);
      console.log(`📝 CHECK THE RECEIPT:`);
      console.log(`   Look for the line that shows: ä ö å Ä Ö Å`);
      console.log(`   Tell me which NUMBER works correctly!`);
      console.log(``);
      
      setTimeout(() => {
        client.end();
        console.log(`✅ ===== COMPLETE =====\n`);
        process.exit(0);
      }, 1000);
    });
  });
  
  console.log(`🔌 Connecting...`);
  client.connect(port, host);
}

sendToPrinter('192.168.1.106', 9100);
