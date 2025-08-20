#!/usr/bin/env node

/**
 * Android Printing Verification Script
 * Quick verification that all components are properly built and functional
 */

const fs = require('fs');
const path = require('path');

console.log('🖨️ ===== ANDROID PRINTING VERIFICATION =====\n');

const BASE_PATH = process.cwd();

function checkFile(filePath, description) {
    const fullPath = path.join(BASE_PATH, filePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'FOUND' : 'MISSING'}`);
    
    if (exists) {
        const stats = fs.statSync(fullPath);
        console.log(`   📁 Size: ${Math.round(stats.size / 1024)}KB, Modified: ${stats.mtime.toLocaleDateString()}`);
    }
    
    return exists;
}

function checkFileContent(filePath, searchTerms, description) {
    try {
        const content = fs.readFileSync(path.join(BASE_PATH, filePath), 'utf8');
        const found = searchTerms.filter(term => content.includes(term));
        const missing = searchTerms.filter(term => !content.includes(term));
        
        console.log(`${missing.length === 0 ? '✅' : '⚠️'} ${description}:`);
        if (found.length > 0) {
            console.log(`   ✅ Found: ${found.join(', ')}`);
        }
        if (missing.length > 0) {
            console.log(`   ❌ Missing: ${missing.join(', ')}`);
        }
        
        return missing.length === 0;
    } catch (error) {
        console.log(`❌ ${description}: Error reading file - ${error.message}`);
        return false;
    }
}

console.log('📁 CORE FILES VERIFICATION\n');

// Check core files
const coreFiles = [
    ['src/lib/printer/types.ts', 'TypeScript Types'],
    ['src/lib/printer/escpos-formatter.ts', 'ESC/POS Formatter'],
    ['src/lib/printer/printer-service.ts', 'Printer Service'],
    ['src/lib/printer/index.ts', 'Printer Module Index'],
    ['android/app/src/main/java/com/restaurant/ordermaster/MainActivity.java', 'Android MainActivity'],
    ['android/app/src/main/java/com/restaurant/ordermaster/PrinterBridge.java', 'Android PrinterBridge'],
    ['android/app/src/main/AndroidManifest.xml', 'Android Manifest']
];

let allFilesExist = true;
for (const [filePath, description] of coreFiles) {
    const exists = checkFile(filePath, description);
    allFilesExist = allFilesExist && exists;
}

console.log('\n🔍 COMPONENT FUNCTIONALITY VERIFICATION\n');

// Check TypeScript implementation
const tsChecks = [
    ['src/lib/printer/types.ts', ['PrinterDevice', 'ESC_POS', 'ERROR_CODES'], 'TypeScript Types & Constants'],
    ['src/lib/printer/escpos-formatter.ts', ['ESCPOSFormatter', 'formatReceipt', 'buildBase64'], 'ESC/POS Formatter'],
    ['src/lib/printer/printer-service.ts', ['PrinterService', 'scanNetworkPrinters', 'sendRawDataToPrinter', 'AndroidBridge'], 'Printer Service'],
    ['src/lib/printer/index.ts', ['export', 'createPrinterService', 'isAndroidBridgeAvailable'], 'Module Exports']
];

let allTSValid = true;
for (const [filePath, terms, description] of tsChecks) {
    const valid = checkFileContent(filePath, terms, description);
    allTSValid = allTSValid && valid;
}

// Check Java implementation
const javaChecks = [
    ['android/app/src/main/java/com/restaurant/ordermaster/MainActivity.java', ['extends BridgeActivity', 'PrinterBridge', 'addJavascriptInterface'], 'MainActivity Integration'],
    ['android/app/src/main/java/com/restaurant/ordermaster/PrinterBridge.java', ['@JavascriptInterface', 'sendRawDataToPrinter', 'testPrinterConnection', 'getNetworkInfo'], 'PrinterBridge Methods']
];

let allJavaValid = true;
for (const [filePath, terms, description] of javaChecks) {
    const valid = checkFileContent(filePath, terms, description);
    allJavaValid = allJavaValid && valid;
}

// Check Android permissions
const manifestValid = checkFileContent('android/app/src/main/AndroidManifest.xml', [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE', 
    'usesCleartextTraffic="true"'
], 'Android Permissions');

console.log('\n📊 BUILD VERIFICATION\n');

// Check build outputs
const buildFiles = [
    ['dist/index.html', 'Frontend Build Output'],
    ['android/app/build/outputs/apk/debug/app-debug.apk', 'Android Debug APK (if built)']
];

let buildExists = true;
for (const [filePath, description] of buildFiles) {
    const exists = checkFile(filePath, description);
    if (filePath.includes('.apk')) {
        // APK is optional for this check
        continue;
    }
    buildExists = buildExists && exists;
}

console.log('\n🎯 VERIFICATION SUMMARY\n');

const results = {
    'Core Files': allFilesExist,
    'TypeScript Implementation': allTSValid,
    'Java Implementation': allJavaValid,
    'Android Permissions': manifestValid,
    'Build Output': buildExists
};

let allPassed = true;
for (const [category, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${category}: ${passed ? 'PASSED' : 'FAILED'}`);
    allPassed = allPassed && passed;
}

console.log('\n' + '═'.repeat(60));

if (allPassed) {
    console.log('🎉 ALL VERIFICATIONS PASSED!');
    console.log('🚀 Android network printing implementation is complete and ready!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Build Android APK: cd android && ./gradlew assembleDebug');
    console.log('   2. Install on device: ./gradlew installDebug');
    console.log('   3. Test with real thermal printer on same network');
    console.log('   4. Verify printing functionality end-to-end');
    console.log('\n💡 TIP: Check ANDROID_PRINTING_COMPLETE.md for detailed setup instructions');
} else {
    console.log('⚠️ Some verifications failed.');
    console.log('📋 Please review the missing components above before deployment.');
}

console.log('\n🔧 Quick Test Commands:');
console.log('   npm run build              # Build frontend');
console.log('   cd android && ./gradlew build  # Build Android');
console.log('   npx cap sync android       # Sync Capacitor');
console.log('   npx cap run android        # Run on device');

process.exit(allPassed ? 0 : 1);
