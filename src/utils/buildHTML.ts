import { Route, MapTheme, MapMode } from '../types';

const TILES: Record<MapTheme, { url: string; attribution: string }> = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '© CARTO © OpenStreetMap',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '© CARTO © OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap © OpenStreetMap',
  },
};

const FALLBACK_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap',
};

export interface BuildHTMLOptions {
  route?: Route;
  mode?: MapMode;
  zoom?: number;
  theme?: MapTheme;
  centerLat?: number;
  centerLng?: number;
  showRoute?: boolean;
  showTrail?: boolean;
  trailMaxPoints?: number;
  showStops?: boolean;
  showStartEnd?: boolean;
  showMyLocationButton?: boolean;
  showZoomControls?: boolean;
  showStatusBadge?: boolean;
  showScaleBar?: boolean;
  showSpeed?: boolean;
}

export const buildHTML = (opts: BuildHTMLOptions): string => {
  const {
    route,
    mode = route ? (opts.showRoute !== false ? 'route' : 'static') : 'static',
    zoom = 14,
    theme = 'light',
    showRoute = mode !== 'static' && !!route,
    showTrail = true,
    trailMaxPoints = 100,
    showStops = true,
    showStartEnd = true,
    showMyLocationButton = true,
    showZoomControls = true,
    showStatusBadge = false,
    showScaleBar = false,
    showSpeed = false,
  } = opts;

  const tile = TILES[theme] || TILES.light;
  const isDark = theme === 'dark';

  // Default center
  let defaultLat = opts.centerLat ?? route?.start?.lat ?? 28.6139;
  let defaultLng = opts.centerLng ?? route?.start?.lng ?? 77.2090;

  const routeJSON = route ? JSON.stringify(route) : 'null';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:${isDark ? '#1a1a2e' : '#f0f0f0'}; }
    #map { width:100%; height:100%; }

    /* Loading overlay */
    #loading {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.75);
      color:#fff; padding:10px 18px;
      border-radius:20px; font-family:sans-serif;
      font-size:13px; z-index:9999;
      display:none; pointer-events:none;
    }

    /* My Location Button */
    #myLocationBtn {
      position:absolute; bottom:80px; right:12px;
      width:42px; height:42px;
      background:${isDark ? '#2d2d44' : '#fff'};
      border:none; border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      cursor:pointer; z-index:1000;
      display:${showMyLocationButton ? 'flex' : 'none'};
      align-items:center; justify-content:center;
      font-size:20px; transition:transform 0.15s;
    }
    #myLocationBtn:active { transform:scale(0.9); }

    /* Status badge */
    #statusBadge {
      position:absolute; top:10px; left:50%;
      transform:translateX(-50%);
      padding:5px 14px; border-radius:20px;
      font-family:sans-serif; font-size:12px;
      font-weight:bold; z-index:1000;
      display:${showStatusBadge ? 'block' : 'none'};
      transition:background 0.3s;
      pointer-events:none;
    }
    #statusBadge.connected { background:#4CAF50; color:#fff; }
    #statusBadge.disconnected { background:#f44336; color:#fff; }
    #statusBadge.waiting { background:#FF9800; color:#fff; }

    /* Pulse animation for live bus */
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(244,67,54,0.6); }
      70%  { box-shadow: 0 0 0 10px rgba(244,67,54,0); }
      100% { box-shadow: 0 0 0 0 rgba(244,67,54,0); }
    }
    .bus-pulse { animation: pulse 1.5s infinite; border-radius:50%; }

    /* Zoom controls overrides */
    .leaflet-control-zoom {
      display: ${showZoomControls ? 'block' : 'none'} !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="loading">🛣️ Route load ho rahi hai...</div>
  ${showMyLocationButton ? '<button id="myLocationBtn" title="My Location">📍</button>' : ''}
  ${showStatusBadge ? '<div id="statusBadge" class="waiting">⏳ Connecting...</div>' : ''}

  <script>
    // ── State ────────────────────────────────────────────────
    var route = ${routeJSON};
    var busMarkers = {};
    var busTrails = {};
    var busTrailLines = {};
    var TRAIL_MAX = ${trailMaxPoints};

    // ── Map Init ─────────────────────────────────────────────
    var map = L.map('map', {
      zoomControl: ${showZoomControls},
      attributionControl: true,
    }).setView([${defaultLat}, ${defaultLng}], ${zoom});

    // Primary tile
    var primaryTile = L.tileLayer('${tile.url}', {
      attribution: '${tile.attribution}',
      maxZoom: 19,
    }).addTo(map);

    // Fallback tile on error
    var fallbackAdded = false;
    primaryTile.on('tileerror', function() {
      if (!fallbackAdded) {
        fallbackAdded = true;
        L.tileLayer('${FALLBACK_TILE.url}', {
          attribution: '${FALLBACK_TILE.attribution}',
          maxZoom: 19,
        }).addTo(map);
      }
    });

    ${showScaleBar ? "L.control.scale({ imperial: false }).addTo(map);" : ""}

    // ── Icons ─────────────────────────────────────────────────
    function makeBusIcon(label, color) {
      var c = color || '#1565C0';
      return L.divIcon({
        html:
          '<div style="display:flex;flex-direction:column;align-items:center;">' +
            '<div class="bus-pulse" style="background:' + c + ';width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">🚌</div>' +
            (label ? '<div style="background:' + c + ';color:#fff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:6px;margin-top:2px;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;">' + label + '</div>' : '') +
          '</div>',
        iconSize: [40, label ? 56 : 42],
        iconAnchor: [20, label ? 56 : 42],
        className: '',
      });
    }

    var startIcon = L.divIcon({
      html: '<div style="background:#4CAF50;color:#fff;padding:5px 10px;border-radius:14px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🟢 ' + (route && route.start && route.start.name ? route.start.name : 'Start') + '</div>',
      iconAnchor: [32, 14],
      className: '',
    });

    var endIcon = L.divIcon({
      html: '<div style="background:#f44336;color:#fff;padding:5px 10px;border-radius:14px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏁 ' + (route && route.end && route.end.name ? route.end.name : 'End') + '</div>',
      iconAnchor: [32, 14],
      className: '',
    });

    function makeStopIcon(name) {
      return L.divIcon({
        html: '<div style="background:#FF9800;color:#fff;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      });
    }

    var myLocationMarker = null;
    var myLocationCircle = null;
    var myLocationIcon = L.divIcon({
      html: '<div style="background:#2979FF;width:18px;height:18px;border-radius:50%;border:4px solid #fff;box-shadow:0 2px 8px rgba(41,121,255,0.6);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: '',
    });

    // ── Map Click ─────────────────────────────────────────────
    map.on('click', function(e) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'mapPress', lat: e.latlng.lat, lng: e.latlng.lng })
      );
    });

    // ── Route Markers ─────────────────────────────────────────
    function addMarkers() {
      if (!route) return;

      if (${showStartEnd}) {
        L.marker([route.start.lat, route.start.lng], { icon: startIcon })
          .addTo(map)
          .bindPopup('<b>' + (route.start.name || 'Start') + '</b>');

        L.marker([route.end.lat, route.end.lng], { icon: endIcon })
          .addTo(map)
          .bindPopup('<b>' + (route.end.name || 'End') + '</b>');
      }

      if (${showStops} && route.stops && route.stops.length) {
        route.stops.forEach(function(stop, i) {
          L.marker([stop.lat, stop.lng], { icon: makeStopIcon(stop.name) })
            .addTo(map)
            .on('click', function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'stopPress', stop: stop })
              );
            })
            .bindPopup(
              '<b>🟠 Stop ' + (i + 1) + '</b>' +
              (stop.name ? '<br>' + stop.name : '')
            );
        });
      }
    }

    // ── Road Route Drawing ────────────────────────────────────
    ${showRoute && route ? `
    async function drawRoute() {
      document.getElementById('loading').style.display = 'block';
      try {
        var all = [route.start].concat(route.stops || []).concat([route.end]);
        var coordStr = all.map(function(p){ return p.lng + ',' + p.lat; }).join(';');
        var res = await fetch(
          'https://router.project-osrm.org/route/v1/driving/' + coordStr +
          '?overview=full&geometries=geojson'
        );
        var data = await res.json();
        if (data.code === 'Ok') {
          var road = data.routes[0].geometry.coordinates.map(function(c){ return [c[1], c[0]]; });
          L.polyline(road, { color: '${isDark ? '#64B5F6' : '#1565C0'}', weight: 5, opacity: 0.85 }).addTo(map);
          map.fitBounds(road, { padding: [50, 50] });
        } else { throw new Error('OSRM no route'); }
      } catch(e) {
        // Fallback: straight dashed line
        var pts = [route.start].concat(route.stops || []).concat([route.end]).map(function(p){ return [p.lat, p.lng]; });
        L.polyline(pts, { color: '${isDark ? '#64B5F6' : '#1565C0'}', weight: 4, opacity: 0.7, dashArray: '10,6' }).addTo(map);
        map.fitBounds(pts, { padding: [50, 50] });
      }
      document.getElementById('loading').style.display = 'none';
      addMarkers();
    }
    drawRoute();
    ` : `addMarkers();`}

    // ── Live Bus Update ───────────────────────────────────────
    window.updateBuses = function(buses) {
      buses.forEach(function(bus) {
        var latlng = [bus.lat, bus.lng];
        var icon = makeBusIcon(bus.label, bus.color);

        if (busMarkers[bus.id]) {
          busMarkers[bus.id].setLatLng(latlng).setIcon(icon);
        } else {
          busMarkers[bus.id] = L.marker(latlng, { icon: icon, zIndexOffset: 1000 })
            .addTo(map)
            .on('click', function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'busPress', bus: bus })
              );
            })
            .bindPopup(
              '<b>🚌 Bus ' + bus.id + '</b>' +
              (bus.label ? '<br>' + bus.label : '') +
              (${showSpeed} && bus.speed !== undefined ? '<br>🚀 ' + bus.speed + ' km/h' : '')
            );
        }

        // Trail
        ${showTrail ? `
        if (!busTrails[bus.id]) busTrails[bus.id] = [];
        busTrails[bus.id].push(latlng);
        if (busTrails[bus.id].length > TRAIL_MAX) busTrails[bus.id].shift();
        var trailColor = bus.color || '#f44336';
        if (busTrailLines[bus.id]) {
          busTrailLines[bus.id].setLatLngs(busTrails[bus.id]);
        } else {
          busTrailLines[bus.id] = L.polyline(busTrails[bus.id], {
            color: trailColor, weight: 3, opacity: 0.75,
          }).addTo(map);
        }
        busTrailLines[bus.id].setStyle({ color: trailColor });
        ` : ''}
      });
    };

    // ── Follow Bus ────────────────────────────────────────────
    window.followBus = function(busId) {
      if (busMarkers[busId]) {
        map.panTo(busMarkers[busId].getLatLng(), { animate: true, duration: 0.5 });
      }
    };

    // ── WebSocket Status Badge ────────────────────────────────
    window.setStatus = function(status) {
      var badge = document.getElementById('statusBadge');
      if (!badge) return;
      badge.className = status;
      if (status === 'connected')    badge.innerText = '🟢 Live';
      if (status === 'disconnected') badge.innerText = '🔴 Disconnected';
      if (status === 'waiting')      badge.innerText = '⏳ Connecting...';
    };

    // ── My Location Button ────────────────────────────────────
    ${showMyLocationButton ? `
    document.getElementById('myLocationBtn').addEventListener('click', function() {
      if (!navigator.geolocation) return;
      this.innerText = '⏳';
      var btn = this;
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          btn.innerText = '📍';
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          var acc = pos.coords.accuracy;

          if (myLocationMarker) {
            myLocationMarker.setLatLng([lat, lng]);
            myLocationCircle.setLatLng([lat, lng]).setRadius(acc);
          } else {
            myLocationCircle = L.circle([lat, lng], {
              radius: acc,
              color: '#2979FF',
              fillColor: '#2979FF',
              fillOpacity: 0.1,
              weight: 1,
            }).addTo(map);
            myLocationMarker = L.marker([lat, lng], { icon: myLocationIcon })
              .addTo(map)
              .bindPopup('📍 Aap yahan hain');
          }

          map.setView([lat, lng], 16, { animate: true });

          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'myLocation', lat: lat, lng: lng })
          );
        },
        function(err) {
          btn.innerText = '📍';
          // Location denied or error — silently ignore
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
    ` : ''}

    // ── Recenter to route ─────────────────────────────────────
    window.recenter = function() {
      if (route) {
        var pts = [route.start].concat(route.stops || []).concat([route.end]).map(function(p){ return [p.lat, p.lng]; });
        map.fitBounds(pts, { padding: [50, 50], animate: true });
      }
    };

  </script>
</body>
</html>`;
};
