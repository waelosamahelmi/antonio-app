import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Capacitor } from '@capacitor/core';

interface AndroidContextType {
  isAndroid: boolean;
  hasNotificationPermission: boolean;
  hasBluetoothPermission: boolean;
  hasNetworkPermission: boolean;
  isLoggedInPersistent: boolean;
  isFirstRun: boolean;
  permissionsRequested: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  requestBluetoothPermission: () => Promise<boolean>;
  requestNetworkPermission: () => Promise<boolean>;
  enablePersistentLogin: () => void;
  sendNotification: (title: string, message: string) => void;
  scanBluetooth: () => Promise<any[]>;
  connectToLocalNetwork: (ip: string) => Promise<boolean>;
  markPermissionsRequested: () => void;
  enableBackgroundMode: () => void;
  keepAppActive: () => void;
  testAndroidInterface: () => void;
}

const AndroidContext = createContext<AndroidContextType | undefined>(undefined);

export function AndroidProvider({ children }: { children: ReactNode }) {
  const [isAndroid, setIsAndroid] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [hasBluetoothPermission, setHasBluetoothPermission] = useState(false);
  const [hasNetworkPermission, setHasNetworkPermission] = useState(false);
  const [isLoggedInPersistent, setIsLoggedInPersistent] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  useEffect(() => {
    // Check if permissions have been requested before
    const hasRequestedBefore = localStorage.getItem('permissions-requested');
    if (hasRequestedBefore) {
      setPermissionsRequested(true);
      setIsFirstRun(false);
    }

    // Use Capacitor for proper platform detection
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    const isAndroidPlatform = platform === 'android';
    
    console.log('🔍 Platform detection:', {
      platform,
      isNative,
      isAndroidPlatform,
      userAgent: navigator.userAgent,
      hasAndroidInterface: typeof (window as any).Android !== 'undefined'
    });

    setIsAndroid(isAndroidPlatform);

    // Check for Android interface (WebView context)
    if (typeof (window as any).Android !== 'undefined') {
      console.log('📱 Android WebView interface detected');
      setIsAndroid(true);
      checkPermissions();
      checkPersistentLogin();
    } else if (isAndroidPlatform && isNative) {
      console.log('📱 Native Android platform detected');
      // In a proper Capacitor app, we'd use Capacitor plugins here
      checkPermissions();
    } else {
      console.log('🌐 Web platform detected, setting default permissions');
      setHasNotificationPermission(false);
      setHasBluetoothPermission(false);
      setHasNetworkPermission(true);
    }

    // Request persistent login on Android
    if (isAndroidPlatform) {
      enablePersistentLogin();
    }
  }, []);

  // Run debug test after everything is initialized
  useEffect(() => {
    if (typeof (window as any).Android !== 'undefined') {
      // Delay to ensure all functions are defined
      setTimeout(() => {
        testAndroidInterface();
      }, 1000);
    }
  }, [isAndroid]);

  const checkPermissions = async () => {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        console.log('🔍 Checking Android permissions...');
        
        // Check notification permission
        let notifications = false;
        if (typeof (window as any).Android.hasNotificationPermission !== 'undefined') {
          notifications = await (window as any).Android.hasNotificationPermission();
          console.log('📱 Notification permission:', notifications);
        } else {
          console.log('⚠️ hasNotificationPermission method not available');
        }
        
        // Check Bluetooth permission
        let bluetooth = false;
        if (typeof (window as any).Android.hasBluetoothPermission !== 'undefined') {
          bluetooth = await (window as any).Android.hasBluetoothPermission();
          console.log('🔵 Bluetooth permission:', bluetooth);
        } else {
          console.log('⚠️ hasBluetoothPermission method not available');
        }
        
        // Check network permission
        let network = true; // Default to true for web compatibility
        if (typeof (window as any).Android.hasNetworkPermission !== 'undefined') {
          network = await (window as any).Android.hasNetworkPermission();
          console.log('🌐 Network permission:', network);
        } else {
          console.log('⚠️ hasNetworkPermission method not available, defaulting to true');
        }
        
        console.log('📊 Permission summary:', { notifications, bluetooth, network });
        
        setHasNotificationPermission(notifications);
        setHasBluetoothPermission(bluetooth);
        setHasNetworkPermission(network);
      } catch (error) {
        console.error('❌ Error checking permissions:', error);
      }
    } else {
      console.log('🌐 Running in web browser, setting default permissions');
      setHasNotificationPermission(false);
      setHasBluetoothPermission(false);
      setHasNetworkPermission(true);
    }
  };

  const checkPersistentLogin = () => {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        const persistent = (window as any).Android.isPersistentLoginEnabled();
        setIsLoggedInPersistent(persistent);
      } catch (error) {
        console.error('Error checking persistent login:', error);
      }
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    console.log('🔔 === REQUESTING NOTIFICATION PERMISSIONS ===');
    console.log('🔍 Platform:', Capacitor.getPlatform());
    console.log('🔍 Is Native:', Capacitor.isNativePlatform());
    console.log('🔍 Android interface available:', typeof (window as any).Android !== 'undefined');

    // Check if running in Android WebView with interface
    if (typeof (window as any).Android !== 'undefined') {
      try {
        console.log('📱 Using Android WebView interface');
        console.log('🔍 Available Android methods:', Object.keys((window as any).Android));
        
        // First request basic notification permission
        let basicNotification = false;
        if (typeof (window as any).Android.requestNotificationPermission !== 'undefined') {
          console.log('📱 Requesting basic notification permission...');
          basicNotification = await (window as any).Android.requestNotificationPermission();
          console.log('✅ Basic notification permission result:', basicNotification);
        } else {
          console.log('⚠️ Basic notification permission method not available');
          alert('Notification permission method not available. Please ensure the app has proper native interface.');
        }
        
        // Request POST_NOTIFICATIONS permission for Android 13+
        let postNotifications = true;
        if (typeof (window as any).Android.requestPostNotificationsPermission !== 'undefined') {
          console.log('📱 Requesting POST_NOTIFICATIONS permission (Android 13+)...');
          postNotifications = await (window as any).Android.requestPostNotificationsPermission();
          console.log('✅ POST_NOTIFICATIONS permission result:', postNotifications);
        } else {
          console.log('ℹ️ POST_NOTIFICATIONS permission method not available (not Android 13+)');
        }
        
        const granted = basicNotification && postNotifications;
        console.log('🏁 Final notification permission result:', granted);
        
        // Re-check permissions after requesting
        await checkPermissions();
        
        return granted;
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        alert(`Error requesting notification permission: ${error}`);
        return false;
      }
    }
    
    // Fallback for native Capacitor app (use Capacitor plugins)
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('📱 Using Capacitor native Android platform');
      console.log('ℹ️ Native Capacitor notification handling not implemented yet');
      setHasNotificationPermission(true);
      return true;
    }
    
    // Fallback for web
    if ('Notification' in window) {
      console.log('🌐 Requesting web notification permission...');
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      console.log('✅ Web notification permission result:', granted);
      setHasNotificationPermission(granted);
      return granted;
    }
    
    // If no notification support available, show alert
    console.log('❌ No notification support available');
    alert('Notification permissions are not available in this environment. Please ensure you are running the app in an Android WebView with proper native interface.');
    return false;
  };

  const requestBluetoothPermission = async (): Promise<boolean> => {
    console.log('🔵 === REQUESTING BLUETOOTH PERMISSIONS ===');
    console.log('🔍 Platform:', Capacitor.getPlatform());
    console.log('🔍 Is Native:', Capacitor.isNativePlatform());
    console.log('🔍 Android interface available:', typeof (window as any).Android !== 'undefined');

    // Check if running in Android WebView with interface
    if (typeof (window as any).Android !== 'undefined') {
      try {
        console.log('📱 Using Android WebView interface');
        console.log('🔍 Available Android methods:', Object.keys((window as any).Android));
        
        let granted = false;
        
        // For Android 12+ (API 31+) - Request comprehensive Bluetooth permissions
        if (typeof (window as any).Android.requestBluetoothPermissions !== 'undefined') {
          console.log('📱 Requesting modern Bluetooth permissions (Android 12+)...');
          granted = await (window as any).Android.requestBluetoothPermissions();
          console.log('✅ Modern Bluetooth permissions result:', granted);
        } else if (typeof (window as any).Android.requestBluetoothPermission !== 'undefined') {
          // Fallback for older Android versions
          console.log('📱 Requesting legacy Bluetooth permission...');
          granted = await (window as any).Android.requestBluetoothPermission();
          console.log('✅ Legacy Bluetooth permission result:', granted);
        } else {
          console.log('❌ No Bluetooth permission request methods available');
          alert('Bluetooth permission methods not available. Please ensure the app has proper native interface.');
          granted = false;
        }
        
        console.log('🏁 Final Bluetooth permission result:', granted);
        
        // Re-check permissions after requesting
        await checkPermissions();
        
        return granted;
      } catch (error) {
        console.error('❌ Error requesting bluetooth permission:', error);
        alert(`Error requesting Bluetooth permission: ${error}`);
        return false;
      }
    }
    
    // Fallback for native Capacitor app (use Capacitor plugins)
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('📱 Using Capacitor native Android platform');
      console.log('ℹ️ Native Capacitor Bluetooth handling not implemented yet');
      setHasBluetoothPermission(true);
      return true;
    }

    // If no Bluetooth support available, show alert
    console.log('❌ No Bluetooth support available');
    alert('Bluetooth permissions are not available in this environment. Please ensure you are running the app in an Android WebView with proper native interface.');
    return false;
  };

  const requestNetworkPermission = async (): Promise<boolean> => {
    console.log('🌐 === REQUESTING NETWORK PERMISSIONS ===');
    console.log('🔍 Platform:', Capacitor.getPlatform());
    console.log('🔍 Is Native:', Capacitor.isNativePlatform());
    console.log('🔍 Android interface available:', typeof (window as any).Android !== 'undefined');

    if (typeof (window as any).Android !== 'undefined') {
      try {
        console.log('📱 Using Android WebView interface');
        let granted = true; // Network is usually granted by default
        
        if (typeof (window as any).Android.requestNetworkPermission !== 'undefined') {
          console.log('📱 Requesting network permission...');
          granted = await (window as any).Android.requestNetworkPermission();
          console.log('✅ Network permission result:', granted);
        } else {
          console.log('ℹ️ Network permission method not available (likely auto-granted)');
        }
        
        await checkPermissions();
        return granted;
      } catch (error) {
        console.error('❌ Error requesting network permission:', error);
        return true; // Default to true for network
      }
    }
    
    // Network is generally available on all platforms
    console.log('🌐 Network access available');
    setHasNetworkPermission(true);
    return true;
  };

  const enablePersistentLogin = () => {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        if (typeof (window as any).Android.enablePersistentLogin !== 'undefined') {
          (window as any).Android.enablePersistentLogin();
          setIsLoggedInPersistent(true);
          console.log('✅ Persistent login enabled');
        }
      } catch (error) {
        console.error('Error enabling persistent login:', error);
      }
    } else {
      // Fallback for web
      setIsLoggedInPersistent(true);
    }
  };

  const sendNotification = (title: string, message: string) => {
    if (typeof (window as any).Android !== 'undefined' && hasNotificationPermission) {
      try {
        if (typeof (window as any).Android.showNotification !== 'undefined') {
          (window as any).Android.showNotification(title, message);
        } else if (typeof (window as any).Android.sendNotification !== 'undefined') {
          (window as any).Android.sendNotification(title, message);
        } else {
          console.log('No notification methods available on Android interface');
        }
      } catch (error) {
        console.error('Error sending Android notification:', error);
      }
    } else if ('Notification' in window && hasNotificationPermission) {
      try {
        new Notification(title, { body: message });
      } catch (error) {
        console.error('Error sending web notification:', error);
      }
    } else {
      console.log('Notifications not available or permission not granted');
    }
  };

  const scanBluetooth = async (): Promise<any[]> => {
    if (typeof (window as any).Android !== 'undefined' && hasBluetoothPermission) {
      try {
        if (typeof (window as any).Android.scanBluetoothDevices !== 'undefined') {
          return await (window as any).Android.scanBluetoothDevices();
        }
      } catch (error) {
        console.error('Error scanning Bluetooth devices:', error);
      }
    }
    return [];
  };

  const connectToLocalNetwork = async (ip: string): Promise<boolean> => {
    if (typeof (window as any).Android !== 'undefined' && hasNetworkPermission) {
      try {
        if (typeof (window as any).Android.connectToNetwork !== 'undefined') {
          return await (window as any).Android.connectToNetwork(ip);
        }
      } catch (error) {
        console.error('Error connecting to network:', error);
      }
    }
    return false;
  };

  const markPermissionsRequested = () => {
    setPermissionsRequested(true);
    setIsFirstRun(false);
    localStorage.setItem('permissions-requested', 'true');
  };

  const enableBackgroundMode = () => {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        if (typeof (window as any).Android.enableBackgroundMode !== 'undefined') {
          (window as any).Android.enableBackgroundMode();
        }
      } catch (error) {
        console.error('Error enabling background mode:', error);
      }
    }
  };

  const keepAppActive = () => {
    if (typeof (window as any).Android !== 'undefined') {
      try {
        if (typeof (window as any).Android.keepAppActive !== 'undefined') {
          (window as any).Android.keepAppActive();
        }
      } catch (error) {
        console.error('Error keeping app active:', error);
      }
    }
  };

  const testAndroidInterface = () => {
    console.log('🧪 === TESTING ANDROID INTERFACE ===');
    console.log('🔍 Platform:', Capacitor.getPlatform());
    console.log('🔍 Is Native:', Capacitor.isNativePlatform());
    console.log('🔍 User Agent:', navigator.userAgent);
    console.log('🔍 Android interface available:', typeof (window as any).Android !== 'undefined');
    
    if (typeof (window as any).Android !== 'undefined') {
      console.log('📱 Available Android methods:', Object.keys((window as any).Android));
      console.log('🎯 Testing basic method calls...');
      
      // Test each method availability
      const methods = [
        'hasNotificationPermission',
        'hasBluetoothPermission', 
        'hasNetworkPermission',
        'requestNotificationPermission',
        'requestBluetoothPermission',
        'requestNetworkPermission'
      ];
      
      methods.forEach(method => {
        const available = typeof (window as any).Android[method] !== 'undefined';
        console.log(`🔍 ${method}: ${available ? '✅ Available' : '❌ Not Available'}`);
      });
    } else {
      console.log('❌ Android interface not available');
    }
  };

  const value: AndroidContextType = {
    isAndroid,
    hasNotificationPermission,
    hasBluetoothPermission,
    hasNetworkPermission,
    isLoggedInPersistent,
    isFirstRun,
    permissionsRequested,
    requestNotificationPermission,
    requestBluetoothPermission,
    requestNetworkPermission,
    enablePersistentLogin,
    sendNotification,
    scanBluetooth,
    connectToLocalNetwork,
    markPermissionsRequested,
    enableBackgroundMode,
    keepAppActive,
    testAndroidInterface,
  };

  return (
    <AndroidContext.Provider value={value}>
      {children}
    </AndroidContext.Provider>
  );
}

export function useAndroid() {
  const context = useContext(AndroidContext);
  if (context === undefined) {
    throw new Error("useAndroid must be used within an AndroidProvider");
  }
  return context;
}
