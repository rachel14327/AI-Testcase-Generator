# AI Testcase Generator – Frontend

React (Vite) app for login, register, and a protected page.

## Run

1. Install dependencies:
   ```bash
   cd test-case-generator/frontend && npm install
   ```
2. Start the backend (from `test-case-generator/backend`):
   ```bash
   uvicorn main:app --reload
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173

## Routes

- `/` – Home (links to Sign in / Register)
- `/login` – Sign in
- `/register` – Create account
- `/protected` – Protected page (requires login)

The dev server proxies `/api` and `/protected` to the backend at `http://127.0.0.1:8000`.
