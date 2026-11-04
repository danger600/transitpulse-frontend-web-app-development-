'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { AlertTriangle, ArrowRight, BusFront, CheckCircle2, CircleDashed, Clock3, MapPinned, RefreshCw, Route, Search, ShieldAlert, SignalHigh, Wifi, WifiOff } from "lucide-react";
import { BarChart3, ChevronDown, ChevronUp, Map } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { cityCatalog, type TransitSnapshot, MockTransitProvider } from "@/lib/transit-data";

const provider = new MockTransitProvider();

function getStatusStyles(value: string) {
  switch (value) {
    case "On time":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "2 min late":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "Cancelled":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "Platform change":
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function getAlertStyles(value: string) {
  switch (value) {
    case "major":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "moderate":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "minor":
      return "bg-teal-50 text-teal-700 border-teal-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getRouteStyles(status: string) {
  switch (status) {
    case "normal":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "delayed":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "suspended":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 minute ago";
  return `Updated ${minutes} minutes ago`;
}

function formatClock(value: string) {
  return value;
}

function useTransitData(city: string, autoRefresh: boolean) {
  const [snapshot, setSnapshot] = useState<TransitSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setLoading((previous) => previous ? true : false);
    setRefreshing(true);

    try {
      const nextSnapshot = await provider.getSnapshot(city);
      setSnapshot(nextSnapshot);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Service information is temporarily unavailable.";
      setError(message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void fetchSnapshot();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, fetchSnapshot]);

  return { snapshot, loading, refreshing, error, refresh: fetchSnapshot };
}

export function TransitPulseDashboard() {
  const [selectedCity, setSelectedCity] = useState("seattle");
  const [selectedStation, setSelectedStation] = useState("University Street");
  const [searchValue, setSearchValue] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [routeFilter, setRouteFilter] = useState<"all" | "rail" | "bus" | "affected">("all");

  useEffect(() => {
    const persistedCity = window.localStorage.getItem("transitpulse-city");
    const persistedStation = window.localStorage.getItem("transitpulse-station");
    const persistedDismissed = window.localStorage.getItem("transitpulse-dismissed");

    if (persistedCity) setSelectedCity(persistedCity);
    if (persistedStation) setSelectedStation(persistedStation);
    if (persistedDismissed) setDismissedAlerts(JSON.parse(persistedDismissed));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("transitpulse-city", selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    window.localStorage.setItem("transitpulse-station", selectedStation);
  }, [selectedStation]);

  useEffect(() => {
    window.localStorage.setItem("transitpulse-dismissed", JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  const city = cityCatalog.find((entry) => entry.id === selectedCity) ?? cityCatalog[0];
  const availableStations = city.stations;

  const { snapshot, loading, refreshing, error, refresh } = useTransitData(selectedCity, autoRefresh);

  useEffect(() => {
    if (selectedStation && !availableStations.includes(selectedStation)) {
      setSelectedStation(availableStations[0]);
    }
  }, [availableStations, selectedStation]);

  const networkHealthy = snapshot?.dataStatus === "ok" || snapshot?.dataStatus === "partial";

  const visibleAlerts = useMemo(
    () => (snapshot?.alerts ?? []).filter((alert) => !dismissedAlerts.includes(alert.id)),
    [dismissedAlerts, snapshot?.alerts],
  );

  const visibleDepartures = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.departures.filter((departure) => {
      const matchesSearch =
        !searchValue ||
        departure.route.toLowerCase().includes(searchValue.toLowerCase()) ||
        departure.destination.toLowerCase().includes(searchValue.toLowerCase()) ||
        departure.platform.toLowerCase().includes(searchValue.toLowerCase());

      const routeFilterMatch =
        routeFilter === "all"
          ? true
          : routeFilter === "affected"
            ? ["Route 8", "Route 41", "Blue Line"].includes(departure.route)
            : departure.mode === routeFilter;

      return matchesSearch && routeFilterMatch;
    });
  }, [routeFilter, searchValue, snapshot]);

  const statusLabel = snapshot?.networkStatus ?? "Minor disruptions.";
  const lastUpdatedText = snapshot ? formatTimeAgo(snapshot.lastUpdated) : "Waiting for data";

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ring-1 ring-brand-200">
              <Route size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold tracking-tight">TransitPulse</p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Demo data
                </span>
              </div>
              <p className="text-sm text-slate-500">Service status</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center lg:justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <MapPinned size={16} className="text-slate-500" />
              <label className="sr-only" htmlFor="city-select">Choose city</label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                className="bg-transparent pr-1 text-sm font-medium text-slate-700 outline-none"
              >
                {cityCatalog.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-0">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search a station, route, or destination"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search station, route, or destination"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600">
                {networkHealthy ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-amber-600" />}
                <span>{snapshot?.dataStatus === "stale" ? "Stale feed" : snapshot?.dataStatus === "partial" ? "Partial data" : "Connected"}</span>
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5">
        <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Network status</span>
                {snapshot?.dataStatus === "stale" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    <AlertTriangle size={12} /> Stale data
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{statusLabel}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {snapshot?.affectedRoutes ?? 0} affected routes · {snapshot?.activeAlerts ?? 0} active alerts
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock3 size={15} className="text-slate-500" />
                <span>{lastUpdatedText}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Feed freshness: {snapshot?.dataMessage ?? "Demo data"}</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white transition hover:bg-rose-500"
              >
                Retry
              </button>
            </div>
          ) : null}

          {snapshot?.dataStatus === "stale" ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Service data is stale. Some arrival times may be out of date. Refresh or retry to confirm current conditions.</span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Active service alerts</h2>
                  <p className="text-sm text-slate-500">Notifications affecting current journeys</p>
                </div>
                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {visibleAlerts.length} active
                </div>
              </div>

              <div className="space-y-3">
                {visibleAlerts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No active alerts to show. Service conditions look steady.
                  </div>
                ) : (
                  visibleAlerts.map((alert) => {
                    const expanded = !!expandedAlerts[alert.id];

                    return (
                      <article key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", getAlertStyles(alert.severity))}>
                              {alert.severity}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-700">{alert.route}</span>
                                <span>{alert.area}</span>
                                <span>Started {alert.startTime}</span>
                              </div>
                              <h3 className="mt-2 text-base font-semibold text-slate-900">{alert.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedAlerts((prev) => ({ ...prev, [alert.id]: !expanded }))}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              {expanded ? "Hide" : "More details"}
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDismissedAlerts((prev) => [...prev, alert.id])}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {expanded ? (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                            <p>{alert.details}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Affected stops</p>
                                <ul className="mt-1 space-y-1 text-sm text-slate-600">
                                  {alert.affectedStops.map((stop) => (
                                    <li key={stop}>• {stop}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested action</p>
                                <p className="mt-1 font-medium text-slate-800">{alert.suggestion ?? "Allow extra travel time."}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Live departures</h2>
                  <p className="text-sm text-slate-500">{selectedStation} · {city.name}</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <label className="sr-only" htmlFor="station-select">Select station</label>
                  <select
                    id="station-select"
                    value={selectedStation}
                    onChange={(event) => setSelectedStation(event.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                  >
                    {availableStations.map((station) => (
                      <option key={station} value={station}>
                        {station}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { label: "All" , value: "all" },
                  { label: "Rail", value: "rail" },
                  { label: "Bus", value: "bus" },
                  { label: "Affected", value: "affected" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRouteFilter(option.value as "all" | "rail" | "bus" | "affected")}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      routeFilter === option.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : visibleDepartures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No matching departures found for the current filters.
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleDepartures.map((departure) => (
                    <div key={departure.id} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:grid-cols-[1.2fr_1.2fr_.8fr_1fr_.9fr] sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-slate-200">
                            {departure.mode === "rail" ? <SignalHigh size={12} /> : <BusFront size={12} />}
                            {departure.route}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-slate-700">{departure.destination}</p>
                      </div>
                      <div className="text-slate-600">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Platform</span>
                        {departure.platform}
                      </div>
                      <div className="text-slate-600">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Scheduled</span>
                        {formatClock(departure.scheduled)}
                      </div>
                      <div className="text-slate-600">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Expected</span>
                        {departure.status === "Cancelled" ? "Cancelled" : formatClock(departure.expected)}
                      </div>
                      <div className="flex justify-start sm:justify-end">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", getStatusStyles(departure.status))}>
                          {departure.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Route alternatives</h2>
                  <p className="text-sm text-slate-500">Origin to destination suggestions</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                  3 options
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="grid gap-2 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinned size={14} className="text-slate-500" />
                    <span className="font-medium text-slate-700">From</span>
                    <input defaultValue="University Street" className="ml-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight size={14} className="text-slate-500" />
                    <span className="font-medium text-slate-700">To</span>
                    <input defaultValue="South Lake Union" className="ml-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>

                {snapshot?.journeyOptions.map((option) => (
                  <div key={option.id} className={cn("rounded-xl border p-3", option.recommended ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50") }>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", option.recommended ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200") }>
                          {option.title}
                        </span>
                        {option.unavailable ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Unavailable</span> : null}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{option.duration}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Transfers</p>
                        <p className="mt-1 font-medium text-slate-800">{option.transfers}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Walk</p>
                        <p className="mt-1 font-medium text-slate-800">{option.walkingMinutes} min</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Warnings</p>
                        <p className="mt-1 font-medium text-slate-800">{option.serviceWarnings.length}</p>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {option.serviceWarnings.map((warning) => (
                        <li key={warning} className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>

                    {option.explanation ? <p className="mt-3 text-xs text-slate-600">{option.explanation}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Network view</h2>
                  <p className="text-sm text-slate-500">Route conditions across the network</p>
                </div>
                <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Map view
                </div>
              </div>

              <div className="space-y-3">
                {snapshot?.routeStatus.map((route) => (
                  <div key={route.route} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", route.type === "rail" ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700")}>
                        {route.type === "rail" ? <SignalHigh size={14} /> : <BusFront size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{route.route}</p>
                        <p className="truncate text-xs text-slate-500">{route.description}</p>
                      </div>
                    </div>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", getRouteStyles(route.status))}>
                      {route.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Service reliability</h2>
              <p className="text-sm text-slate-500">Week-to-date performance trends</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              <BarChart3 size={14} />
              6-day view
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot?.reliabilityData ?? []}>
                <defs>
                  <linearGradient id="performanceFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2d7b7c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2d7b7c" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "white" }}
                  formatter={(value: number) => [`${value}%`, "Reliability"]}
                />
                <Area type="monotone" dataKey="value" stroke="#2d7b7c" strokeWidth={2.5} fill="url(#performanceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="pb-10 pt-2 text-center text-xs text-slate-500">
          TransitPulse is a demo dashboard with mock data for design and prototyping. Connect a real authorized GTFS-Realtime feed when ready.
        </footer>
      </main>
    </div>
  );
}
