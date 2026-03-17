import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export const useWebSocket = (
  url: string | undefined,
  onMessage: MessageHandler,
  onConnect?: () => void,
  onDisconnect?: () => void,
  autoReconnect: boolean = true,
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!url || !isMounted.current) return;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      if (onConnect) onConnect();
    };

    wsRef.current.onmessage = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onMessage(data);
      } catch (_) {
        // ignore malformed
      }
    };

    wsRef.current.onclose = () => {
      if (onDisconnect) onDisconnect();
      if (autoReconnect && isMounted.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    wsRef.current.onerror = () => {
      wsRef.current?.close();
    };
  }, [url, autoReconnect]);

  useEffect(() => {
    isMounted.current = true;
    if (url) connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [url]);
};
