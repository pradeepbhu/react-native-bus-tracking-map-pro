import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BusTrackingMap } from 'react-native-bus-tracking-map-pro';

const ROUTE = {
  start: { lat: 28.627952, lng: 77.374523, name: 'Noida Sector 52 Metro' },
  stops: [
    { lat: 28.617887, lng: 77.373751, name: 'Stop 1 - Sector 51' },
    { lat: 28.610122, lng: 77.373021, name: 'Stop 2 - Sector 50' },
    { lat: 28.600731, lng: 77.372471, name: 'Stop 3 - Sector 49' },
  ],
  end: { lat: 28.585247, lng: 77.379129, name: 'DPS School Noida' },
};

// ─────────────────────────────────────────────
// 1️⃣  ONLY MAP — no route, no bus (sirf map)
// ─────────────────────────────────────────────
export function OnlyMapExample() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BusTrackingMap mode="static" />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 2️⃣  ROUTE ONLY — bus nahi, sirf road line
// ─────────────────────────────────────────────
export function RouteOnlyExample() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BusTrackingMap
        route={ROUTE}
        mode="route"
        theme="light"
        showMyLocationButton={true}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 3️⃣  STATIC BUS — WebSocket nahi, manual lat/lng
// ─────────────────────────────────────────────
export function StaticBusExample() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BusTrackingMap
        route={ROUTE}
        buses={[
          { id: 'bus1', lat: 28.610, lng: 77.373, label: 'Bus A' },
          { id: 'bus2', lat: 28.617, lng: 77.374, label: 'Bus B', color: '#9C27B0' },
        ]}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 4️⃣  LIVE TRACKING — WebSocket se real-time
// ─────────────────────────────────────────────
export function LiveTrackingExample() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BusTrackingMap
        route={ROUTE}
        wsUrl="ws://your-server.com:3000"   // optional — sirf live tracking ke liye
        showTrail={true}
        showStatusBadge={true}
        onWsConnect={() => console.log('Connected!')}
        onWsDisconnect={() => console.log('Disconnected!')}
        onBusPress={(bus) => console.log('Bus tapped:', bus)}
        onStopPress={(stop) => console.log('Stop tapped:', stop)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 5️⃣  DARK MODE + SATELLITE
// ─────────────────────────────────────────────
export function DarkModeExample() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'satellite' | 'terrain'>('dark');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>
      <View style={styles.themeRow}>
        {(['light', 'dark', 'satellite', 'terrain'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTheme(t)}
            style={[styles.themeBtn, theme === t && styles.themeBtnActive]}
          >
            <Text style={styles.themeTxt}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <BusTrackingMap route={ROUTE} theme={theme} showMyLocationButton />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 6️⃣  MY LOCATION callback
// ─────────────────────────────────────────────
export function MyLocationExample() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loc && (
        <View style={styles.locBar}>
          <Text style={styles.locText}>
            📍 {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </Text>
        </View>
      )}
      <BusTrackingMap
        mode="static"
        showMyLocationButton
        onMyLocation={(l) => setLoc(l)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 7️⃣  FULL FEATURED (default export)
// ─────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BusTrackingMap
        route={ROUTE}
        wsUrl="ws://your-server.com:3000"
        showTrail
        showMyLocationButton
        showStatusBadge
        showScaleBar
        showSpeed
        theme="light"
        zoom={14}
        followBusId="bus1"
        onBusPress={(bus) => alert('Bus: ' + bus.id)}
        onStopPress={(stop) => alert('Stop: ' + stop.name)}
        onMapPress={(loc) => console.log('Map tapped:', loc)}
        onMyLocation={(loc) => console.log('My loc:', loc)}
        onWsConnect={() => console.log('WS connected')}
        onWsDisconnect={() => console.log('WS disconnected')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    backgroundColor: '#222',
    padding: 8,
    gap: 6,
    justifyContent: 'center',
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#444',
  },
  themeBtnActive: { backgroundColor: '#2979FF' },
  themeTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  locBar: {
    backgroundColor: '#1565C0',
    padding: 8,
    alignItems: 'center',
  },
  locText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
