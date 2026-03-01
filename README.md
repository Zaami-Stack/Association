# Association Language Academy (Full Stack)

This is a new full-stack project built from the same architecture as the flower app:

- `client/`: React + Vite frontend
- `server/`: Express API
- Database: SQLite (`server/src/data/association.sqlite`)

It is a separate project and does not modify `zaamiflower`.

## Features

- Browse language courses (English, Spanish, French)
- Filter courses by language
- Enroll a student into a course
- View enrollments by email
- Track lesson completion progress per enrollment
- Dashboard stats from database

## Run Locally

```bash
npm install
npm run install:all
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api/health`

## Database

SQLite file path:

`server/src/data/association.sqlite`

Seed data is inserted automatically on first run.

