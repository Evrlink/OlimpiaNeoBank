type PhoneMockupProps = {
  variant?: "default" | "hero" | "spend" | "transactions" | "grow";
  size?: "default" | "hero";
};

export function PhoneMockup({ variant = "default", size = "default" }: PhoneMockupProps) {
  const phoneClass = size === "hero" ? "phone phone--hero" : "phone";

  if (variant === "hero") {
    return (
      <div
        className={`${phoneClass} phone--hero-v1`}
        role="img"
        aria-label="Olimpia app preview showing balance, savings goal, and recent activity"
      >
        <div className="phone-v1-shell">
          <div className="phone-v1-notch" aria-hidden="true" />
          <div className="phone-screen phone-screen--hero-v1">
            <div className="phone-v1-topbar">
              <p className="phone-hero-greeting">Hi, Sarah ☀️</p>
              <span className="phone-v1-profile" aria-hidden="true">
                S
              </span>
            </div>

            <div className="phone-balance phone-balance--hero">
              <span className="phone-amount">$4,280.00</span>
              <span className="phone-balance-change">+ $280.00 (6.9%) this month</span>
            </div>

            <div className="phone-quick-actions">
              {[
                { label: "Send", icon: "M12 19V5M5 12l7-7 7 7" },
                { label: "Add Money", icon: "M12 5v14M5 12h14" },
                { label: "Swap", icon: "M7 16V4M7 4l-3 3M7 4l3 3M17 8v12M17 20l3-3M17 20l-3-3" },
                { label: "More", icon: "M5 12h.01M12 12h.01M19 12h.01" },
              ].map((action) => (
                <div key={action.label} className="phone-quick-action-item">
                  <span className="phone-quick-action-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d={action.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="phone-quick-action-label">{action.label}</span>
                </div>
              ))}
            </div>

            <div className="phone-card phone-card--goal">
              <div className="phone-goal-row">
                <div className="phone-goal-thumb" aria-hidden="true" />
                <div className="phone-goal-info">
                  <div className="phone-goal-title">Europe Trip ✈️</div>
                  <div className="phone-goal-meta">$2,250 of $5,000</div>
                  <div className="progress-track">
                    <div className="progress-fill progress-fill--pink" style={{ width: "45%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="phone-recent">
              <span className="phone-label">Recent Activity</span>
              <ul className="phone-recent-list">
                {[
                  { name: "Coffee Shop", amount: "−$5.45", tone: "coffee" },
                  { name: "Salary", amount: "+$2,500.00", tone: "salary", positive: true },
                  { name: "Target", amount: "−$83.21", tone: "shop" },
                ].map((item) => (
                  <li key={item.name}>
                    <span className="phone-recent-left">
                      <span className={`phone-recent-icon phone-recent-icon--${item.tone}`} />
                      {item.name}
                    </span>
                    <span className={item.positive ? "phone-recent-pos" : undefined}>
                      {item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <nav className="phone-v1-nav" aria-hidden="true">
              <span className="phone-v1-nav-item phone-v1-nav-item--active">⌂</span>
              <span className="phone-v1-nav-item">◎</span>
              <span className="phone-v1-nav-item">▢</span>
              <span className="phone-v1-nav-item">◉</span>
              <span className="phone-v1-nav-item">☰</span>
            </nav>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "transactions") {
    return (
      <div
        className={phoneClass}
        role="img"
        aria-label="Olimpia app preview showing recent account activity and transactions"
      >
        <PhoneChrome />
        <div className="phone-screen phone-screen--transactions">
          <h3 className="phone-screen-title">Activity</h3>
          <ul className="phone-activity-list">
            <li className="phone-activity-item">
              <div className="phone-activity-meta">
                <span className="phone-activity-label">Girls Trip Fund</span>
                <span className="phone-activity-date">Today</span>
              </div>
              <span className="phone-activity-amount phone-activity-amount--positive">
                +$50.00
              </span>
            </li>
            <li className="phone-activity-item">
              <div className="phone-activity-meta">
                <span className="phone-activity-label">Coffee Shop</span>
                <span className="phone-activity-date">Yesterday</span>
              </div>
              <span className="phone-activity-amount">−$4.50</span>
            </li>
            <li className="phone-activity-item">
              <div className="phone-activity-meta">
                <span className="phone-activity-label">Yield earned</span>
                <span className="phone-activity-date">Mar 12</span>
              </div>
              <span className="phone-activity-amount phone-activity-amount--positive">
                +$2.18
              </span>
            </li>
            <li className="phone-activity-item">
              <div className="phone-activity-meta">
                <span className="phone-activity-label">Bank transfer in</span>
                <span className="phone-activity-date">Mar 10</span>
              </div>
              <span className="phone-activity-amount phone-activity-amount--positive">
                +$300.00
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (variant === "grow") {
    return (
      <div
        className={phoneClass}
        role="img"
        aria-label="Olimpia app preview showing savings growth options with estimated earnings"
      >
        <PhoneChrome />
        <div className="phone-screen phone-screen--grow">
          <h3 className="phone-screen-title">Grow</h3>
          <ul className="phone-grow-list">
            <li className="phone-grow-item">
              <div className="phone-grow-meta">
                <span className="phone-grow-label">Your savings</span>
                <span className="phone-grow-sub">USDC · ~4.2% est.</span>
              </div>
              <span className="phone-grow-value">$2,840.00</span>
            </li>
            <li className="phone-grow-item">
              <div className="phone-grow-meta">
                <span className="phone-grow-label">Emergency Fund</span>
                <span className="phone-grow-sub">Earning · +$8.12 this month</span>
              </div>
              <span className="phone-grow-value phone-grow-value--positive">
                $1,200.00
              </span>
            </li>
            <li className="phone-grow-item">
              <div className="phone-grow-meta">
                <span className="phone-grow-label">Girls Trip Fund</span>
                <span className="phone-grow-sub">Earning · +$4.27 this month</span>
              </div>
              <span className="phone-grow-value phone-grow-value--positive">
                $1,800.00
              </span>
            </li>
            <li className="phone-grow-item">
              <div className="phone-grow-meta">
                <span className="phone-grow-label">Goal earnings</span>
                <span className="phone-grow-sub">Estimated · variable</span>
              </div>
              <span className="phone-grow-value phone-grow-value--positive">
                +$12.39
              </span>
            </li>
          </ul>
          <nav className="phone-bottom-nav" aria-hidden="true">
            <span className="phone-nav-item">Wallet</span>
            <span className="phone-nav-item">Payments</span>
            <span className="phone-nav-item phone-nav-item--active">Grow</span>
          </nav>
        </div>
      </div>
    );
  }

  if (variant === "spend") {
    return (
      <div
        className={phoneClass}
        role="img"
        aria-label="Olimpia app preview showing available balance, virtual debit card, and recent transactions"
      >
        <PhoneChrome />
        <div className="phone-screen phone-screen--spend">
          <div className="phone-balance">
            <span className="phone-label">Available balance</span>
            <span className="phone-amount">$1,000.00</span>
          </div>
          <div className="phone-debit-card" aria-hidden="true">
            <div className="debit-card-top">
              <span className="debit-card-brand">Olimpia</span>
              <span className="debit-card-chip" />
            </div>
            <span className="debit-card-number">•••• 4821</span>
            <div className="debit-card-bottom">
              <span className="debit-card-holder">Sarah M.</span>
              <span className="debit-card-network">VISA</span>
            </div>
          </div>
          <div className="phone-txn-section">
            <span className="phone-label">Recent activity</span>
            <ul className="phone-txn-list">
              <li className="phone-txn-item">
                <span className="phone-txn-merchant">Sweetgreen</span>
                <span className="phone-txn-amount">−$14.50</span>
              </li>
              <li className="phone-txn-item">
                <span className="phone-txn-merchant">Uber</span>
                <span className="phone-txn-amount">−$22.80</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={phoneClass}
      role="img"
      aria-label="Olimpia app preview showing balance, growth account, savings goal, and quick actions"
    >
      <PhoneChrome />
      <div className="phone-screen">
        <p className="phone-greeting">Good morning, Sarah</p>
        <p className="phone-headline">You&apos;re making progress.</p>
        <div className="phone-balance">
          <span className="phone-label">Total balance</span>
          <span className="phone-amount">$4,280.00</span>
        </div>
        <div className="phone-card">
          <div className="goal-row">
            <span>Girls Trip Fund</span>
            <span className="goal-pct">72%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "72%" }} />
          </div>
          <span className="goal-meta">$1,800 of $2,500</span>
        </div>
        <div className="phone-card">
          <span className="phone-label">Growth Account</span>
          <span className="growth-amount">+$12.48 this month</span>
          <span className="goal-meta">Estimated earnings · variable</span>
        </div>
        <div className="phone-actions">
          <span className="action-pill primary">Add Money</span>
          <span className="action-pill">Send</span>
          <span className="action-pill">Receive</span>
        </div>
      </div>
    </div>
  );
}

function PhoneChrome() {
  return (
    <>
      <div className="phone-status" aria-hidden="true">
        <span className="phone-status-time">9:41</span>
        <span className="phone-status-notch" />
        <span className="phone-status-icons">●●●</span>
      </div>
      <div className="phone-appbar" aria-hidden="true">
        <span className="phone-menu">☰</span>
        <span className="phone-app-logo">Olimpia</span>
        <span className="phone-avatar">S</span>
      </div>
    </>
  );
}
