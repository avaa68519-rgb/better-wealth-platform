"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = { id: string; client_id: string; subject: string; message: string; category: string; status: string; staff_note: string | null; created_at: string };
type Profile = { id: string; first_name: string | null; last_name: string | null };
const statusText = (status: string) => status.replaceAll("_", " ");
const clientName = (profile: Profile | undefined) => [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed client";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState("Loading support requests…");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const [ticketResult, profileResult] = await Promise.all([
      supabase.from("support_tickets").select("id, client_id, subject, message, category, status, staff_note, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, last_name"),
    ]);
    const error = ticketResult.error ?? profileResult.error;
    if (error) { setMessage(error.message.includes("support_tickets") ? "Apply the support-tickets migration in Supabase before using this queue." : error.message); return; }
    setTickets((ticketResult.data ?? []) as Ticket[]);
    setProfiles((profileResult.data ?? []) as Profile[]);
    setMessage("");
  }

  useEffect(() => { void load(); }, []);

  async function updateTicket(ticket: Ticket, form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(ticket.id); setMessage("");
    const status = String(data.get("status"));
    const staff_note = String(data.get("staffNote") ?? "").trim() || null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("support_tickets").update({ status, staff_note, assigned_to: user?.id, updated_at: new Date().toISOString() }).eq("id", ticket.id);
    if (!error) await supabase.from("audit_events").insert({ actor_id: user?.id, entity_type: "support_ticket", entity_id: ticket.id, event_type: `support_${status}`, metadata: { client_id: ticket.client_id } });
    setBusy(null);
    if (error) { setMessage(error.message); return; }
    setMessage("Support request updated. The client can now see the status and your update in their portal.");
    await load();
  }

  return <main className="admin-shell"><aside className="admin-sidebar"><Link href="/" className="brand sidebar-brand"><span className="brand-mark">BW</span> Better Wealth</Link><div className="admin-badge">Live internal operations</div><nav className="admin-nav" aria-label="Admin navigation"><Link href="/admin"><span>◈</span> Overview</Link><Link className="admin-active" href="/admin/support"><span>?</span> Support queue</Link></nav></aside><section className="admin-content"><header className="admin-header"><div><p className="eyebrow">Client care workspace</p><h1>Support requests.</h1></div><Link className="secondary-button" href="/admin">Back to administration</Link></header>{message && <p className="signin-message" role="status">{message}</p>}<section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Inbox</p><h2>{tickets.length} customer request{tickets.length === 1 ? "" : "s"}</h2></div></div><div className="admin-support-list">{tickets.map((ticket) => <article className="admin-support-ticket" key={ticket.id}><div className="support-ticket-meta"><span>{clientName(profiles.find((profile) => profile.id === ticket.client_id))}</span><em className={ticket.status === "resolved" || ticket.status === "closed" ? "status-approved" : "status-pending"}>{statusText(ticket.status)}</em></div><h3>{ticket.subject}</h3><small>{ticket.category} · {new Date(ticket.created_at).toLocaleString()}</small><p>{ticket.message}</p><form onSubmit={(event) => { event.preventDefault(); void updateTicket(ticket, event.currentTarget); }}><label>Status<select name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><label>Client update<textarea name="staffNote" defaultValue={ticket.staff_note ?? ""} placeholder="Visible to the customer in their portal" maxLength={2000} /></label><button className="button button-small" type="submit" disabled={busy === ticket.id}>{busy === ticket.id ? "Saving…" : "Save update"}</button></form></article>)}</div>{!tickets.length && !message && <p className="empty-copy">No support requests yet.</p>}</section></section></main>;
}
