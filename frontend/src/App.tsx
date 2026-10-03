
import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "";

type Product = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
};

type User = { id: number; name: string; email: string };
type Order = {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  created_at: string;
};
type Inventory = {
  id: number;
  product_id: number;
  quantity: number;
  reserved_quantity: number;
  available: number;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

const navigation = [
  { label: "Overview", path: "/", icon: "◫", group: "CONSOLE" },
  { label: "Products", path: "/products", icon: "▦", group: "CONSOLE" },
  { label: "Users", path: "/users", icon: "♙", group: "CONSOLE" },
  { label: "Orders", path: "/orders", icon: "▤", group: "CONSOLE" },
  { label: "Inventory", path: "/inventory", icon: "▧", group: "CONSOLE" },
];

const learningLinks = [
  { label: "About the project", path: "/about", icon: "◎" },
  { label: "Learning paths", path: "/learn", icon: "⌘" },
  { label: "Documentation", path: "/docs", icon: "▣" },
  { label: "Architecture", path: "/docs/architecture", icon: "⌘" },
  { label: "Hands-on labs", path: "/labs", icon: "⌁" },
];

const docs = [
  {
    path: "/docs/getting-started",
    title: "Getting Started",
    category: "FOUNDATIONS",
    time: "10 min",
    description: "Prepare your environment and run the application locally.",
    level: "Beginner",
  },
  {
    path: "/docs/architecture",
    title: "System Architecture",
    category: "FOUNDATIONS",
    time: "12 min",
    description: "Understand the frontend, Go API, PostgreSQL, and telemetry flow.",
    level: "Beginner",
  },
  {
    path: "/docs/docker",
    title: "Docker & Compose",
    category: "PLATFORM",
    time: "20 min",
    description: "Explore containers, images, networks, volumes, and Compose.",
    level: "Beginner",
  },
  {
    path: "/docs/cicd",
    title: "CI/CD Pipeline",
    category: "DELIVERY",
    time: "20 min",
    description: "Follow tests, image builds, registry publishing, and deployment.",
    level: "Intermediate",
  },
  {
    path: "/docs/database",
    title: "PostgreSQL",
    category: "DATA",
    time: "18 min",
    description: "Study the schema, indexes, seeded data, and database queries.",
    level: "Intermediate",
  },
  {
    path: "/docs/observability",
    title: "Observability",
    category: "RELIABILITY",
    time: "25 min",
    description: "Follow traces, database spans, metrics, logs, and diagnosis.",
    level: "Intermediate",
  },
  {
    path: "/docs/troubleshooting",
    title: "Troubleshooting",
    category: "OPERATIONS",
    time: "15 min",
    description: "Use systematic checks to diagnose common application failures.",
    level: "All levels",
  },
  {
    path: "/docs/contributing",
    title: "Contributing",
    category: "COMMUNITY",
    time: "8 min",
    description: "Learn the repository workflow and contribute improvements.",
    level: "All levels",
  },
];

function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">D<span>.</span></span>
      <span className="brand-copy">
        <strong>DEVOPS<span>SHOP</span></strong>
        <small>By Saros-dev</small>
        <small>ENGINEERING PLAYGROUND</small>
      </span>
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");


  useEffect(() => {
    let active = true;
    const check = () => {
      fetch(`${API}/health`)
        .then((r) => {
          if (active) setApiStatus(r.ok ? "online" : "offline");
        })
        .catch(() => {
          if (active) setApiStatus("offline");
        });
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Brand />
        <div className="workspace-label">WORKSPACE / DEVOPS LAB</div>
        <div className="nav-section-label">APPLICATION</div>
        <nav className="navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "selected" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-section-label learn-label">EXPLORE & LEARN</div>
        <nav className="navigation">
          {learningLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/docs"}
              className={({ isActive }) => `nav-item ${isActive ? "selected" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="system-card">
          <div className="system-card-title">
            <span className={`status-dot ${apiStatus}`} />
            RUNTIME STATUS
          </div>
          <strong>{apiStatus === "online" ? "API reachable" : apiStatus === "offline" ? "API unavailable" : "Checking API…"}</strong>
          <p>{apiStatus === "offline" ? "Check the backend and API URL." : "Go · PostgreSQL · REST"}</p>
          <Link className="text-link" to="/docs/troubleshooting">Diagnose connection →</Link>
        </div>
        <div className="sidebar-footer">
          <div className="avatar">S</div>
          <div><strong>DevOps Playground</strong><small>Open-source learning lab</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            ☰
          </button>
          <div className="breadcrumbs">
            <span>DEVOPS SHOP</span><span className="crumb-separator">/</span>
            <strong>{location.pathname === "/" ? "Overview" : location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ")}</strong>
          </div>
          <div className="topbar-actions">
            <span className="environment"><span className="status-dot good" /> LOCAL LAB</span>
            <a className="github-link" href="https://github.com/saros-dev/devops-shop" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </header>
        <div className="page-content">{children}</div>
        <footer className="page-footer">
          <span>DEVOPS SHOP <b>///</b> OPEN ENGINEERING LAB</span>
          <span>BUILT TO EXPLORE. DESIGNED TO LEARN.</span>
        </footer>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}

function Button({ children, onClick, secondary = false }: {
  children: React.ReactNode; onClick?: () => void; secondary?: boolean;
}) {
  return <button className={`button ${secondary ? "button-secondary" : "button-primary"}`} onClick={onClick}>{children}</button>;
}

function useResource<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api<T[]>(path);
      setData(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await api<T[]>(path);

        if (!cancelled) {
          setData(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Request failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, error, reload };
}
function MetricCard({ label, value, note, icon }: {
  label: string; value: string; note: string; icon: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-note"><span className="metric-note-dot" />{note}</div>
    </div>
  );
}

function Dashboard() {
  const products = useResource<Product>("/api/products");
  const users = useResource<User>("/api/users");
  const orders = useResource<Order>("/api/orders");
  const inventory = useResource<Inventory>("/api/inventory");

  const totalRevenue = orders.data.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const failed = [products, users, orders, inventory].some((resource) => resource.error);

  return (
    <>
      <PageHeading eyebrow="ENGINEERING CONSOLE / 01" title="System overview" description="Explore the application, inspect its data, and learn how the stack works." action={<Button secondary onClick={() => [products.reload(), users.reload(), orders.reload(), inventory.reload()]}>↻ Refresh data</Button>} />
      {failed && <div className="alert-banner"><span>!</span><div><strong>Some API resources are unavailable</strong><p>Start the Go API and PostgreSQL, then refresh. Dashboard figures are live only when requests succeed.</p></div><Link to="/docs/troubleshooting" className="text-link">Troubleshoot →</Link></div>}
      <section className="welcome-banner">
        <div className="welcome-content">
          <div className="banner-kicker">OPEN-SOURCE / HANDS-ON ENGINEERING</div>
          <h2>Build it.<br /><span>Break it. Understand it.</span></h2>
          <p>A practical playground for DevOps, software delivery, databases, and observability. Learn by running real workflows and investigating real telemetry.</p>
          <div className="banner-actions"><Link to="/learn" className="button button-primary">Start learning <span>→</span></Link><Link to="/about" className="button button-ghost">Explore the project</Link></div>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-core">D<span>+</span></div>
          <div className="art-node node-one">CI / CD</div><div className="art-node node-two">OTEL</div><div className="art-node node-three">POSTGRES</div>
        </div>
        <div className="banner-index">LAB_001 / ENGINEERING SYSTEMS</div>
      </section>
      <div className="metrics-grid">
        <MetricCard label="PRODUCTS" value={products.loading ? "—" : products.error ? "N/A" : products.data.length.toLocaleString()} note="API-backed records" icon="▦" />
        <MetricCard label="USERS" value={users.loading ? "—" : users.error ? "N/A" : users.data.length.toLocaleString()} note="Registered users returned" icon="♙" />
        <MetricCard label="ORDERS" value={orders.loading ? "—" : orders.error ? "N/A" : orders.data.length.toLocaleString()} note="Orders returned by API" icon="▤" />
        <MetricCard label="ORDER VALUE" value={orders.error || orders.loading ? "—" : money(totalRevenue)} note="Sum of returned orders" icon="$" />
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">LEARNING ROADMAP</div><h3>Your engineering journey</h3></div><span className="panel-tag">NO KUBERNETES REQUIRED</span></div>
          {[
            ["01", "Application & APIs", "React · Go · REST", "/docs/getting-started"],
            ["02", "Containers & delivery", "Docker · GitLab CI/CD", "/docs/docker"],
            ["03", "Data & persistence", "PostgreSQL · SQL", "/docs/database"],
            ["04", "Observability & SRE", "OpenTelemetry · Prometheus", "/docs/observability"],
          ].map(([n, title, detail, path]) => <Link className="roadmap-row" to={path} key={n}><span className="roadmap-number">{n}</span><span className="roadmap-copy"><strong>{title}</strong><small>{detail}</small></span><span className="row-arrow">↗</span></Link>)}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">RUNTIME / API</div><h3>Service endpoints</h3></div><Link className="text-link" to="/docs/architecture">Architecture →</Link></div>
          {[
            ["REST API", "GET /api/products", "HTTP"],
            ["PostgreSQL", "User & commerce data", "SQL"],
            ["Metrics", "GET /metrics", "PROM"],
            ["Health check", "GET /health", "HTTP"],
          ].map(([title, detail, tag]) => <div className="service-row" key={title}><span className="service-symbol">⌘</span><div><strong>{title}</strong><small>{detail}</small></div><span className="panel-tag">{tag}</span></div>)}
          <p className="muted">Endpoint availability depends on your current backend implementation and configuration.</p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">EXPLORE / LEARN / BUILD</div><h3>Choose your next step</h3></div></div>
        <div className="feature-grid">
          <Link to="/docs" className="feature-card"><span>▣</span><strong>Read the docs</strong><p>Guides, architecture, commands, and troubleshooting.</p><small>EXPLORE DOCUMENTATION ↗</small></Link>
          <Link to="/labs" className="feature-card"><span>⌁</span><strong>Run a lab</strong><p>Investigate latency, HTTP failures, and database traces.</p><small>OPEN HANDS-ON LABS ↗</small></Link>
          <Link to="/about" className="feature-card"><span>◎</span><strong>Understand the project</strong><p>Learn why the project exists and how to contribute.</p><small>ABOUT THIS PROJECT ↗</small></Link>
        </div>
      </section>
    </>
  );
}

const sampleProducts: Product[] = [
  { id: 1, name: "MacBook Pro", category: "Laptops", description: "Professional development workstation.", price: 1999.99 },
  { id: 2, name: "Mechanical Keyboard", category: "Accessories", description: "A tactile keyboard for daily engineering.", price: 99.99 },
  { id: 3, name: "4K Monitor", category: "Monitors", description: "A high-resolution workspace display.", price: 499.99 },
];

function Catalog() {
  const { data, loading, error, reload } = useResource<Product>("/api/products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Record<number, { product: Product; quantity: number }>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const products = data.length ? data : sampleProducts;
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category || "Other")))];
  const filtered = useMemo(() => products.filter((p) =>
    `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase().includes(query.toLowerCase()) &&
    (category === "All" || (p.category || "Other") === category)
  ), [products, query, category]);
  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = Object.values(cart).reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function add(product: Product) {
    setCart((old) => ({ ...old, [product.id]: { product, quantity: (old[product.id]?.quantity || 0) + 1 } }));
    setNotice(`${product.name} added to demo cart.`);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function adjust(id: number, delta: number) {
    setCart((old) => {
      const next = { ...old };
      const quantity = (next[id]?.quantity || 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = { ...next[id], quantity };
      return next;
    });
  }

  return (
    <>
      <PageHeading eyebrow="COMMERCE / CATALOG" title="Product catalog" description="Explore products returned by the Go API and experiment with search, filters, and a local demo cart." action={<Button onClick={() => setCartOpen(true)}>Cart ({cartCount}) ↗</Button>} />
      {error && <div className="alert-banner"><span>!</span><div><strong>API unavailable — demo catalog shown</strong><p>{error}. Sample products are fallback data, not database records.</p></div><button onClick={() => reload()}>Retry</button></div>}
      {notice && <div className="toast" role="status">✓ {notice}</div>}
      <div className="filter-row">
        <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product name, category, or description…" /></label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter category">{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <Button secondary onClick={() => { setQuery(""); setCategory("All"); }}>Reset filters</Button>
      </div>
      <div className="catalog-summary"><span>{loading ? "Loading products…" : `${filtered.length} products`}</span><span>DEMO CART · FRONTEND ONLY</span></div>
      <div className="product-grid">
        {filtered.map((p, i) => <article className="product-card" key={p.id}>
          <div className={`product-visual visual-${i % 6}`}><span>{(p.category || "SHOP").slice(0, 3).toUpperCase()}</span><small>SKU-{String(p.id).padStart(5, "0")}</small></div>
          <div className="product-card-body"><div className="eyebrow">{p.category || "GENERAL"}</div><h3>{p.name}</h3><p>{p.description || "Product description not provided by the API."}</p><div className="product-card-bottom"><strong>{money(Number(p.price))}</strong><button className="add-button" onClick={() => add(p)} aria-label={`Add ${p.name} to demo cart`}>+</button></div></div>
        </article>)}
      </div>
      {!filtered.length && <div className="empty-state"><span>⌕</span><strong>No matching products</strong><p>Try a different query or reset the category filter.</p></div>}
      <p className="muted">The cart is client-side demo functionality. It does not reserve inventory, create orders, or process payments.</p>
      {cartOpen && <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer"><div className="drawer-heading"><div><div className="eyebrow">LOCAL STATE / DEMO</div><h2>Your cart <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>
          <div className="cart-lines">{Object.values(cart).map(({ product, quantity }) => <div className="cart-line" key={product.id}><div className="cart-product-mark">{product.name.slice(0, 2).toUpperCase()}</div><div className="cart-line-info"><strong>{product.name}</strong><small>{money(product.price)} each</small><div className="quantity-control"><button onClick={() => adjust(product.id, -1)} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => adjust(product.id, 1)} aria-label="Increase quantity">+</button></div></div><strong>{money(product.price * quantity)}</strong></div>)}
          {!cartCount && <div className="empty-state"><span>＋</span><strong>Your cart is empty</strong><p>Add a product to explore local cart interactions.</p></div>}</div>
          <div className="cart-summary"><div><span>Demo subtotal</span><strong>{money(cartTotal)}</strong></div><p>This demo does not submit a real order or charge a payment method.</p><button className="button button-primary full-width" disabled={!cartCount} onClick={() => setNotice("Demo checkout is not connected yet. No order was created.")}>Continue to demo checkout →</button><button className="text-button clear-cart" onClick={() => setCart({})}>Clear cart</button></div>
        </aside>
      </div>}
    </>
  );
}

function DataTable<T extends object>({ title, description, path, columns }: {
  title: string; description: string; path: string;
  columns: { label: string; render: (row: T) => React.ReactNode }[];
}) {
  const { data, loading, error, reload } = useResource<T>(path);
  return <>
    <PageHeading eyebrow="DATA EXPLORER / LIVE API" title={title} description={description} action={<Button secondary onClick={() => reload()}>↻ Refresh</Button>} />
    {error && <div className="alert-banner"><span>!</span><div><strong>Could not load {title.toLowerCase()}</strong><p>{error}. Check the backend and the endpoint implementation.</p></div><Link className="text-link" to="/docs/troubleshooting">Troubleshoot →</Link></div>}
    <section className="panel data-panel"><div className="panel-heading"><div><div className="eyebrow">API RESPONSE</div><h3>{loading ? "Loading…" : `${data.length.toLocaleString()} records returned`}</h3></div><span className="panel-tag">{path}</span></div>
      <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead><tbody>{data.map((row, i) => <tr key={String((row as Record<string, unknown>).id ?? i)}>{columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>
      {!loading && !error && data.length === 0 && <div className="empty-state"><span>▤</span><strong>No records returned</strong><p>The endpoint returned an empty result.</p></div>}
      <p className="muted">This table displays the API response as returned. No synthetic totals are presented as live database facts.</p>
    </section>
  </>;
}

function UsersPage() {
  return <DataTable<User> title="Users" description="Inspect user records from PostgreSQL through the Go API." path="/api/users" columns={[
    { label: "ID", render: (r) => <span className="mono">USR-{r.id}</span> },
    { label: "NAME", render: (r) => <strong>{r.name}</strong> },
    { label: "EMAIL", render: (r) => r.email },
  ]} />;
}
function OrdersPage() {
  return <DataTable<Order> title="Orders" description="Inspect the orders exposed by the current API." path="/api/orders" columns={[
    { label: "ORDER", render: (r) => <span className="mono">ORD-{r.id}</span> },
    { label: "USER ID", render: (r) => r.user_id },
    { label: "STATUS", render: (r) => <span className={`pill ${r.status === "delivered" ? "good" : r.status === "cancelled" ? "bad" : "pending"}`}>{r.status}</span> },
    { label: "TOTAL", render: (r) => <strong className="amount">{money(Number(r.total_amount))}</strong> },
    { label: "CREATED", render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : "—" },
  ]} />;
}
function InventoryPage() {
  return <DataTable<Inventory> title="Inventory" description="Review stock and reserved quantities, if the inventory endpoint is implemented." path="/api/inventory" columns={[
    { label: "RECORD", render: (r) => <span className="mono">INV-{r.id}</span> },
    { label: "PRODUCT ID", render: (r) => r.product_id },
    { label: "QUANTITY", render: (r) => r.quantity },
    { label: "RESERVED", render: (r) => r.reserved_quantity },
    { label: "AVAILABLE", render: (r) => <strong>{r.available ?? r.quantity - r.reserved_quantity}</strong> },
  ]} />;
}

function About() {
  return <>
    <PageHeading eyebrow="PROJECT / MISSION" title="Engineering in the open." description="A hands-on playground for learning how modern applications are built, delivered, and operated." />
    <section className="about-hero panel"><div className="eyebrow">WHY THIS PROJECT EXISTS</div><h2>Learn the system,<br /><span>not just the commands.</span></h2><p>DevOps Shop is an open-source learning project that connects application development with infrastructure, delivery automation, database engineering, and observability. It is designed to make the interactions between these systems visible and testable. © 2026 Saros Shojaei "saros-dev" · DevOps Shop · Open Source</p><div className="banner-actions"><Link className="button button-primary" to="/learn">Choose a learning path →</Link><a className="button button-secondary" href="https://github.com/saros-dev/devops-shop" target="_blank" rel="noreferrer">Explore source ↗</a></div></section>
    <div className="overview-grid">
      <section className="panel"><div className="eyebrow">THE APPROACH</div><h3>Built to be explored</h3><p className="body-copy">Rather than treating Docker, CI/CD, SQL, and telemetry as isolated tutorials, the project brings them together in one application. A change in the code can travel through tests, image builds, deployment, and runtime monitoring.</p></section>
      <section className="panel"><div className="eyebrow">WHO IT IS FOR</div><h3>Curious engineers</h3><p className="body-copy">Beginners can follow guided paths. More experienced engineers can inspect configurations, introduce failures, investigate traces, improve deployment practices, and contribute fixes.</p></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">PROJECT PRINCIPLES</div><h3>What matters here</h3></div></div><div className="feature-grid">{[
      ["01", "Reproducibility", "Commands and steps should be repeatable on a local lab."],
      ["02", "Observable systems", "Learn to verify behavior through evidence, not guesses."],
      ["03", "Real engineering", "Explore code, SQL, CI configuration, and runtime behavior."],
      ["04", "Honest documentation", "Clearly separate implemented features from planned work."],
    ].map(([n, t, d]) => <article className="feature-card" key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></article>)}</div></section>
    <section className="panel"><div className="eyebrow">CURRENT SCOPE</div><h3>What is in the lab?</h3><p className="body-copy">The current repository includes a React frontend, Go REST API, PostgreSQL integration, Docker-based development, GitLab CI/CD work, and OpenTelemetry/Prometheus/Tempo/Grafana configuration. Exact feature availability depends on the current code and deployment configuration. Kubernetes is intentionally outside the current learning sequence.</p><Link className="text-link" to="/docs/architecture">Read the architecture guide →</Link></section>
  </>;
}

const learningPaths = [
  { level: "01 / FOUNDATION", title: "Application fundamentals", description: "Understand the HTTP lifecycle, frontend/API boundary, REST routes, and PostgreSQL.", topics: ["React & TypeScript", "Go HTTP handlers", "REST & JSON", "SQL fundamentals"], docs: "/docs/getting-started" },
  { level: "02 / PLATFORM", title: "Containers & delivery", description: "Package the application and follow a commit from tests to deployment.", topics: ["Docker & Compose", "Git workflows", "GitLab Runner", "Container registry"], docs: "/docs/docker" },
  { level: "03 / DATA", title: "Database engineering", description: "Explore schema design, generated datasets, indexes, and query behavior.", topics: ["PostgreSQL schema", "Indexes & queries", "Transactions", "Data integrity"], docs: "/docs/database" },
  { level: "04 / RELIABILITY", title: "Observability & SRE", description: "Correlate HTTP requests and database spans to understand latency and failures.", topics: ["OpenTelemetry", "Distributed traces", "Prometheus metrics", "Incident diagnosis"], docs: "/docs/observability" },
];

function Learning() {
  return <>
    <PageHeading eyebrow="LEARNING CENTER / PATHS" title="Learn by building." description="Follow structured paths from application fundamentals to delivery, databases, and reliability." />
    <section className="welcome-banner learning-banner"><div className="welcome-content"><div className="banner-kicker">YOUR LAB / YOUR PACE</div><h2>From first request<br />to <span>root cause.</span></h2><p>Each path connects concepts to the actual files, commands, and services in this repository.</p><Link className="button button-primary" to="/docs/getting-started">Begin with the basics →</Link></div><div className="banner-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core">LAB<span>_</span></div></div></section>
    <div className="learning-grid">{learningPaths.map((p) => <article className="learning-card" key={p.title}><div className="eyebrow">{p.level}</div><h3>{p.title}</h3><p>{p.description}</p><div className="topic-list">{p.topics.map((t) => <span key={t}>{t}</span>)}</div><Link className="text-link" to={p.docs}>Open learning materials ↗</Link></article>)}</div>
    <section className="panel"><div className="eyebrow">HOW TO LEARN EFFECTIVELY</div><h3>Use a repeatable learning loop</h3><div className="steps-grid">{[["01", "Read", "Understand the concept and its role in the system."], ["02", "Run", "Execute the commands and observe the actual output."], ["03", "Investigate", "Inspect logs, traces, responses, and configuration."], ["04", "Verify", "Repeat the experiment and explain what changed."]].map(([n, t, d]) => <div className="step-card" key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></div>)}</div></section>
  </>;
}

function DocsIndex() {
  const [query, setQuery] = useState("");
  const visible = docs.filter((d) => `${d.title} ${d.description} ${d.category}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="KNOWLEDGE BASE / GUIDES" title="Documentation" description="A practical reference for running, understanding, troubleshooting, and improving DevOps Shop." />
    <label className="search-box docs-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation…" /></label>
    <div className="docs-grid">{visible.map((d, i) => <Link to={d.path} className="doc-card" key={d.path}><div className="doc-card-top"><span className="doc-index">{String(i + 1).padStart(2, "0")}</span><span className="doc-time">{d.time}</span></div><div className="eyebrow">{d.category}</div><h3>{d.title}</h3><p>{d.description}</p><div className="doc-card-bottom"><span>{d.level}</span><strong>Read guide ↗</strong></div></Link>)}</div>
    {!visible.length && <div className="empty-state"><strong>No matching guides</strong><p>Try another search term.</p></div>}
    <section className="panel contribution-callout"><div><div className="eyebrow">DOCUMENTATION IS PART OF THE PRODUCT</div><h3>Found a gap or an outdated step?</h3><p className="body-copy">Help keep the guides accurate by improving the documentation alongside the code.</p></div><a className="button button-secondary" href="https://github.com/saros-dev/devops-shop" target="_blank" rel="noreferrer">Contribute on GitHub ↗</a></section>
  </>;
}

const guides: Record<string, { title: string; category: string; intro: string; sections: { title: string; body: string; code?: string }[] }> = {
  "getting-started": {
    title: "Getting Started",
    category: "FOUNDATIONS / FIRST RUN",
    intro: "Start with the smallest reproducible setup. Confirm the application works before moving to automation or observability.",
    sections: [
      { title: "1. Prerequisites", body: "Install Git, Docker with Compose, Go, and Node.js/npm. PostgreSQL can run in Docker. Use the versions required by the repository's configuration and CI pipeline." },
      { title: "2. Get the source", body: "Clone the repository and inspect the project files before starting services.", code: "git clone https://github.com/saros-dev/devops-shop.git\ncd devops-shop\nls -la" },
      { title: "3. Inspect the configuration", body: "Review the README, Dockerfiles, Compose templates, environment variables, database initialization SQL, and CI pipeline. Never commit real passwords or tokens." },
      { title: "4. Verify the API", body: "When the backend is running, check the health endpoint and one data endpoint.", code: "curl -i http://localhost:8080/health\ncurl -i http://localhost:8080/api/products" },
      { title: "5. Start the frontend", body: "Use the frontend's package scripts to install dependencies and start Vite. Configure VITE_API_BASE_URL when the API is hosted at a different origin.", code: "cd frontend\nnpm install\nnpm run dev" },
    ],
  },
  architecture: {
    title: "System Architecture",
    category: "FOUNDATIONS / DESIGN",
    intro: "Follow the request path from the browser to the API, database, and telemetry backends.",
    sections: [
      { title: "Request path", body: "The React frontend makes HTTP requests to the Go API. The API validates input, executes application logic, and queries PostgreSQL. The API response returns to the browser." },
      { title: "Application data flow", body: "The frontend should not connect directly to PostgreSQL. Database credentials and query execution belong on the backend.", code: "Browser / React\n      │ HTTP\n      ▼\n    Go API\n      │ SQL (pgx)\n      ▼\n PostgreSQL" },
      { title: "Telemetry flow", body: "The Go service can emit traces to an OpenTelemetry Collector. Configured exporters can send traces to Tempo or other backends. Prometheus scrapes configured metrics endpoints, while Grafana visualizes configured data sources.", code: "Go API ── traces ──> OTel Collector ──> Tempo\n   │                                      │\n   └── /metrics ──> Prometheus ─────────> Grafana" },
      { title: "What to verify", body: "Check the Compose service names, ports, environment variables, telemetry exporter endpoint, Collector receivers/exporters, and Grafana data-source URLs. A configuration file alone does not prove that a service is running." },
    ],
  },
  docker: {
    title: "Docker & Compose",
    category: "PLATFORM / CONTAINERS",
    intro: "Use containers to make the application stack easier to reproduce and operate.",
    sections: [
      { title: "Images and containers", body: "An image is a packaged template; a container is a running instance. Inspect the Dockerfiles to understand build stages, dependencies, and runtime configuration.", code: "docker images\ndocker ps\ndocker ps -a" },
      { title: "Compose lifecycle", body: "Compose describes related services, networks, volumes, and configuration. Run these commands from the directory containing the applicable Compose file.", code: "docker compose config\ndocker compose up -d --build\ndocker compose ps\ndocker compose logs --tail=100" },
      { title: "Networking", body: "Containers in the same Compose network usually reach each other by service name. localhost inside a container refers to that container, not another service or the host." },
      { title: "Volumes and safety", body: "Volumes preserve state, especially database files. The command docker compose down -v removes declared volumes and can destroy local data; do not run it unless you intend to reset that data." },
    ],
  },
  cicd: {
    title: "CI/CD Pipeline",
    category: "DELIVERY / AUTOMATION",
    intro: "Trace how source changes become tested artifacts and deployed services.",
    sections: [
      { title: "Pipeline stages", body: "A typical pipeline validates code, runs tests, builds container images, publishes tagged images to a registry, and deploys a specific immutable version." },
      { title: "Runner and registry", body: "The GitLab Runner executes configured jobs. The registry stores images. Keep credentials in protected CI/CD variables and use least-privilege access." },
      { title: "Deployment discipline", body: "Prefer explicit image tags such as a commit SHA. Review deployment logs, verify the running container version, and test health endpoints after deployment." },
      { title: "Verify the pipeline", body: "Read the actual .gitlab-ci.yml and deployment playbook before assuming a stage exists. The guide should reflect the current pipeline, not an aspirational diagram." },
    ],
  },
  database: {
    title: "PostgreSQL & Data",
    category: "DATA / PERSISTENCE",
    intro: "Learn how relational schema design, indexes, and query behavior affect the application.",
    sections: [
      { title: "Schema and relationships", body: "Inspect primary keys, foreign keys, uniqueness constraints, nullability, and check constraints in the initialization SQL. These rules protect data integrity." },
      { title: "Seed data", body: "Generated sample data makes it possible to explore realistic query patterns without external services. Confirm row counts in PostgreSQL rather than assuming initialization succeeded.", code: "SELECT COUNT(*) FROM users;\nSELECT COUNT(*) FROM products;\nSELECT COUNT(*) FROM orders;" },
      { title: "Query plans", body: "Use EXPLAIN to inspect the planned execution strategy. EXPLAIN ANALYZE actually runs the query, so use care with expensive statements and data-changing queries.", code: "EXPLAIN SELECT id, name FROM products WHERE category = 'Laptops';" },
      { title: "Tracing database calls", body: "A PostgreSQL span may expose operation name, server, database, duration, and query attributes depending on instrumentation and configuration. Treat query text as potentially sensitive and avoid capturing secrets." },
    ],
  },
  observability: {
    title: "Observability & SRE",
    category: "RELIABILITY / TELEMETRY",
    intro: "Move from noticing that a request is slow to finding which operation consumed the time.",
    sections: [
      { title: "Metrics, logs, and traces", body: "Metrics summarize behavior over time, logs record discrete events, and traces connect work across a request. They answer different questions and work best when correlated." },
      { title: "Follow an HTTP trace", body: "Generate a request, find its trace, inspect the server span, and compare child spans. Confirm that the API and database spans share the same trace ID before assuming the request is fully instrumented." },
      { title: "Investigate database latency", body: "Compare the HTTP duration with child database spans. A slow request with a long SQL span suggests database work may contribute; a short SQL span points you toward other code or downstream dependencies." },
      { title: "Metrics", body: "Prometheus can scrape /metrics and the Collector's span-metrics endpoint when configured. Check the actual scrape targets and metric names before writing queries." },
      { title: "Failure lab", body: "The /api/slow and /api/error routes are intended as controlled test endpoints in this project. Verify the current handlers before using them. Do not expose intentional failure endpoints publicly." },
    ],
  },
  troubleshooting: {
    title: "Troubleshooting",
    category: "OPERATIONS / DIAGNOSIS",
    intro: "Diagnose from the outside in. Check the failing boundary before changing unrelated components.",
    sections: [
      { title: "API unavailable", body: "Confirm the process/container is running, inspect logs, verify port mapping, and request the health endpoint.", code: "docker compose ps\ndocker compose logs --tail=100 api\ncurl -i http://localhost:8080/health" },
      { title: "Database connection failed", body: "Check DATABASE_URL, credentials, database readiness, network membership, and the hostname used inside the container. A service name is usually appropriate for Compose-to-Compose traffic." },
      { title: "Frontend cannot reach the API", body: "Check the browser console and Network panel. Verify VITE_API_BASE_URL or the Vite proxy, CORS settings, API port mapping, and whether the browser can resolve the chosen hostname." },
      { title: "No traces appear", body: "Confirm instrumentation is initialized, the exporter endpoint is reachable from the app's network namespace, the Collector receiver matches the protocol, and the trace pipeline exports to a running backend." },
      { title: "No metrics appear", body: "Check the Prometheus target health, scrape endpoint, application metric registration, and the exact metric name. A healthy HTTP endpoint does not guarantee the expected metric exists." },
    ],
  },
  contributing: {
    title: "Contributing",
    category: "COMMUNITY / OPEN SOURCE",
    intro: "Contribute small, verifiable changes and keep the project documentation aligned with its implementation.",
    sections: [
      { title: "Explore first", body: "Read the README, inspect the relevant code and tests, and look for an existing issue before starting a large change." },
      { title: "Create a branch", body: "Keep changes focused and use descriptive branch names.", code: "git switch -c docs/improve-getting-started\ngit status --short" },
      { title: "Test your changes", body: "Run the Go tests and build, and run the frontend build and lint checks when relevant.", code: "go test ./...\ngo build ./...\ncd frontend\nnpm run build\nnpm run lint" },
      { title: "Submit the change", body: "Explain what changed, why it matters, how it was tested, and whether it changes configuration or data. Never include credentials, private telemetry, or local environment secrets." },
    ],
  },
};

function DocsArticle() {
  const { slug = "" } = useParams();
  const guide = guides[slug];
  const navigate = useNavigate();
  if (!guide) return <NotFound />;
  return <>
    <div className="doc-article-layout">
      <aside className="doc-sidebar"><div className="eyebrow">DOCUMENTATION</div><Link to="/docs" className="doc-sidebar-home">← All guides</Link>{docs.map((d) => <NavLink key={d.path} to={d.path} className={({ isActive }) => `doc-side-link ${isActive ? "active" : ""}`}>{d.title}</NavLink>)}</aside>
      <article className="doc-article">
        <div className="eyebrow">{guide.category}</div><h1>{guide.title}</h1><p className="doc-intro">{guide.intro}</p>
        <div className="doc-callout"><strong>Learning objective</strong><p>Understand the concept, follow the steps, verify the result, and explain what you observed. Adapt commands to your current environment.</p></div>
        {guide.sections.map((section) => <section className="article-section" key={section.title}><h2>{section.title}</h2><p>{section.body}</p>{section.code && <pre><code>{section.code}</code><button onClick={() => navigator.clipboard?.writeText(section.code!)} className="copy-button">Copy</button></pre>}</section>)}
        <section className="article-section"><h2>Check your understanding</h2><ul><li>Can you explain the concept in your own words?</li><li>Did you verify the behavior with a command or observable result?</li><li>Can you identify the next component to inspect if it fails?</li></ul></section>
        <div className="article-bottom"><Link to="/docs" className="button button-secondary">← All documentation</Link><Button onClick={() => navigate("/labs")}>Continue to labs →</Button></div>
      </article>
    </div>
  </>;
}




function Labs() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function runLab(path: string) {
    setBusy(true);
    setResult("");
    const start = performance.now();
    try {
      const response = await fetch(`${API}${path}`);
      const body = await response.text();
      setResult(`HTTP ${response.status} · ${(performance.now() - start).toFixed(0)} ms\n\n${body.slice(0, 1200)}`);
    } catch (e) {
      setResult(`Request failed: ${e instanceof Error ? e.message : "unknown error"}\n\nCheck that the API is running and reachable from your browser.`);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeading eyebrow="PRACTICE / EXPERIMENTS" title="Hands-on labs" description="Generate controlled requests and inspect the result. These labs call your configured API." />
    <div className="alert-banner"><span>!</span><div><strong>Run only against your own development environment</strong><p>The error lab intentionally requests a failing endpoint. Do not expose test endpoints to production users.</p></div></div>
    <div className="lab-grid">
      <article className="lab-card"><div className="eyebrow">LAB 001 / LATENCY</div><div className="lab-icon">◷</div><h3>Investigate a slow request</h3><p>Request the slow endpoint, measure browser-observed duration, then inspect the corresponding trace if tracing is configured.</p><div className="lab-meta"><span>GET /api/slow</span><span>~3 seconds if the demo handler is active</span></div><Button onClick={() => runLab("/api/slow")} >Run latency test →</Button></article>
      <article className="lab-card"><div className="eyebrow">LAB 002 / HTTP ERRORS</div><div className="lab-icon error-icon">!</div><h3>Inspect an HTTP failure</h3><p>Observe the response status, compare it with application logs, and locate the request trace.</p><div className="lab-meta"><span>GET /api/error</span><span>Expected 500 if implemented</span></div><Button secondary onClick={() => runLab("/api/error")}>Trigger test error →</Button></article>
      <article className="lab-card"><div className="eyebrow">LAB 003 / HEALTH</div><div className="lab-icon">⌁</div><h3>Check service health</h3><p>Validate the health endpoint before investigating database queries or telemetry exporters.</p><div className="lab-meta"><span>GET /health</span><span>Expected 200 if healthy</span></div><Button secondary onClick={() => runLab("/health")}>Check health →</Button></article>
    </div>
    {result && <section className="panel lab-result"><div className="panel-heading"><div><div className="eyebrow">LATEST EXPERIMENT</div><h3>Request result</h3></div><button className="icon-button" onClick={() => setResult("")}>×</button></div><pre><code>{busy ? "Request in progress…" : result}</code></pre></section>}
    <section className="panel"><div className="eyebrow">AFTER THE REQUEST</div><h3>How to investigate</h3><div className="steps-grid">{[["01", "Record", "Note the HTTP status and elapsed time."], ["02", "Trace", "Find the trace in your configured tracing backend."], ["03", "Correlate", "Compare the HTTP span, child spans, and logs."], ["04", "Explain", "State the evidence supporting your root-cause hypothesis."]].map(([n, t, d]) => <div className="step-card" key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></div>)}</div><Link className="text-link" to="/docs/observability">Read the observability guide →</Link></section>
  </>;
}

function NotFound() {
  return <section className="panel not-found"><div className="eyebrow">404 / ROUTE NOT FOUND</div><h1>This page is off the map.</h1><p className="body-copy">The guide or page may have moved.</p><Link to="/docs" className="button button-primary">Browse documentation →</Link></section>;
}

function AppRoutes() {
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/products" element={<Catalog />} />
    <Route path="/users" element={<UsersPage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/inventory" element={<InventoryPage />} />
    <Route path="/about" element={<About />} />
    <Route path="/learn" element={<Learning />} />
    <Route path="/docs" element={<DocsIndex />} />
    <Route path="/docs/:slug" element={<DocsArticle />} />
    <Route path="/labs" element={<Labs />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Layout>;
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}