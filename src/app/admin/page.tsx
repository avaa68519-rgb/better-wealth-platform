"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  country_code: string | null;
  phone_number: string | null;
  investment_plan: string | null;
  role: string;
  identity_status: string;
};

type FundingRequest = {
  id: string;
  client_id: string;
  asset_symbol: string;
  network: string;
  status: string;
  submitted_at: string;
  declared_amount?: number;
  requested_amount?: number;
  transaction_reference?: string;
  destination_address?: string;
  payout_reference?: string | null;
  internal_note?: string | null;
  kind: "deposit" | "withdrawal";
};

type Verification = {
  id: string;
  client_id: string;
  document_type: string;
  status: string;
  submitted_at: string;
  document_path: string;
  selfie_path: string;
  rejection_reason?: string | null;
};

type PortfolioAccount = { id: string; client_id: string; name: string; currency_code: string; status: string };
type Holding = { id: string; portfolio_account_id: string; asset_name: string; asset_symbol: string; asset_class: string; units: number; unit_price: number; performance_percent: number; valuation_currency: string; valued_at: string };

type Audit = {
  id: number;
  entity_type: string;
  event_type: string;
  occurred_at: string;
};

type PendingAction =
  | { kind: "kyc"; submittedAt: string; verification: Verification }
  | { kind: "deposit" | "withdrawal"; submittedAt: string; request: FundingRequest };

const networkOptions = ["BTC|Bitcoin", "ETH|Ethereum", "USDT|TRC20", "USDT|ERC20"];
const pendingFundingStatuses = ["submitted", "under_review"];

