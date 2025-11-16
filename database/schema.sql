-- WordPress.org Plugin/Theme Cache Schema
-- Self-learning cache with dual TTL strategy:
-- - WordPress.org plugins/themes: 30-day TTL
-- - Custom plugins/themes: 2-day TTL

CREATE TABLE IF NOT EXISTS wporg_cache (
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('plugin', 'theme')),
    is_wporg INTEGER NOT NULL CHECK(is_wporg IN (0, 1)), -- 1 = WordPress.org, 0 = custom
    checked_at TEXT NOT NULL, -- ISO 8601 timestamp
    hit_count INTEGER DEFAULT 1,
    PRIMARY KEY (slug, type)
);

-- Index for lookups by type and slug
CREATE INDEX IF NOT EXISTS idx_type_slug ON wporg_cache(type, slug);

-- Index for finding stale entries (cache expiration queries)
CREATE INDEX IF NOT EXISTS idx_checked_at ON wporg_cache(checked_at);

-- Index for analytics (finding WordPress.org vs custom plugins)
CREATE INDEX IF NOT EXISTS idx_is_wporg ON wporg_cache(is_wporg);
