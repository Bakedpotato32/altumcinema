import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const requestDeviceStoragePermissions = async () => {
  if (!Capacitor.isNativePlatform()) {
    // When previewing in browser/Termux localhost, standard file picking is used
    return true;
  }

  try {
    const status = await Filesystem.checkPermissions();
    
    if (status.publicStorage === 'granted') {
      return true;
    }

    const requestResult = await Filesystem.requestPermissions();
    return requestResult.publicStorage === 'granted';
  } catch (err) {
    console.error('Failed to request native storage permissions:', err);
    return false;
  }
};
