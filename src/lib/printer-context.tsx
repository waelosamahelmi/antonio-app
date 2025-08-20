import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { PrinterService } from './printer/printer-service';
import { PrinterDevice, PrintJob, ReceiptData } from "./printer/types";
import { useAndroid } from "./android-context";
import { useToast } from "@/hooks/use-toast";
import { LocalPrinterManager } from "./local-printer-manager";
import { UniversalOrderParser } from "./universal-order-parser";

interface PrinterContextType {
  // Printer Management
  printers: PrinterDevice[];
  activePrinter: PrinterDevice | null;
  isDiscovering: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  scanProgress: number;
  
  // Discovery & Connection
  startBluetoothDiscovery: () => Promise<void>;
  startNetworkDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  connectToPrinter: (printer: PrinterDevice) => Promise<void>;
  disconnectFromPrinter: (printerId: string) => Promise<void>;
  addManualPrinter: (ip: string, port: number, name?: string) => Promise<void>;
  removePrinter: (printerId: string) => Promise<void>;
  setActivePrinter: (printer: PrinterDevice | null) => void;
    // Printing
  printReceipt: (data: ReceiptData) => Promise<boolean>;
  printOrder: (order: any) => Promise<boolean>;
  testPrint: (printerId: string) => Promise<void>;
  
  // Status
  refreshPrinterStatus: (printerId: string) => Promise<void>;
  
  // Queue Management
  printQueue: PrintJob[];
  addToPrintQueue: (job: PrintJob) => void;
  processPrintQueue: () => Promise<void>;
  clearPrintQueue: () => void;
  
  // Modal Management
  showDiscoveryModal: boolean;
  showSettingsModal: boolean;
  showPreviewModal: boolean;
  showTroubleshootingModal: boolean;
  setShowDiscoveryModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowPreviewModal: (show: boolean) => void;
  setShowTroubleshootingModal: (show: boolean) => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

interface PrinterProviderProps {
  children: ReactNode;
}

export function PrinterProvider({ children }: PrinterProviderProps) {
  // ...existing state...
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [activePrinter, setActivePrinter] = useState<PrinterDevice | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [scanProgress, setScanProgress] = useState(0);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  
  // Modal states
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTroubleshootingModal, setShowTroubleshootingModal] = useState(false);
  
  const { isAndroid } = useAndroid();
  const { toast } = useToast();

  // Single printer service instance
  const [printerService] = useState(() => {
    const service = new PrinterService();
    
    console.log('🔄 PrinterService created for Android network printing');
    
    // Set up event handlers
    service.onDeviceFound = (device: PrinterDevice) => {
      console.log(`📱 Device found: ${device.name}`);
      setPrinters(current => {
        const existing = current.find(p => p.id === device.id);
        if (existing) {
          // Update existing device
          return current.map(p => p.id === device.id ? device : p);
        } else {
          // Add new device
          return [...current, device];
        }
      });
    };
    
    service.onDeviceConnected = (device: PrinterDevice) => {
      console.log(`✅ Device connected: ${device.name}`);
      setActivePrinter(device);
      setConnectionStatus('Connected');
      setPrinters(current => current.map(p => p.id === device.id ? device : p));
      toast({
        title: "Printer Connected",
        description: `Successfully connected to ${device.name}`,
      });
    };
    
    service.onDeviceDisconnected = (device: PrinterDevice) => {
      console.log(`🔌 Device disconnected: ${device.name}`);
      if (activePrinter?.id === device.id) {
        setActivePrinter(null);
        setConnectionStatus('Disconnected');
      }
      setPrinters(current => current.map(p => p.id === device.id ? device : p));
      toast({
        title: "Printer Disconnected",
        description: `Disconnected from ${device.name}`,
      });
    };
    
    service.onError = (error: any) => {
      console.error(`❌ Printer service error: ${error}`);
      toast({
        title: "Printer Error",
        description: error.message || String(error),
        variant: "destructive",
      });
    };
    
    service.onScanProgress = (progress) => {
      setScanProgress((progress.current / progress.total) * 100);
    };
    
    return service;
  });

