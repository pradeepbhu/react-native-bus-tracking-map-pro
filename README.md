# react-native-bus-tracking-map-pro

🚌 Production-ready React Native map — **bus tracking**, **live WebSocket**, **My Location button**, **dark/satellite mode**, multi-bus, road routing, and more.

---

## Install

```bash
npm install react-native-bus-tracking-map-pro react-native-webview
cd ios && pod install   # iOS only
```

---

## Quick Examples

### 1️⃣ Only Map (no route, no bus)
```tsx
<BusTrackingMap mode="static" />
```

### 2️⃣ Route Only (no live bus)
```tsx
<BusTrackingMap route={ROUTE} mode="route" />
```

### 3️⃣ Static Bus (manual position)
```tsx
<BusTrackingMap
  route={ROUTE}
  buses={[{ id: 'bus1', lat: 28.61, lng: 77.37, label: 'Bus A' }]}
/>
```

### 4️⃣ Live Tracking (WebSocket — optional)
```tsx
<BusTrackingMap
  route={ROUTE}
  wsUrl="ws://your-server.com:3000"
  showTrail
  showStatusBadge
/>
```

### 5️⃣ Dark / Satellite Mode
```tsx
<BusTrackingMap route={ROUTE} theme="dark" />
<BusTrackingMap route={ROUTE} theme="satellite" />
```

---

## WebSocket Message Formats

Server se koi bhi format bhejo — sab supported hai:

```json
// Multi-bus
{ "buses": [{ "id": "bus1", "lat": 28.61, "lng": 77.37 }] }

// Array directly
[{ "id": "bus1", "lat": 28.61, "lng": 77.37 }]

// Single bus (id optional, default 'bus1')
{ "id": "bus1", "lat": 28.61, "lng": 77.37 }
```

---

## All Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **`route`** | `Route` | — | Start, stops[], end |
| **`mode`** | `'tracking' \| 'route' \| 'static'` | auto | Map mode |
| `buses` | `Bus[]` | `[]` | Static bus positions |
| `wsUrl` | `string` | — | WebSocket URL (optional, only for live) |
| `autoReconnect` | `boolean` | `true` | Auto reconnect WS |
| `followBusId` | `string` | — | Pan map to this bus |
| `theme` | `'light' \| 'dark' \| 'satellite' \| 'terrain'` | `'light'` | Map style |
| `zoom` | `number` | `14` | Initial zoom |
| `center` | `{lat, lng}` | route.start | Override map center |
| `showRoute` | `boolean` | `true` | OSRM road line |
| `showTrail` | `boolean` | `true` | Bus path trail |
| `trailMaxPoints` | `number` | `100` | Max trail history points |
| `showStops` | `boolean` | `true` | Stop markers |
| `showStartEnd` | `boolean` | `true` | Start/End markers |
| `showMyLocationButton` | `boolean` | `true` | 📍 My Location button |
| `showZoomControls` | `boolean` | `true` | +/- zoom buttons |
| `showStatusBadge` | `boolean` | auto | WS live status badge |
| `showScaleBar` | `boolean` | `false` | Scale bar |
| `showSpeed` | `boolean` | `false` | Bus speed in popup |
| `onBusPress` | `(bus) => void` | — | Bus tap event |
| `onStopPress` | `(stop) => void` | — | Stop tap event |
| `onMapPress` | `(latlng) => void` | — | Map tap event |
| `onMyLocation` | `(latlng) => void` | — | My location result |
| `onWsConnect` | `() => void` | — | WS connected |
| `onWsDisconnect` | `() => void` | — | WS disconnected |
| `style` | `ViewStyle` | — | Container style |
| `height` | `number` | — | Fixed height (px) |

---

## Types

```ts
type Route = {
  start: Location;
  stops?: Location[];
  end: Location;
};

type Location = {
  lat: number;
  lng: number;
  name?: string;
};

type Bus = {
  id: string;
  lat: number;
  lng: number;
  label?: string;     // shown below icon
  color?: string;     // trail color e.g. '#9C27B0'
  heading?: number;   // 0-360
  speed?: number;     // km/h
};
```

---

## Peer Dependencies

```
react >= 17
react-native >= 0.68
react-native-webview >= 11
```

---

## License

MIT
# react-native-bus-tracking-map-pro
