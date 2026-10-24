import { registerPlugin, Capacitor } from '@capacitor/core';

export const MediaScanner = registerPlugin('MediaScanner');

export const checkDeviceStoragePermissions = async () => {
  if (!Capacitor.isNativePlatform()) {
    return { granted: true };
  }
  try {
    return await MediaScanner.checkPermissions();
  } catch (err) {
    console.warn('Native checkPermissions error:', err);
    return { granted: false };
  }
};

export const requestDeviceStoragePermissions = async () => {
  if (!Capacitor.isNativePlatform()) {
    return { granted: true };
  }
  try {
    return await MediaScanner.requestStoragePermissions();
  } catch (err) {
    console.error('Native requestStoragePermissions error:', err);
    return { granted: false };
  }
};

export const openAllFilesSettings = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await MediaScanner.openAllFilesSettings();
  } catch (err) {
    console.error('Failed opening all files settings:', err);
  }
};

export const scanAllDeviceVideos = async () => {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }
  try {
    const response = await MediaScanner.scanVideos();
    return response?.folders || [];
  } catch (err) {
    console.error('Native scanVideos error:', err);
    return [];
  }
};
