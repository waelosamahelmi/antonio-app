/**
 * Example: How to Integrate CloudPRNT into Printer Context
 * 
 * This file shows how to add CloudPRNT printing to your existing printer context
 */

import { createCloudPRNTClient } from '@/lib/printer/cloudprnt-client';
import { ReceiptData } from '@/lib/printer/types';

// ==========================================
// OPTION 1: Add to Existing Printer Context
// ==========================================

// In your printer context file (e.g., contexts/PrinterContext.tsx)

// Add CloudPRNT client to context state
const cloudPRNT = createCloudPRNTClient();

// Add CloudPRNT printer configuration to settings
interface CloudPRNTPrinter {
  mac: string;
  name: string;
  type: 'star' | 'escpos';
  enabled: boolean;
}

// Add to context state
const [cloudPrinters, setCloudPrinters] = useState<CloudPRNTPrinter[]>([]);

// Function to print via CloudPRNT
const printOrderViaCloudPRNT = async (order: any, printerMac: string) => {
  try {
    console.log('🖨️ Printing order via CloudPRNT:', order.orderNumber);

    // Convert order to receipt data
    const receiptData: ReceiptData = {
      orderNumber: order.orderNumber || order.order_number || order.id,
      timestamp: new Date(order.createdAt || order.created_at || Date.now()),
      customerName: order.customerName || order.customer_name,
      customerPhone: order.customerPhone || order.customer_phone,
      customerEmail: order.customerEmail || order.customer_email,
      deliveryAddress: order.deliveryAddress || order.delivery_address,
      orderType: order.orderType || order.order_type || 'pickup',
      paymentMethod: order.paymentMethod || order.payment_method,
      paymentStatus: order.paymentStatus || order.payment_status,
      items: convertOrderItemsToReceiptItems(order),
      total: parseFloat(order.total || order.totalAmount || '0'),
      subtotal: parseFloat(order.subtotal || '0'),
      deliveryFee: parseFloat(order.deliveryFee || order.delivery_fee || '0'),
      discount: parseFloat(order.discount || '0')
    };

    // Find printer config
    const printer = cloudPrinters.find(p => p.mac === printerMac && p.enabled);
    if (!printer) {
      throw new Error(`CloudPRNT printer ${printerMac} not found or not enabled`);
    }

    // Submit to CloudPRNT
    const result = await cloudPRNT.submitJob(
      printer.mac,
      receiptData,
      order,
      printer.type
    );

    if (result.success) {
      console.log(`✅ CloudPRNT job submitted: ${result.jobId}`);
      // Show success toast
      toast.success(`Print job queued for ${printer.name}`);
      return true;
    } else {
      throw new Error(result.error || 'CloudPRNT submission failed');
    }
  } catch (error) {
    console.error('❌ CloudPRNT print error:', error);
    toast.error(`Print failed: ${error.message}`);
    return false;
  }
};

// Helper function to convert order items
function convertOrderItemsToReceiptItems(order: any) {
  const orderItems = order.orderItems || order.order_items || order.items || [];
  
  return orderItems.map((item: any) => {
    const menuItem = item.menuItems || item.menu_items || item.menuItem || item;
    const itemName = menuItem.name || item.name || 'Unknown Item';
    
    // Get toppings
    let toppings = [];
    if (item.toppings && Array.isArray(item.toppings)) {
      toppings = item.toppings.map((t: any) => ({
        name: t.name,
        price: parseFloat(t.price || '0')
      }));
    }
    
    // Get special instructions
    const specialInstructions = item.specialInstructions || item.special_instructions || '';
    
    return {
      name: itemName,
      quantity: parseInt(item.quantity || '1'),
      unitPrice: parseFloat(item.unit_price || item.unitPrice || menuItem.price || '0'),
      totalPrice: parseFloat(item.total_price || item.totalPrice || '0'),
      toppings: toppings,
      notes: specialInstructions
    };
  });
}

// ==========================================
// OPTION 2: Standalone CloudPRNT Function
// ==========================================

/**
 * Print order using CloudPRNT
 * Can be called from anywhere in the app
 */
export async function printOrderCloudPRNT(
  order: any,
  printerMac: string,
  printerType: 'star' | 'escpos' = 'star'
): Promise<boolean> {
  const cloudPRNT = createCloudPRNTClient();
  
  const receiptData: ReceiptData = {
    orderNumber: order.orderNumber || order.order_number || order.id,
    timestamp: new Date(order.createdAt || order.created_at || Date.now()),
    customerName: order.customerName || order.customer_name,
    customerPhone: order.customerPhone || order.customer_phone,
    customerEmail: order.customerEmail || order.customer_email,
    deliveryAddress: order.deliveryAddress || order.delivery_address,
    orderType: order.orderType || order.order_type || 'pickup',
    paymentMethod: order.paymentMethod || order.payment_method,
    items: (order.orderItems || order.order_items || order.items || []).map((item: any) => ({
      name: item.menuItems?.name || item.menu_items?.name || item.name || 'Unknown',
      quantity: parseInt(item.quantity || '1'),
      unitPrice: parseFloat(item.unit_price || item.unitPrice || '0'),
      totalPrice: parseFloat(item.total_price || item.totalPrice || '0'),
      toppings: item.toppings || [],
      notes: item.specialInstructions || item.special_instructions || ''
    })),
    total: parseFloat(order.total || order.totalAmount || '0')
  };

  const result = await cloudPRNT.submitJob(printerMac, receiptData, order, printerType);
  return result.success;
}

