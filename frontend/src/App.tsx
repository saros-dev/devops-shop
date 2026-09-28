import { useEffect, useState } from 'react'
import './App.css'

type Product = {
  id: number
  name: string
  price: number
}

type User = {
  id: number
  name: string
  email: string
}

type Order = {
  id: number
  user_id: number
  product_id: number
  quantity: number
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState('')
  const [result, setResult] = useState('')

  const request = async (url: string, label: string) => {
    setLoading(label)
    setResult('')

    try {
      const response = await fetch(url)
      const text = await response.text()

      let data

      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`Invalid response from ${url}`)
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Request failed')
      throw error
    } finally {
      setLoading('')
    }
  }

  const loadProducts = async () => {
    const data = await request('/api/products', 'products')
    setProducts(data)
    setResult(`${data.length} products loaded`)
  }

  const loadUsers = async () => {
    const data = await request('/api/users', 'users')
    setUsers(data)
    setResult(`${data.length} users loaded`)
  }

  const loadOrders = async () => {
    const data = await request('/api/orders', 'orders')
    setOrders(data)
    setResult(`${data.length} orders loaded`)
  }

  const testSlowRequest = async () => {
    const start = performance.now()

    await request('/api/slow', 'slow')

    const duration = Math.round(performance.now() - start)
    setResult(`Slow request completed in ${duration} ms`)
  }

  const testError = async () => {
    try {
      await request('/api/error', 'error')
    } catch {
      // Expected.
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="app">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            DS
          </div>

          <div>
            <div className="brand-name">DevOps Shop</div>
            <div className="brand-meta">Engineering Console</div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-indicator" />
          <span>All systems operational</span>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="hero-label">
              <span />
              DEVOPS LAB
            </div>

            <h1>
              Infrastructure,
              <br />
              <span>made visible.</span>
            </h1>

            <p>
              A production-style playground for Go, PostgreSQL,
              Prometheus and OpenTelemetry.
            </p>
          </div>

          <div className="hero-status">
            <div className="hero-status-label">API STATUS</div>

            <div className="hero-status-value">
              <span className="status-indicator large" />
              Operational
            </div>

            <div className="hero-status-url">
              192.168.64.6:8088
            </div>
          </div>
        </section>

        <section className="metrics">
          <div className="metric-card">
            <span className="metric-label">PRODUCTS</span>
            <strong>{products.length}</strong>
            <span className="metric-description">Available items</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">USERS</span>
            <strong>{users.length}</strong>
            <span className="metric-description">Registered users</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">ORDERS</span>
            <strong>{orders.length}</strong>
            <span className="metric-description">Current orders</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">STACK</span>
            <strong>5</strong>
            <span className="metric-description">Core services</span>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">CATALOG</span>
              <h2>Products</h2>
              <p>Data served directly from the Go API.</p>
            </div>

            <button
              className="button secondary"
              onClick={loadProducts}
              disabled={loading === 'products'}
            >
              {loading === 'products' ? 'Loading...' : 'Refresh products'}
              <span>↗</span>
            </button>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-top">
                  <span className="product-id">
                    PRODUCT {String(product.id).padStart(2, '0')}
                  </span>

                  <span className="product-dot" />
                </div>

                <div className="product-icon">
                  {product.id === 1 ? 'MB' : product.id === 2 ? 'KB' : 'MN'}
                </div>

                <h3>{product.name}</h3>

                <div className="product-bottom">
                  <span>Starting at</span>
                  <strong>${product.price.toFixed(2)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="two-column">
          <section className="section compact">
            <div className="section-heading">
              <div>
                <span className="section-kicker">DATABASE</span>
                <h2>Users</h2>
                <p>PostgreSQL-backed requests.</p>
              </div>

              <button
                className="icon-button"
                onClick={loadUsers}
                disabled={loading === 'users'}
                aria-label="Load users"
              >
                ↻
              </button>
            </div>

            {users.length > 0 ? (
              <div className="data-table">
                <div className="table-head">
                  <span>ID</span>
                  <span>USER</span>
                  <span>EMAIL</span>
                </div>

                {users.map((user) => (
                  <div className="table-row" key={user.id}>
                    <span className="muted">#{user.id}</span>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">DB</div>
                <strong>No users loaded</strong>
                <span>Run a database request to fetch users.</span>

                <button
                  className="button secondary"
                  onClick={loadUsers}
                  disabled={loading === 'users'}
                >
                  {loading === 'users' ? 'Loading...' : 'Query database'}
                </button>
              </div>
            )}
          </section>

          <section className="section compact">
            <div className="section-heading">
              <div>
                <span className="section-kicker">ORDERS</span>
                <h2>Recent orders</h2>
                <p>Live API response data.</p>
              </div>

              <button
                className="icon-button"
                onClick={loadOrders}
                disabled={loading === 'orders'}
                aria-label="Load orders"
              >
                ↻
              </button>
            </div>

            {orders.length > 0 ? (
              <div className="data-table">
                <div className="table-head">
                  <span>ORDER</span>
                  <span>USER</span>
                  <span>QTY</span>
                </div>

                {orders.map((order) => (
                  <div className="table-row" key={order.id}>
                    <strong>#{order.id}</strong>
                    <span>User #{order.user_id}</span>
                    <span>{order.quantity} item</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">OR</div>
                <strong>No orders loaded</strong>
                <span>Request the API to retrieve orders.</span>

                <button
                  className="button secondary"
                  onClick={loadOrders}
                  disabled={loading === 'orders'}
                >
                  {loading === 'orders' ? 'Loading...' : 'Load orders'}
                </button>
              </div>
            )}
          </section>
        </div>

        <section className="observability">
          <div className="observability-header">
            <div>
              <span className="section-kicker">OBSERVABILITY</span>
              <h2>Generate production-like traffic</h2>
              <p>
                Trigger traces, metrics and errors for your monitoring stack.
              </p>
            </div>

            <div className="observability-stack">
              <span>OTel</span>
              <span>Tempo</span>
              <span>Prometheus</span>
              <span>Grafana</span>
            </div>
          </div>

          <div className="test-grid">
            <button
              className="test-card"
              onClick={testSlowRequest}
              disabled={loading === 'slow'}
            >
              <div className="test-icon">03s</div>
              <div>
                <strong>Slow request</strong>
                <span>
                  {loading === 'slow'
                    ? 'Waiting for response...'
                    : 'Generate a 3 second trace'}
                </span>
              </div>
              <b>→</b>
            </button>

            <button
              className="test-card danger"
              onClick={testError}
              disabled={loading === 'error'}
            >
              <div className="test-icon">500</div>
              <div>
                <strong>Generate error</strong>
                <span>
                  {loading === 'error'
                    ? 'Sending request...'
                    : 'Trigger an HTTP 500'}
                </span>
              </div>
              <b>→</b>
            </button>

            <button
              className="test-card"
              onClick={loadUsers}
              disabled={loading === 'users'}
            >
              <div className="test-icon">DB</div>
              <div>
                <strong>Database query</strong>
                <span>
                  {loading === 'users'
                    ? 'Querying PostgreSQL...'
                    : 'Generate database traffic'}
                </span>
              </div>
              <b>→</b>
            </button>
          </div>

          {result && (
            <div className="result-bar">
              <span className="result-dot" />
              {result}
            </div>
          )}
        </section>

        <footer>
          <span>DEVOPS SHOP</span>
          <span>Go · React · PostgreSQL · OTel · Prometheus</span>
        </footer>
      </main>
    </div>
  )
}

export default App
