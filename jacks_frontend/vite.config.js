import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SITE_URL = 'https://www.jacksnorwoodpub.ca'
const OG_IMAGE = `${SITE_URL}/default-hero.jpeg`

// Route-level SEO metadata injected into static HTML at build time.
// Social crawlers (Facebook, Twitter, LinkedIn) don't execute JavaScript —
// they read the raw HTML. This plugin generates dist/<route>/index.html
// with correct meta tags for each public route so sharing previews work.
const ROUTE_META = [
  {
    path: '/',
    title: "Jack's Norwood | Pub & Restaurant in Norwood, Ontario",
    description: "Jack's Norwood is your neighbourhood pub and restaurant in Norwood, Ontario. Great food, cold drinks, daily specials, and live events. Open 7 days a week.",
  },
  {
    path: '/menu',
    title: "Menu | Jack's Norwood Pub & Restaurant",
    description: "Explore our full pub menu — classic meals, daily specials, and a great selection of drinks at Jack's Norwood in Norwood, ON.",
  },
  {
    path: '/promotions',
    title: "Daily Specials & Promotions | Jack's Norwood",
    description: "Check out our daily specials and featured promotions at Jack's Norwood Pub in Norwood, Ontario. Great value food and drinks every day.",
  },
  {
    path: '/events',
    title: "Upcoming Events | Jack's Norwood",
    description: "Live music, trivia nights, and special events at Jack's Norwood Pub in Norwood, Ontario. Check out what's coming up.",
  },
  {
    path: '/gallery',
    title: "Photo Gallery | Jack's Norwood Pub",
    description: "Photos of food, drinks, events, and atmosphere at Jack's Norwood Pub & Restaurant in Norwood, Ontario.",
  },
  {
    path: '/about',
    title: "About Us | Jack's Norwood Pub & Restaurant",
    description: "The story behind Jack's Norwood — a community-focused pub and restaurant on Highway 7 in Norwood, Ontario.",
  },
  {
    path: '/contact',
    title: "Contact & Find Us | Jack's Norwood",
    description: "Contact Jack's Norwood. Find us at 4327 Highway 7, Norwood, ON K0L 2V0. Call +1 (705) 639-0399 or email us.",
  },
  {
    path: '/reservation',
    title: "Book a Table | Jack's Norwood Pub & Restaurant",
    description: "Reserve your table at Jack's Norwood Pub & Restaurant in Norwood, Ontario. Easy online bookings for any occasion.",
  },
]

function generateStaticRoutes() {
  return {
    name: 'generate-static-routes',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexPath = path.join(distDir, 'index.html')

      if (!fs.existsSync(indexPath)) return

      // Strip base title, description, and og:/twitter: fallbacks from index.html.
      // Each route gets its own injected below — no duplicates in production HTML.
      let baseHtml = fs.readFileSync(indexPath, 'utf-8')
      baseHtml = baseHtml
        .replace(/<title>[^<]*<\/title>/, '')
        .replace(/<meta name="description"[^>]*\/?>/, '')
        .replace(/<meta property="og:[^>]*\/?>/g, '')
        .replace(/<meta name="twitter:[^>]*\/?>/g, '')
        .replace(/<link rel="canonical"[^>]*\/?>/g, '')

      ROUTE_META.forEach(({ path: routePath, title, description }) => {
        const canonicalUrl = `${SITE_URL}${routePath}`

        const injected = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:alt" content="Jack's Norwood Pub &amp; Restaurant in Norwood, Ontario" />
  <meta property="og:locale" content="en_CA" />
  <meta property="og:site_name" content="Jack's Norwood" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />`

        const html = baseHtml.replace('</head>', `${injected}\n  </head>`)

        if (routePath === '/') {
          fs.writeFileSync(indexPath, html)
          console.log('  [seo] dist/index.html')
        } else {
          const routeDir = path.join(distDir, routePath)
          fs.mkdirSync(routeDir, { recursive: true })
          fs.writeFileSync(path.join(routeDir, 'index.html'), html)
          console.log(`  [seo] dist${routePath}/index.html`)
        }
      })

      console.log(`\n✓ SEO: generated static HTML for ${ROUTE_META.length} routes`)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    generateStaticRoutes(),
  ],
})
