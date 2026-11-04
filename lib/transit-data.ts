export type Severity = "minor" | "moderate" | "major";

export type AlertSeverity = Severity | "info";

export interface ServiceAlert {
  id: string;
  severity: AlertSeverity;
  route: string;
  area: string;
  startTime: string;
  title: string;
  message: string;
  details: string;
  suggestion?: string;
  affectedStops: string[];
}

export interface Departure {
  id: string;
  route: string;
  destination: string;
  platform: string;
  scheduled: string;
  expected: string;
  status: "On time" | "2 min late" | "Cancelled" | "Platform change" | "Delayed";
  mode: "rail" | "bus";
}

export interface RouteStatus {
  route: string;
  type: "rail" | "bus";
  status: "normal" | "delayed" | "suspended";
  description: string;
}

export interface JourneyOption {
  id: string;
  title: string;
  duration: string;
  transfers: number;
  walkingMinutes: number;
  serviceWarnings: string[];
  recommended?: boolean;
  unavailable?: boolean;
  explanation?: string;
}

export interface ReliabilityPoint {
  label: string;
  value: number;
}

export type DataStatus = "ok" | "partial" | "stale" | "error";

export interface TransitSnapshot {
  city: string;
  stationName: string;
  lastUpdated: string;
  networkStatus: string;
  affectedRoutes: number;
  activeAlerts: number;
  dataStatus: DataStatus;
  dataMessage?: string;
  alerts: ServiceAlert[];
  departures: Departure[];
  routeStatus: RouteStatus[];
  journeyOptions: JourneyOption[];
  reliabilityData: ReliabilityPoint[];
}

export interface TransitProvider {
  getSnapshot(city: string): Promise<TransitSnapshot>;
}

export interface CityOption {
  id: string;
  name: string;
  stations: string[];
}

export const cityCatalog: CityOption[] = [
  {
    id: "seattle",
    name: "Seattle",
    stations: ["University Street", "Westlake Center", "Capitol Hill", "Rainier Beach"],
  },
  {
    id: "portland",
    name: "Portland",
    stations: ["Pioneer Courthouse", "Hollywood Transit Center", "Clackamas Town Center"],
  },
  {
    id: "boston",
    name: "Boston",
    stations: ["South Station", "Downtown Crossing", "Harvard Square"],
  },
];

export const routeNames = ["Blue Line", "Green Line", "Route 8", "Route 12", "Route 24", "Route 41", "Route 7", "Route 5"];

function formatIso(date: Date) {
  return date.toISOString();
}

function createAlerts(): ServiceAlert[] {
  return [
    {
      id: "alert-1",
      severity: "moderate",
      route: "Route 8",
      area: "Downtown Core",
      startTime: "07:10",
      title: "Crowding and minor delays",
      message: "Boarding is slower than usual near 3rd Avenue due to a signal reset affecting eastbound traffic.",
      details: "Passengers should expect brief waits and use the southbound platform after 8:00 AM. Customer service has advised a temporary boarding hold at some stops.",
      suggestion: "Use Route 8 instead.",
      affectedStops: ["3rd Ave & Pine", "3rd Ave & Union", "Pike & 5th"],
    },
    {
      id: "alert-2",
      severity: "minor",
      route: "Blue Line",
      area: "Capitol Hill",
      startTime: "08:05",
      title: "Single-track operations",
      message: "Trains are running every 10 minutes instead of the usual 6-minute headway while crews clear a track obstruction.",
      details: "This is a temporary issue and operators are monitoring headways. Expect longer waits at Capitol Hill and University Street.",
      suggestion: "Consider bus shuttle from Capitol Hill.",
      affectedStops: ["Capitol Hill", "International District", "University Street"],
    },
    {
      id: "alert-3",
      severity: "major",
      route: "Route 41",
      area: "Ballard",
      startTime: "06:45",
      title: "Service suspended between 24th and Market",
      message: "A roadway incident has forced a detour and temporary suspension on the Ballard branch.",
      details: "The route is operating only between downtown and 24th Avenue. Riders transferring to Route 12 or Route 5 may be affected by additional wait times.",
      suggestion: "Use Route 12 or Route 5 as an alternative.",
      affectedStops: ["Market St", "Ballard Ave", "Leary Way"],
    },
  ];
}

function createDepartures(): Departure[] {
  return [
    {
      id: "dep-1",
      route: "Blue Line",
      destination: "Downtown",
      platform: "2",
      scheduled: "07:42",
      expected: "07:42",
      status: "On time",
      mode: "rail",
    },
    {
      id: "dep-2",
      route: "Green Line",
      destination: "Capitol Hill",
      platform: "1",
      scheduled: "07:49",
      expected: "07:51",
      status: "2 min late",
      mode: "rail",
    },
    {
      id: "dep-3",
      route: "Route 8",
      destination: "South Lake Union",
      platform: "Eastbound",
      scheduled: "07:55",
      expected: "07:55",
      status: "On time",
      mode: "bus",
    },
    {
      id: "dep-4",
      route: "Route 41",
      destination: "Ballard",
      platform: "Northbound",
      scheduled: "08:02",
      expected: "Cancelled",
      status: "Cancelled",
      mode: "bus",
    },
    {
      id: "dep-5",
      route: "Route 12",
      destination: "University District",
      platform: "Bay 4",
      scheduled: "08:07",
      expected: "08:09",
      status: "Platform change",
      mode: "bus",
    },
    {
      id: "dep-6",
      route: "Blue Line",
      destination: "Northgate",
      platform: "3",
      scheduled: "08:12",
      expected: "08:12",
      status: "On time",
      mode: "rail",
    },
  ];
}

