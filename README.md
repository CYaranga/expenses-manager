# Expenses Manager

A modern family expense tracking application built with React, Hono, and Cloudflare Workers.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## Features

- **Family-based expense tracking** - Create or join a family to track expenses together
- **Dashboard with analytics** - Visual charts showing spending trends and category breakdowns
- **Expense management** - Add, edit, and delete expenses with category filtering
- **Invite system** - Share invite codes to add family members
- **Role-based access** - Admin and member roles with appropriate permissions
- **Mobile responsive** - Fully responsive design that works on all devices
- **Secure authentication** - JWT-based auth with access and refresh tokens
- **Real-time password strength** - Visual feedback when creating passwords

## Tech Stack

### Backend
- **[Hono](https://hono.dev/)** - Lightweight, ultrafast web framework
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge computing platform
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - Serverless SQLite database
- **[Jose](https://github.com/panva/jose)** - JWT implementation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Frontend
- **[React 19](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Recharts](https://recharts.org/)** - Charting library
- **[React Router](https://reactrouter.com/)** - Client-side routing

## Project Structure

```
expenses-manager/
├── api/                    # Hono backend
│   └── src/
│       ├── index.ts        # Worker entry point
│       ├── app.ts          # Hono app configuration
│       ├── middleware/     # Auth and error middleware
│       ├── routes/         # API route handlers
│       ├── services/       # Business logic
│       └── utils/          # Helper functions
├── web/                    # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # API client
│       ├── pages/          # Page components
│       └── store/          # Zustand stores
├── shared/                 # Shared TypeScript types
├── migrations/             # D1 database migrations
├── scripts/                # Build scripts
└── wrangler.jsonc          # Cloudflare configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (v3.0 or later)
- Cloudflare account with D1 database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/expenses-manager.git
   cd expenses-manager
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and add your JWT_SECRET
   ```

4. Apply database migrations (local):
   ```bash
   bun run db:migrate
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

The app will be available at `http://localhost:5173` with the API at `http://localhost:8787`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both API and web dev servers |
| `bun run dev:api` | Start only the API dev server |
| `bun run dev:web` | Start only the web dev server |
| `bun run build` | Build both API and web for production |
| `bun run deploy` | Build and deploy to Cloudflare |
| `bun run db:migrate` | Apply migrations locally |
| `bun run db:migrate:prod` | Apply migrations to production |
| `bun run typecheck` | Run TypeScript type checking |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Families
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/families` | Create new family |
| GET | `/api/families/current` | Get user's family |
| PUT | `/api/families/current` | Update family (admin) |
| GET | `/api/families/members` | List family members |
| POST | `/api/families/join` | Join with invite code |
| POST | `/api/families/regenerate-code` | New invite code (admin) |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (with filters) |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get single expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/summary` | Get dashboard stats |
| GET | `/api/expenses/categories` | List categories |

## Deployment

### Set up Cloudflare secrets

```bash
wrangler secret put JWT_SECRET
```

### Apply production migrations

```bash
bun run db:migrate:prod
```

### Deploy

```bash
bun run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `ENVIRONMENT` | Environment name (production/development) |

## Database Schema

The application uses four main tables:

- **users** - User accounts with email, password hash, and family membership
- **families** - Family groups with name, invite code, and admin
- **expenses** - Individual expense records with amount, category, and date
- **refresh_tokens** - JWT refresh token storage for secure authentication

## Security Features

- Password hashing using PBKDF2 with Web Crypto API
- JWT access tokens (15 min expiry) and refresh tokens (7 days)
- Role-based access control (admin/member)
- CORS protection
- Input validation with Zod schemas

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cloudflare](https://cloudflare.com) for the Workers platform
- [Hono](https://hono.dev) for the amazing web framework
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
