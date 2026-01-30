-- Make password_hash nullable for Google sign-in users
-- SQLite doesn't support ALTER COLUMN, so we recreate the table

-- Create new users table with nullable password_hash and google_id
CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT,
    display_name TEXT,
    avatar_url TEXT,
    family_id TEXT,
    role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT
);

-- Copy existing data
INSERT INTO users_new (id, email, password_hash, display_name, avatar_url, family_id, role, created_at, updated_at, last_login_at)
SELECT id, email, password_hash, display_name, avatar_url, family_id, role, created_at, updated_at, last_login_at
FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id);
