"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  country_code: string | null;
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
  kind: "deposit" | "withdrawal";
};

type Verification = {
  id: string;
  client_id: string;
  document_type: string;
  status: string;
  submitted_at: string;
};

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
  const [message, setMessage] = useState("Loading live operations data…");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const [clientResult, verificationResult, depositResult, withdrawalResult, auditResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, country_code, role, identity_status")
          .order("created_at", { ascending: false }),
        supabase
          .from("identity_verifications")
          .select("id, client_id, document_type, status, submitted_at")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("deposit_requests")
          .select("id, client_id, asset_symbol, network, status, submitted_at, declared_amount")
          .order("submitted_at", { ascending: false })
          .limit(25),
        supabase
          .from("withdrawal_requests")
          .select("id, client_id, asset_symbol, network, status, submitted_at, requested_amount")
          .order("submitted_at", { ascending: false })
          .limit(25),
        supabase
          .from("audit_events")
          .select("id, entity_type, event_type, occurred_at")
          .order("occurred_at", { ascending: false })
          .limit(10),
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
    const form = new FormData(event.currentTarget);
    const [asset_symbol, network] = String(form.get("assetNetwork")).split("|");
    const clientId = String(form.get("clientId"));
    const publicAddress = String(form.get("publicAddress")).trim();

    setBusyAction("wallet");
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
    setBusyAction(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    event.currentTarget.reset();
    setMessage("Deposit wallet assigned. The public address is now visible only to that client.");
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
              <span>Action</span><span>Customer</span><span>Details</span><span>Submitted</span><span>Status</span><span>Decision</span>
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

        <section id="wallets" className="admin-wallet-section">
          <div>
            <p className="eyebrow">Manual wallet assignment</p>
            <h2>Assign a public deposit address.</h2>
            <p>Enter only the customer’s assigned public deposit address and network. Never enter a private key, seed phrase, exchange credential, or payout credential.</p>
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
          <div className="admin-panel-heading"><div><p className="eyebrow">Audit activity</p><h2>Recent administrative events</h2></div></div>
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
