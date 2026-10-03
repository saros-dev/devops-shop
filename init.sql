-- ============================================================
-- DevOps Shop - Database Initialization
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    provider TEXT NOT NULL,
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (name, email)
SELECT
    'User ' || id,
    'user' || id || '@example.com'
FROM generate_series(1, 10000) AS gs(id)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================

INSERT INTO products (
    name,
    description,
    category,
    price
)
SELECT
    CASE (id % 10)
        WHEN 0 THEN 'MacBook Pro ' || id
        WHEN 1 THEN 'Mechanical Keyboard ' || id
        WHEN 2 THEN '4K Monitor ' || id
        WHEN 3 THEN 'Wireless Mouse ' || id
        WHEN 4 THEN 'USB-C Hub ' || id
        WHEN 5 THEN 'Noise Cancelling Headphones ' || id
        WHEN 6 THEN 'Gaming Laptop ' || id
        WHEN 7 THEN 'Webcam ' || id
        WHEN 8 THEN 'External SSD ' || id
        ELSE 'Smartphone ' || id
    END,
    'Professional technology product #' || id,
    CASE (id % 6)
        WHEN 0 THEN 'Laptops'
        WHEN 1 THEN 'Accessories'
        WHEN 2 THEN 'Monitors'
        WHEN 3 THEN 'Audio'
        WHEN 4 THEN 'Storage'
        ELSE 'Mobile'
    END,
    ROUND(
        (49.99 + ((id * 37) % 195000) / 100.0)::numeric,
        2
    )
FROM generate_series(1, 5000) AS gs(id);

-- ============================================================
-- INVENTORY
-- ============================================================

INSERT INTO inventory (
    product_id,
    quantity,
    reserved_quantity
)
SELECT
    id,
    10 + (id % 500),
    id % 20
FROM products
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================
-- CARTS
-- ============================================================

INSERT INTO carts (
    user_id,
    status
)
SELECT
    id,
    CASE
        WHEN id % 10 = 0 THEN 'completed'
        ELSE 'active'
    END
FROM users
WHERE id <= 5000;

-- ============================================================
-- CART ITEMS
-- ============================================================

INSERT INTO cart_items (
    cart_id,
    product_id,
    quantity
)
SELECT
    c.id,
    ((c.id * 17) % 5000) + 1,
    (c.id % 5) + 1
FROM carts AS c
WHERE c.id <= 5000
ON CONFLICT (cart_id, product_id) DO NOTHING;

-- ============================================================
-- ORDERS
-- ============================================================

INSERT INTO orders (
    user_id,
    status,
    total_amount,
    created_at
)
SELECT
    ((id * 37) % 10000) + 1,
    CASE (id % 6)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'processing'
        WHEN 2 THEN 'shipped'
        WHEN 3 THEN 'delivered'
        WHEN 4 THEN 'delivered'
        ELSE 'cancelled'
    END,
    ROUND(
        (50 + ((id * 71) % 250000) / 100.0)::numeric,
        2
    ),
    NOW() - ((id % 365) || ' days')::interval
FROM generate_series(1, 50000) AS gs(id);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

INSERT INTO order_items (
    order_id,
    product_id,
    quantity,
    unit_price
)
SELECT
    o.id,
    ((o.id * n) % 5000) + 1,
    ((o.id + n) % 4) + 1,
    ROUND(
        (49.99 + ((o.id * n * 29) % 195000) / 100.0)::numeric,
        2
    )
FROM orders AS o
CROSS JOIN generate_series(1, 3) AS item(n);

-- ============================================================
-- PAYMENTS
-- ============================================================

INSERT INTO payments (
    order_id,
    status,
    amount,
    provider,
    transaction_id,
    created_at
)
SELECT
    o.id,
    CASE
        WHEN o.status = 'cancelled' THEN 'failed'
        WHEN o.id % 25 = 0 THEN 'failed'
        ELSE 'completed'
    END,
    o.total_amount,
    CASE (o.id % 4)
        WHEN 0 THEN 'stripe'
        WHEN 1 THEN 'paypal'
        WHEN 2 THEN 'adyen'
        ELSE 'mockpay'
    END,
    'TX-' || LPAD(o.id::text, 10, '0'),
    o.created_at
FROM orders AS o;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_name
    ON products(name);

CREATE INDEX IF NOT EXISTS idx_inventory_product
    ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_carts_user
    ON carts(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart
    ON cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_orders_user
    ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
    ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_order
    ON payments(order_id);

-- ============================================================
-- ANALYZE
-- ============================================================

ANALYZE users;
ANALYZE products;
ANALYZE inventory;
ANALYZE carts;
ANALYZE cart_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;