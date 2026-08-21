"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setMessage("Sign-in will be enabled after the Better Wealth Supabase project is connected.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/portal";
    window.location.assign(safeNext);
  }

  return (
    <main className="signin-page">
      <Link href="/" className="brand"><span className="brand-mark">BW</span> Better Wealth</Link>
      <section className="signin-card">
        <p className="eyebrow">Client portal</p>
        <h1>Welcome back.</h1>
        <p>Sign in to view your portfolio, documents, and request activity.</p>
        <form onSubmit={handleSubmit}>
          <label>Email address<input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required placeholder="Your password" /></label>
          <button className="button" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}<span aria-hidden>→</span></button>
        </form>
        {message && <p className="signin-message" role="status">{message}</p>}
        <div className="signin-links"><Link href="/create-account">Create an account</Link><Link href="/">Back to website</Link></div>
      </section>
      <p className="signin-disclaimer">Capital is at risk. This portal does not provide investment advice.</p>
    </main>
  );
}
