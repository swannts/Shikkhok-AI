import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '../store/useUIStore';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export const useNetworkStatus = (): NetworkStatus => {
  const setOffline = useUIStore((state) => state.setOffline);

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = !!state.isConnected;
      setStatus({
        isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      // Synchronize with global UI offline banner
      setOffline(!isConnected);
    });

    return () => unsubscribe();
  }, [setOffline]);

  return status;
};
