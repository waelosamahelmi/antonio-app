import { NotificationSoundManager } from './notification-sound-manager-enhanced';

export interface BackgroundNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  specialInstructions?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    toppings?: string[];
  }>;
}

export class BackgroundNotificationManager {
  private static instance: BackgroundNotificationManager;
  private soundManager: NotificationSoundManager;
  private currentNotification: BackgroundNotificationData | null = null;
  private isNotificationActive = false;
  private notificationHandlers: {
    onAccept?: (orderId: string) => void;
    onDecline?: (orderId: string) => void;
    onShow?: (order: BackgroundNotificationData) => void;
  } = {};

  private constructor() {
    this.soundManager = NotificationSoundManager.getInstance();
    this.setupBackgroundHandling();
  }

  static getInstance(): BackgroundNotificationManager {
    if (!BackgroundNotificationManager.instance) {
      BackgroundNotificationManager.instance = new BackgroundNotificationManager();
    }
    return BackgroundNotificationManager.instance;
  }

  private setupBackgroundHandling(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.isNotificationActive) {
        if (document.hidden) {
          // Page is hidden, ensure notification continues in background
          this.ensureBackgroundNotification();
        } else {
          // Page is visible, make sure popup is shown
          this.ensureForegroundNotification();
        }
      }
    });

    // Handle Android-specific background events
    if (typeof (window as any).Android !== 'undefined') {
      // Enable background mode for persistent notifications
      try {
        if (typeof (window as any).Android.enableBackgroundMode !== 'undefined') {
          (window as any).Android.enableBackgroundMode();
        }
        if (typeof (window as any).Android.keepAppActive !== 'undefined') {
          (window as any).Android.keepAppActive();
        }
      } catch (error) {
        console.warn('Could not enable Android background mode:', error);
      }
    }
  }

  setNotificationHandlers(handlers: {
    onAccept?: (orderId: string) => void;
    onDecline?: (orderId: string) => void;
    onShow?: (order: BackgroundNotificationData) => void;
  }): void {
    this.notificationHandlers = handlers;
  }
  async showOrderNotification(orderData: BackgroundNotificationData): Promise<void> {
    console.log('🚨 BackgroundNotificationManager: Showing new order notification', orderData);
    
    this.currentNotification = orderData;
    this.isNotificationActive = true;

    // Start loud looping sound immediately
    this.soundManager.forceStartSound();

    // Show popup immediately if app is in foreground
    this.notificationHandlers.onShow?.(orderData);

    // Send Android system notification for background
    await this.sendAndroidNotification(orderData);

    // Force show modal with a slight delay to ensure it appears
    setTimeout(() => {
      if (this.isNotificationActive && !document.hidden) {
        console.log('🚨 Force showing notification modal');
        this.notificationHandlers.onShow?.(orderData);
      }
    }, 100);

    // Ensure notification persists across app states
    this.ensurePersistentNotification();
  }

  private async sendAndroidNotification(orderData: BackgroundNotificationData): Promise<void> {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        const title = `🚨 NEW ORDER #${orderData.orderNumber}`;
        const message = `${orderData.customerName} - €${orderData.totalAmount.toFixed(2)} - ${orderData.orderType.toUpperCase()}`;
        
        // Send notification with high priority and persistent flags
        if (typeof (window as any).Android.showNotificationWithActions !== 'undefined') {
          // Enhanced notification with action buttons
          await (window as any).Android.showNotificationWithActions(
            title,
            message,
            JSON.stringify({
              orderId: orderData.orderId,
              actions: ['ACCEPT', 'DECLINE'],
              priority: 'HIGH',
              persistent: true,
              sound: true,
              vibrate: true
            })
          );
        } else if (typeof (window as any).Android.showNotification !== 'undefined') {
          // Fallback to basic notification
          await (window as any).Android.showNotification(title, message);
        } else if (typeof (window as any).Android.sendNotification !== 'undefined') {
          // Legacy fallback
          await (window as any).Android.sendNotification(title, message);
        }

        console.log('✅ Android notification sent successfully');
      } catch (error) {
        console.error('❌ Failed to send Android notification:', error);
      }
    }

    // Fallback to web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(`🚨 NEW ORDER #${orderData.orderNumber}`, {
          body: `${orderData.customerName} - €${orderData.totalAmount.toFixed(2)}`,
          icon: '/generated-icon.png',
          badge: '/generated-icon.png',
          tag: `order-${orderData.orderId}`,
          requireInteraction: true,
          silent: false,
          data: {
            orderId: orderData.orderId
          }
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          this.notificationHandlers.onShow?.(orderData);
          notification.close();
        };

      } catch (error) {
        console.error('❌ Failed to send web notification:', error);
      }
    }
  }

  private ensurePersistentNotification(): void {
    // Keep checking if notification is still active and ensure it continues
    const checkInterval = setInterval(() => {
      if (!this.isNotificationActive) {
        clearInterval(checkInterval);
        return;
      }

      // If sound stopped playing, restart it
      if (!this.soundManager.isCurrentlyPlaying()) {
        console.log('🔔 Restarting notification sound for persistence');
        this.soundManager.startNotificationSound();
      }

      // Re-send Android notification periodically for persistence
      if (this.currentNotification && document.hidden) {
        this.sendAndroidNotification(this.currentNotification);
      }
    }, 10000); // Check every 10 seconds
  }

  private ensureBackgroundNotification(): void {
    if (this.currentNotification) {
      console.log('📱 Ensuring background notification for order:', this.currentNotification.orderId);
      this.sendAndroidNotification(this.currentNotification);
    }
  }

  private ensureForegroundNotification(): void {
    if (this.currentNotification) {
      console.log('📱 Ensuring foreground notification for order:', this.currentNotification.orderId);
      this.notificationHandlers.onShow?.(this.currentNotification);
    }
  }

  acceptOrder(): void {
    if (!this.currentNotification) return;
    
    console.log('✅ Order accepted:', this.currentNotification.orderId);
    
    // Stop all notifications
    this.stopNotification();
    
    // Call accept handler
    this.notificationHandlers.onAccept?.(this.currentNotification.orderId);
  }

  declineOrder(): void {
    if (!this.currentNotification) return;
    
    console.log('❌ Order declined:', this.currentNotification.orderId);
    
    // Stop all notifications
    this.stopNotification();
    
    // Call decline handler
    this.notificationHandlers.onDecline?.(this.currentNotification.orderId);
  }

  dismissNotification(): void {
    console.log('🔕 Notification dismissed');
    this.stopNotification();
  }

  private stopNotification(): void {
    this.isNotificationActive = false;
    this.currentNotification = null;
    
    // Stop sound
    this.soundManager.stopNotificationSound();
    
    // Clear any web notifications
    if ('navigator' in window && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }

    // Clear Android notifications
    if (typeof (window as any).Android !== 'undefined') {
      try {
        if (typeof (window as any).Android.clearNotifications !== 'undefined') {
          (window as any).Android.clearNotifications();
        }
      } catch (error) {
        console.warn('Could not clear Android notifications:', error);
      }
    }
  }

  getCurrentNotification(): BackgroundNotificationData | null {
    return this.currentNotification;
  }

  isActive(): boolean {
    return this.isNotificationActive;
  }

  destroy(): void {
    this.stopNotification();
    this.soundManager.destroy();
  }
}

// Global instance
export const backgroundNotificationManager = BackgroundNotificationManager.getInstance();
