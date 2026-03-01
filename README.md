# Association Language Academy (Full Stack)

This is a new full-stack project built from the same architecture as the flower app:

- `client/`: React + Vite frontend
- `server/`: Express API
- `api/`: Vercel serverless API
- Database: Supabase (production) + SQLite fallback for local Express server

It is a separate project and does not modify `zaamiflower`.

## Features

- Browse language courses (English, Spanish, French)
- Filter courses by language
- Enroll a student into a course
- View enrollments by email
- Track lesson completion progress per enrollment
- Dashboard stats from database
- Supabase database schema compatible with Vercel `/api/*` routes

## Run Locally

```bash
npm install
npm run install:all
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api/health`

## Supabase Setup (Same Style as Zaamiflower)

1. Create a Supabase project.
2. Run SQL from: `supabase/schema.sql`.
3. Add environment variables in Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET` (strong random string, at least 24 chars)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
4. Deploy this repo to Vercel.

The serverless backend routes are:

- `GET /api/health`
- `GET /api/stats`
- `GET /api/languages`
- `GET /api/courses?languageId=&search=`
- `GET /api/courses/:courseId`
- `GET /api/gallery`
- `POST /api/gallery` (admin)
- `PATCH /api/gallery/:photoId` (admin)
- `DELETE /api/gallery/:photoId` (admin)
- `GET /api/notifications`
- `POST /api/notifications` (admin)
- `DELETE /api/notifications/:notificationId` (admin)
- `GET /api/enrollments?email=`
- `POST /api/enrollments`
- `GET /api/enrollments/:enrollmentId/progress`
- `PATCH /api/enrollments/:enrollmentId/progress`
- `GET /api/admin/students` (admin)
- `POST /api/auth/login`
- `POST /api/auth/signup` (student account)
- `POST /api/auth/logout`
- `GET /api/auth/me`

Seed data for languages/courses/lessons is inserted automatically on first request when Supabase is empty.

## Local DB Fallback

If you run `server/` locally without Supabase, Express uses SQLite:

`server/src/data/association.sqlite`
