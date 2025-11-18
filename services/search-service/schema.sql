CREATE TABLE IF NOT EXISTS items (
    item_id VARCHAR(100) PRIMARY KEY,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    s3_image_key VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);
