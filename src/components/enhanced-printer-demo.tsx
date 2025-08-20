import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bluetooth, Wifi, Printer, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedPrinterConnectionManager } from '@/lib/printer/connection-manager-enhanced';
import { PrinterDevice } from '@/lib/printer/types';

interface PrinterDemoProps {
  onClose?: () => void;
}

export function EnhancedPrinterDemo({ onClose }: PrinterDemoProps) {
  const [printerManager] = useState(() => new EnhancedPrinterConnectionManager());
  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterDevice[]>([]);
  const [connectedPrinters, setConnectedPrinters] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    method: 'bluetooth' | 'network';
    current: number;
    total: number;
    details?: string;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'connecting' | 'connected' | 'failed' }>({});
  
  // Manual printer addition
  const [manualIP, setManualIP] = useState('');
  const [manualPort, setManualPort] = useState('9100');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    // Setup event handlers
    printerManager.onDeviceFound = (device) => {
      setDiscoveredPrinters(prev => {
        const exists = prev.find(p => p.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
    };

    printerManager.onDeviceConnected = (device) => {
      setConnectedPrinters(prev => {
        const exists = prev.find(p => p.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
      setConnectionStatus(prev => ({ ...prev, [device.id]: 'connected' }));
    };

    printerManager.onDeviceDisconnected = (device) => {
      setConnectedPrinters(prev => prev.filter(p => p.id !== device.id));
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[device.id];
        return newStatus;
      });
    };

    printerManager.onError = (error, printerId) => {
      setErrors(prev => [...prev, `${printerId ? `[${printerId}] ` : ''}${error}`]);
      if (printerId) {
        setConnectionStatus(prev => ({ ...prev, [printerId]: 'failed' }));
      }
    };

    printerManager.onScanProgress = (progress) => {
      setScanProgress(progress);
    };

    // Cleanup on unmount
    return () => {
      printerManager.cleanup();
    };
  }, [printerManager]);

  const startBluetoothScan = async () => {
    try {
      setIsScanning(true);
      setErrors([]);
      setDiscoveredPrinters([]);
      setScanProgress(null);
      
      await printerManager.startBluetoothScan({ duration: 30000 });
    } catch (error) {
      setErrors(prev => [...prev, `Bluetooth scan failed: ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const startNetworkScan = async () => {
    try {
      setIsScanning(true);
      setErrors([]);
      setDiscoveredPrinters([]);
      setScanProgress(null);
      
      const networkPrinters = await printerManager.scanNetworkPrinters();
      setDiscoveredPrinters(prev => [...prev, ...networkPrinters]);
    } catch (error) {
      setErrors(prev => [...prev, `Network scan failed: ${error}`]);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [printer.id]: 'connecting' }));
      await printerManager.connectPrinter(printer);
    } catch (error) {
      setErrors(prev => [...prev, `Connection failed: ${error}`]);
      setConnectionStatus(prev => ({ ...prev, [printer.id]: 'failed' }));
    }
  };

  const disconnectPrinter = async (printerId: string) => {
    try {
      await printerManager.disconnectPrinter(printerId);
    } catch (error) {
      setErrors(prev => [...prev, `Disconnection failed: ${error}`]);
    }
  };

  const testPrinter = async (printerId: string) => {
    try {
      const result = await printerManager.testPrinter(printerId);
      if (result) {
        setErrors(prev => [...prev, `✅ Test successful for printer ${printerId}`]);
      } else {
        setErrors(prev => [...prev, `❌ Test failed for printer ${printerId}`]);
      }
    } catch (error) {
      setErrors(prev => [...prev, `Test error: ${error}`]);
    }
  };

  const printTestReceipt = async (printerId: string) => {
    try {
      const testReceipt = {
        header: {
          text: 'TEST RECEIPT\n==================',
          alignment: 'center' as const,
          bold: true
        },
        items: [
          {
            name: 'Test Item 1',
            quantity: 1,
            price: 10.50,
            totalPrice: 10.50
          },
          {
            name: 'Test Item 2',
            quantity: 2,
            price: 5.25,
            totalPrice: 10.50
          }
        ],
        footer: {
          text: 'Thank you for testing!\n==================',
          alignment: 'center' as const
        },
        total: 21.00,
        orderNumber: 'TEST-001',
        timestamp: new Date()
      };

      await printerManager.printReceipt(printerId, testReceipt);
      setErrors(prev => [...prev, `✅ Test receipt sent to printer ${printerId}`]);
    } catch (error) {
      setErrors(prev => [...prev, `Print failed: ${error}`]);
    }
  };

  const addManualPrinter = async () => {
    try {
      if (!manualIP) {
        setErrors(prev => [...prev, 'Please enter an IP address']);
        return;
      }

      const port = parseInt(manualPort) || 9100;
      const device = await printerManager.addManualNetworkPrinter(manualIP, port, manualName || undefined);
      
      if (device) {
        setDiscoveredPrinters(prev => [...prev, device]);
        setManualIP('');
        setManualPort('9100');
        setManualName('');
        setErrors(prev => [...prev, `✅ Manual printer added: ${device.name}`]);
      } else {
        setErrors(prev => [...prev, `❌ Could not add printer at ${manualIP}:${port}`]);
      }
    } catch (error) {
      setErrors(prev => [...prev, `Manual printer addition failed: ${error}`]);
    }
  };

  const getStatusColor = (status: PrinterDevice['status']) => {
    switch (status) {
      case 'idle': return 'bg-green-500';
      case 'printing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusIcon = (printerId: string) => {
    const status = connectionStatus[printerId];
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Printer Discovery & Management</h1>
          <p className="text-muted-foreground">Advanced Bluetooth and Network printer detection with improved reliability</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Demo
          </Button>
        )}
      </div>

      {/* Scan Progress */}
      {scanProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanProgress.method === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
              {scanProgress.method === 'bluetooth' ? 'Bluetooth' : 'Network'} Scan in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{scanProgress.details}</span>
                <span>{scanProgress.current}/{scanProgress.total}</span>
              </div>
              <Progress value={(scanProgress.current / scanProgress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errors.slice(-10).map((error, index) => (
                <Alert key={index} variant={error.startsWith('✅') ? 'default' : 'destructive'}>
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setErrors([])}
              className="mt-2"
            >
              Clear Messages
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="connected">Connected ({connectedPrinters.length})</TabsTrigger>
          <TabsTrigger value="manual">Manual Add</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startBluetoothScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bluetooth className="h-4 w-4" />}
              Scan Bluetooth
            </Button>
            <Button 
              onClick={startNetworkScan}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Scan Network
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {printer.type === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    {printer.type === 'bluetooth' ? 'Bluetooth' : `${printer.address}:${printer.port}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)}`} />
                      {printer.status}
                    </Badge>
                    {getConnectionStatusIcon(printer.id)}
                  </div>
                  
                  {printer.metadata && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {printer.metadata.protocol && <div>Protocol: {printer.metadata.protocol}</div>}
                      {printer.metadata.manufacturer && <div>Manufacturer: {printer.metadata.manufacturer}</div>}
                      {printer.metadata.features && <div>Features: {printer.metadata.features.join(', ')}</div>}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {printer.isConnected ? (
                      <>
                        <Button size="sm" onClick={() => disconnectPrinter(printer.id)}>
                          Disconnect
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => testPrinter(printer.id)}>
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printTestReceipt(printer.id)}>
                          Print Test
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => connectToPrinter(printer)}
                        disabled={connectionStatus[printer.id] === 'connecting'}
                      >
                        {connectionStatus[printer.id] === 'connecting' ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {discoveredPrinters.length === 0 && !isScanning && (
            <Card>
              <CardContent className="text-center py-8">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No printers discovered yet. Start a scan to find printers.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedPrinters.map((printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {printer.type === 'bluetooth' ? <Bluetooth className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
                    {printer.name}
                  </CardTitle>
                  <CardDescription>
                    Connected • {printer.type === 'bluetooth' ? 'Bluetooth' : `${printer.address}:${printer.port}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)}`} />
                    {printer.status}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => testPrinter(printer.id)}>
                      Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => printTestReceipt(printer.id)}>
                      Print Test
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => disconnectPrinter(printer.id)}>
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {connectedPrinters.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No printers connected. Discover and connect to printers first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Network Printer Manually</CardTitle>
              <CardDescription>
                Add a network printer by specifying its IP address and port
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input 
                    id="ip"
                    placeholder="192.168.1.100"
                    value={manualIP}
                    onChange={(e) => setManualIP(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port"
                    placeholder="9100"
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input 
                    id="name"
                    placeholder="My Printer"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={addManualPrinter} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Add Printer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
