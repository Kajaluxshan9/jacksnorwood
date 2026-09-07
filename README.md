# Jack's Norwood — Restaurant Website

A full-stack restaurant & pub website built with **React + Spring Boot**.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, React Router v6 |
| Backend  | Spring Boot 3.4.3, Java 21, Spring Security + JWT |
| Database | PostgreSQL |

---

## Project Structure

```
JacksNorwood2/
├── jacks_frontend/   # React + Vite frontend
└── jacks_backend/    # Spring Boot backend
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Java 21**
- **PostgreSQL** running locally
- **Maven** (or use the included `./mvnw` wrapper)

---

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE jacksnorwood;
```

---

### 2. Backend Setup

#### Create the `.env` file

```bash
cd jacks_backend
cp .env.example .env
```

Open `jacks_backend/.env.example`, copy all the contents, paste into `jacks_backend/.env`, and fill in your values.

#### Create the uploads folder

The `uploads/` directory is excluded from git. Create it manually before running the backend:

```bash
mkdir jacks_backend/uploads
```

This folder stores all uploaded images and PDFs (gallery, team photos, specials posters, CVs). It is never committed to git.

#### Run the backend

```bash
cd jacks_backend
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8080**

> On first boot, the database is seeded automatically with sample menu items, promotions, events, and an admin user.

---

### 3. Frontend Setup

#### Create the `.env` file

```bash
cd jacks_frontend
cp .env.example .env
```

Open `jacks_frontend/.env.example`, copy all the contents, paste into `jacks_frontend/.env`, and fill in your values.

#### Install dependencies and run

```bash
cd jacks_frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**

> **Important:** Always restart `npm run dev` after editing `.env` — Vite only reads environment variables at startup.

---

## Adding a Google Map