  // Auto re-discover and reconnect to saved printers on startup
  useEffect(() => {
    console.log('📄 Auto-discovering saved printers on startup...');
    
    // Clean up stale connections first
    LocalPrinterManager.clearFailedConnections();
    
    const savedPrinters = LocalPrinterManager.getPrinters();
    
    if (savedPrinters.length > 0) {
      console.log(`📄 Found ${savedPrinters.length} saved printers, auto-adding them...`);
      
      // Auto-rediscover saved printers using proper discovery logic
      const autoRediscoverSavedPrinters = async () => {
        for (const savedPrinter of savedPrinters) {
          try {
            console.log(`🔍 Auto-rediscovering saved printer: ${savedPrinter.name} (${savedPrinter.address}:${savedPrinter.port})`);
            
            // Use the same logic as manual printer addition to properly re-add the printer
            const ip = savedPrinter.address;
            const port = savedPrinter.port || 9100; // Default to 9100 if port is undefined
            
            // Force add the printer (this will properly test connection and setup)
            const rediscoveredPrinter = await printerService.forceAddPrinter(
              ip, 
              port, 
              savedPrinter.name
            );
            
            console.log(`✅ Successfully re-added saved printer: ${rediscoveredPrinter.name}`);
            
            // Update the printers list with the newly rediscovered printer
            setPrinters(prev => {
              const filtered = prev.filter(p => p.id !== rediscoveredPrinter.id);
              return [...filtered, rediscoveredPrinter];
            });
            
            // Auto-connect if this was the last connected printer and auto-reconnect is enabled
            if (LocalPrinterManager.isAutoReconnectEnabled()) {
              const lastConnected = LocalPrinterManager.getLastConnectedPrinter();
              if (lastConnected && lastConnected.id === savedPrinter.id) {
                console.log(`🔄 Auto-connecting to last used printer: ${rediscoveredPrinter.name}`);
                // Don't await to avoid blocking other rediscoveries
                connectToPrinter(rediscoveredPrinter).catch(error => {
                  console.log(`⚠️ Auto-connect failed for ${rediscoveredPrinter.name}: ${error}`);
                });
              }
            }
            
          } catch (error) {
            console.log(`⚠️ Failed to rediscover saved printer ${savedPrinter.name}: ${error}`);
            // Keep the old printer entry in case user wants to manually reconnect
            setPrinters(prev => {
              const exists = prev.find(p => p.id === savedPrinter.id);
              if (!exists) {
                return [...prev, { ...savedPrinter, status: 'offline', isConnected: false }];
              }
              return prev;
            });
          }
        }
      };
      
      // Start auto-rediscovery in background
      autoRediscoverSavedPrinters();
    } else {
      console.log('📄 No saved printers found');
    }
  }, []);

