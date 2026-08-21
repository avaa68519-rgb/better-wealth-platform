"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VerificationPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading current status…");

  useEffect(() => { void (async () => { const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("profiles").select("identity_status").eq("id", user.id).single(); setStatus(data?.identity_status?.replace("_", " ") ?? "not started"); })(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const document = form.get("document") as File;
    const selfie = form.get("selfie") as File;
    if (!document?.size || !selfie?.size) { setMessage("Choose both a document and a clear selfie before submitting."); return; }
    if (document.size > 10_485_760 || selfie.size > 10_485_760) { setMessage("Each file must be 10 MB or smaller."); return; }
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Please sign in again."); setBusy(false); return; }
    const stamp = Date.now();
    const documentPath = `${user.id}/${stamp}-document-${document.name}`;
    const selfiePath = `${user.id}/${stamp}-selfie-${selfie.name}`;
    const [documentUpload, selfieUpload] = await Promise.all([
      supabase.storage.from("kyc-documents").upload(documentPath, document, { contentType: document.type, upsert: false }),
      supabase.storage.from("kyc-documents").upload(selfiePath, selfie, { contentType: selfie.type, upsert: false }),
    ]);
    if (documentUpload.error || selfieUpload.error) { setMessage((documentUpload.error ?? selfieUpload.error)?.message ?? "Secure upload failed."); setBusy(false); return; }
    const { error } = await supabase.from("identity_verifications").upsert({ client_id: user.id, document_type: form.get("documentType"), document_path: documentPath, selfie_path: selfiePath, status: "pending", submitted_at: new Date().toISOString() }, { onConflict: "client_id" });
    setBusy(false);
    if (error) { setMessage(error.message.includes("row-level security") ? "Your previous verification cannot be replaced yet. Please contact Better Wealth support, or apply the KYC resubmission update in Supabase." : error.message); return; }
    navigator.vibrate?.(25); setStatus("pending"); setMessage("Verification submitted securely. Withdrawals remain unavailable until a Better Wealth reviewer approves it.");
  }

  return <main className="signin-page"><Link href="/portal" className="brand"><span className="brand-mark">BW</span> Better Wealth</Link><section className="signin-card signup-card"><p className="eyebrow">Identity verification</p><h1>Verify your identity.</h1><p>Current status: <strong>{status}</strong></p><p>Submit a government-issued document and a clear selfie. Files are stored privately and can only be accessed by you and authorised Better Wealth reviewers.</p><form onSubmit={submit}><label>Document type<select name="documentType" defaultValue="passport"><option value="passport">Passport</option><option value="drivers_license">Driver’s licence</option><option value="national_id">National ID</option></select></label><label>Government-issued document<input name="document" type="file" accept="image/jpeg,image/png,application/pdf" required /></label><label>Selfie holding your document<input name="selfie" type="file" accept="image/jpeg,image/png" required /></label><p className="form-note">JPG, PNG, or PDF only. Maximum 10 MB per file. Do not send files by email.</p><button className="button" disabled={busy} type="submit">{busy ? "Uploading securely…" : "Submit for review"}<span>→</span></button></form>{message && <p className="signin-message" role="status">{message}</p>}<div className="signin-links"><Link href="/portal">Back to portal</Link><Link href="/portal/funding">Funding centre</Link></div></section></main>;
}
