// Quick printer status check - run this in browser console

console.log('=== PRINTER SERVICE STATUS CHECK ===');

// Check environment
const isAndroid = typeof window?.Android?.sendRawDataToPrinter === 'function';
console.log('🏃 Environment:', isAndroid ? 'Android (Native Bridge Available)' : 'Browser (Limited)');

// Check if printer service is available  
if (window.printerService) {
  console.log('✅ Printer service available');
  
  const allDevices = window.printerService.getAllDevices();
  console.log(`📱 Total devices found: ${allDevices.length}`);
  
  const connectedDevices = window.printerService.getConnectedDevices();
  console.log(`🔗 Connected devices: ${connectedDevices.length}`);
  
  // Show device details
  allDevices.forEach((device, i) => {
    console.log(`\n📋 Device ${i + 1}: ${device.name}`);
    console.log(`   Address: ${device.address}:${device.port}`);
    console.log(`   Type: ${device.type}`);
    console.log(`   Connected: ${device.isConnected ? '✅' : '❌'}`);
    console.log(`   Status: ${device.status}`);
    console.log(`   Protocol: ${device.metadata?.protocol || 'Unknown'}`);
    
    // Show expected behavior
    if (device.type === 'network' && device.port === 9100) {
      console.log(`   🖨️ Print Capability: ${isAndroid ? '✅ Should work via Android native bridge' : '❌ Browser limitation - requires Android app'}`);
    } else if (device.port === 80 || device.port === 631) {
      console.log(`   🖨️ Print Capability: ✅ Should work in browser (HTTP/IPP)`);
    }
  });
  
  // Service status
  const status = window.printerService.getServiceStatus();
  console.log('\n📊 Service Status:', status);
  
} else {
  console.log('❌ Printer service not available');
}

console.log('\n💡 To test printing:');
console.log('   1. Connect to a printer');
console.log('   2. Click "Test Print" button');
console.log('   3. Check the toast notification for results');
console.log('   4. For RAW TCP printers, use Android app for actual printing');