function nameOf(client: Client | undefined) {
  return [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "Unnamed client";
}

function displayStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [accounts, setAccounts] = useState<PortfolioAccount[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioClientId, setPortfolioClientId] = useState("");
  const [activePortfolioClientId, setActivePortfolioClientId] = useState("");
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
  const [walletMessage, setWalletMessage] = useState("Staff assign public wallet addresses here. Requests are reviewed separately; cryptocurrency is never sent by this application.");
  const [portfolioMessage, setPortfolioMessage] = useState("Add a new investment or use the same product code to replace its current valuation.");
  const [revaluationMessage, setRevaluationMessage] = useState("Apply a controlled percentage change to all recorded holdings. Every change is written to the audit log.");
  const [message, setMessage] = useState("Loading live operations data…");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const walletLocked = useRef(false);
  const portfolioLocked = useRef(false);
  const revaluationLocked = useRef(false);

  async function load() {
    const supabase = createClient();
    const [clientResult, verificationResult, depositResult, withdrawalResult, auditResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, phone_number, country_code, investment_plan, role, identity_status")
          .order("created_at", { ascending: false }),
        supabase
          .from("identity_verifications")
          .select("id, client_id, document_type, document_path, selfie_path, status, rejection_reason, submitted_at")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("deposit_requests")
          .select("id, client_id, asset_symbol, network, status, submitted_at, declared_amount, transaction_reference, internal_note")
          .order("submitted_at", { ascending: false })
          .limit(25),
        supabase
          .from("withdrawal_requests")
          .select("id, client_id, asset_symbol, network, status, submitted_at, requested_amount, destination_address, payout_reference, internal_note")
          .order("submitted_at", { ascending: false })
          .limit(25),
        supabase
          .from("audit_events")
          .select("id, entity_type, event_type, occurred_at")
          .order("occurred_at", { ascending: false })
          .limit(5),
      ]);

    const error =
      clientResult.error ??
      verificationResult.error ??
      depositResult.error ??
      withdrawalResult.error ??
      auditResult.error;

    if (error) {
      setMessage(`Unable to load operations data: ${error.message}`);
      return;
    }

    setClients((clientResult.data ?? []) as Client[]);
    setVerifications((verificationResult.data ?? []) as Verification[]);
    setRequests(
      [
        ...(depositResult.data ?? []).map((item) => ({ ...item, kind: "deposit" as const })),
        ...(withdrawalResult.data ?? []).map((item) => ({ ...item, kind: "withdrawal" as const })),
      ].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)),
    );
    setAudits((auditResult.data ?? []) as Audit[]);
    setMessage("");
  }

  async function loadPortfolio(clientId: string) {
    if (!clientId) return;
    setBusyAction("portfolio-search"); setPortfolioMessage("Loading this customer’s portfolio…");
    const supabase = createClient();
    const accountResult = await supabase.from("portfolio_accounts").select("id, client_id, name, currency_code, status").eq("client_id", clientId).order("created_at", { ascending: false });
    if (accountResult.error) { setBusyAction(null); setPortfolioMessage(accountResult.error.message); return; }
    const currentAccounts = (accountResult.data ?? []) as PortfolioAccount[];
    const accountIds = currentAccounts.map((account) => account.id);
    const holdingResult = accountIds.length ? await supabase.from("holdings").select("id, portfolio_account_id, asset_name, asset_symbol, asset_class, units, unit_price, performance_percent, valuation_currency, valued_at").in("portfolio_account_id", accountIds).order("valued_at", { ascending: false }) : { data: [], error: null };
    setBusyAction(null);
    if (holdingResult.error) { setPortfolioMessage(holdingResult.error.message); return; }
    setAccounts(currentAccounts); setHoldings((holdingResult.data ?? []) as Holding[]); setActivePortfolioClientId(clientId);
    setPortfolioMessage(currentAccounts.length ? "Portfolio loaded. You can amend an existing product by saving it with the same product code." : "No portfolio exists for this customer yet. Add their first approved investment below.");
  }

  useEffect(() => {
    void load();
  }, []);

  const pendingActions = useMemo<PendingAction[]>(() => {
    const kycActions: PendingAction[] = verifications
      .filter((item) => item.status === "pending")
      .map((verification) => ({
        kind: "kyc",
        submittedAt: verification.submitted_at,
        verification,
      }));
    const fundingActions: PendingAction[] = requests
      .filter((request) => pendingFundingStatuses.includes(request.status))
      .map((request) => ({
        kind: request.kind,
        submittedAt: request.submitted_at,
        request,
      }));

    return [...kycActions, ...fundingActions].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
    );
  }, [requests, verifications]);

  const pendingKyc = verifications.filter((item) => item.status === "pending").length;
  const pendingDeposits = requests.filter(
    (item) => item.kind === "deposit" && pendingFundingStatuses.includes(item.status),
  ).length;
  const pendingWithdrawals = requests.filter(
    (item) => item.kind === "withdrawal" && pendingFundingStatuses.includes(item.status),
  ).length;

  async function writeAudit(
    entityType: string,
    entityId: string,
    eventType: string,
    metadata: Record<string, string>,
  ) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return supabase.from("audit_events").insert({
      actor_id: user?.id,
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      metadata,
    });
  }

  async function assignWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (walletLocked.current) return;
    walletLocked.current = true;
    const form = new FormData(event.currentTarget);
    const [asset_symbol, network] = String(form.get("assetNetwork")).split("|");
    const clientId = String(form.get("clientId"));
    const publicAddress = String(form.get("publicAddress")).trim();

    setBusyAction("wallet"); setWalletMessage("Assigning the wallet to this customer…");
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("deposit_addresses")
      .insert({
        client_id: clientId,
        asset_symbol,
        network,
        public_address: publicAddress,
        assigned_by: user?.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      await writeAudit("deposit_address", data.id, "wallet_assigned", {
        asset_symbol,
        network,
        client_id: clientId,
      });
    }
    setBusyAction(null); walletLocked.current = false;

    if (error) {
      setWalletMessage(error.message);
      return;
    }

    event.currentTarget.reset();
    navigator.vibrate?.(25);
    setWalletMessage("Wallet assigned successfully. The public address is now visible only to that client.");
    await load();
  }

  async function reviewVerification(item: Verification, status: "approved" | "rejected") {
    setBusyAction(`kyc-${item.id}`);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const reviewedAt = new Date().toISOString();
    const { error: verificationError } = await supabase
      .from("identity_verifications")
      .update({ status, reviewer_id: user?.id, reviewed_at: reviewedAt })
      .eq("id", item.id);

    if (verificationError) {
      setBusyAction(null);
      setMessage(verificationError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ identity_status: status })
      .eq("id", item.client_id);

    if (profileError) {
      setBusyAction(null);
      setMessage(`Verification changed, but the customer profile could not be updated: ${profileError.message}`);
      await load();
      return;
    }

    await writeAudit("identity_verification", item.id, `verification_${status}`, {
      client_id: item.client_id,
    });
    setBusyAction(null);
    setMessage(
      `KYC ${status}. The customer’s verification status now shows “${status}” in their portal.`,
    );
    await load();
  }

  async function reviewRequest(
    request: FundingRequest,
    status: "under_review" | "approved" | "rejected",
  ) {
    setBusyAction(`${request.kind}-${request.id}`);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const table = request.kind === "deposit" ? "deposit_requests" : "withdrawal_requests";
    const { error } = await supabase
      .from(table)
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (!error) {
      await writeAudit(
        request.kind === "deposit" ? "deposit_request" : "withdrawal_request",
        request.id,
        `request_${status}`,
        { asset_symbol: request.asset_symbol, network: request.network },
      );
    }
    setBusyAction(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      `${request.kind === "deposit" ? "Deposit" : "Withdrawal"} marked ${displayStatus(status)}. The customer can now see this status. Any actual transfer remains a manual off-platform operation.`,
    );
    await load();
  }

  async function openKycFile(path: string) {
    setBusyAction(`file-${path}`);
    const { data, error } = await createClient().storage.from("kyc-documents").createSignedUrl(path, 60);
    setBusyAction(null);
    if (error || !data?.signedUrl) { setMessage(`Unable to open the private file: ${error?.message ?? "No signed link was created."}`); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function saveRequestDetails(event: FormEvent<HTMLFormElement>, request: FundingRequest) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyAction(`details-${request.kind}-${request.id}`);
    const table = request.kind === "deposit" ? "deposit_requests" : "withdrawal_requests";
    const changes = request.kind === "deposit"
      ? { internal_note: String(form.get("internalNote") ?? "").trim() || null }
      : { internal_note: String(form.get("internalNote") ?? "").trim() || null, payout_reference: String(form.get("payoutReference") ?? "").trim() || null };
    const { error } = await createClient().from(table).update(changes).eq("id", request.id);
    setBusyAction(null);
    if (error) { setMessage(error.message); return; }
    await writeAudit(request.kind === "deposit" ? "deposit_request" : "withdrawal_request", request.id, "request_details_updated", { client_id: request.client_id });
    setMessage("Review notes saved. These notes are internal and are not visible to the customer.");
    await load();
  }

  async function saveHolding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (portfolioLocked.current) return;
    portfolioLocked.current = true;
    const form = new FormData(event.currentTarget);
    const clientId = activePortfolioClientId;
    if (!clientId) { setPortfolioMessage("Select and search for a customer before saving an investment."); return; }
    const assetSymbol = String(form.get("assetSymbol")).trim().toUpperCase();
    setBusyAction("holding"); setPortfolioMessage("Saving this investment valuation…");
    const supabase = createClient();
    let account = accounts.find((item) => item.client_id === clientId && item.status === "active");
    if (!account) {
      const created = await supabase.from("portfolio_accounts").insert({ client_id: clientId, name: "Investment portfolio", currency_code: "USD", status: "active" }).select("id, client_id, name, currency_code, status").single();
      if (created.error || !created.data) { portfolioLocked.current = false; setBusyAction(null); setPortfolioMessage(created.error?.message ?? "Unable to create a portfolio account."); return; }
      account = created.data as PortfolioAccount;
    }
    const { data, error } = await supabase.from("holdings").upsert({
      portfolio_account_id: account.id,
      asset_name: String(form.get("assetName")).trim(),
      asset_symbol: assetSymbol,
      asset_class: String(form.get("assetClass")).trim(),
      units: Number(form.get("units")),
      unit_price: Number(form.get("unitPrice")),
      performance_percent: Number(form.get("performancePercent")),
      valuation_currency: "USD",
      valued_at: new Date().toISOString(),
    }, { onConflict: "portfolio_account_id,asset_symbol" }).select("id").single();
    setBusyAction(null); portfolioLocked.current = false;
    if (error || !data) { setPortfolioMessage(error?.message ?? "Unable to save the holding. Run the portfolio migration before using this form."); return; }
    await writeAudit("holding", data.id, "holding_valued", { client_id: clientId, asset_symbol: assetSymbol });
    event.currentTarget.reset();
    navigator.vibrate?.(25); setPortfolioMessage("Investment saved successfully. The customer portal now reflects the current valuation and performance percentage.");
    await loadPortfolio(clientId);
  }

  async function deleteHolding(holding: Holding) {
    if (!window.confirm(`Remove ${holding.asset_name} (${holding.asset_symbol}) from this client portfolio?`)) return;
    setBusyAction(`delete-${holding.id}`); setPortfolioMessage("Removing the investment…");
    const { error } = await createClient().from("holdings").delete().eq("id", holding.id);
    setBusyAction(null);
    if (error) { setPortfolioMessage(error.message); return; }
    navigator.vibrate?.(25); setPortfolioMessage("Investment removed successfully. The customer portfolio has been updated.");
    await loadPortfolio(activePortfolioClientId);
  }

  async function applyRevaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (revaluationLocked.current) return;
    const form = new FormData(event.currentTarget);
    const percent = Number(form.get("percentage"));
    const direction = String(form.get("direction"));
    const change = direction === "decrease" ? -percent : percent;
    if (!Number.isFinite(percent) || percent <= 0 || percent > 1000) { setRevaluationMessage("Enter a percentage greater than 0 and no more than 1,000."); return; }
    if (!window.confirm(`Apply a ${percent}% ${direction} to every recorded client holding? This changes dashboard valuations and will be audited.`)) return;
    revaluationLocked.current = true; setBusyAction("revalue"); setRevaluationMessage("Applying the portfolio revaluation…");
    const { data, error } = await createClient().rpc("apply_portfolio_revaluation", { change_percent: change });
    setBusyAction(null); revaluationLocked.current = false;
    if (error) { setRevaluationMessage(error.message.includes("function") ? "The portfolio revaluation database update has not been applied yet. Run the provided Supabase SQL first." : error.message); return; }
    navigator.vibrate?.(35); setRevaluationMessage(`Revaluation complete. ${data ?? 0} holding${data === 1 ? "" : "s"} updated by ${change}% and recorded in the audit log.`);
    await load();
    if (activePortfolioClientId) await loadPortfolio(activePortfolioClientId);
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="brand sidebar-brand">
          <span className="brand-mark">BW</span> Better Wealth
        </Link>
        <div className="admin-badge">Live internal operations</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a className="admin-active" href="#overview"><span>◈</span> Overview</a>
          <a href="#pending"><span>!</span> Pending actions <b>{pendingActions.length}</b></a>
          <a href="#clients"><span>◎</span> Clients</a>
          <a href="#portfolio"><span>◫</span> Portfolios</a>
          <a href="#revaluation"><span>↕</span> Revaluation</a>
          <a href="#funding"><span>↗</span> Funding</a>
          <a href="#wallets"><span>◌</span> Wallet assignments</a>
          <Link href="/admin/support"><span>?</span> Support queue</Link>
          <a href="#activity"><span>◷</span> Audit activity</a>
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Operations workspace</p>
            <h1>Better Wealth administration.</h1>
          </div>
          <Link className="secondary-button" href="/portal">Open client portal</Link>
        </header>

        <div className="admin-environment">
          <span>Manual operations</span>
          <p>Wallet addresses are assigned by staff. Requests are reviewed here; cryptocurrency is never sent by this application.</p>
        </div>
        {message && <p className="signin-message" role="status">{message}</p>}

        <section id="overview" className="admin-stat-grid">
          <article><span>Client records</span><strong>{clients.length}</strong><small>Role-controlled access</small></article>
          <article><span>Pending KYC</span><strong>{pendingKyc}</strong><small className="attention">Identity review required</small></article>
          <article><span>Pending deposits</span><strong>{pendingDeposits}</strong><small className="attention">Funding review required</small></article>
          <article><span>Pending withdrawals</span><strong>{pendingWithdrawals}</strong><small className="attention">Manual approval required</small></article>
        </section>

        <section id="pending" className="admin-panel pending-actions-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Action centre</p>
              <h2>Pending customer actions</h2>
            </div>
            <span className="queue-count">{pendingActions.length} open</span>
          </div>
          <p className="admin-panel-copy">
            KYC, deposit, and withdrawal submissions appear here in newest-first order. Approvals update the customer portal immediately.
          </p>

          <div className="pending-actions-table">
            <div className="pending-actions-head">
              <span>Action</span><span>Customer</span><span>Details</span><span>Review</span><span>Submitted</span><span>Status</span><span>Decision</span>
            </div>
            {pendingActions.length ? pendingActions.map((action) => {
              const record = action.kind === "kyc" ? action.verification : action.request;
              const client = clients.find((entry) => entry.id === record.client_id);
              const actionBusy = busyAction === `${action.kind}-${record.id}`;
              return (
                <div className="pending-actions-row" key={`${action.kind}-${record.id}`}>
                  <strong className={`action-kind action-${action.kind}`}>{action.kind === "kyc" ? "KYC" : action.kind}</strong>
                  <span>{nameOf(client)}</span>
                  <span>
                    {action.kind === "kyc"
                      ? displayStatus(action.verification.document_type)
                      : `${action.request.asset_symbol} · ${action.request.network} · ${action.request.declared_amount ?? action.request.requested_amount}`}
                  </span>
                  <button className="review-link" type="button" onClick={() => setSelectedAction(action)}>View details</button>
                  <time>{new Date(action.submittedAt).toLocaleString()}</time>
                  <em className="status-pending">{displayStatus(record.status)}</em>
                  <span className="admin-review-actions">
                    {action.kind === "kyc" ? (
                      <>
                        <button disabled={actionBusy} onClick={() => reviewVerification(action.verification, "approved")}>Approve</button>
                        <button className="reject-action" disabled={actionBusy} onClick={() => reviewVerification(action.verification, "rejected")}>Reject</button>
                      </>
                    ) : (
                      <>
                        <button disabled={actionBusy} onClick={() => reviewRequest(action.request, "under_review")}>Review</button>
                        <button disabled={actionBusy} onClick={() => reviewRequest(action.request, "approved")}>Approve</button>
                        <button className="reject-action" disabled={actionBusy} onClick={() => reviewRequest(action.request, "rejected")}>Reject</button>
                      </>
                    )}
                  </span>
                </div>
              );
            }) : <div className="queue-empty"><strong>All caught up.</strong><span>There are no pending customer actions.</span></div>}
          </div>
        </section>

        {selectedAction && <section className="admin-panel action-detail-panel" aria-live="polite">
          <div className="admin-panel-heading"><div><p className="eyebrow">Submission review</p><h2>{selectedAction.kind === "kyc" ? "Identity verification" : `${selectedAction.kind === "deposit" ? "Deposit" : "Withdrawal"} request`}</h2></div><button className="secondary-button" type="button" onClick={() => setSelectedAction(null)}>Close review</button></div>
          {(() => {
            const record = selectedAction.kind === "kyc" ? selectedAction.verification : selectedAction.request;
            const client = clients.find((entry) => entry.id === record.client_id);
            return <div className="action-detail-body"><div><span>Customer</span><strong>{nameOf(client)}</strong><small>{client?.country_code || "Country not provided"} · {client?.identity_status || "not started"}</small><small>Plan: {client?.investment_plan || "Not selected"}</small><small>{client?.phone_number || "No phone number provided"}</small></div>
              {selectedAction.kind === "kyc" ? <div className="detail-files"><p><span>Document type</span><strong>{displayStatus(selectedAction.verification.document_type)}</strong></p><button type="button" disabled={busyAction?.startsWith("file-")} onClick={() => void openKycFile(selectedAction.verification.document_path)}>Open ID document</button><button type="button" disabled={busyAction?.startsWith("file-")} onClick={() => void openKycFile(selectedAction.verification.selfie_path)}>Open selfie with ID</button><small>Files remain private; each review link expires after one minute.</small></div> : <form className="admin-form request-detail-form" onSubmit={(event) => void saveRequestDetails(event, selectedAction.request)}><div className="review-data"><p><span>Asset / network</span><strong>{selectedAction.request.asset_symbol} · {selectedAction.request.network}</strong></p><p><span>Amount</span><strong>{selectedAction.request.declared_amount ?? selectedAction.request.requested_amount}</strong></p>{selectedAction.kind === "deposit" ? <p><span>Transaction reference</span><code>{selectedAction.request.transaction_reference}</code></p> : <p><span>Destination address</span><code>{selectedAction.request.destination_address}</code></p>}</div>{selectedAction.kind === "withdrawal" && <label>Payout transaction reference<input name="payoutReference" defaultValue={selectedAction.request.payout_reference ?? ""} placeholder="Enter after the transfer is completed" /></label>}<label>Internal review note<textarea name="internalNote" defaultValue={selectedAction.request.internal_note ?? ""} placeholder="Reason for decision, confirmations completed, or exception notes" /></label><button className="button" disabled={busyAction === `details-${selectedAction.request.kind}-${selectedAction.request.id}`} type="submit">Save review details</button></form>}
            </div>;
          })()}
        </section>}

        <section id="clients" className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Clients</p><h2>Client directory</h2></div></div>
          <div className="admin-table">
            <div className="admin-table-head"><span>Client</span><span>Country</span><span>Verification</span><span>Role</span></div>
            {clients.map((client) => (
              <div className="admin-table-row" key={client.id}>
                <div><strong>{nameOf(client)}</strong><small>{client.id.slice(0, 8)}…</small></div>
                <span>{client.country_code || "Not provided"}</span>
                <span>{displayStatus(client.identity_status)}</span>
                <span>{displayStatus(client.role)}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="portfolio" className="admin-panel portfolio-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Portfolio management</p><h2>Add or update a client investment.</h2></div></div>
          <p className="admin-panel-copy">Search for one customer first. Their portfolio is loaded only after you select them, so customer records stay focused and manageable.</p>
          <form className="portfolio-search" onSubmit={(event) => { event.preventDefault(); void loadPortfolio(portfolioClientId); }}><label>Customer<select value={portfolioClientId} onChange={(event) => setPortfolioClientId(event.target.value)} required><option value="" disabled>Select customer</option>{clients.filter((client) => client.role === "client").map((client) => <option key={client.id} value={client.id}>{nameOf(client)} · {client.country_code || "Country not provided"}</option>)}</select></label><button className="secondary-button" disabled={!portfolioClientId || busyAction === "portfolio-search"} type="submit">{busyAction === "portfolio-search" ? "Loading…" : "Search portfolio"}</button></form>
          <p className="portfolio-action-status" role="status">{portfolioMessage}</p>
          {activePortfolioClientId ? <><form className="portfolio-form" onSubmit={saveHolding}>
            <label>Investment product<input name="assetName" required placeholder="e.g. Global Income Portfolio" /></label>
            <label>Symbol / code<input name="assetSymbol" required maxLength={16} placeholder="e.g. GIP" /></label>
            <label>Product class<input name="assetClass" required placeholder="e.g. Managed fund" /></label>
            <label>Units held<input name="units" required type="number" min="0" step="any" placeholder="0" /></label>
            <label>Current unit value (USD)<input name="unitPrice" required type="number" min="0" step="any" placeholder="0.00" /></label>
            <label>Performance (%)<input name="performancePercent" required type="number" min="-100" step="0.01" defaultValue="0" /></label>
            <button className="button" disabled={busyAction === "holding"} type="submit">Save investment <span>→</span></button>
          </form>
          <div className="holding-admin-list">{holdings.length ? holdings.map((holding) => <div key={holding.id}><strong>{holding.asset_name} <small>{holding.asset_symbol}</small></strong><span>{Number(holding.units).toLocaleString()} units × ${Number(holding.unit_price).toLocaleString()} · {Number(holding.performance_percent).toFixed(2)}%</span><button className="remove-holding" type="button" disabled={busyAction === `delete-${holding.id}`} onClick={() => void deleteHolding(holding)}>{busyAction === `delete-${holding.id}` ? "Removing…" : "Remove"}</button></div>) : <p className="empty-copy">No investment holdings have been recorded for this customer.</p>}</div></> : <p className="empty-copy">Select a customer above to view or manage their portfolio.</p>}
        </section>

        <section id="revaluation" className="admin-panel revaluation-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Bulk portfolio revaluation</p><h2>Adjust all recorded holdings.</h2></div></div>
          <p className="admin-panel-copy">Use this only after an authorised valuation decision. It changes the current unit value of every recorded client holding; it does not place trades or move funds.</p>
          <form className="revaluation-form" onSubmit={applyRevaluation}>
            <label>Percentage<input name="percentage" required type="number" min="0.01" max="1000" step="0.01" placeholder="e.g. 2.5" /></label>
            <label>Direction<select name="direction" defaultValue="increase"><option value="increase">Increase all valuations</option><option value="decrease">Reduce all valuations</option></select></label>
            <button className="button" disabled={busyAction === "revalue"} type="submit">{busyAction === "revalue" ? "Applying…" : "Apply to all portfolios"} <span>→</span></button>
          </form>
          <p className="revaluation-status" role="status">{revaluationMessage}</p>
        </section>

        <section id="wallets" className="admin-wallet-section">
          <div>
            <p className="eyebrow">Manual wallet assignment</p>
            <h2>Assign a public deposit address.</h2>
            <p>Enter only the customer’s assigned public deposit address and network. Never enter a private key, seed phrase, exchange credential, or payout credential.</p>
            <p className="wallet-action-status" role="status">{walletMessage}</p>
          </div>
          <form className="admin-wallet-card admin-form" onSubmit={assignWallet}>
            <label>Client
              <select name="clientId" required defaultValue="">
                <option value="" disabled>Select client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{nameOf(client)} · {displayStatus(client.role)}</option>)}
              </select>
            </label>
            <label>Asset and network
              <select name="assetNetwork" defaultValue="BTC|Bitcoin">
                {networkOptions.map((option) => <option key={option} value={option}>{option.replace("|", " · ")}</option>)}
              </select>
            </label>
            <label>Public deposit address<input name="publicAddress" required placeholder="Paste the public address only" /></label>
            <button className="button" disabled={busyAction === "wallet" || !clients.length} type="submit">Assign wallet <span>→</span></button>
          </form>
        </section>

        <section id="funding" className="admin-panel withdrawal-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Funding history</p><h2>Deposit and withdrawal requests</h2></div></div>
          <div className="withdrawal-table">
            <div className="withdrawal-head"><span>Type</span><span>Client</span><span>Asset / network</span><span>Amount</span><span>Status</span><span>Submitted</span></div>
            {requests.length ? requests.map((request) => (
              <div className="withdrawal-row" key={`${request.kind}-${request.id}`}>
                <strong>{request.kind}</strong>
                <span>{nameOf(clients.find((client) => client.id === request.client_id))}</span>
                <span>{request.asset_symbol} · {request.network}</span>
                <span>{request.declared_amount ?? request.requested_amount}</span>
                <em className={request.status === "approved" ? "status-approved" : "status-pending"}>{displayStatus(request.status)}</em>
                <time>{new Date(request.submitted_at).toLocaleString()}</time>
              </div>
            )) : <div className="queue-empty"><span>No funding requests submitted yet.</span></div>}
          </div>
        </section>

        <section id="activity" className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Audit activity</p><h2>Five most recent administrative events</h2></div></div>
          <div className="admin-timeline">
            {audits.length ? audits.map((audit) => (
              <div key={audit.id}>
                <i className="timeline-info" />
                <p><strong>{displayStatus(audit.event_type)}</strong><span>{displayStatus(audit.entity_type)}</span></p>
                <time>{new Date(audit.occurred_at).toLocaleString()}</time>
              </div>
            )) : <p>No administrative actions recorded yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