// ==========================================
// OPTION 3: React Hook for CloudPRNT
// ==========================================

import { useState, useCallback } from 'react';

export function useCloudPRNT() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const cloudPRNT = createCloudPRNTClient();

  const printOrder = useCallback(async (
    order: any,
    printerMac: string,
    printerType: 'star' | 'escpos' = 'star'
  ) => {
    setIsSubmitting(true);
    
    try {
      const receiptData: ReceiptData = {
        orderNumber: order.orderNumber || order.id,
        timestamp: new Date(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddress: order.deliveryAddress,
        orderType: order.orderType || 'pickup',
        paymentMethod: order.paymentMethod,
        items: (order.items || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          toppings: item.toppings || [],
          notes: item.notes || ''
        })),
        total: order.total
      };

      const result = await cloudPRNT.submitJob(
        printerMac,
        receiptData,
        order,
        printerType
      );

      if (result.success && result.jobId) {
        setLastJobId(result.jobId);
      }

      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getStatus = useCallback(async () => {
    return await cloudPRNT.getStatus();
  }, []);

  const listPrinters = useCallback(async () => {
    return await cloudPRNT.listPrinters();
  }, []);

  return {
    printOrder,
    getStatus,
    listPrinters,
    isSubmitting,
    lastJobId
  };
}

// Usage in component:
// const { printOrder, isSubmitting } = useCloudPRNT();
// await printOrder(order, '001162123456', 'star');

// ==========================================
// OPTION 4: Add to Order Component
// ==========================================

// In your OrderCard or OrderDetails component

import { Button } from '@/components/ui/button';

function OrderCard({ order }) {
  const { printOrder, isSubmitting } = useCloudPRNT();
  
  // Get printer MAC from settings
  const printerMac = localStorage.getItem('cloudprnt_printer_mac') || '001162123456';
  const printerType = localStorage.getItem('cloudprnt_printer_type') || 'star';

  const handlePrint = async () => {
    const result = await printOrder(order, printerMac, printerType as any);
    
    if (result.success) {
      toast.success(`Receipt sent to printer`);
    } else {
      toast.error(`Print failed: ${result.error}`);
    }
  };

  return (
    <div className="order-card">
      {/* ... order details ... */}
      
      <Button 
        onClick={handlePrint} 
        disabled={isSubmitting}
        variant="outline"
      >
        {isSubmitting ? 'Sending...' : 'Print Receipt'}
      </Button>
    </div>
  );
}

// ==========================================
// OPTION 5: Settings UI for CloudPRNT Printer
// ==========================================

function CloudPRNTSettings() {
  const [printerMac, setPrinterMac] = useState(
    localStorage.getItem('cloudprnt_printer_mac') || ''
  );
  const [printerType, setPrinterType] = useState<'star' | 'escpos'>(
    (localStorage.getItem('cloudprnt_printer_type') as any) || 'star'
  );
  const [printerName, setPrinterName] = useState(
    localStorage.getItem('cloudprnt_printer_name') || 'Kitchen Printer'
  );

  const { listPrinters, getStatus } = useCloudPRNT();
  const [registeredPrinters, setRegisteredPrinters] = useState([]);

  const handleSave = () => {
    localStorage.setItem('cloudprnt_printer_mac', printerMac);
    localStorage.setItem('cloudprnt_printer_type', printerType);
    localStorage.setItem('cloudprnt_printer_name', printerName);
    toast.success('CloudPRNT settings saved');
  };

  const handleRefresh = async () => {
    const printers = await listPrinters();
    setRegisteredPrinters(printers);
  };

  return (
    <div className="settings-section">
      <h3>CloudPRNT Printer Settings</h3>
      
      <div className="form-group">
        <label>Printer Name</label>
        <input
          type="text"
          value={printerName}
          onChange={(e) => setPrinterName(e.target.value)}
          placeholder="Kitchen Printer"
        />
      </div>

      <div className="form-group">
        <label>Printer MAC Address</label>
        <input
          type="text"
          value={printerMac}
          onChange={(e) => setPrinterMac(e.target.value)}
          placeholder="00:11:62:12:34:56"
        />
      </div>

      <div className="form-group">
        <label>Printer Type</label>
        <select
          value={printerType}
          onChange={(e) => setPrinterType(e.target.value as any)}
        >
          <option value="star">Star (mC-Print3, TSP100IV)</option>
          <option value="escpos">ESC/POS (Generic)</option>
        </select>
      </div>

      <Button onClick={handleSave}>Save Settings</Button>
      <Button onClick={handleRefresh} variant="outline">
        Refresh Registered Printers
      </Button>

      {registeredPrinters.length > 0 && (
        <div className="registered-printers">
          <h4>Registered Printers</h4>
          <ul>
            {registeredPrinters.map((p: any) => (
              <li key={p.mac}>
                {p.model || 'Unknown'} - {p.mac}
                <span>Last seen: {new Date(p.lastPoll).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { CloudPRNTSettings };