  // Discovery functions
  const startBluetoothDiscovery = useCallback(async () => {
    if (isDiscovering) return;
    
    setIsDiscovering(true);
    setScanProgress(0);
    
    try {
      console.log('📱 Starting Bluetooth discovery...');
      // Bluetooth scanning not implemented in current PrinterService
      // Using network discovery as fallback
      const devices = await printerService.scanNetworkPrinters();
      console.log(`📱 Network scan found ${devices.length} devices`);
      
      if (devices.length === 0) {
        toast({
          title: "No Bluetooth Printers Found",
          description: "Make sure your printer is powered on and in pairing mode",
        });
      }
    } catch (error) {
      console.error('❌ Bluetooth discovery failed:', error);
      toast({
        title: "Bluetooth Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
      setScanProgress(0);
    }
  }, [isDiscovering, printerService, toast]);

  const startNetworkDiscovery = useCallback(async () => {
    if (isDiscovering) return;
    
    setIsDiscovering(true);
    setScanProgress(0);
    
    try {
      console.log('🌐 Starting network discovery...');
      const devices = await printerService.scanNetworkPrinters();
      console.log(`🌐 Network scan found ${devices.length} devices`);
      
      if (devices.length === 0) {
        toast({
          title: "No Network Printers Found",
          description: "Check that printers are connected to the same network",
        });
      } else {
        toast({
          title: "Network Scan Complete",
          description: `Found ${devices.length} network printer${devices.length === 1 ? '' : 's'}`,
        });
      }
    } catch (error) {
      console.error('❌ Network discovery failed:', error);
      toast({
        title: "Network Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
      setScanProgress(0);
    }
  }, [isDiscovering, printerService, toast]);

  const stopDiscovery = useCallback(() => {
    console.log('⏹️ Stopping printer discovery...');
    printerService.cancelScan();
    setIsDiscovering(false);
    setScanProgress(0);
  }, [printerService]);

  // Connection functions
  const connectToPrinter = useCallback(async (printer: PrinterDevice) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionStatus('Connecting...');
    
    try {
      console.log(`🔗 Connecting to printer: ${printer.name} (${printer.address}:${printer.port})`);
      
      // First ensure the printer is properly added to the service
      const allDevices = printerService.getAllDevices();
      const deviceInService = allDevices.find(d => d.id === printer.id);
      
      if (!deviceInService) {
        console.log(`🔄 Printer not in service, re-adding: ${printer.name}`);
        const readdedPrinter = await printerService.forceAddPrinter(
          printer.address, 
          printer.port || 9100, 
          printer.name
        );
        
        // Update printers list with the re-added printer
        setPrinters(prev => {
          const filtered = prev.filter(p => p.id !== readdedPrinter.id);
          return [...filtered, readdedPrinter];
        });
        
        printer = readdedPrinter; // Use the re-added printer for connection
      }
      
      // Now connect to the printer
      await printerService.connectToPrinter(printer.id);
      
      // Update connection status
      setConnectionStatus('Connected');
      
      // Record successful connection in localStorage
      LocalPrinterManager.recordConnection(printer.id);
      
      toast({
        title: "Connected",
        description: `Successfully connected to ${printer.name}`,
      });
      
    } catch (error) {
      console.error(`❌ Connection failed: ${error}`);
      setConnectionStatus('Connection Failed');
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${printer.name}. Printer may be offline or unreachable.`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, printerService, toast]);

  const disconnectFromPrinter = useCallback(async (printerId: string) => {
    try {
      console.log(`🔌 Disconnecting printer: ${printerId}`);
      await printerService.disconnectFromPrinter(printerId);
    } catch (error) {
      console.error(`❌ Disconnect failed: ${error}`);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from printer",
        variant: "destructive",
      });
    }
  }, [printerService, toast]);

  const addManualPrinter = useCallback(async (ip: string, port: number, name?: string) => {
    try {
      console.log(`➕ Adding manual printer: ${ip}:${port}`);
      const device = await printerService.addPrinter(ip, port);
      if (device) {
        // Save to localStorage
        LocalPrinterManager.addPrinter(device);
        
        // Update local state
        setPrinters(current => {
          const existing = current.find(p => p.id === device.id);
          if (existing) {
            return current.map(p => p.id === device.id ? device : p);
          } else {
            return [...current, device];
          }
        });
        
        toast({
          title: "Printer Added",
          description: `Successfully added ${device.name}`,
        });
      }
    } catch (error) {
      console.error(`❌ Failed to add manual printer: ${error}`);
      toast({
        title: "Failed to Add Printer",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [printerService, toast]);

  const removePrinter = useCallback(async (printerId: string) => {
    try {
      console.log(`🗑️ Removing printer: ${printerId}`);
      
      // Remove from localStorage
      LocalPrinterManager.removePrinter(printerId);
      
      // Remove from local state
      setPrinters(current => current.filter(p => p.id !== printerId));
      
      if (activePrinter?.id === printerId) {
        setActivePrinter(null);
        setConnectionStatus('Disconnected');
      }
      
      toast({
        title: "Printer Removed",
        description: "Printer has been removed from the list",
      });
    } catch (error) {
      console.error(`❌ Failed to remove printer: ${error}`);
      toast({
        title: "Failed to Remove Printer",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [activePrinter, toast]);
  // Printing functions
  const printOrder = useCallback(async (order: any): Promise<boolean> => {
    if (!activePrinter || !activePrinter.isConnected) {
      toast({
        title: "No Active Printer",
        description: "Please connect to a printer first",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('🖨️ Printing order using universal parser...');
      
      // Parse order using universal parser
      const receiptData = UniversalOrderParser.parseOrder(order);
      
      // Validate the parsed data
      const validation = UniversalOrderParser.validateReceiptData(receiptData);
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Order parsing warnings:', validation.warnings);
      }
      if (!validation.isValid) {
        console.error('❌ Order parsing errors:', validation.errors);
        throw new Error(`Order parsing failed: ${validation.errors.join(', ')}`);
      }
      
      console.log('✅ Order parsed successfully:', {
        orderNumber: receiptData.orderNumber,
        itemCount: receiptData.items.length,
        total: receiptData.total
      });
      
      const success = await printerService.print(activePrinter.id, {
        type: 'receipt',
        data: receiptData,
        originalOrder: order
      });
      
      if (success) {
        toast({
          title: "Print Successful",
          description: `Order ${receiptData.orderNumber} has been printed`,
        });
      }
      return success;
    } catch (error) {
      console.error(`❌ Print order failed: ${error}`);
      
      // Debug the order structure on error
      UniversalOrderParser.debugOrder(order);
      
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : 'Failed to print order',
        variant: "destructive",
      });
      return false;
    }
  }, [activePrinter, printerService, toast]);

  const printReceipt = useCallback(async (data: ReceiptData): Promise<boolean> => {
    if (!activePrinter || !activePrinter.isConnected) {
      toast({
        title: "No Active Printer",
        description: "Please connect to a printer first",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('🖨️ Printing receipt...');
      // Convert receipt data to ESC/POS commands
      const escposData = convertReceiptToESCPOS(data);
      await printerService.print(activePrinter.id, {
        type: 'receipt',
        data: escposData
      });
      
      toast({
        title: "Print Successful",
        description: "Receipt has been sent to the printer",
      });
      return true;
    } catch (error) {
      console.error(`❌ Print failed: ${error}`);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  }, [activePrinter, printerService, toast]);

  const testPrint = useCallback(async (printerId: string) => {
    try {
      console.log(`🧪 Running test print for: ${printerId}`);
      const success = await printerService.testPrint(printerId);
      
      if (success) {
        toast({
          title: "Test Print Successful",
          description: "Test print has been sent to the printer",
        });
      } else {
        toast({
          title: "Test Print Failed",
          description: "Failed to send test print",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`❌ Test print failed: ${error}`);
      toast({
        title: "Test Print Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [printerService, toast]);

  const refreshPrinterStatus = useCallback(async (printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (printer && printer.type === 'network') {
      // For network printers, test connection to update status
      try {
        const isConnected = printerService.isDeviceConnected(printerId);
        printer.isConnected = isConnected;
        printer.status = isConnected ? 'idle' : 'offline';
        setPrinters(current => current.map(p => p.id === printerId ? printer : p));
      } catch (error) {
        console.error(`❌ Status refresh failed: ${error}`);
      }
    }
  }, [printers, printerService]);

  // Print queue functions
  const addToPrintQueue = useCallback((job: PrintJob) => {
    setPrintQueue(current => [...current, job]);
  }, []);

  const processPrintQueue = useCallback(async () => {
    if (printQueue.length === 0 || !activePrinter) return;

    for (const job of printQueue) {
      try {
        await printReceipt(job.content.data as ReceiptData);
        setPrintQueue(current => current.filter(j => j.id !== job.id));
      } catch (error) {
        console.error(`❌ Failed to process print job ${job.id}:`, error);
        break; // Stop processing on error
      }
    }
  }, [printQueue, activePrinter, printReceipt]);

  const clearPrintQueue = useCallback(() => {
    setPrintQueue([]);
  }, []);

  // Initialize
  useEffect(() => {
    console.log('🚀 Initializing printer service...');
    
    // Load saved active printer from localStorage
    const savedPrinterId = localStorage.getItem('activePrinterId');
    if (savedPrinterId) {
      const savedPrinter = printers.find(p => p.id === savedPrinterId);
      if (savedPrinter) {
        setActivePrinter(savedPrinter);
      }
    }

    // Cleanup on unmount
    return () => {
      printerService.cleanup();
    };
  }, [printerService]);

  // Enhanced setActivePrinter that saves to both localStorage and Supabase
  const handleSetActivePrinter = useCallback(async (printer: PrinterDevice | null) => {
    setActivePrinter(printer);
    
    // Save to localStorage for immediate use
    if (printer) {
      localStorage.setItem('activePrinterId', printer.id);
      LocalPrinterManager.setDefaultPrinter(printer.id);
      console.log(`💾 Saved active printer: ${printer.name}`);
    } else {
      localStorage.removeItem('activePrinterId');
      console.log('🗑️ Cleared active printer');
    }
  }, []);

  // Auto-reconnect on startup is already handled in the initial useEffect
  // No additional auto-reconnect logic needed here

  const contextValue: PrinterContextType = {
    printers,
    activePrinter,
    isDiscovering,
    isConnecting,
    connectionStatus,
    scanProgress,
    startBluetoothDiscovery,
    startNetworkDiscovery,
    stopDiscovery,
    connectToPrinter,
    disconnectFromPrinter,
    addManualPrinter,
    removePrinter,
    setActivePrinter: handleSetActivePrinter,
    printReceipt,
    printOrder,
    testPrint,
    refreshPrinterStatus,
    printQueue,
    addToPrintQueue,
    processPrintQueue,
    clearPrintQueue,
    showDiscoveryModal,
    showSettingsModal,
    showPreviewModal,
    showTroubleshootingModal,
    setShowDiscoveryModal,
    setShowSettingsModal,
    setShowPreviewModal,
    setShowTroubleshootingModal,
  };

  return (
    <PrinterContext.Provider value={contextValue}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}

// Helper function to convert receipt data to ESC/POS commands
function convertReceiptToESCPOS(data: ReceiptData): Uint8Array {
  const commands: number[] = [];
  
  // Helper function to encode text for thermal printer with proper character mapping
  const encodeForThermalPrinter = (text: string): number[] => {
    const bytes: number[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const code = text.charCodeAt(i);
      
      // Handle special characters for thermal printers
      switch (char) {
        // Euro symbol - CP850 encoding
        case '€':
          bytes.push(0xEE); // CP850 encoding for Euro
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
        // Standard ASCII characters (0-127)
        default:
          if (code < 128) {
            bytes.push(code);
          } else {
            // For other characters, use question mark as fallback
            bytes.push(0x3F); // Question mark for unknown characters
          }
          break;
      }
    }
    
    return bytes;
  };
  
  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @
  
  // Set character set to CP850 for European characters
  commands.push(0x1B, 0x74, 0x02); // ESC t 2 - Set CP850 code page
  
  // Header
  if (data.header) {
    commands.push(0x1B, 0x61, 0x01); // Center align
    commands.push(0x1B, 0x21, 0x30); // Double width/height
    commands.push(...encodeForThermalPrinter(data.header.text));
    commands.push(0x0A, 0x0A); // Line feeds
    commands.push(0x1B, 0x21, 0x00); // Normal text
  }
  
  // Items
  if (data.items && data.items.length > 0) {
    commands.push(0x1B, 0x61, 0x00); // Left align
    
    data.items.forEach(item => {
      // Item name and price
      const line = `${item.name.padEnd(20)} €${item.price.toFixed(2).padStart(7)}`;
      commands.push(...encodeForThermalPrinter(line));
      commands.push(0x0A);
      
      // Quantity if specified
      if (item.quantity && item.quantity > 1) {
        const qtyLine = `  Qty: ${item.quantity}`;
        commands.push(...encodeForThermalPrinter(qtyLine));
        commands.push(0x0A);
      }
      
      // Toppings
      if (item.toppings && item.toppings.length > 0) {
        item.toppings.forEach(topping => {
          const toppingLine = `  + ${topping.name}${topping.price > 0 ? ` (+€${topping.price.toFixed(2)})` : ''}`;
          commands.push(...encodeForThermalPrinter(toppingLine));
          commands.push(0x0A);
        });
      }
      
      // Special instructions (clean notes only)
      if (item.notes && item.notes.trim() && !item.notes.includes('Toppings:') && !item.notes.includes('Size:')) {
        const noteLine = `  Special: ${item.notes}`;
        commands.push(...encodeForThermalPrinter(noteLine));
        commands.push(0x0A);
      }
    });
    
    commands.push(0x0A); // Extra line feed
  }
  
  // Total
  if (data.total !== undefined) {
    commands.push(0x1B, 0x45, 0x01); // Bold on
    const totalLine = `${'TOTAL'.padEnd(20)} €${data.total.toFixed(2).padStart(8)}`;
    commands.push(...encodeForThermalPrinter(totalLine));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(0x0A, 0x0A);
  }
  
  // Footer
  if (data.footer) {
    commands.push(0x1B, 0x61, 0x01); // Center align
    commands.push(...encodeForThermalPrinter(data.footer.text));
    commands.push(0x0A, 0x0A);
  }
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x01); // Partial cut
  
  return new Uint8Array(commands);
}
