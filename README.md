# TimeCapsule

A full-stack app for writing a message now and emailing it to someone at a future date.

## Features
- Register and log in with JWT authentication.
- Create future email capsules.
- View scheduled, sent, and failed capsules.
- Delete a capsule while it is still scheduled.
- Nodemailer sends due emails using a background cron job.
- Socket.IO sends live status updates to the logged-in user's dashboard.

## Requirements
- Node.js 20+
- MongoDB Atlas account or local MongoDB
- Gmail account with 2-Step Verification and a Google App Password (for Gmail SMTP)

## 1. Configure backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env`:
- `MONGODB_URI`: your MongoDB connection string.
- `JWT_SECRET`: a long random secret.
- `CLIENT_URL=http://localhost:5173`
- `MAIL_USER`: Gmail address used to send mail.
- `MAIL_PASS`: Google App Password (16 characters), not your regular Gmail password.
- Keep `MAIL_FROM` aligned with `MAIL_USER`.

Start backend:
```bash
npm run dev
```
Backend health check: http://localhost:5000/

## 2. Configure frontend (new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the Vite URL, normally http://localhost:5173/

## 3. Test
1. Register an account.
2. Create a capsule using an email address you can access.
3. Set delivery time at least 2–3 minutes in the future.
4. Keep the backend running. The scheduler checks once per minute.
5. The capsule changes from `scheduled` to `sent`; the recipient receives an email.

## Important notes
- The backend must remain running for scheduled delivery. For real production use, deploy it on an always-on service or move scheduling to a persistent worker/queue.
- A capsule is marked `failed` if the email provider rejects it. This starter project does not auto-retry failed deliveries.
- The Socket.IO room join is intended for a learning/demo project. Before public deployment, authenticate socket connections with JWT and validate room membership server-side.
- Email delivery time follows the backend server's clock/time zone. The browser sends a date-time value which the backend parses as a Date.
- Never commit `.env` or share your Gmail App Password.
