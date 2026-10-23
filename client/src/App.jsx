import React, { useEffect, useState } from "react";

const BASE_URL = "https://vocidy.com";
const Plans = [
  {
    id: "free",
    name: "Free",
    price: "0",
    description: "For basic needs",
    features: [
      "Pdf exports",
      "save copy to google drive",
      "Mail invoice to client",
      "local storage",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "5",
    description: "For businesses that want to automate their invoicing",
    features: [
      "Everything in basic",
      "up to 40 recurring invoices per month",
      "50MB Cloud storage",
    ],
  },
];

function Icon({ name, size = 20 }) {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    data: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 21c0-4 3.5-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    card: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    receipt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    subscription: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M17.5 12a5.5 5.5 0 1 1-9.62-3.65"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 3v5l3-1.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    billing: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="6"
          width="14"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M3 10h14" stroke="currentColor" strokeWidth="2" />
        <path
          d="M18 15a3 3 0 1 0-1 2.24"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M20 13v2.5h-2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 5.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.5h-.1a1.7 1.7 0 0 0-1.5 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    menu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6h16M4 12h16M4 18h16"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    ),
    activity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12h4l3-8 4 16 3-8h4"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    trend: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="m4 16 6-6 4 4 6-7" stroke="currentColor" strokeWidth="2" />
        <path d="M15 7h5v5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M10 17l5-5-5-5M15 12H3M21 3v18"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  };

  return icons[name] || null;
}

