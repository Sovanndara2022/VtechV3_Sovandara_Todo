## Getting Started
First, run the development server:
Run the project (ZIP)
	1.	Unzip
	2.	Open terminal in the project folder (vtech-todo/)
	3.	Run:

npm install
npm run dev

	4.	Open: http://localhost:3000
    
```bash
npm run dev


# or
bun dev# VTech Todo Challenge (Next.js + TypeScript)

Built in **TypeScript** using **Next.js App Router**. The UI, API routes, and data layer are fully typed (no plain JS app code). API payloads are validated to match the assignment contract.

## Tech Stack
- Next.js (App Router) + React + TypeScript
- Supabase (Postgres) for **Live** mode
- In-memory repo for **Dummy** mode
- Zod for request validation

## Features
- Create / Update / Delete todos
- Prevent empty + duplicate todos (UI validation)
- Edit uses the same input field
- Filter list while typing
- Toggle completion (strikethrough)
- Dummy vs Live storage (Supabase) supported

## Project Structure (key files)
- UI: `src/app/page.tsx`
- API:
  - `src/app/api/todo/route.ts` (GET, POST)
  - `src/app/api/todo/[id]/route.ts` (PUT, DELETE)
- Repo switch: `src/lib/repos/switch.ts`
- Dummy repo: `src/lib/repos/dummy-repo.ts`
- Supabase repo: `src/lib/repos/supabase-repo.ts`
- Types: `src/lib/types.ts`

## API Contract
### GET `/api/todo`
Response:
```json
[
  { "id": "string", "todo": "string", "isCompleted": true, "createdAt": "timestamp" }
]
```

### POST `/api/todo`
Request body:
```json
{ "id": "uuid", "todo": "string", "isCompleted": false, "createdAt": "timestamp" }
```
Response:
```json
{ "success": true }
```

### PUT `/api/todo/{id}`
Request body:
```json
{ "id": "uuid", "todo": "string", "isCompleted": true, "createdAt": "timestamp" }
```
Response:
```json
{ "success": true }
```

### DELETE `/api/todo/{id}`
Response:
```json
{ "success": true }
```

## Setup & Run
From the project root (`vtech-todo/`):

```bash
npm install
npm run dev
```

App runs at: `http://localhost:3000`

## Dummy vs Live Mode
This project supports 2 data backends:
- **Dummy**: in-memory storage (no external setup)
- **Live**: Supabase Postgres


### Default mode (Dummy) (on Toggle drop down)

```bash
npm run dev
```

### Live (Supabase) mode (on Toggle drop down)

```bash
npm run dev
```
for that
## Live Mode + Realtime Demo (Multi-user)
1. Start the app in **Live** mode (see env vars above).
2. Open **two tabs** (or one normal tab + one incognito):
   - Tab A: `http://localhost:3000`
   - Tab B: `http://localhost:3000`
3. Ensure both tabs select **Backend: Live** (dropdown).
4. In Tab A: create/edit/toggle/delete a todo.
5. Tab B should refresh automatically via Supabase realtime subscription.

> If Supabase env vars are missing, the app will skip realtime subscription (Dummy mode still works).


Then restart:
```bash
npm run dev
```

## Notes on Realtime (Live mode)
In Live mode, the UI can subscribe to Supabase realtime events and refresh the list when the database changes.

## Hours Spent
Estimated total time spent: **~18 hours**
(breakdown: UI ~7h, API + validation ~4h, Supabase + realtime ~5h, cleanup/docs ~2h)