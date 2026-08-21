"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CreateAccountPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setMessage("Account creation will be enabled after the Better Wealth Supabase project is connected.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 12) {
      setMessage("Choose a password with at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: String(formData.get("email") ?? ""),
      password,
      options: {
        data: {
          first_name: String(formData.get("firstName") ?? ""),
          last_name: String(formData.get("lastName") ?? ""),
          country_code: String(formData.get("country") ?? ""),
          investment_plan: String(formData.get("plan") ?? "Foundation"),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account, then return here to sign in.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/portal");
  }

  return (
    <main className="signin-page">
      <Link href="/" className="brand"><span className="brand-mark">BW</span> Better Wealth</Link>
      <section className="signin-card signup-card">
        <p className="eyebrow">Client portal</p>
        <h1>Create your account.</h1>
        <p>Set up secure access to the Better Wealth client portal. Identity verification is completed after sign-up.</p>
        <form onSubmit={handleSubmit}>
          <div className="signup-grid">
            <label>First name<input type="text" name="firstName" autoComplete="given-name" required /></label>
            <label>Last name<input type="text" name="lastName" autoComplete="family-name" required /></label>
          </div>
          <label>Email address<input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <div className="signup-grid">
            <label>Country of residence<select name="country" defaultValue="" required><option value="" disabled>Select country</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AU">Australia</option><option value="Other">Other</option></select></label>
            <label>Preferred plan<select name="plan" defaultValue="Foundation"><option>Foundation</option><option>Growth</option><option>Private</option></select></label>
          </div>
          <label>Password<input type="password" name="password" autoComplete="new-password" required minLength={12} placeholder="At least 12 characters" /></label>
          <label>Confirm password<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} placeholder="Re-enter your password" /></label>
          <label className="form-check"><input type="checkbox" required /> <span>I understand that investment value can go down as well as up, and I agree to the approved terms, privacy notice, and risk disclosure.</span></label>
          <button className="button" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account…" : "Create account"}<span aria-hidden>→</span></button>
        </form>
        {message && <p className="signin-message" role="status">{message}</p>}
        <div className="signin-links"><Link href="/sign-in">Already have an account? Sign in</Link><Link href="/">Back to website</Link></div>
      </section>
      <p className="signin-disclaimer">Capital is at risk. This portal does not provide investment advice.</p>
    </main>
  );
}
