export const useNetworkStatus = () => {
  const isOnline = ref(true);
  
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };
  
  if (import.meta.client) {
    // Initialize immediately for client-side
    isOnline.value = navigator.onLine;
    
    onMounted(() => {
      updateOnlineStatus();
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    });
    
    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });
  }
  
  return { isOnline: readonly(isOnline) };
};