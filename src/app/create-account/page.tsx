"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";

const countries = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"], ["AO", "Angola"], ["AG", "Antigua and Barbuda"], ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"], ["AT", "Austria"], ["AZ", "Azerbaijan"],
  ["BS", "Bahamas"], ["BH", "Bahrain"], ["BD", "Bangladesh"], ["BB", "Barbados"], ["BY", "Belarus"], ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"], ["BT", "Bhutan"], ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"], ["BW", "Botswana"], ["BR", "Brazil"], ["BN", "Brunei"], ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"],
  ["CV", "Cabo Verde"], ["KH", "Cambodia"], ["CM", "Cameroon"], ["CA", "Canada"], ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"], ["CO", "Colombia"], ["KM", "Comoros"], ["CG", "Congo"], ["CD", "Congo, Democratic Republic of the"], ["CR", "Costa Rica"], ["CI", "Côte d’Ivoire"], ["HR", "Croatia"], ["CU", "Cuba"], ["CY", "Cyprus"], ["CZ", "Czechia"],
  ["DK", "Denmark"], ["DJ", "Djibouti"], ["DM", "Dominica"], ["DO", "Dominican Republic"],
  ["EC", "Ecuador"], ["EG", "Egypt"], ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"], ["ER", "Eritrea"], ["EE", "Estonia"], ["SZ", "Eswatini"], ["ET", "Ethiopia"],
  ["FJ", "Fiji"], ["FI", "Finland"], ["FR", "France"],
  ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"], ["DE", "Germany"], ["GH", "Ghana"], ["GR", "Greece"], ["GD", "Grenada"], ["GT", "Guatemala"], ["GN", "Guinea"], ["GW", "Guinea-Bissau"], ["GY", "Guyana"],
  ["HT", "Haiti"], ["HN", "Honduras"], ["HU", "Hungary"],
  ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"], ["IR", "Iran"], ["IQ", "Iraq"], ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"],
  ["JM", "Jamaica"], ["JP", "Japan"], ["JO", "Jordan"],
  ["KZ", "Kazakhstan"], ["KE", "Kenya"], ["KI", "Kiribati"], ["KP", "Korea, North"], ["KR", "Korea, South"], ["KW", "Kuwait"], ["KG", "Kyrgyzstan"],
  ["LA", "Laos"], ["LV", "Latvia"], ["LB", "Lebanon"], ["LS", "Lesotho"], ["LR", "Liberia"], ["LY", "Libya"], ["LI", "Liechtenstein"], ["LT", "Lithuania"], ["LU", "Luxembourg"],
  ["MG", "Madagascar"], ["MW", "Malawi"], ["MY", "Malaysia"], ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"], ["MH", "Marshall Islands"], ["MR", "Mauritania"], ["MU", "Mauritius"], ["MX", "Mexico"], ["FM", "Micronesia"], ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"], ["ME", "Montenegro"], ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"],
  ["NA", "Namibia"], ["NR", "Nauru"], ["NP", "Nepal"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NI", "Nicaragua"], ["NE", "Niger"], ["NG", "Nigeria"], ["MK", "North Macedonia"], ["NO", "Norway"],
  ["OM", "Oman"],
  ["PK", "Pakistan"], ["PW", "Palau"], ["PS", "Palestine"], ["PA", "Panama"], ["PG", "Papua New Guinea"], ["PY", "Paraguay"], ["PE", "Peru"], ["PH", "Philippines"], ["PL", "Poland"], ["PT", "Portugal"],
  ["QA", "Qatar"],
  ["RO", "Romania"], ["RU", "Russia"], ["RW", "Rwanda"],
  ["KN", "Saint Kitts and Nevis"], ["LC", "Saint Lucia"], ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"], ["SM", "San Marino"], ["ST", "São Tomé and Príncipe"], ["SA", "Saudi Arabia"], ["SN", "Senegal"], ["RS", "Serbia"], ["SC", "Seychelles"], ["SL", "Sierra Leone"], ["SG", "Singapore"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["SB", "Solomon Islands"], ["SO", "Somalia"], ["ZA", "South Africa"], ["SS", "South Sudan"], ["ES", "Spain"], ["LK", "Sri Lanka"], ["SD", "Sudan"], ["SR", "Suriname"], ["SE", "Sweden"], ["CH", "Switzerland"], ["SY", "Syria"],
  ["TW", "Taiwan"], ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TL", "Timor-Leste"], ["TG", "Togo"], ["TO", "Tonga"], ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"], ["TR", "Türkiye"], ["TM", "Turkmenistan"], ["TV", "Tuvalu"],
  ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"], ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"],
  ["VU", "Vanuatu"], ["VA", "Vatican City"], ["VE", "Venezuela"], ["VN", "Vietnam"],
  ["YE", "Yemen"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
] as const;

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

    // This message is separate from Supabase's email-verification email.
    void fetch("/api/transactional-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "registration_confirmation", clientId: data.user?.id }),
    });

    if (!data.session) {
      setMessage("Check your email to confirm your account, then return here to sign in.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/portal");
  }

  return (
    <main className="signin-page">
      <Link href="/" className="brand auth-brand"><BrandLogo /></Link>
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
            <label>Country of residence<select name="country" defaultValue="" required><option value="" disabled>Select country</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
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