function createRouteStatus(): RouteStatus[] {
  return [
    { route: "Blue Line", type: "rail", status: "normal", description: "Regular service" },
    { route: "Green Line", type: "rail", status: "delayed", description: "Slowdowns near Capitol Hill" },
    { route: "Route 8", type: "bus", status: "delayed", description: "Crowding and signal resets" },
    { route: "Route 12", type: "bus", status: "normal", description: "Moderate demand" },
    { route: "Route 24", type: "bus", status: "normal", description: "Regular service" },
    { route: "Route 41", type: "bus", status: "suspended", description: "Detour and suspension" },
  ];
}

function createJourneyOptions(): JourneyOption[] {
  return [
    {
      id: "journey-1",
      title: "Recommended",
      duration: "28 min",
      transfers: 1,
      walkingMinutes: 4,
      serviceWarnings: ["Blue Line headway 10 min", "Limited platform capacity"],
      recommended: true,
      explanation: "Shortest overall trip with minimal walking and the best risk profile under current conditions.",
    },
    {
      id: "journey-2",
      title: "Alternative",
      duration: "32 min",
      transfers: 2,
      walkingMinutes: 7,
      serviceWarnings: ["Route 8 crowding", "Eastbound delays"],
      explanation: "Slightly longer travel time with a second transfer but still reliable during the current disruption.",
    },
    {
      id: "journey-3",
      title: "Unavailable",
      duration: "—",
      transfers: 0,
      walkingMinutes: 0,
      serviceWarnings: ["Insufficient data"],
      unavailable: true,
      explanation: "No reliable route match is available from the current mock feed for this origin-destination pair.",
    },
  ];
}

export function buildTransitSnapshot(city: string): TransitSnapshot {
  const now = new Date();
  const cityOption = cityCatalog.find((entry) => entry.id === city) ?? cityCatalog[0];
  const stationName = cityOption.stations[0];

  const alerts = createAlerts();
  const departures = createDepartures();

  return {
    city: cityOption.name,
    stationName,
    lastUpdated: formatIso(now),
    networkStatus: "Minor disruptions.",
    affectedRoutes: 3,
    activeAlerts: alerts.length,
    dataStatus: "ok",
    dataMessage: "Demo data · Not a live feed",
    alerts,
    departures,
    routeStatus: createRouteStatus(),
    journeyOptions: createJourneyOptions(),
    reliabilityData: [
      { label: "Mon", value: 92 },
      { label: "Tue", value: 90 },
      { label: "Wed", value: 88 },
      { label: "Thu", value: 93 },
      { label: "Fri", value: 86 },
      { label: "Today", value: 81 },
    ],
  };
}

export class MockTransitProvider implements TransitProvider {
  async getSnapshot(city: string): Promise<TransitSnapshot> {
    const snapshot = buildTransitSnapshot(city);
    const random = Math.random();

    if (random > 0.83) {
      throw new Error("The mock transit API timed out while refreshing services.");
    }

    if (random > 0.69) {
      snapshot.dataStatus = "stale";
      snapshot.dataMessage = "Data is 8 minutes old. Demo feed is stale.";
      snapshot.lastUpdated = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      snapshot.networkStatus = "Service information may be stale.";
      snapshot.activeAlerts = 2;
      snapshot.alerts = snapshot.alerts.slice(0, 2);
    }

    if (random > 0.76 && random < 0.83) {
      snapshot.dataStatus = "partial";
      snapshot.dataMessage = "Some departures are temporarily missing from the demo feed.";
      snapshot.departures = snapshot.departures.slice(0, 4);
      snapshot.activeAlerts = 1;
      snapshot.alerts = [snapshot.alerts[0]];
    }

    return snapshot;
  }
}

// Placeholder for a production GTFS-Realtime implementation.
// When connecting to a real transit authority:
// 1. Check the agency's GTFS-Realtime terms of use and data licensing.
// 2. Verify an authorized endpoint, required headers, and any CORS restrictions.
// 3. Confirm refresh frequency, staleness thresholds, and replay/validation rules.
export class GtfsRealtimeProvider implements TransitProvider {
  async getSnapshot(_city: string): Promise<TransitSnapshot> {
    throw new Error("GTFS-Realtime provider is not implemented yet. Add an authorized agency feed and a real adapter here.");
  }
}
