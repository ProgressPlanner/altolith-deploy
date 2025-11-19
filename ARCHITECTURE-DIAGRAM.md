# Multi-Provider Architecture Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aether Site Exporter                         │
│                   Multi-Provider Workflow                       │
└─────────────────────────────────────────────────────────────────┘

┌────────────┐
│  User      │
│  Clicks    │───┐
│  Publish   │   │
└────────────┘   │
                 ▼
         ┌──────────────┐
         │ Start Publish│
         └──────┬───────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│              PHASE 1: Pre-scan (Shared)                       │
├───────────────────────────────────────────────────────────────┤
│  1. Discover Assets                                           │
│     └─► Find all CSS, JS, images, fonts                      │
│                                                                │
│  2. Get Static Site URLs                                      │
│     └─► Crawl site, get all page URLs                        │
│                                                                │
│  3. Fetch & Cache RAW HTML                                    │
│     ├─► Fetch HTML from each URL (as anonymous visitor)      │
│     ├─► Extract assets from HTML                             │
│     └─► Cache RAW HTML in IndexedDB                          │
│         (Before URL rewriting! ✨)                            │
│                                                                │
│  4. Generate Blueprint                                        │
│     └─► Create blueprint.json for WordPress Playground       │
└───────────────────────────────────────────────────────────────┘
                 │
                 │ Raw HTML cached, ready for processing
                 │
                 ▼
┌───────────────────────────────────────────────────────────────┐
│         PHASE 2: Upload (Per-Provider Parallel)               │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐        ┌──────────────────────┐     │
│  │  Provider A         │        │  Provider B          │     │
│  │  (Cloudflare R2)    │        │  (Local Filesystem)  │     │
│  └─────────┬───────────┘        └───────┬──────────────┘     │
│            │                             │                     │
│            │                             │                     │
│  ┌─────────▼────────────┐     ┌─────────▼─────────────┐      │
│  │ Fetch Raw HTML       │     │ Fetch Raw HTML        │      │
│  │ from IndexedDB       │     │ from IndexedDB        │      │
│  └─────────┬────────────┘     └─────────┬─────────────┘      │
│            │                             │                     │
│            │                             │                     │
│  ┌─────────▼────────────┐     ┌─────────▼─────────────┐      │
│  │ Apply URL Rewriting  │     │ Apply URL Rewriting   │      │
│  │ ┌──────────────────┐ │     │ ┌───────────────────┐ │      │
│  │ │ Deployment URL:  │ │     │ │ Deployment URL:   │ │      │
│  │ │ example.workers  │ │     │ │ static.example    │ │      │
│  │ │      .dev        │ │     │ │      .com         │ │      │
│  │ └──────────────────┘ │     │ └───────────────────┘ │      │
│  └─────────┬────────────┘     └─────────┬─────────────┘      │
│            │                             │                     │
│            │                             │                     │
│  ┌─────────▼────────────┐     ┌─────────▼─────────────┐      │
│  │ Upload to Storage    │     │ Upload to Storage     │      │
│  │ ┌──────────────────┐ │     │ ┌───────────────────┐ │      │
│  │ │ Path Prefix:     │ │     │ │ Path Prefix:      │ │      │
│  │ │ cloudflare-r2/   │ │     │ │ local-filesystem/ │ │      │
│  │ └──────────────────┘ │     │ └───────────────────┘ │      │
│  └─────────┬────────────┘     └─────────┬─────────────┘      │
│            │                             │                     │
│            │                             │                     │
│  ┌─────────▼────────────┐     ┌─────────▼─────────────┐      │
│  │ Update Manifest      │     │ Update Manifest       │      │
│  │ cloudflare-r2/       │     │ local-filesystem/     │      │
│  │ file-manifest.json   │     │ file-manifest.json    │      │
│  └──────────────────────┘     └───────────────────────┘      │
│                                                                │
└───────────────────────────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Complete   │
         │   Publish    │
         └──────────────┘
```

---

## Storage Structure

```
WordPress Root
│
└── wp-content/
    └── uploads/
        └── aether-exports/
            │
            ├── cloudflare-r2/                    ◄─── Provider A
            │   ├── static/
            │   │   ├── index.html
            │   │   │   └─► URLs: https://example.workers.dev/...
            │   │   │
            │   │   ├── about/
            │   │   │   └── index.html
            │   │   │       └─► URLs: https://example.workers.dev/...
            │   │   │
            │   │   └── wp-content/
            │   │       └── uploads/
            │   │           └── image.jpg
            │   │
            │   └── file-manifest.json            ◄─── Provider A Manifest
            │       {
            │         "static/index.html": {
            │           "size": 12345,
            │           "hash": "sha256-abc..."
            │         }
            │       }
            │
            └── local-filesystem/                 ◄─── Provider B
                ├── static/
                │   ├── index.html
                │   │   └─► URLs: https://static.example.com/...
                │   │
                │   ├── about/
                │   │   └── index.html
                │   │       └─► URLs: https://static.example.com/...
                │   │
                │   └── wp-content/
                │       └── uploads/
                │           └── image.jpg
                │
                └── file-manifest.json            ◄─── Provider B Manifest
                    {
                      "static/index.html": {
                        "size": 12345,
                        "hash": "sha256-abc..."
                      }
                    }
