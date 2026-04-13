import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const appState = useRef(AppState.currentState);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const hasInternet = state.isConnected && state.isInternetReachable !== false;

      setIsConnected(hasInternet);
    } catch (error) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkNetwork();

    const subscription = Network.addNetworkStateListener(() => {
      checkNetwork();
    });

    const appStateSubscription = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkNetwork();
      }
      appState.current = nextAppState;
    });

    const interval = setInterval(checkNetwork, 5000);

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, []);

  return { isConnected };
};