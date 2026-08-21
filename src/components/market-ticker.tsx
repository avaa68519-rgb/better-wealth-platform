"use client";

import { useEffect, useState } from "react";

type Instrument = { id: string; symbol: string; name: string; price: number | null; change: number | null };

export function MarketTicker() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const load = async () => { const response = await fetch("/api/market-ticker"); const data = await response.json(); setInstruments(data.instruments ?? []); setLive(Boolean(data.live)); };
    void load(); const interval = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(interval);
  }, []);
  if (!instruments.length) return <div className="live-ticker"><span>MARKET DATA</span><b>Loading live instruments…</b></div>;
  const tickerItems = [...instruments, ...instruments];
  return <div className="live-ticker"><span className={live ? "ticker-live" : "ticker-delay"}>{live ? "● LIVE MARKET DATA" : "○ MARKET DATA TEMPORARILY UNAVAILABLE"}</span><div className="ticker-window"><div className="ticker-track">{tickerItems.map((instrument, index) => <div className={`ticker-item ticker-${instrument.id}`} key={`${instrument.id}-${index}`} aria-hidden={index >= instruments.length}><strong>{instrument.symbol}</strong><b>{instrument.price === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: instrument.price < 100 ? 2 : 0 }).format(instrument.price)}</b><small className={(instrument.change ?? 0) >= 0 ? "ticker-up" : "ticker-down"}>{instrument.change === null ? "—" : `${instrument.change >= 0 ? "▲" : "▼"} ${Math.abs(instrument.change).toFixed(2)}%`}</small></div>)}</div></div></div>;
}