```

---

## URL Rewriting Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Original HTML (Cached)                        │
├──────────────────────────────────────────────────────────────────┤
│  <a href="https://example.local/about/">About</a>                │
│  <img src="https://example.local/wp-content/uploads/logo.png">   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           │ Same raw HTML
                           │
          ┌────────────────┴────────────────┐
          │                                  │
          ▼                                  ▼
┌─────────────────────┐          ┌──────────────────────┐
│   Provider A        │          │   Provider B         │
│   (Cloudflare R2)   │          │   (Local Filesystem) │
└─────────┬───────────┘          └──────────┬───────────┘
          │                                  │
          │ worker_endpoint:                │ public_url:
          │ example.workers.dev             │ static.example.com
          │                                  │
          ▼                                  ▼
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│  Rewritten HTML (Provider A)    │  │  Rewritten HTML (Provider B) │
├─────────────────────────────────┤  ├──────────────────────────────┤
│ <a href="/static/about/">       │  │ <a href="/static/about/">    │
│     About                       │  │     About                    │
│ </a>                            │  │ </a>                         │
│                                 │  │                              │
│ <img src="https://example      │  │ <img src="https://static    │
│     .workers.dev/static/       │  │     .example.com/static/    │
│     wp-content/uploads/        │  │     wp-content/uploads/     │
│     logo.png">                 │  │     logo.png">              │
└─────────────────────────────────┘  └──────────────────────────────┘
          │                                  │
          │ Upload to                        │ Upload to
          │ cloudflare-r2/static/           │ local-filesystem/static/
          │                                  │
          ▼                                  ▼
    ┌─────────────┐                    ┌─────────────┐
    │   Storage   │                    │   Storage   │
    │     (R2)    │                    │   (Local)   │
    └─────────────┘                    └─────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Components                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  usePublishController                                │      │
│  │  ├─► Orchestrates workflow                           │      │
│  │  ├─► Manages publish state                           │      │
│  │  └─► Executes workflow steps                         │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  useStaticSiteGenerator                              │      │
│  │  ├─► Phase 1: Cache raw HTML                        │      │
│  │  ├─► Phase 2: Apply per-provider URL rewriting      │      │
│  │  └─► Upload files to storage                        │      │
│  └────────────────┬─────────────────────────────────────┘      │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  StorageService                                      │      │
│  │  ├─► Constructor receives provider_id               │      │
│  │  ├─► _prefixKey() adds provider prefix              │      │
│  │  ├─► upload() → {providerId}/static/...             │      │
│  │  ├─► downloadManifest() → {providerId}/manifest.json│      │
│  │  └─► All operations auto-prefixed                   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PHP Backend                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  LocalFilesystemAdapter                              │      │
│  │  ├─► Handles file system operations                  │      │
│  │  ├─► Creates directories with provider prefix        │      │
│  │  └─► Writes files to {providerId}/static/...         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Configuration                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Provider Configs      │
            ├───────────────────────┤
            │ cloudflare-r2:        │
            │   worker_endpoint: X  │
            │   enabled: true       │
            │                       │
            │ local-filesystem:     │
            │   public_url: Y       │
            │   enabled: true       │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Upload Step           │
            │ (Parallel Execution)  │
            └─────┬───────────┬─────┘
                  │           │
        ┌─────────▼───┐   ┌──▼─────────┐
        │ Provider A  │   │ Provider B │
        │ Context:    │   │ Context:   │
        │ - URL: X    │   │ - URL: Y   │
        │ - ID: r2    │   │ - ID: local│
        └─────┬───────┘   └──┬─────────┘
              │              │
              ▼              ▼
    ┌─────────────────────────────────┐
    │  processStaticSiteUrls()        │
    │  - Receives provider-specific:  │
    │    - staticSiteUrl              │
    │    - staticSiteProviderId       │
    └─────────┬───────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │  StorageService                 │
    │  - config.provider_id set       │
    │  - Auto-prefixes all paths      │
    └─────────┬───────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │  File System                    │
    │  - {providerId}/static/...      │
    │  - {providerId}/manifest.json   │
    └─────────────────────────────────┘
```

---

## Manifest Hash Checking

