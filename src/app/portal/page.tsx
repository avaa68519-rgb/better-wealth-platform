"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Profile = { first_name: string | null; investment_plan: string | null };
type Holding = { id: string; asset_name: string; asset_symbol: string; units: number; unit_price: number; performance_percent: number };
type Request = { id: string; kind: "Deposit" | "Withdrawal"; asset_symbol: string; network: string; status: string; submitted_at: string; amount: number };
type ValuationPoint = { portfolio_value: number; recorded_at: string };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const quantity = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);
const label = (value: string) => value.replaceAll("_", " ");

export default function PortalOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [valuationHistory, setValuationHistory] = useState<ValuationPoint[]>([]);
  const [message, setMessage] = useState("Loading your account…");

  async function loadPortalData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.assign("/sign-in?next=/portal"); return; }
      const [profileResult, accountResult, depositResult, withdrawalResult, historyResult] = await Promise.all([
        supabase.from("profiles").select("first_name, investment_plan").eq("id", user.id).single(),
        supabase.from("portfolio_accounts").select("id").eq("client_id", user.id).eq("status", "active"),
        supabase.from("deposit_requests").select("id, asset_symbol, network, status, submitted_at, declared_amount").order("submitted_at", { ascending: false }).limit(5),
        supabase.from("withdrawal_requests").select("id, asset_symbol, network, status, submitted_at, requested_amount").order("submitted_at", { ascending: false }).limit(5),
        supabase.from("portfolio_value_history").select("portfolio_value, recorded_at").order("recorded_at", { ascending: false }).limit(24),
      ]);
      if (profileResult.error || accountResult.error || depositResult.error || withdrawalResult.error || historyResult.error) { setMessage("We could not load your account data. Please refresh or contact support."); return; }
      const accountIds = (accountResult.data ?? []).map((account) => account.id);
      const holdingResult = accountIds.length ? await supabase.from("holdings").select("id, asset_name, asset_symbol, units, unit_price, performance_percent").in("portfolio_account_id", accountIds) : { data: [], error: null };
      if (holdingResult.error) { setMessage("We could not load your holdings. Please refresh or contact support."); return; }
      setProfile(profileResult.data as Profile);
      setHoldings((holdingResult.data ?? []) as Holding[]);
      setRequests([...(depositResult.data ?? []).map((item) => ({ ...item, amount: Number(item.declared_amount), kind: "Deposit" as const })), ...(withdrawalResult.data ?? []).map((item) => ({ ...item, amount: Number(item.requested_amount), kind: "Withdrawal" as const }))].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)));
      setValuationHistory(((historyResult.data ?? []) as ValuationPoint[]).reverse());
      setMessage("");
  }

  useEffect(() => {
    void loadPortalData();
    const refreshTimer = window.setInterval(() => { void loadPortalData(); }, 15_000);
    const refreshOnFocus = () => { void loadPortalData(); };
    window.addEventListener("focus", refreshOnFocus);
    return () => { window.clearInterval(refreshTimer); window.removeEventListener("focus", refreshOnFocus); };
  }, []);

  const value = useMemo(() => holdings.reduce((total, holding) => total + Number(holding.units) * Number(holding.unit_price), 0), [holdings]);
  const approvedDeposits = useMemo(() => Object.entries(requests.filter((item) => item.kind === "Deposit" && ["approved", "credited"].includes(item.status)).reduce<Record<string, number>>((totals, item) => ({ ...totals, [item.asset_symbol]: (totals[item.asset_symbol] ?? 0) + item.amount }), {})).map(([asset, amount]) => `${quantity(amount)} ${asset}`).join(" · "), [requests]);
  const portfolioReturn = useMemo(() => { const total = holdings.reduce((sum, holding) => sum + Number(holding.units) * Number(holding.unit_price), 0); return total ? holdings.reduce((sum, holding) => sum + (Number(holding.units) * Number(holding.unit_price) * Number(holding.performance_percent)), 0) / total : null; }, [holdings]);
  const allocations = useMemo(() => holdings.map((holding, index) => ({ ...holding, value: Number(holding.units) * Number(holding.unit_price), color: ["#173a5b", "#16875d", "#4b8f78", "#527f8a", "#356c65"][index % 5] })).sort((a, b) => b.value - a.value), [holdings]);
  const performancePoints = useMemo(() => { if (!valuationHistory.length) return ""; const values = valuationHistory.map((item) => Number(item.portfolio_value)); const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1; return values.map((amount, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - ((amount - min) / range) * 76}`).join(" "); }, [valuationHistory]);

  return <main className="portal-shell"><aside className="sidebar"><Link href="/" className="brand sidebar-brand"><span className="brand-mark">BW</span> Better Wealth</Link><p className="sidebar-label">Client portal</p><nav className="side-nav" aria-label="Portal navigation"><Link className="nav-active" href="/portal"><span>◈</span> Overview</Link><Link href="/portal/verification"><span>✓</span> Verification</Link><Link href="/portal/funding"><span>↗</span> Funding</Link><Link href="/portal/support"><span>?</span> Support</Link></nav><div className="sidebar-footer"><span className="avatar">{profile?.first_name?.slice(0, 1).toUpperCase() || "C"}</span><div><strong>{profile?.first_name || "Client account"}</strong><small>Secure session</small></div></div><SignOutButton /></aside><section className="portal-content"><header className="portal-header"><div><p className="eyebrow">Client portal</p><h1>Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}.</h1></div></header>{message && <p className="signin-message" role="status">{message}</p>}<section className="balance-section"><div><p className="metric-label">Portfolio value</p><h2>{money(value)}</h2><p className="positive">{holdings.length ? `${holdings.length} holding${holdings.length === 1 ? "" : "s"}` : "No investments yet"}</p></div><div className="balance-actions"><Link href="/portal/funding" className="button">Manage funding <span>→</span></Link><Link href="/portal/support" className="secondary-button">Contact support</Link></div></section><section className="stat-grid"><article><p>Approved deposits</p><strong>{approvedDeposits || "—"}</strong><span>Shown in the deposited asset</span></article><article><p>Portfolio return</p><strong>{portfolioReturn === null ? "—" : `${portfolioReturn >= 0 ? "+" : ""}${portfolioReturn.toFixed(2)}%`}</strong><span>{portfolioReturn === null ? "Available once investments are valued" : "Weighted from recorded holdings"}</span></article><article><p>Investment plan</p><strong>{profile?.investment_plan || "Not selected"}</strong><span>Selected at registration</span></article></section><section className="portal-grid"><article className="panel holdings-panel"><div className="panel-heading"><div><p className="eyebrow">Your portfolio</p><h2>{holdings.length ? "Current holdings" : "No investments yet"}</h2></div></div><div className="holding-list">{holdings.length ? holdings.map((holding) => <div className="holding" key={holding.id}><span className="asset-icon fund">{holding.asset_symbol.slice(0, 2)}</span><div><strong>{holding.asset_name}</strong><small>{holding.asset_symbol} · {Number(holding.units)} units</small></div><div className="holding-value"><strong>{money(Number(holding.units) * Number(holding.unit_price))}</strong><span>{money(Number(holding.unit_price))} per unit · {Number(holding.performance_percent) >= 0 ? "+" : ""}{Number(holding.performance_percent).toFixed(2)}%</span></div></div>) : <p className="empty-copy">Your approved investments will appear here after they are added to your account.</p>}</div></article><article className="panel allocation-panel"><div className="panel-heading"><div><p className="eyebrow">Portfolio performance</p><h2>Value over time</h2></div></div>{valuationHistory.length > 1 ? <div className="performance-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Portfolio value history"><polyline points={performancePoints} fill="none" stroke="#c49c54" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div><span>{new Date(valuationHistory[0].recorded_at).toLocaleDateString()}</span><strong>{money(Number(valuationHistory[valuationHistory.length - 1].portfolio_value))}</strong><span>Latest valuation</span></div></div> : <p className="empty-copy">Performance history begins after the next authorised portfolio valuation.</p>}</article></section><section className="panel allocation-panel"><div className="panel-heading"><div><p className="eyebrow">Portfolio graph</p><h2>Asset allocation</h2></div></div>{allocations.length ? <div className="allocation-chart">{allocations.map((holding) => <div className="allocation-bar" key={holding.id}><div><span>{holding.asset_name}</span><strong>{money(holding.value)}</strong></div><i><b style={{ width: `${value ? (holding.value / value) * 100 : 0}%`, backgroundColor: holding.color }} /></i><small>{value ? ((holding.value / value) * 100).toFixed(1) : "0.0"}% of portfolio</small></div>)}</div> : <p className="empty-copy">Your asset graph will appear after authorised investments are recorded.</p>}</section><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Account activity</p><h2>{requests.length ? "Recent funding requests" : "No activity yet"}</h2></div><Link href="/portal/funding">View funding →</Link></div><div className="activity-list">{requests.length ? requests.map((request) => <div className="activity" key={`${request.kind}-${request.id}`}><span className="activity-marker" /><div><strong>{request.kind} request</strong><p>{request.asset_symbol} · {request.network} · {quantity(request.amount)} {request.asset_symbol}</p></div><span className="status">{label(request.status)}</span><time>{new Date(request.submitted_at).toLocaleDateString()}</time></div>) : <p className="empty-copy">Your deposit and withdrawal requests will appear here.</p>}</div></section></section></main>;
}
