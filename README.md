# CinemaBro

## Environment Setup

CinemaBro now reads configuration from environment variables.

1. Copy [.env.example](.env.example) to .env.
2. Fill in at least:
	1. DISCORD_TOKEN
	2. DISCORD_CLIENT_ID
	3. SUPABASE_KEY
3. If you deploy guild commands with [deploy-guild-commands.js](deploy-guild-commands.js), set DISCORD_GUILD_ID too.

Notes:
- [config.json](config.json) is no longer used by runtime scripts.
- SUPABASE_URL has a default value, but can be overridden in .env.
- DATABASE_URL enables Postgres-backed paths in [db/store.js](db/store.js).

## Docker Self-Hosting

This repo now includes:
- [Dockerfile](Dockerfile) for the bot container
- [docker-compose.yml](docker-compose.yml) for bot + Postgres

Run with Docker Compose:

```bash
docker compose up -d --build
```

Stop services:

```bash
docker compose down
```

Persistence:
- Postgres data is stored in the named volume created by [docker-compose.yml](docker-compose.yml).
- SQL initialization scripts in [db/sql](db/sql) are automatically applied the first time the Postgres volume is created.

Current status:
- The app still uses Supabase for live queries today.
- Postgres is provisioned and includes an initial schema in [db/sql/001_init.sql](db/sql/001_init.sql).
- The first incremental cutover paths are now backed by [db/store.js](db/store.js):
	- [functions/getAllMovies.js](functions/getAllMovies.js)
	- [commands/users/wish.js](commands/users/wish.js)
	- [commands/users/wishlist.js](commands/users/wishlist.js)

## Incremental Cutover

Supabase remains available for untouched commands while you migrate in slices.

1. Keep DATABASE_URL empty to use Supabase-only behavior.
2. Set DATABASE_URL to enable Postgres-backed logic in migrated store methods.
3. Migrate additional commands to [db/store.js](db/store.js) over time.

## Development Environment

The development stack is isolated from production and uses separate Docker services and a separate Postgres volume.

Files involved:
- [docker-compose.dev.yml](docker-compose.dev.yml)
- [.env.dev.example](.env.dev.example)
- [scripts/seed-dev-data.js](scripts/seed-dev-data.js)

How it works:
1. Start dev stack with [docker-compose.dev.yml](docker-compose.dev.yml).
2. Postgres schema is initialized from [db/sql/001_init.sql](db/sql/001_init.sql).
3. Bot starts with npm script dev:seeded, which runs [scripts/seed-dev-data.js](scripts/seed-dev-data.js) before boot.
4. Seed script is idempotent and upserts test data every startup when NODE_ENV=development and DEV_SEED=true.

Seeded test data:
- 3 users: dev-user-1, dev-user-2, dev-user-3
- 3 movies: The Matrix, Arrival, Interstellar
- Ratings: each user rates 2 of the 3 movies

Start dev environment:
1. Copy [.env.dev.example](.env.dev.example) to .env.dev and fill Discord values.
2. Run:

```bash
npm run compose:dev:up
```

Stop dev environment:

```bash
npm run compose:dev:down
```

Notes:
- Dev Postgres is mapped to host port 5433 to avoid collisions.
- The dev stack uses its own volume, so production data remains untouched.
- While migration is in progress, unmigrated command paths may still rely on Supabase-backed logic.

## To Do
- /add personal movies if not in guild - UNTESTED
- /mystats - same stats calculated for only your movie ratings
- /me - user movie list and stats
- stats - user that votes most with the group and least with the group
- show unwatched guild movies to user
- Remove /n from end of reset
- Show current rating after all ratings
