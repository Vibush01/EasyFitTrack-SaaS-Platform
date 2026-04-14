# EasyFitTrack — Free-Tier Architecture

## Hosting Stack

| Service | Provider | Tier | Limits |
|---------|----------|------|--------|
| Frontend | Netlify | Free | 100GB bandwidth/month |
| Backend | Render | Free | Spins down after 15 min inactivity |
| Database | MongoDB Atlas | Free (M0) | 512MB storage |
| Image Storage | Cloudinary | Free | 25 credits/month |

## Design Principles

### 1. On-Demand Computation Only

Render's free tier shuts down the server process after 15 minutes of inactivity. This means:

- **No cron jobs** — any `setInterval` or node-cron task would die when the process stops.
- **No background workers** — there's no persistent process to run them.
- **All analytics are computed at request time** — when a gym owner visits their dashboard, the `expiring-soon`, `peak-hours`, and `growth` endpoints query MongoDB on the fly using aggregation pipelines.

This "lazy" approach is intentional: the few extra milliseconds of query time are negligible compared to the cost and complexity of maintaining a persistent scheduler.

#### EventLog Cleanup

The `EventLog` model uses a Mongoose `post('save')` hook to trim records when the count exceeds 1,000. This runs inline after each save — it is NOT a cron job. It piggybacks on normal user activity, making it safe for free-tier hosting.

### 2. Client-Side Image Compression

Cloudinary's free tier provides 25 credits/month. Each credit is roughly 1GB of managed assets. To maximize this:

- All images are compressed in the browser **before** upload using `browser-image-compression`.
- Default settings: **1MB max**, **1920px max dimension**, **JPEG conversion**.
- Files already under 1MB are skipped (no wasted CPU).
- If compression fails, the original file is sent as a fallback.

#### Compression Points

| Page | What's Compressed | Utility Used |
|------|-------------------|--------------|
| Profile | Profile photo | `compressImage()` |
| Update Gym | Gym gallery photos | `compressImages()` |
| Progress Tracker | Progress photos | `compressImages()` |

The backend (`multer` → `cloudinary.uploader.upload_stream`) doesn't need any changes — it receives `file.buffer` regardless of size.

### 3. Cold Start Awareness

Render free tier has a ~30 second cold start. The frontend handles this gracefully:

- API calls use `try/catch` with user-friendly error toasts.
- No hard timeouts that would fail during cold starts.
- The loading state in UI components covers the delay naturally.
