"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Profile = { first_name: string | null; investment_plan: string | null };
type Holding = { id: string; asset_name: string; asset_symbol: string; units: number; unit_price: number; performance_percent: number };
type Request = { id: string; kind: "Deposit" | "Withdrawal"; asset_symbol: string; network: string; status: string; submitted_at: string; amount: number };

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const label = (value: string) => value.replaceAll("_", " ");

export default function PortalOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [message, setMessage] = useState("Loading your account…");

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.assign("/sign-in?next=/portal"); return; }
      const [profileResult, accountResult, depositResult, withdrawalResult] = await Promise.all([
        supabase.from("profiles").select("first_name, investment_plan").eq("id", user.id).single(),
        supabase.from("portfolio_accounts").select("id").eq("client_id", user.id).eq("status", "active"),
        supabase.from("deposit_requests").select("id, asset_symbol, network, status, submitted_at, declared_amount").order("submitted_at", { ascending: false }).limit(5),
        supabase.from("withdrawal_requests").select("id, asset_symbol, network, status, submitted_at, requested_amount").order("submitted_at", { ascending: false }).limit(5),
      ]);
      if (profileResult.error || accountResult.error || depositResult.error || withdrawalResult.error) { setMessage("We could not load your account data. Please refresh or contact support."); return; }
      const accountIds = (accountResult.data ?? []).map((account) => account.id);
      const holdingResult = accountIds.length ? await supabase.from("holdings").select("id, asset_name, asset_symbol, units, unit_price, performance_percent").in("portfolio_account_id", accountIds) : { data: [], error: null };
      if (holdingResult.error) { setMessage("We could not load your holdings. Please refresh or contact support."); return; }
      setProfile(profileResult.data as Profile);
      setHoldings((holdingResult.data ?? []) as Holding[]);
      setRequests([...(depositResult.data ?? []).map((item) => ({ ...item, amount: Number(item.declared_amount), kind: "Deposit" as const })), ...(withdrawalResult.data ?? []).map((item) => ({ ...item, amount: Number(item.requested_amount), kind: "Withdrawal" as const }))].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)));
      setMessage("");
    })();
  }, []);

  const value = useMemo(() => holdings.reduce((total, holding) => total + Number(holding.units) * Number(holding.unit_price), 0), [holdings]);
  const contributions = useMemo(() => requests.filter((item) => item.kind === "Deposit" && ["approved", "credited"].includes(item.status)).reduce((total, item) => total + item.amount, 0), [requests]);
  const portfolioReturn = useMemo(() => value && contributions ? ((value - contributions) / contributions) * 100 : 0, [value, contributions]);

  return <main className="portal-shell"><aside className="sidebar"><Link href="/" className="brand sidebar-brand"><span className="brand-mark">BW</span> Better Wealth</Link><p className="sidebar-label">Client portal</p><nav className="side-nav" aria-label="Portal navigation"><Link className="nav-active" href="/portal"><span>◈</span> Overview</Link><Link href="/portal/verification"><span>✓</span> Verification</Link><Link href="/portal/funding"><span>↗</span> Funding</Link><Link href="/portal/support"><span>?</span> Support</Link></nav><div className="sidebar-footer"><span className="avatar">{profile?.first_name?.slice(0, 1).toUpperCase() || "C"}</span><div><strong>{profile?.first_name || "Client account"}</strong><small>Secure session</small></div></div><SignOutButton /></aside><section className="portal-content"><header className="portal-header"><div><p className="eyebrow">Client portal</p><h1>Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}.</h1></div></header>{message && <p className="signin-message" role="status">{message}</p>}<section className="balance-section"><div><p className="metric-label">Portfolio value</p><h2>{money(value)}</h2><p className="positive">{holdings.length ? `${holdings.length} holding${holdings.length === 1 ? "" : "s"}` : "No investments yet"}</p></div><div className="balance-actions"><Link href="/portal/funding" className="button">Manage funding <span>→</span></Link><Link href="/portal/support" className="secondary-button">Contact support</Link></div></section><section className="stat-grid"><article><p>Net contributions</p><strong>{money(contributions)}</strong><span>Approved deposits</span></article><article><p>Portfolio return</p><strong>{holdings.length ? `${portfolioReturn >= 0 ? "+" : ""}${portfolioReturn.toFixed(2)}%` : "—"}</strong><span>{holdings.length ? "Based on recorded holdings" : "Available once investments are valued"}</span></article><article><p>Investment plan</p><strong>{profile?.investment_plan || "Not selected"}</strong><span>Selected at registration</span></article></section><section className="portal-grid"><article className="panel holdings-panel"><div className="panel-heading"><div><p className="eyebrow">Your portfolio</p><h2>{holdings.length ? "Current holdings" : "No investments yet"}</h2></div></div><div className="holding-list">{holdings.length ? holdings.map((holding) => <div className="holding" key={holding.id}><span className="asset-icon fund">{holding.asset_symbol.slice(0, 2)}</span><div><strong>{holding.asset_name}</strong><small>{holding.asset_symbol} · {Number(holding.units)} units</small></div><div className="holding-value"><strong>{money(Number(holding.units) * Number(holding.unit_price))}</strong><span>{money(Number(holding.unit_price))} per unit · {Number(holding.performance_percent) >= 0 ? "+" : ""}{Number(holding.performance_percent).toFixed(2)}%</span></div></div>) : <p className="empty-copy">Your approved investments will appear here after they are added to your account.</p>}</div></article><article className="panel allocation-panel"><div className="panel-heading"><div><p className="eyebrow">Account status</p><h2>Ready when you are</h2></div></div><p className="empty-copy">Use the funding centre to submit a deposit after a wallet is assigned by Better Wealth operations.</p><Link href="/portal/funding" className="text-link">Open funding centre →</Link></article></section><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Account activity</p><h2>{requests.length ? "Recent funding requests" : "No activity yet"}</h2></div><Link href="/portal/funding">View funding →</Link></div><div className="activity-list">{requests.length ? requests.map((request) => <div className="activity" key={`${request.kind}-${request.id}`}><span className="activity-marker" /><div><strong>{request.kind} request</strong><p>{request.asset_symbol} · {request.network} · {money(request.amount)}</p></div><span className="status">{label(request.status)}</span><time>{new Date(request.submitted_at).toLocaleDateString()}</time></div>) : <p className="empty-copy">Your deposit and withdrawal requests will appear here.</p>}</div></section></section></main>;
}