function Sidebar({ page, setPage, open, setOpen, data }) {
  const navigation = [
    ["dashboard", "Dashboard"],
    ["subscription", "Subscription"],
    ["settings", "Settings"],
  ];

  if (data.subscription.plan.name !== "free") {
    navigation.splice(2, 0, ["billing", "Billing"]);
  }

  return (
    <>
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">MyApp</div>

          <button className="mobile-close" onClick={() => setOpen(false)}>
            <Icon name="close" size={22} />
          </button>
        </div>

        <nav className="navigation">
          {navigation.map(([key, label]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "nav-item-active" : ""}`}
              onClick={() => {
                setPage(key);
                setOpen(false);
              }}
            >
              <Icon name={key} size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <form
            action="http://localhost:5000/auth/logout"
            method="post"
            className="nav-item logout"
          >
            <Icon name="logout" size={19} />
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Header({ setOpen, data }) {
  return (
    <header className="header">
      <button className="mobile-menu" onClick={() => setOpen(true)}>
        <Icon name="menu" size={23} />
      </button>

      <div className="header-user">
        <div className="header-user-info">
          <strong>{data.name}</strong>
          <span>{data.email}</span>
        </div>

        <div className="avatar">
          <img width={40} src={data.picture} alt="profile picture" />
        </div>
      </div>
    </header>
  );
}

function DashboardPage({ data }) {
  const stats = [
    {
      title: "Recurring Invoices",
      value: data.recurringInvoice.count,
      description: ` ${data.recurringInvoice.sent} recurring invoice${data.recurringInvoice.sentCount > 1 ? "s" : ""} sent`,
      icon: "activity",
      color: "blue",
    },
    {
      title: "History",
      value: data.invoiceCount,
      description: "Total number of invoices generated",
      icon: "trend",
      color: "green",
    },
    {
      title: "Next Billing",
      value: "Oct 9",
      description: "2026",
      icon: "calendar",
      color: "orange",
    },
    {
      title: "Current Plan",
      value: data.subscription.plan.name,
      description: `$${data.subscription.plan.price} / month`,
      icon: "card",
      color: "purple",
    },
  ];

  const usage = data.subscription.usage ?? 0;
  const limit = data.subscription.plan.planFeatures.find(
    ({ feature }) => feature.name == "recurringLimit",
  ).value;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${data.name}`}
        description="Here's what's happening with your account."
      />

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.title}>
            <div className={`stat-icon ${stat.color}`}>
              <Icon name={stat.icon} size={20} />
            </div>

            <div className="stat-title">{stat.title}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-description">{stat.description}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Account usage</h2>
              <p>Your current monthly usage.</p>
            </div>

            <span className="badge badge-purple">
              {data.subscription.plan.name}
            </span>
          </div>

          <div className="usage-section">
            <div className="usage-label">
              <span>Recurring invoices</span>
              <span>
                {usage} / {limit}
              </span>
            </div>

            <div className="progress">
              <div
                className="progress-bar"
                style={{
                  width: `${(usage / limit) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SubscriptionPage({ subscription: sub }) {
  const [subscription, setSubscription] = useState(sub);
  const [message, setMessage] = useState();

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => {
      setMessage("");
    }, 2000);
  }

  async function cancelSubscription() {
    const res = await fetch(BASE_URL + "/api/cancel_subscription", {
      method: "post",
      credentials: "include",
    });
    if (!res.ok) {
      showMessage("something went wrong ");
    }
    const { subscription } = await res.json();
    setSubscription(subscription);
  }

  async function reactivate() {
    const res = await fetch(BASE_URL + "/api/reactivate-subscription", {
      method: "post",
      credentials: "include",
    });
    if (!res.ok) {
      showMessage("something went wrong ");
    }
    const { subscription } = await res.json();
    setSubscription(subscription);
  }

  function capitalizeInitial(str) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  return (
    <>
      <PageHeader
        title="Subscription"
        description="Manage your plan and subscription."
      ></PageHeader>
      {
        <div className="current-plan">
          <div>
            <span className="eyebrow">Current plan</span>
            <h2>{capitalizeInitial(subscription.plan.name)}</h2>
            <p style={{ marginBottom: "16px" }}>
              ${subscription.plan.price}/month{". "}
              {subscription.endDate && subscription.status == "CANCELING"
                ? "Ends on"
                : "Renews on"}{" "}
              {new Date(subscription.endDate).toDateString()}
            </p>

            {subscription.plan.name == "free" ? (
              <a
                style={{ textDecoration: "none" }}
                href="/subscribe?plan=pro"
                className="primary-button"
              >
                Upgrade
              </a>
            ) : subscription.status == "CANCELING" ? (
              <>
                <button onClick={reactivate} className="secondary-button">
                  Reactivate
                </button>
              </>
            ) : (
              <button
                className="danger-button cancel"
                onClick={cancelSubscription}
              >
                Cancel
              </button>
            )}
            <p>{message}</p>
          </div>
          <div>
            <span className="status-badge">
              {subscription.status == "CANCELING" ||
              subscription.status == "CANCELED"
                ? "canceled"
                : "active"}
            </span>
          </div>
        </div>
      }

      <h2 className="section-title">Available plans</h2>

      <div className="plans-grid">
        {Plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${
              plan.id === subscription?.plan.name ? "plan-card-current" : ""
            }`}
          >
            {plan.id === subscription.plan.name && (
              <span className="current-label">Current plan</span>
            )}
            <h3>{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>
            <div className="plan-price">
              <strong>${plan.price}</strong>

              {plan.price > 0 && <span>/month</span>}
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Icon name="check" size={17} />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              style={{
                width: "100%",
                textDecoration: "none",
                display: "inline-block",
              }}
              href={`/subscribe?plan=${plan.id}`}
              className={
                plan.id === subscription?.plan.name
                  ? "disabled-button"
                  : "primary-button full-width"
              }
              disabled={plan.id === subscription?.plan.name}
            >
              {plan.id === subscription?.plan.name
                ? "Current plan"
                : `Choose ${plan.name}`}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}

function BillingPage({ card, subscription, ledgerEntries }) {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Manage payment methods and view invoices."
      />

      <div className="billing-grid">
        <div className="card">
          <h2>Payment method</h2>

          <div className="payment-method">
            <div className="payment-icon">
              <Icon name="card" size={22} />
            </div>

            <div>
              <strong>
                {card.type ?? "-"} ending in {card.ending ?? "-"}
              </strong>
            </div>
          </div>

          <button
            className="text-button"
            onClick={() => alert("Mock payment method update")}
          >
            Update payment method
          </button>
        </div>

        <div className="card">
          <h2>Billing summary</h2>

          <div className="billing-summary">
            <div>
              <span>Current plan</span>
              <strong>{subscription.plan.name}</strong>
            </div>

            <div>
              <span>Monthly cost</span>
              <strong>${subscription.plan.price}</strong>
            </div>

            <div>
              <span>
                {subscription.status == "CANCELING"
                  ? "Ends on"
                  : "Next payment"}
              </span>
              <strong>{new Date(subscription.endDate).toDateString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card invoice-card">
        <div className="card-header">
          <div>
            <h2>Subscription history</h2>
            <p>Your previous payments and invoices.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {ledgerEntries.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.id}</strong>
                  </td>

                  <td>{new Date(invoice.createdAt).toDateString()}</td>

                  <td>{invoice.amount}</td>

                  <td>
                    <span className="paid-badge">{invoice.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingAc, setLoadingAc] = useState(false);
  const [msg, setMsg] = useState("");

  async function deleteAccount() {
    setLoadingAc(true);
    const res = await fetch(`${BASE_URL}/api/data`, {
      method: "delete",
    });
    if (!res.ok) {
      setMsg("Something went wrong, try again later");
      setLoadingAc(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
      />

      <div className="settings-container">
        <div className="card">
          <h2>Notifications</h2>

          <SettingRow
            title="Email notifications"
            description="Receive important account and subscription updates."
            checked={notifications}
            setChecked={setNotifications}
          />

          <SettingRow
            title="Marketing emails"
            description="Receive product news and special offers."
            checked={marketing}
            setChecked={setMarketing}
          />
        </div>

        <div className="card danger-card " style={{ position: "relative" }}>
          <h2>Danger zone</h2>

          <p className="card-description">
            Permanently delete your account and all associated data.
          </p>

          <button
            className="danger-button"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete account
          </button>
          {showDeleteModal && (
            <div
              style={{
                position: "absolute",
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid var(--border)",
                top: "70px",
                left: "50px",
              }}
            >
              <p style={{ marginBottom: "12px", fontSize: "14px" }}>
                Are you sure you want to delete your account?
              </p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  disabled={loadingAc}
                  onClick={deleteAccount}
                  className="danger-button"
                >
                  Delete account
                </button>
              </div>
              <p style={{ marginTp: "12px", fontSize: "12px" }}>{msg}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SettingRow({ title, description, checked, setChecked }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        className={`toggle ${checked ? "toggle-on" : ""}`}
        onClick={() => setChecked(!checked)}
        aria-label={`Toggle ${title}`}
      >
        <span />
      </button>
    </div>
  );
}

function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {children && <div>{children}</div>}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BASE_URL + "/api/dashboard/data", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <span class="loader"></span>;

  const pages = {
    dashboard: <DashboardPage setPage={setPage} data={data} />,
    subscription: <SubscriptionPage subscription={data.subscription} />,
    billing: (
      <BillingPage
        card={data.card}
        subscription={data.subscription}
        ledgerEntries={data.ledgerEntries}
      />
    ),
    settings: <SettingsPage />,
  };

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        data={data}
      />

      <div className="main">
        <Header setOpen={setSidebarOpen} data={data} />

        <main className="content">{pages[page]}</main>
      </div>
    </div>
  );
}

export default App;