1. Go to [maps.google.com](https://maps.google.com)
2. Search for your restaurant location
3. Click **Share** → **Embed a map** tab
4. Click **Copy HTML** — you'll see something like:
   ```html
   <iframe src="https://www.google.com/maps/embed?pb=!1m18..." ...></iframe>
   ```
5. Copy **only the URL** inside `src="..."` (not the whole iframe tag)
6. Paste it into `jacks_frontend/.env`:
   ```env
   VITE_GOOGLE_MAPS_EMBED_URL=https://www.google.com/maps/embed?pb=!1m18...
   ```
7. **Restart** the Vite dev server (`npm run dev`)

If no URL is set, the contact page shows a "View on Google Maps" link instead.

---

## Accessing the Admin Dashboard

1. Go to **http://localhost:5173/admin/login**
2. Log in with the default credentials:

   | Username | Password  |
   |----------|-----------|
   | `admin`  | `admin123` |

3. You'll be redirected to the admin dashboard at `/admin`

### Admin Pages

| Page         | URL                        | Description                        |
|--------------|----------------------------|------------------------------------|
| Dashboard    | `/admin`                   | Stats overview                     |
| Menu         | `/admin/menu`              | Add/edit/delete menu items         |
| Promotions   | `/admin/promotions`        | Manage Daily & Special promotions  |
| Events       | `/admin/events`            | Manage upcoming events             |
| Gallery      | `/admin/gallery`           | Manage photo gallery               |
| Reservations | `/admin/reservations`      | View & update reservation status   |
| Messages     | `/admin/messages`          | View contact form submissions      |
| Settings     | `/admin/settings`          | Update social media links          |

> **Security:** Change the default admin password after your first login by updating the database directly or adding a change-password feature.

---

## Social Media Links

Social media links (Facebook, Instagram, TikTok) are managed from the admin panel — no code changes needed.

1. Log in to the admin dashboard
2. Go to **Settings** (`/admin/settings`)
3. Enter your social media profile URLs
4. Click **Save Settings**

Links appear in the website footer. Icons are only shown for platforms that have a URL set.

---

## Environment Variables Reference

### Frontend (`jacks_frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | ✅ Yes | — | Backend API base URL, e.g. `http://localhost:8080/api`. Change to your server URL in production. |
| `VITE_RESTAURANT_NAME` | ✅ Yes | — | Restaurant name shown in the browser tab, SEO meta tags, and page headings. |
| `VITE_RESTAURANT_PHONE` | ✅ Yes | — | Contact phone number shown in the header, footer, and contact page. |
| `VITE_RESTAURANT_EMAIL` | ✅ Yes | — | Contact email address shown on the contact page. |
| `VITE_RESTAURANT_ADDRESS` | ✅ Yes | — | Physical street address shown in the footer and contact page. |
| `VITE_GOOGLE_MAPS_EMBED_URL` | Optional | Built from the address | Google Maps embed `src` URL. If left empty, a map is generated from `VITE_RESTAURANT_ADDRESS` instead. See the [Adding a Google Map](#adding-a-google-map) section for how to get this URL. |
| `VITE_HERO_IMAGE_URL` | Optional | Bundled image | Fallback hero background image. Leave empty to use the default bundled image. Set to a `/uploads/...` path to use a custom image. Note: hero images uploaded via the Admin → Hero Images page take priority over this value. |
| `VITE_ONLINE_ORDER_URL` | Optional | Built-in provider link | Destination of the "Order Online" links in the navbar and footer. |
| `VITE_HOURS_SUN_WED` | Optional | `08:00 AM - 08:00 PM` | Opening hours for Sunday–Wednesday. **This is the grouping production uses.** Shown in the footer, contact page, reservation sidebar, home page, and the LocalBusiness structured data. |
| `VITE_HOURS_THU_SAT` | Optional | `08:00 AM - 10:00 PM` | Opening hours for Thursday–Saturday. |
| `VITE_HOURS_MON_THU` | Optional | — | Alternative three-band grouping: Monday–Thursday. |
| `VITE_HOURS_FRI_SAT` | Optional | — | Alternative three-band grouping: Friday–Saturday. |
| `VITE_HOURS_SUN` | Optional | — | Alternative three-band grouping: Sunday. |

> **Note on the hours variables.** Two groupings are supported — `SUN_WED`/`THU_SAT`
> (two bands) and `MON_THU`/`FRI_SAT`/`SUN` (three bands). Pick one. If both are set,
> the two-band names win, because that is the schedule the live site publishes.
> Set any of them to an empty value to hide that row.
>
> These names must appear verbatim in `src/config/hours.js`. Vite substitutes
> `import.meta.env.VITE_*` by matching the literal text at build time, so a name the
> code does not read is not an error — it is silently `undefined`, and the default is
> used instead. That failure mode is why the resolution logic lives in its own module
> with tests: wrong opening hours reach customers through Google as well as the site.

### Backend (`jacks_backend/.env`)

#### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ Yes | `localhost` | PostgreSQL server hostname. |
| `DB_PORT` | ✅ Yes | `5432` | PostgreSQL port. |
| `DB_NAME` | ✅ Yes | `jacksnorwood` | Name of the PostgreSQL database. |
| `DB_USERNAME` | ✅ Yes | `postgres` | PostgreSQL login username. |
| `DB_PASSWORD` | ✅ Yes | — | PostgreSQL login password. |

#### JWT Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | — | Secret key used to sign JWT tokens. Must be at least 256 bits (32+ characters). Use a long random string in production — never share this value. |
| `JWT_EXPIRATION` | Optional | `86400000` | How long a JWT token stays valid, in milliseconds. Default is `86400000` (24 hours). |

#### CORS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | ✅ Yes | `http://localhost:5173` | The frontend URL that the backend allows requests from. In production, set this to your deployed frontend URL (e.g. `https://yoursite.com`). |

#### Email (SMTP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIL_HOST` | ✅ Yes | `smtp.gmail.com` | SMTP server hostname. For Gmail use `smtp.gmail.com`. |
| `MAIL_PORT` | ✅ Yes | `587` | SMTP port. Use `587` for STARTTLS (Gmail). |
| `MAIL_USERNAME` | ✅ Yes | — | The Gmail (or other provider) address used to send emails, e.g. `yourname@gmail.com`. |
| `MAIL_PASSWORD` | ✅ Yes | — | The SMTP password. For Gmail, create a 16-character **App Password** (not your regular Gmail password) at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). |
| `RESTAURANT_EMAIL` | ✅ Yes | — | The restaurant's own email address that receives contact form submissions. This is the **destination** inbox — different from `MAIL_USERNAME` which is the sender. |

#### Spring Profile

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | Optional | `dev` | Controls which Spring profile is active. Use `dev` locally (auto-seeds the database with sample data on first boot). Use `prod` in production (skips the DataInitializer so real data is never overwritten on restart). |

---

## Running the Tests

Both suites are self-contained — no database, no mail server, no running app.

```bash
# Backend (JUnit 5 + Mockito + an in-memory H2 database)
cd jacks_backend
./mvnw test

# Frontend (Vitest)
cd jacks_frontend
npm test          # single run
npm run test:watch
```

The backend suite covers the upload boundary (type checks and directory
containment), the partial-update semantics of the DTOs, the menu delete/convert
operations against a real schema, and the public web layer (who can reach what,
and which payloads are rejected). The frontend suite covers the date helpers,
the opening-hours configuration, and the API session handling.

**A note on the database.** Tests run against H2 in PostgreSQL compatibility
mode, configured in `src/test/resources/application.properties`. That is close
to production but not identical — H2 accepts some SQL that PostgreSQL rejects.
If you change a `@Query`, run it against a real PostgreSQL instance before
trusting a green suite.

## Building for Production

### Frontend

```bash
cd jacks_frontend
npm run build
# Output is in jacks_frontend/dist/
```

### Backend

```bash
cd jacks_backend
./mvnw clean package
# JAR is at target/jacks_backend-*.jar
java -jar target/jacks_backend-*.jar
```

> **Important:** Set `SPRING_PROFILES_ACTIVE=prod` in your server environment before running in production. This disables the `DataInitializer` which seeds sample data — you don't want it overwriting real data on every restart.
>
> Locally, leave it unset (defaults to `dev`) so the database is seeded automatically on first boot.
