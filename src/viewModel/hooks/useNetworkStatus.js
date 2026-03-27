import * as Network from "expo-network";
import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    isInternetReachable: true,
    type: null
  });

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();

      setNetworkState({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type
      });

    } catch (error) {
      setNetworkState({
        isOnline: false,
        isInternetReachable: false,
        type: null
      });
    }
  };

  useEffect(() => {
    checkNetwork();

    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline: networkState.isOnline,
    isInternetReachable: networkState.isInternetReachable,
    isConnected: networkState.isOnline && networkState.isInternetReachable,
    networkType: networkState.type
  };
};