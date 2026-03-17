import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
// @ts-ignore
import { WebView } from 'react-native-webview';
import { BusTrackingMapProps, Bus, MapMode } from '../types';
import { buildHTML } from '../utils/buildHTML';
import { useWebSocket } from '../hooks/useWebSocket';

const BusTrackingMap: React.FC<BusTrackingMapProps> = (props) => {
  const {
    route,
    mode,
    buses: propBuses = [],
    wsUrl,
    autoReconnect = true,
    followBusId,
    theme = 'light',
    zoom = 14,
    center,
    showRoute,
    showTrail = true,
    trailMaxPoints = 100,
    showStops = true,
    showStartEnd = true,
    showMyLocationButton = true,
    showZoomControls = true,
    showStatusBadge,
    showScaleBar = false,
    showSpeed = false,
    isConnected,
    onBusPress,
    onStopPress,
    onMapPress,
    onWsConnect,
    onWsDisconnect,
    onMyLocation,
    style,
    height,
  } = props;

  const webRef = useRef<any>(null);
  const [buses, setBuses] = useState<Bus[]>(propBuses);

  // Auto-detect mode
  const resolvedMode: MapMode = mode ?? (wsUrl || propBuses.length > 0 ? 'tracking' : route ? 'route' : 'static');

  // ── WebSocket ──────────────────────────────────────────────
  const handleWsMessage = useCallback((data: any) => {
    // Support multiple formats:
    // { buses: [...] }        → multi-bus
    // [{ id, lat, lng }, ...] → array of buses
    // { id, lat, lng }        → single bus (auto-id)
    if (Array.isArray(data)) {
      setBuses(data as Bus[]);
    } else if (data?.buses && Array.isArray(data.buses)) {
      setBuses(data.buses as Bus[]);
    } else if (data?.lat !== undefined && data?.lng !== undefined) {
      const id = data.id || 'bus1';
      setBuses((prev) => {
        const exists = prev.findIndex((b) => b.id === id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = { ...updated[exists], ...data, id };
          return updated;
        }
        return [...prev, { id, ...data }];
      });
    }
  }, []);

  const handleWsConnect = useCallback(() => {
    webRef.current?.injectJavaScript(`window.setStatus && window.setStatus('connected'); true;`);
    onWsConnect?.();
  }, [onWsConnect]);

  const handleWsDisconnect = useCallback(() => {
    webRef.current?.injectJavaScript(`window.setStatus && window.setStatus('disconnected'); true;`);
    onWsDisconnect?.();
  }, [onWsDisconnect]);

  useWebSocket(wsUrl, handleWsMessage, handleWsConnect, handleWsDisconnect, autoReconnect);

  // ── Sync prop buses (manual / static) ─────────────────────
  useEffect(() => {
    setBuses(propBuses);
  }, [propBuses]);

  // ── Inject bus updates into WebView ───────────────────────
  useEffect(() => {
    if (!webRef.current || buses.length === 0) return;
    webRef.current.injectJavaScript(`
      if (window.updateBuses) { updateBuses(${JSON.stringify(buses)}); }
      true;
    `);
  }, [buses]);

  // ── External isConnected prop → WebView badge update ─────
  useEffect(() => {
    if (isConnected === undefined || !webRef.current) return;
    const status = isConnected ? 'connected' : 'disconnected';
    webRef.current.injectJavaScript(`window.setStatus && window.setStatus('${status}'); true;`);
  }, [isConnected]);

  // ── Follow bus ────────────────────────────────────────────
  useEffect(() => {
    if (!followBusId || !webRef.current) return;
    webRef.current.injectJavaScript(`
      if (window.followBus) { followBus('${followBusId}'); }
      true;
    `);
  }, [followBusId, buses]);

  // ── Handle messages from WebView ──────────────────────────
  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'busPress':
          onBusPress?.(msg.bus);
          break;
        case 'stopPress':
          onStopPress?.(msg.stop);
          break;
        case 'mapPress':
          onMapPress?.({ lat: msg.lat, lng: msg.lng });
          break;
        case 'myLocation':
          onMyLocation?.({ lat: msg.lat, lng: msg.lng });
          break;
      }
    } catch (_) {}
  }, [onBusPress, onStopPress, onMapPress, onMyLocation]);

  // ── Build HTML ────────────────────────────────────────────
  const html = buildHTML({
    route,
    mode: resolvedMode,
    zoom,
    theme,
    centerLat: center?.lat,
    centerLng: center?.lng,
    showRoute: showRoute ?? (resolvedMode !== 'static' && !!route),
    showTrail,
    trailMaxPoints,
    showStops,
    showStartEnd,
    showMyLocationButton,
    showZoomControls,
    showStatusBadge: showStatusBadge ?? (!!wsUrl || isConnected !== undefined),
    showScaleBar,
    showSpeed,
  });

  const containerStyle = [
    styles.container,
    height ? { height, flex: undefined as any } : undefined,
    style,
  ].filter(Boolean);

  return (
    <View style={containerStyle}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs
        geolocationEnabled
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});

export default BusTrackingMap;