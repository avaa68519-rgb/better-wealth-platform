import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const instruments = [
  ["Bitcoin", "BTC / USD", "$67,420.00", "+2.18%", "up"],
  ["Ethereum", "ETH / USD", "$3,512.00", "−0.64%", "down"],
  ["Gold spot", "XAU / USD", "$2,384.10", "+0.91%", "up"],
  ["S&P 500", "SPX", "5,612.40", "+0.44%", "up"],
  ["Oil (WTI)", "USD / BBL", "$78.62", "−1.15%", "down"],
];

const markets = [
  ["Equities", "Access a broad view of listed companies and diversified equity exposure.", "AAPL", "NVDA", "ASML"],
  ["Digital assets", "Track selected digital-asset markets alongside your wider portfolio.", "BTC", "ETH", "SOL"],
  ["Commodities", "Follow key hard-asset and energy benchmarks in one focused view.", "Gold", "Silver", "Oil"],
  ["Indices", "Understand market direction through major regional and sector benchmarks.", "S&P 500", "NASDAQ", "DAX"],
];

type Plan = {
  title: string;
  description: string;
  minimum: string;
  features: string[];
  featured: boolean;
};

const plans: Plan[] = [
  { title: "Foundation", description: "For clients getting started with a considered, diversified investment approach.", minimum: "$250", features: ["Client portal access", "Portfolio reporting", "Secure document centre", "Standard client support"], featured: false },
  { title: "Growth", description: "For clients seeking broader multi-asset exposure and richer reporting.", minimum: "$2,500", features: ["Everything in Foundation", "Broader market visibility", "Enhanced portfolio insights", "Priority client support"], featured: true },
  { title: "Private", description: "For larger portfolios that require a tailored relationship and reporting approach.", minimum: "$10,000", features: ["Everything in Growth", "Tailored reporting", "Dedicated relationship contact", "Priority review workflow"], featured: false },
];

const reviews = [
  ["‘The portal makes it easier to understand what I hold and what requires my attention.’", "M. Patel", "Private client"],
  ["‘The account process felt clear at every stage, from verification through to my first statement.’", "C. Morgan", "Client portal user"],
  ["‘I value seeing my requests, documents, and portfolio information in one secure place.’", "A. Rivera", "Client portal user"],
];

