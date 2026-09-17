# Royal Baltic · HoReCa Express

Mobile-first German B2B seafood ordering prototype built with React, App Router, Tailwind and Lucide. Open the catalog, choose a demo restaurant and try checkout and repeat orders. No real transactions are made.

Read [implementation and architecture](docs/IMPLEMENTATION.md) for setup, file structure, PostgreSQL migration instructions and production limitations.

```sh
pnpm install
pnpm dev
pnpm build
```

Requires Node >=22.13. Neon migrations and server API are included but not connected. The UI uses clearly labelled demo data; newly created demo orders reset on reload. PWA installation requires a supported browser and HTTPS.
