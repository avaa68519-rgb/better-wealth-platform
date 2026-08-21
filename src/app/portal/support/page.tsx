"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  staff_note: string | null;
  created_at: string;
};

const statusText = (status: string) => status.replaceAll("_", " ");

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState("Loading your support requests…");
  const [submitting, setSubmitting] = useState(false);

  async function loadTickets() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, category, status, staff_note, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage(error.message.includes("support_tickets") ? "Support is being set up. Please contact the operations team temporarily." : error.message);
      return;
    }
    setTickets((data ?? []) as Ticket[]);
    setMessage("");
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").insert({
      client_id: user?.id,
      subject: String(form.get("subject") ?? "").trim(),
      category: String(form.get("category") ?? "general"),
      message: String(form.get("message") ?? "").trim(),
    });
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    event.currentTarget.reset();
    setMessage("Your support request has been received. The Better Wealth team will respond in this portal.");
    await loadTickets();
  }

  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <Link href="/" className="brand sidebar-brand"><span className="brand-mark">BW</span> Better Wealth</Link>
        <p className="sidebar-label">Client portal</p>
        <nav className="side-nav" aria-label="Portal navigation">
          <Link href="/portal"><span>◈</span> Overview</Link>
          <Link href="/portal/verification"><span>✓</span> Verification</Link>
          <Link href="/portal/funding"><span>↗</span> Funding</Link>
          <Link className="nav-active" href="/portal/support"><span>?</span> Support</Link>
        </nav>
        <SignOutButton />
      </aside>
      <section className="portal-content support-content">
        <header className="portal-header"><div><p className="eyebrow">Client care</p><h1>How can we help?</h1></div><Link href="/portal" className="back-link">← Back to overview</Link></header>
        {message && <p className="signin-message" role="status">{message}</p>}
        <div className="support-grid">
          <article className="panel support-form-card">
            <p className="eyebrow">New request</p><h2>Contact operations.</h2>
            <p>Do not include passwords, private keys, seed phrases, or full identity document numbers.</p>
            <form onSubmit={submitTicket}>
              <label>Topic<select name="category" defaultValue="general"><option value="general">General account question</option><option value="funding">Deposit or withdrawal</option><option value="verification">Identity verification</option><option value="account">Account access</option></select></label>
              <label>Subject<input name="subject" required minLength={3} maxLength={160} placeholder="A short summary" /></label>
              <label>Message<textarea name="message" required minLength={10} maxLength={5000} placeholder="Tell us how we can help" /></label>
              <button className="button" disabled={submitting} type="submit">{submitting ? "Sending…" : "Send support request"} <span>→</span></button>
            </form>
          </article>
          <article className="panel support-history-card">
            <p className="eyebrow">Your requests</p><h2>{tickets.length ? "Support history" : "No requests yet"}</h2>
            <div className="support-ticket-list">{tickets.length ? tickets.map((ticket) => <div className="support-ticket" key={ticket.id}><div><strong>{ticket.subject}</strong><small>{ticket.category} · {new Date(ticket.created_at).toLocaleString()}</small></div><em className={ticket.status === "resolved" || ticket.status === "closed" ? "status-approved" : "status-pending"}>{statusText(ticket.status)}</em>{ticket.staff_note && <p><b>Team update:</b> {ticket.staff_note}</p>}</div>) : <p className="empty-copy">When you submit a request, its status and staff updates will appear here.</p>}</div>
          </article>
        </div>
      </section>
    </main>
  );
}