export default function Home() {
  return (
    <main className="marketing-page detailed-home">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link href="/" className="brand brand-home"><BrandLogo /></Link>
        <div className="nav-links"><a href="#markets">Markets</a><a href="#plans">Plans</a><a href="#approach">Why Better Wealth</a><a href="#reviews">Client perspectives</a></div>
        <Link href="/sign-in" className="button button-small">Client sign in <span aria-hidden>↗</span></Link>
      </nav>

      <section className="hero modern-hero">
        <div className="hero-copy"><p className="eyebrow">Better Wealth Investment Group</p><h1>See the bigger <em>picture.</em></h1><p className="hero-lede">A modern client experience for informed investing — with portfolio visibility, straightforward requests, and personal service in one secure place.</p><div className="hero-actions"><a className="button" href="#plans">Explore investment plans <span aria-hidden>→</span></a><a className="text-link" href="#markets">Explore market view <span aria-hidden>↗</span></a></div><div className="hero-trust"><span>◌ Secure client portal</span><span>◌ Multi-asset visibility</span><span>◌ Human review</span></div><p className="risk-note">Capital is at risk. Investment values can rise and fall.</p></div>
        <div className="hero-art modern-hero-art" aria-label="Illustrative portfolio interface"><div className="hero-glow" /><div className="hero-grid" /><div className="hero-dashboard"><div className="dashboard-top"><span>Portfolio value</span><i>Live overview</i></div><strong>$84,206<span>.19</span></strong><b>+4.80% <small>this month</small></b><div className="chart-lines"><i /><i /><i /><svg viewBox="0 0 330 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 95 C30 90 40 78 63 83 S105 58 130 69 S162 37 188 52 S229 45 245 31 S286 39 330 8" /></svg></div><div className="dashboard-assets"><span><i className="asset-dot one" />Global portfolio <b>48%</b></span><span><i className="asset-dot two" />Digital assets <b>31%</b></span><span><i className="asset-dot three" />Alternatives <b>21%</b></span></div></div><div className="floating-card"><span>Portfolio review</span><strong>On track</strong><small>Next review · 18 Sep</small></div><div className="art-caption"><span className="caption-dot" /> Designed for perspective</div></div>
      </section>

      <section className="market-tape" aria-label="Indicative market prices"><div className="tape-label"><span className="pulse-dot" /> Markets <small>Indicative prices</small></div>{instruments.map(([name, symbol, price, move, direction]) => <article className="tape-instrument" key={symbol}><div><strong>{name}</strong><small>{symbol}</small></div><div><b>{price}</b><span className={direction === "up" ? "up" : "down"}>{direction === "up" ? "▲" : "▼"} {move}</span></div></article>)}<p className="tape-disclaimer">Data connection pending</p></section>

      <section className="trust-strip"><div><strong>Clear account status</strong><span>See verification, documents, and request activity in one place.</span></div><div><strong>Manual review controls</strong><span>Funding requests remain visible through each review stage.</span></div><div><strong>Security-led design</strong><span>Built for a customer-owned, role-controlled platform.</span></div></section>

      <section id="markets" className="markets-section section-pad"><div className="section-heading"><div><p className="eyebrow">Markets</p><h2>One place to follow the instruments that matter.</h2></div><p>Build a clearer picture of portfolio context with selected instruments presented alongside your investments.</p></div><div className="market-grid">{markets.map(([title, description, ...tags], index) => <article className="market-card" key={title}><span className="market-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p><div className="market-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div><a href="#contact">Learn more <b>→</b></a></article>)}</div></section>

      <section id="plans" className="plans-section section-pad"><div className="section-heading centered"><div><p className="eyebrow">Investment plans</p><h2>Choose the service level that fits your goals.</h2><p>Plan details, minimums, eligibility, fees, and risk disclosures must be approved by Better Wealth Investment Group before publication.</p></div></div><div className="plan-grid">{plans.map((plan) => <article className={`plan-card ${plan.featured ? "plan-featured" : ""}`} key={plan.title}>{plan.featured && <span className="plan-label">Selected option</span>}<p className="plan-type">{plan.featured ? "Growth tier" : "Client tier"}</p><h3>{plan.title}</h3><p className="plan-description">{plan.description}</p><div className="minimum"><span>Indicative minimum</span><strong>{plan.minimum}</strong></div><ul>{plan.features.map(feature => <li key={feature}><span>✓</span>{feature}</li>)}</ul><a className={plan.featured ? "button" : "secondary-button plan-button"} href="#contact">Discuss this plan <b>→</b></a></article>)}</div></section>

      <section id="approach" className="approach-section"><div className="approach-visual"><div className="visual-label">Better Wealth<br /><span>client experience</span></div><div className="approach-lines" /><div className="approach-number">01</div></div><div className="approach-copy"><p className="eyebrow">Why Better Wealth</p><h2>Built around clarity, not unnecessary complexity.</h2><p>Every screen should give a client a useful next step: understand their portfolio, review a document, check a request, or speak with the team.</p><div className="feature-list"><div><span>01</span><h3>One connected view</h3><p>Portfolio information, documents, and activity presented in one portal.</p></div><div><span>02</span><h3>Transparent request status</h3><p>Clear stages for verification, deposit review, and withdrawals.</p></div><div><span>03</span><h3>Human operational review</h3><p>Important actions follow the approved Better Wealth process, with a record of decisions.</p></div></div></div></section>

      <section className="portal-preview section-pad"><div className="section-heading"><div><p className="eyebrow">Your client portal</p><h2>Important portfolio information, calmly organised.</h2></div><p>Designed for desktop and mobile access, with practical status information where clients need it.</p></div><div className="preview-window"><div className="preview-sidebar"><span className="brand-mark">BW</span><i /><i className="active" /><i /><i /><i /></div><div className="preview-main"><div className="preview-top"><div><span>Portfolio value</span><strong>$25,459.11</strong><b>↑ $1,243.60 this month</b></div><button>Manage funding →</button></div><div className="preview-columns"><div><p>Current holdings</p><div className="preview-row"><span className="preview-icon" />Balanced Growth <b>$12,840.00</b></div><div className="preview-row"><span className="preview-icon btc-dot" />Bitcoin <b>$8,492.31</b></div><div className="preview-row"><span className="preview-icon gold-dot" />Gold <b>$4,126.80</b></div></div><div className="preview-allocation"><p>Allocation</p><div className="mini-donut" /><span>Balanced across<br />selected assets</span></div></div></div></div></section>

      <section id="reviews" className="reviews-section section-pad"><div className="section-heading"><div><p className="eyebrow">Client perspectives</p><h2>Designed to earn confidence through clear communication.</h2></div><p className="review-disclaimer">Illustrative copy only. Replace with approved, genuine client feedback and required disclosures before launch.</p></div><div className="review-grid">{reviews.map(([quote, name, role]) => <article className="review-card" key={name}><span className="quote-mark">“</span><p>{quote}</p><div><span className="review-avatar">{name.charAt(0)}</span><span><strong>{name}</strong><small>{role}</small></span></div></article>)}</div></section>

      <section className="story-section"><div><p className="eyebrow">Our story</p><h2>Wealth management should feel understandable.</h2></div><div className="story-body"><p>Better Wealth Investment Group will bring portfolio information, key client tasks, and an experienced operational process into one considered digital experience.</p><p>Before launch, this section will be completed with the company’s approved history, team, regulated status, service proposition, and legal disclosures.</p><div className="story-values"><span><b>Clear</b> information</span><span><b>Thoughtful</b> process</span><span><b>Long-term</b> focus</span></div></div></section>

      <section id="contact" className="contact-panel"><p className="eyebrow">Better Wealth Investment Group</p><h2>Ready for a more considered investment experience?</h2><p>Speak with the Better Wealth team about the appropriate next step for you.</p><div><a href="mailto:hello@betterwealth.example" className="button button-light">Contact Better Wealth <span aria-hidden>→</span></a><Link href="/sign-in" className="footer-signin">Client sign in</Link></div></section>

      <footer className="site-footer"><div className="footer-brand"><Link href="/" className="brand brand-home"><BrandLogo inverse /></Link><p>Better Wealth Investment Group. A clear and considered client investment experience.</p><small>Capital is at risk. This site is not investment advice.</small></div><div><h3>Platform</h3><a href="#markets">Markets</a><a href="#plans">Investment plans</a><Link href="/sign-in">Client portal</Link><a href="#approach">Security approach</a></div><div><h3>Company</h3><a href="#approach">About Better Wealth</a><a href="#reviews">Client perspectives</a><a href="#contact">Contact</a></div><div><h3>Legal</h3><a href="#contact">Terms of use</a><a href="#contact">Privacy policy</a><a href="#contact">Risk disclosure</a><a href="#contact">Cookie policy</a></div><div className="footer-bottom">© 2026 Better Wealth Investment Group. All rights reserved.<span>Draft site — subject to legal and compliance approval.</span></div></footer>
    </main>
  );
}
