import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AnimatedStat } from "@/components/animated-stat";
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

function PortfolioPreview() {
  return <div className="bw-portfolio-dashboard" aria-label="Illustrative Better Wealth portfolio dashboard">
    <header><span className="bw-dashboard-menu">☰</span><strong>My Portfolio <i>●</i></strong><div><span>◉</span><span>◌</span></div></header>
    <section className="bw-dashboard-summary"><p>Overall portfolio value <span>◉</span></p><strong>$84,206.19</strong><small>▲ $3,856.40 <b>(4.80%)</b> <i>All time</i></small></section>
    <section className="bw-dashboard-gain"><small>Today&apos;s gain</small><strong>+$1,248.22</strong><span>▲ 1.51%</span></section>
    <section className="bw-dashboard-performance"><header><strong>Portfolio performance</strong><small>All time⌄</small></header><svg viewBox="0 0 450 170" role="img" aria-label="Illustrative upward portfolio performance chart"><path d="M0 150 C22 140 35 148 55 130 S86 131 104 112 S133 120 154 94 S183 105 204 79 S230 90 251 66 S285 78 308 52 S337 63 360 38 S400 45 450 11" fill="none" stroke="currentColor" strokeWidth="4" /><path d="M0 150 C22 140 35 148 55 130 S86 131 104 112 S133 120 154 94 S183 105 204 79 S230 90 251 66 S285 78 308 52 S337 63 360 38 S400 45 450 11 V170 H0Z" fill="url(#performance-fill)" /><defs><linearGradient id="performance-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".35" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs></svg><footer><span>1D</span><span>1W</span><span>1M</span><span>6M</span><span>1Y</span><b>All</b></footer></section>
    <section className="bw-dashboard-allocation"><header><strong>Asset allocation</strong></header><div className="bw-allocation-ring" /><p><span className="allocation-crypto" />Crypto <b>45%</b></p><p><span className="allocation-equity" />Equities <b>30%</b></p><p><span className="allocation-gold" />Gold <b>15%</b></p><p><span className="allocation-silver" />Silver <b>10%</b></p></section>
    <section className="bw-dashboard-holdings"><header><strong>Holdings</strong><small>All assets⌄</small></header><div><span className="holding-icon holding-crypto">₿</span><p><b>Crypto</b><small>45.0% of portfolio</small></p><strong>$37,892</strong><em>+$5,629<br /><small>(17.45%)</small></em></div><div><span className="holding-icon holding-equity">⌁</span><p><b>Global equity</b><small>30.0% of portfolio</small></p><strong>$25,262</strong><em>+$2,410<br /><small>(10.55%)</small></em></div><div><span className="holding-icon holding-gold">◆</span><p><b>Gold</b><small>15.0% of portfolio</small></p><strong>$12,631</strong><em>+$801<br /><small>(6.77%)</small></em></div></section>
  </div>;
}

export default function Home() {
  return <main className="bw-home">
    <CursorRipple />
    <section className="bw-hero">
      <nav className="bw-nav" aria-label="Primary navigation"><Link href="/" className="brand"><BrandLogo inverse /></Link><div className="bw-nav-links"><a href="#solutions">Solutions</a><a href="#plans">Investment plans</a><a href="#markets">Markets</a></div><div className="bw-nav-actions"><Link href="/sign-in">Log in</Link><Link className="bw-create" href="/create-account">Create account</Link><span className="bw-menu">☰</span></div></nav>
      <div className="bw-hero-copy"><p>Better Wealth Investment Group</p><h1>Access a more<br />considered <em>investment future.</em></h1><span className="bw-rule" /><div className="bw-hero-actions"><Link className="bw-light-button" href="/create-account">Explore investments <b>→</b></Link><div><strong>Open an account in minutes</strong><small>Clear next steps, secure client access</small></div></div></div>
      <div className="bw-moon" aria-hidden="true"><i /><i /><i /></div>
      <div className="bw-horizon-foreground" aria-hidden="true" />
      <div className="bw-hero-stats"><article><strong><AnimatedStat value={4.5} decimals={1} suffix="M+" /></strong><span>Client accounts</span></article><article><strong><AnimatedStat value={145} suffix="+" /></strong><span>Countries served</span></article><article><strong><AnimatedStat value={27.9} prefix="$" decimals={1} suffix="B" /></strong><span>Assets managed</span></article><article><strong>Since 2010</strong><span>Founded October 2010</span></article></div>
    </section>
    <MarketTicker />
    <section id="solutions" className="bw-solutions"><header><p>Featured solutions</p><h2>Tools and opportunities<br /><em>built around your needs.</em></h2></header><div>{solutions.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><a href="#plans">Explore <b>→</b></a></article>)}</div></section>
    <section id="markets" className="bw-market-band"><div><p>Market perspective</p><h2>See the context<br />behind your capital.</h2><span className="bw-rule" /><p className="bw-market-copy">Follow selected market instruments and keep them alongside the holdings you care about most.</p><a href="#plans">View investment plans <b>→</b></a></div><div className="bw-market-visual"><span>MARKET<br />PERSPECTIVE</span><i /><i /><i /></div></section>
    <section className="bw-portal-section"><div className="bw-portal-copy"><p>Your client portfolio</p><h2>A private view of<br />what matters.</h2><p>Portfolio value, performance history, asset allocation, and current holdings come together in one secure client view.</p><Link href="/sign-in">Enter client portal <b>↗</b></Link></div><PortfolioPreview /></section>
    <section id="plans" className="bw-plans"><header><p>Investment plans</p><h2>Choose a plan built around your goals.</h2><span>Pick a comfortable portfolio tier during sign-up. Your selected plan follows you into your Better Wealth dashboard.</span></header><div className="bw-plan-grid">{plans.map((plan, index) => <article className={index === 1 ? "bw-plan-featured" : ""} key={plan.name}><div><span>{plan.label}</span><small>0{index + 1}</small></div><h3>{plan.name}</h3><p>{plan.description}</p><section><small>Minimum</small><strong>{plan.minimum}</strong></section><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><a href="#contact">Choose {plan.name} <b>→</b></a></article>)}</div><small className="bw-plan-note">Plan suitability, fees, minimums, availability, and risk disclosures require approval before publication.</small></section>
    <section id="contact" className="bw-cta"><p>Begin your investment journey</p><h2>Ready to put your<br />capital to work?</h2><span>Open an account in minutes, or speak with Better Wealth about the next appropriate step.</span><div><Link href="/create-account">Create account <b>→</b></Link><a href="mailto:hello@betterwealth.example">Talk to an advisor</a></div></section>
    <footer className="bw-footer"><Link href="/" className="brand"><BrandLogo inverse /></Link><div><a href="#solutions">Solutions</a><a href="#markets">Markets</a><a href="#plans">Investment plans</a><Link href="/sign-in">Client portal</Link></div><p>© 2026 Better Wealth Investment Group.<br />Capital is at risk. This site is not investment advice.</p></footer>
  </main>;
}
