"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { notifyCustomer } from "@/lib/email/notify";
import { createClient } from "@/lib/supabase/client";

type DepositAddress = {
  id: string;
  asset_symbol: string;
  network: string;
  public_address: string;
};
type RequestItem = {
  id: string;
  asset_symbol: string;
  network: string;
  status: string;
  submitted_at: string;
  kind: "Deposit" | "Withdrawal";
};

const withdrawalNetworks = [
  { asset: "BTC", network: "Bitcoin" },
  { asset: "ETH", network: "Ethereum" },
  { asset: "USDT", network: "TRC20" },
  { asset: "USDT", network: "ERC20" },
];

export default function FundingPage() {
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [message, setMessage] = useState("Loading your funding details…");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionKind, setSubmissionKind] = useState<
    "deposit" | "withdrawal" | null
  >(null);
  const submitLock = useRef(false);
  const selectedAddress = useMemo(
    () =>
      addresses.find((address) => address.id === selectedAddressId) ??
      addresses[0],
    [addresses, selectedAddressId],
  );

  async function loadFundingData(preserveMessage = false) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please sign in again to view funding details.");
      return;
    }
    const [addressResult, depositResult, withdrawalResult] = await Promise.all([
      supabase
        .from("deposit_addresses")
        .select("id, asset_symbol, network, public_address")
        .order("assigned_at", { ascending: false }),
      supabase
        .from("deposit_requests")
        .select("id, asset_symbol, network, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(3),
      supabase
        .from("withdrawal_requests")
        .select("id, asset_symbol, network, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(3),
    ]);
    if (addressResult.error || depositResult.error || withdrawalResult.error) {
      setMessage(
        "We could not load funding details. Please refresh the page or contact Better Wealth support.",
      );
      return;
    }
    const assignedAddresses = (addressResult.data ?? []) as DepositAddress[];
    setAddresses(assignedAddresses);
    setSelectedAddressId(assignedAddresses[0]?.id ?? "");
    setRequests(
      [
        ...(depositResult.data ?? []).map((request) => ({
          ...request,
          kind: "Deposit" as const,
        })),
        ...(withdrawalResult.data ?? []).map((request) => ({
          ...request,
          kind: "Withdrawal" as const,
        })),
      ].sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at)),
    );
    if (!preserveMessage)
      setMessage(
        assignedAddresses.length
          ? ""
          : "No deposit wallet has been assigned to your account yet. Contact Better Wealth support when you are ready to fund.",
      );
  }

  useEffect(() => {
    void loadFundingData();
  }, []);

  async function submitDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    if (!selectedAddress) {
      setMessage(
        "An administrator must assign a deposit wallet before you can submit a deposit reference.",
      );
      return;
    }
    const formData = new FormData(event.currentTarget);
    submitLock.current = true;
    setSubmissionKind("deposit");
    setIsSubmitting(true);
    setMessage(
      "Deposit reference received. Saving it securely now — please do not submit it again.",
    );
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("deposit_requests")
      .insert({
        client_id: user?.id,
        deposit_address_id: selectedAddress.id,
        asset_symbol: selectedAddress.asset_symbol,
        network: selectedAddress.network,
        declared_amount: Number(formData.get("amount")),
        transaction_reference: String(
          formData.get("transactionReference") ?? "",
        ).trim(),
      });
    setIsSubmitting(false);
    setSubmissionKind(null);
    submitLock.current = false;
    if (error) {
      setMessage(
        error.message.includes(
          "deposit_requests_network_transaction_reference_key",
        )
          ? "This transaction hash has already been submitted. Please do not submit it again; the operations team will review the existing request."
          : error.message,
      );
      return;
    }
    void notifyCustomer("deposit_received", {
      asset: selectedAddress.asset_symbol,
      network: selectedAddress.network,
      amount: String(formData.get("amount") ?? ""),
    });
    navigator.vibrate?.(35);
    event.currentTarget.reset();
    setMessage(
      "✓ Deposit reference confirmed. It is now awaiting Better Wealth review, and an email confirmation is on its way.",
    );
    await loadFundingData(true);
  }

  async function submitWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const formData = new FormData(event.currentTarget);
    const [asset_symbol, network] = String(
      formData.get("assetNetwork") ?? "BTC|Bitcoin",
    ).split("|");
    submitLock.current = true;
    setSubmissionKind("withdrawal");
    setIsSubmitting(true);
    setMessage(
      "Withdrawal request received. Saving it securely now — please do not submit it again.",
    );
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("withdrawal_requests")
      .insert({
        client_id: user?.id,
        asset_symbol,
        network,
        requested_amount: Number(formData.get("amount")),
        destination_address: String(
          formData.get("destinationAddress") ?? "",
        ).trim(),
      });
    setIsSubmitting(false);
    setSubmissionKind(null);
    submitLock.current = false;
    if (error) {
      setMessage(
        error.message.includes("row-level security")
          ? "Withdrawals are available once identity verification has been approved."
          : error.message,
      );
      return;
    }
    void notifyCustomer("withdrawal_received", {
      asset: asset_symbol,
      network,
      amount: String(formData.get("amount") ?? ""),
    });
    navigator.vibrate?.(35);
    event.currentTarget.reset();
    setMessage(
      "✓ Withdrawal request confirmed. It is now awaiting manual review, and an email confirmation is on its way.",
    );
    await loadFundingData(true);
  }

  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <Link href="/" className="brand sidebar-brand">
          <span className="brand-mark">BW</span> Better Wealth
        </Link>
        <p className="sidebar-label">Client portal</p>
        <nav className="side-nav" aria-label="Portal navigation">
          <Link href="/portal">
            <span>◈</span> Overview
          </Link>
          <Link href="/portal/verification">
            <span>✓</span> Verification
          </Link>
          <Link className="nav-active" href="/portal/funding">
            <span>↗</span> Funding
          </Link>
          <Link href="/portal/support">
            <span>?</span> Support
          </Link>
        </nav>
        <SignOutButton />
      </aside>
      <section className="portal-content funding-content">
        <header className="portal-header">
          <div>
            <p className="eyebrow">Funding centre</p>
            <h1>Deposit or withdraw.</h1>
          </div>
          <Link href="/portal" className="back-link">
            ← Back to overview
          </Link>
        </header>
        {message && (
          <p className="signin-message" role="status">
            {message}
          </p>
        )}
        <div className="funding-grid">
          <article className="panel funding-card">
            <p className="eyebrow">Deposit crypto</p>
            <h2>Send a deposit</h2>
            <p>
              Select a wallet address that has been assigned to you by the
              Better Wealth operations team.
            </p>
            {addresses.length > 0 ? (
              <>
                <label>
                  Assigned wallet
                  <select
                    value={selectedAddress?.id ?? ""}
                    onChange={(event) =>
                      setSelectedAddressId(event.target.value)
                    }
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.asset_symbol} · {address.network}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="address-box">
                  <small>Your assigned deposit address</small>
                  <code>{selectedAddress?.public_address}</code>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        selectedAddress?.public_address ?? "",
                      );
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied" : "Copy address"}
                  </button>
                </div>
                <form onSubmit={submitDeposit}>
                  <label>
                    Amount sent
                    <input
                      name="amount"
                      inputMode="decimal"
                      min="0.00000001"
                      step="any"
                      required
                      placeholder={`0.00 ${selectedAddress?.asset_symbol ?? ""}`}
                    />
                  </label>
                  <label>
                    Transaction hash / reference
                    <input
                      name="transactionReference"
                      required
                      placeholder="Paste the transaction hash"
                    />
                  </label>
                  <button
                    className="button"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {submissionKind === "deposit"
                      ? "Deposit received — saving…"
                      : "Submit deposit reference"}{" "}
                    <span aria-hidden>→</span>
                  </button>
                </form>
                <p className="form-note">
                  Only send the selected asset through the displayed network.
                  Deposits are credited after review and confirmation.
                </p>
              </>
            ) : (
              <div className="address-box">
                <small>Assigned deposit address</small>
                <strong>Awaiting assignment by Better Wealth operations</strong>
              </div>
            )}
          </article>
          <article className="panel funding-card">
            <p className="eyebrow">Withdrawal request</p>
            <h2>Request a withdrawal</h2>
            <p>
              Enter your own destination wallet address carefully. Better Wealth
              never requests a private key or seed phrase.
            </p>
            <form onSubmit={submitWithdrawal}>
              <label>
                Asset and network
                <select name="assetNetwork" defaultValue="BTC|Bitcoin">
                  {withdrawalNetworks.map((option) => (
                    <option
                      key={`${option.asset}|${option.network}`}
                      value={`${option.asset}|${option.network}`}
                    >
                      {option.asset} · {option.network}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Destination wallet address
                <input
                  name="destinationAddress"
                  required
                  placeholder="Paste your wallet address"
                />
              </label>
              <label>
                Requested amount
                <input
                  name="amount"
                  inputMode="decimal"
                  min="0.00000001"
                  step="any"
                  required
                  placeholder="0.00"
                />
              </label>
              <div className="warning">
                <strong>Please check the network and address.</strong>
                <span>
                  Once submitted, address changes require a new request.
                  Withdrawals require verified identity and manual approval.
                </span>
              </div>
              <button className="button" disabled={isSubmitting} type="submit">
                {submissionKind === "withdrawal"
                  ? "Request received — saving…"
                  : "Request withdrawal"}{" "}
                <span aria-hidden>→</span>
              </button>
            </form>
          </article>
        </div>
        <article className="panel request-panel">
          <div>
            <p className="eyebrow">Recent requests</p>
            <h2>
              {requests.length
                ? `${requests.length} recent request${requests.length === 1 ? "" : "s"}`
                : "No requests yet"}
            </h2>
            {requests.length ? (
              <div className="recent-request-list">
                {requests.map((request) => (
                  <div key={`${request.kind}-${request.id}`}>
                    <strong>{request.kind} request</strong>
                    <span>{request.asset_symbol} · {request.network}</span>
                    <em className="status status-review">{request.status.replaceAll("_", " ")}</em>
                  </div>
                ))}
              </div>
            ) : (
              <p>Submitted deposit and withdrawal requests will appear here for your review.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
