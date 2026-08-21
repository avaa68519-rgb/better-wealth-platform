import Link from "next/link";

const holdings = [
  ["Balanced Growth", "BWG", "$12,840.00", "+4.8%", "fund"],
  ["Bitcoin", "BTC", "$8,492.31", "+2.1%", "btc"],
  ["Gold", "XAU", "$4,126.80", "+0.6%", "gold"],
];

const activity = [
  ["Deposit request received", "Bitcoin · 0.120 BTC", "Under review", "Today, 10:24"],
  ["Statement available", "July 2026 portfolio summary", "Available", "August 1"],
  ["Identity verification", "Your account has been verified", "Complete", "July 22"],
];

export default function PortalOverview() {
  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <Link href="/" className="brand sidebar-brand"><span className="brand-mark">BW</span> Better Wealth</Link>
        <p className="sidebar-label">Client portal</p>
        <nav className="side-nav" aria-label="Portal navigation">
          <Link className="nav-active" href="/portal"><span>◈</span> Overview</Link>
          <a href="#portfolio"><span>◫</span> Portfolio</a>
<Link href="/portal/verification"><span>✓</span> Verification</Link><a href="#documents"><span>▤</span> Documents</a>
          <Link href="/portal/funding"><span>↗</span> Funding</Link>
          <Link href="/portal/support"><span>?</span> Support</Link>
        </nav>
        <div className="sidebar-footer"><span className="avatar">JS</span><div><strong>Jordan Smith</strong><small>Client account</small></div></div>
      </aside>

      <section className="portal-content">
        <header className="portal-header"><div><p className="eyebrow">Tuesday, 21 August</p><h1>Good morning, Jordan.</h1></div><button className="notification" aria-label="Notifications">●<span /></button></header>
        <div className="notice"><span className="notice-symbol">i</span><div><strong>One item needs your attention</strong><p>Your Bitcoin deposit request is under review. We will notify you once it has been reconciled.</p></div><Link href="/portal/funding">View request →</Link></div>

        <section className="balance-section"><div><p className="metric-label">Portfolio value</p><h2>$25,459.11</h2><p className="positive">↑ $1,243.60 <span>this month</span></p></div><div className="balance-actions"><Link href="/portal/funding" className="button">Manage funding <span aria-hidden>→</span></Link><button className="secondary-button">View statement</button></div></section>

        <section className="stat-grid"><article><p>Net contributions</p><strong>$22,100.00</strong><span>Since account opening</span></article><article><p>Portfolio return</p><strong className="positive">+15.20%</strong><span>All time</span></article><article><p>Investment plan</p><strong>Balanced</strong><span>Active since July 2026</span></article></section>

        <section id="portfolio" className="portal-grid">
          <article className="panel holdings-panel"><div className="panel-heading"><div><p className="eyebrow">Your portfolio</p><h2>Current holdings</h2></div><a href="#portfolio">Full portfolio →</a></div><div className="holding-list">{holdings.map(([name, symbol, value, change, style]) => <div className="holding" key={symbol}><span className={`asset-icon ${style}`}>{symbol.slice(0, 1)}</span><div><strong>{name}</strong><small>{symbol}</small></div><div className="holding-value"><strong>{value}</strong><span className="positive">{change}</span></div></div>)}</div></article>
          <article className="panel allocation-panel"><div className="panel-heading"><div><p className="eyebrow">Allocation</p><h2>By asset class</h2></div></div><div className="donut-wrap"><div className="donut"><span><strong>3</strong><small>assets</small></span></div><ul className="allocation-key"><li><i className="key-one" /> Growth fund <b>50%</b></li><li><i className="key-two" /> Digital assets <b>33%</b></li><li><i className="key-three" /> Metals <b>17%</b></li></ul></div></article>
        </section>

        <section id="documents" className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Account activity</p><h2>Recent updates</h2></div><a href="#documents">View all →</a></div><div className="activity-list">{activity.map(([title, description, status, date]) => <div className="activity" key={title}><span className="activity-marker" /><div><strong>{title}</strong><p>{description}</p></div><span className={`status ${status === "Under review" ? "status-review" : ""}`}>{status}</span><time>{date}</time></div>)}</div></section>
      </section>
    </main>
  );
}
