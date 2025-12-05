import React, { useState } from 'react';
import { useAndroid } from '../lib/android-context';
import { ThermalPrinter } from '../lib/capacitor-thermal-printer';
import { Capacitor } from '@capacitor/core';

export const BluetoothDiagnostics: React.FC = () => {
  const { hasBluetoothPermission, requestBluetoothPermission, isAndroid } = useAndroid();
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    console.log(message);
    setDiagnosticResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);

    try {
      addResult('🔍 Starting Bluetooth diagnostics...');

      // 1. Check platform
      addResult(`📱 Platform: ${Capacitor.getPlatform()}`);
      addResult(`🤖 Is Android: ${isAndroid}`);

      // 2. Check permissions
      addResult(`🔐 Has Bluetooth Permission: ${hasBluetoothPermission}`);

      // 3. Check if native methods are available
      if (typeof (window as any).Android !== 'undefined') {
        addResult('✅ Android bridge is available');
        
        const androidMethods = Object.keys((window as any).Android);
        addResult(`📋 Available Android methods: ${androidMethods.join(', ')}`);
      } else {
        addResult('❌ Android bridge is NOT available');
      }

      // 4. Check Capacitor plugins
      addResult('🔌 Checking Capacitor plugins...');
      
      // 5. Check ThermalPrinter plugin
      if (ThermalPrinter) {
        addResult('✅ ThermalPrinter plugin is loaded');
        
        try {
          // Test if the plugin responds
          addResult('🧪 Testing plugin availability...');
          
          // First request permissions if needed
          if (!hasBluetoothPermission) {
            addResult('📋 Requesting Bluetooth permissions...');
            const granted = await requestBluetoothPermission();
            addResult(`🔐 Permission granted: ${granted}`);
            
            if (!granted) {
              addResult('❌ Cannot proceed without Bluetooth permission');
              return;
            }
          }

          // Try to call the scan method
          addResult('🔍 Attempting to scan for Bluetooth devices...');
          
          const scanPromise = ThermalPrinter.scanBluetoothDevices();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scan timeout after 10 seconds')), 10000)
          );

          const result = await Promise.race([scanPromise, timeoutPromise]) as { devices?: any[] };
          addResult(`✅ Scan successful! Found ${result.devices?.length || 0} devices`);
          
          if (result.devices && result.devices.length > 0) {
            result.devices.forEach((device: any, index: number) => {
              addResult(`📱 Device ${index + 1}: ${device.name} (${device.address})`);
            });
          } else {
            addResult('ℹ️ No Bluetooth devices found in range');
          }

        } catch (error: any) {
          addResult(`❌ Plugin test failed: ${error.message || error}`);
          
          // Additional error diagnostics
          if (error.code) {
            addResult(`🔧 Error code: ${error.code}`);
          }
          if (error.source) {
            addResult(`🔧 Error source: ${error.source}`);
          }
        }
      } else {
        addResult('❌ ThermalPrinter plugin is NOT loaded');
      }

      // 6. Check device Bluetooth status
      if (typeof (window as any).Android?.hasBluetoothPermission !== 'undefined') {
        try {
          const hasPermission = await (window as any).Android.hasBluetoothPermission();
          addResult(`🔐 Native permission check: ${hasPermission}`);
        } catch (error: any) {
          addResult(`❌ Native permission check failed: ${error.message}`);
        }
      }

    } catch (error: any) {
      addResult(`❌ Diagnostics failed: ${error.message || error}`);
    } finally {
      setIsRunning(false);
      addResult('✅ Diagnostics completed');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔍 Bluetooth Printer Diagnostics</h2>
      
      <div className="mb-4">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? '🔄 Running Diagnostics...' : '🚀 Run Diagnostics'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Diagnostic Results:</h3>
        {diagnosticResults.length === 0 ? (
          <p className="text-gray-500">Click "Run Diagnostics" to start...</p>
        ) : (
          <div className="space-y-1">
            {diagnosticResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
        <h4 className="font-semibold mb-1">💡 Common Issues:</h4>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Missing Bluetooth permissions in Android manifest</li>
          <li>Plugin not properly installed or synchronized</li>
          <li>Android bridge not initialized</li>
          <li>Device Bluetooth is disabled</li>
          <li>Plugin timeout or hanging on native call</li>
        </ul>
      </div>
    </div>
  );
};