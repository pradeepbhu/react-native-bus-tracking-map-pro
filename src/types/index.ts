export type LatLng = {
  lat: number;
  lng: number;
};

export type Location = LatLng & {
  id?: string;
  name?: string;
};

export type Bus = {
  id: string;
  lat: number;
  lng: number;
  heading?: number;
  label?: string;
  color?: string;
  speed?: number;
};

export type Route = {
  id?: string;
  start: Location;
  stops?: Location[];
  end: Location;
};

export type MapTheme = 'light' | 'dark' | 'satellite' | 'terrain';

export type MapMode = 'tracking' | 'route' | 'static';

export type BusTrackingMapProps = {
  route?: Route;
  mode?: MapMode;
  buses?: Bus[];
  wsUrl?: string;
  autoReconnect?: boolean;
  followBusId?: string;
  theme?: MapTheme;
  zoom?: number;
  center?: LatLng;
  showRoute?: boolean;
  showTrail?: boolean;
  trailMaxPoints?: number;
  showStops?: boolean;
  showStartEnd?: boolean;
  showSpeed?: boolean;
  showMyLocationButton?: boolean;
  showZoomControls?: boolean;
  showStatusBadge?: boolean;
  /** Bahar se connected state pass karo — badge update hoga */
  isConnected?: boolean;
  showScaleBar?: boolean;
  onBusPress?: (bus: Bus) => void;
  onStopPress?: (stop: Location) => void;
  onMapPress?: (location: LatLng) => void;
  onWsConnect?: () => void;
  onWsDisconnect?: () => void;
  onMyLocation?: (location: LatLng) => void;
  style?: object;
  height?: number;
};