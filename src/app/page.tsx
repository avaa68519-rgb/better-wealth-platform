import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CursorRipple } from "@/components/cursor-ripple";
import { MarketTicker } from "@/components/market-ticker";

const plans = [
  { name: "Foundation", minimum: "$250", label: "Balanced", description: "A straightforward starting point for investors building a diversified portfolio.", features: ["Stocks & ETFs", "Digital-asset access", "Portfolio reporting", "Client support"] },
  { name: "Growth", minimum: "$2,500", label: "Most popular", description: "A broader multi-asset allocation for investors seeking a more active portfolio experience.", features: ["Stocks, ETFs & indices", "Digital-asset access", "Enhanced reporting", "Priority support"] },
  { name: "Private", minimum: "$10,000", label: "Advanced", description: "A tailored relationship for larger portfolios and more complex investment requirements.", features: ["Multi-asset portfolio", "Digital assets & commodities", "Advanced reporting", "Priority account support"] },
];

const solutions = [
  ["01", "Public & private markets", "Explore a broader investment landscape across selected public and private opportunities."],
  ["02", "Portfolio intelligence", "Understand holdings, valuations, market context, and account activity in one private view."],
  ["03", "Client service", "Keep funding requests, verification, and support conversations clear at every stage."],
];

export default function Home() {
  return <main className="bw-home">
    <CursorRipple />
    <section className="bw-hero">
      <nav className="bw-nav" aria-label="Primary navigation"><Link href="/" className="brand"><BrandLogo inverse /></Link><div className="bw-nav-links"><a href="#solutions">Solutions</a><a href="#plans">Investment plans</a><a href="#markets">Markets</a></div><div className="bw-nav-actions"><Link href="/sign-in">Log in</Link><Link className="bw-create" href="/create-account">Create account</Link><span className="bw-menu">☰</span></div></nav>
      <div className="bw-hero-copy"><p>Better Wealth Investment Group</p><h1>Access a more<br />considered <em>investment future.</em></h1><span className="bw-rule" /><div className="bw-hero-actions"><Link className="bw-light-button" href="/create-account">Explore investments <b>→</b></Link><div><strong>Open an account in minutes</strong><small>Clear next steps, secure client access</small></div></div></div>
      <div className="bw-moon" aria-hidden="true"><i /><i /><i /></div>
      <div className="bw-building-foreground" aria-hidden="true"><i /><i /><i /></div>
      <div className="bw-hero-stats"><article><strong>4.5M+</strong><span>Client accounts</span></article><article><strong>145+</strong><span>Countries served</span></article><article><strong>$27.9B</strong><span>Assets managed</span></article><article><strong>Since 2010</strong><span>Founded October 2010</span></article></div>
    </section>
    <MarketTicker />
    <section id="solutions" className="bw-solutions"><header><p>Featured solutions</p><h2>Tools and opportunities<br /><em>built around your needs.</em></h2></header><div>{solutions.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><a href="#plans">Explore <b>→</b></a></article>)}</div></section>
    <section id="markets" className="bw-market-band"><div><p>Market perspective</p><h2>See the context<br />behind your capital.</h2><span className="bw-rule" /><p className="bw-market-copy">Follow selected market instruments and keep them alongside the holdings you care about most.</p><a href="#plans">View investment plans <b>→</b></a></div><div className="bw-market-visual"><span>MARKET<br />PERSPECTIVE</span><i /><i /><i /></div></section>
    <section className="bw-portal-section"><div className="bw-portal-copy"><p>Your client portfolio</p><h2>A private view of<br />what matters.</h2><p>Portfolio value, approved deposits, current holdings, and account requests are organised in one secure place.</p><Link href="/sign-in">Enter client portal <b>↗</b></Link></div><div className="bw-portfolio-card"><header><span>CLIENT PORTAL</span><b>Portfolio overview</b><i>Private client</i></header><div className="bw-portfolio-value"><small>Portfolio value</small><strong>$84,206.19</strong><span>▲ 4.80% <i>This month</i></span></div><div className="bw-portfolio-list"><p>Current holdings</p><span><i className="dot-one" />Global equity portfolio <b>$40,419.00</b></span><span><i className="dot-two" />Bitcoin <b>$26,104.00</b></span><span><i className="dot-three" />Gold spot <b>$17,683.19</b></span></div></div></section>
    <section id="plans" className="bw-plans"><header><p>Investment plans</p><h2>Choose a plan built around your goals.</h2><span>Pick a comfortable portfolio tier during sign-up. Your selected plan follows you into your Better Wealth dashboard.</span></header><div className="bw-plan-grid">{plans.map((plan, index) => <article className={index === 1 ? "bw-plan-featured" : ""} key={plan.name}><div><span>{plan.label}</span><small>0{index + 1}</small></div><h3>{plan.name}</h3><p>{plan.description}</p><section><small>Minimum</small><strong>{plan.minimum}</strong></section><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><a href="#contact">Choose {plan.name} <b>→</b></a></article>)}</div><small className="bw-plan-note">Plan suitability, fees, minimums, availability, and risk disclosures require approval before publication.</small></section>
    <section id="contact" className="bw-cta"><p>Begin your investment journey</p><h2>Ready to put your<br />capital to work?</h2><span>Open an account in minutes, or speak with Better Wealth about the next appropriate step.</span><div><Link href="/create-account">Create account <b>→</b></Link><a href="mailto:hello@betterwealth.example">Talk to an advisor</a></div></section>
    <footer className="bw-footer"><Link href="/" className="brand"><BrandLogo inverse /></Link><div><a href="#solutions">Solutions</a><a href="#markets">Markets</a><a href="#plans">Investment plans</a><Link href="/sign-in">Client portal</Link></div><p>© 2026 Better Wealth Investment Group.<br />Capital is at risk. This site is not investment advice.</p></footer>
  </main>;
}
