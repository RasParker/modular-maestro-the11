// Utility functions for localStorage with reactive updates

export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
  
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('localStorageChange', {
    detail: { key, value }
  }));
  
  // Also dispatch storage event for cross-tab updates
  window.dispatchEvent(new StorageEvent('storage', {
    key: key,
    newValue: value,
    oldValue: localStorage.getItem(key),
    storageArea: localStorage,
    url: window.location.href
  }));
};

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(key);
  
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('localStorageChange', {
    detail: { key, value: null }
  }));
};

export const getLocalStorageItem = (key: string): string | null => {
  return localStorage.getItem(key);
};

export const setLocalStorageObject = (key: string, value: any) => {
  const jsonValue = JSON.stringify(value);
  setLocalStorageItem(key, jsonValue);
};

export const getLocalStorageObject = (key: string): any => {
  const item = getLocalStorageItem(key);
  if (!item) return null;
  
  try {
    return JSON.parse(item);
  } catch (error) {
    console.error('Error parsing localStorage object:', error);
    return null;
  }
};