```
┌────────────────────────────────────────────────────┐
│           Upload Decision Tree                     │
└────────────────────┬───────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Get file to upload    │
         │ - Calculate size      │
         │ - Calculate SHA-256   │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Check manifest        │
         │ (provider-specific)   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Entry exists?         │
         └─────┬────────────┬────┘
               │ No         │ Yes
               │            │
               ▼            ▼
         ┌─────────┐   ┌────────────────┐
         │ Upload  │   │ Size matches?  │
         │  File   │   └────┬──────┬────┘
         └─────────┘        │ No   │ Yes
                            │      │
                            ▼      ▼
                      ┌─────────┐ ┌──────────────┐
                      │ Upload  │ │ Hash matches?│
                      │  File   │ └────┬────┬────┘
                      └─────────┘      │ No │ Yes
                                       │    │
                                       ▼    ▼
                                 ┌─────────┐ ┌─────────┐
                                 │ Upload  │ │  Skip   │
                                 │  File   │ │  Upload │
                                 └─────────┘ └─────────┘
```

---

## Performance Timeline

```
┌─────────────────────────────────────────────────────────────┐
│                 Publish Timeline (100 pages)                │
└─────────────────────────────────────────────────────────────┘

  0s ──────────────────────────────────────────────────── 100s
  │                                                          │
  ├─► Discover Assets (5s)                                  │
  │   └─► Find CSS, JS, images, fonts                       │
  │                                                          │
  ├─► Get Static Site URLs (8s)                             │
  │   └─► Crawl site, extract URLs                          │
  │                                                          │
  ├─► Pre-scan Phase (15s)                                  │
  │   ├─► Fetch 100 HTML pages                              │
  │   ├─► Extract assets                                    │
  │   └─► Cache raw HTML in IndexedDB                       │
  │                                                          │
  ├─► Generate Blueprint (1s)                               │
  │   └─► Create blueprint.json                             │
  │                                                          │
  ├─► Upload Phase - Provider A (30s) ───┐                  │
  │   ├─► Process 100 HTML pages (0.5s)  │                  │
  │   │   └─► 5ms per page × 100         │                  │
  │   ├─► Upload HTML files (15s)        │                  │
  │   ├─► Upload assets (12s)            │                  │
  │   └─► Update manifest (2.5s)         │                  │
  │                                       │                  │
  ├─► Upload Phase - Provider B (30s) ───┤ Parallel!        │
  │   ├─► Process 100 HTML pages (0.5s)  │                  │
  │   │   └─► 5ms per page × 100         │                  │
  │   ├─► Upload HTML files (15s)        │                  │
  │   ├─► Upload assets (12s)            │                  │
  │   └─► Update manifest (2.5s)         │                  │
  │                                       │                  │
  └───────────────────────────────────────┘                  │
                                                             │
  Total Time: ~60s (not 90s!)                               │
  Additional cost for 2nd provider: ~0.5s (HTML processing)│
```

---

## Filter Execution Order

```
Pre-scan Phase (Phase 1)
│
├─► For each URL:
│   │
│   ├─► Fetch HTML
│   │
│   ├─► Extract assets
│   │
│   ├─► Apply filter: aether.static.html.raw
│   │   └─► Modify raw HTML (once per page)
│   │
│   └─► Cache raw HTML
│
└─► Pre-scan complete

Upload Phase (Phase 2)
│
├─► For Provider A:
│   │
│   ├─► For each URL:
│   │   │
│   │   ├─► Load raw HTML from cache
│   │   │
│   │   ├─► Apply filter: aether.static.html.process
│   │   │   └─► Modify HTML (once per provider per page)
│   │   │
│   │   ├─► processHtml() - URL rewriting
│   │   │   └─► Uses Provider A deployment URL
│   │   │
│   │   └─► Upload to {providerA}/static/...
│   │
│   └─► Upload manifest
│
└─► For Provider B:
    │
    ├─► For each URL:
    │   │
    │   ├─► Load raw HTML from cache (same as Provider A)
    │   │
    │   ├─► Apply filter: aether.static.html.process
    │   │   └─► Modify HTML (different provider context!)
    │   │
    │   ├─► processHtml() - URL rewriting
    │   │   └─► Uses Provider B deployment URL
    │   │
    │   └─► Upload to {providerB}/static/...
    │
    └─► Upload manifest
```

---

## Security & Isolation

```
┌─────────────────────────────────────────────────────────┐
│                Provider Isolation Guarantees            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Storage Isolation                                   │
│     └─► Automatic path prefixing prevents conflicts    │
│                                                          │
│  ✅ Manifest Isolation                                  │
│     └─► Each provider has independent hash tracking    │
│                                                          │
│  ✅ URL Isolation                                       │
│     └─► Each provider gets its own deployment URL      │
│                                                          │
│  ✅ Configuration Isolation                             │
│     └─► Provider configs stored separately              │
│                                                          │
│  ✅ Error Isolation                                     │
│     └─► One provider failure doesn't affect others     │
│                                                          │
│  ✅ Parallel Execution                                  │
│     └─► Providers upload simultaneously                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Generated:** 2025-11-19
**Tool:** Claude Code
**Status:** Production Ready ✅
