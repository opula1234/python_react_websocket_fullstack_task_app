# Live Collaborative Task Board

A small full-stack task board that demonstrates how a React frontend can work
with a FastAPI backend and use a WebSocket to receive live task updates.

## What the application does

The board lets you:

- Add a task with a title.
- Mark a task as done or not done.
- Delete a task.
- See task changes arrive in real time in connected browser tabs.

The React app sends create, update, and delete requests to the backend over
HTTP. The backend broadcasts each successful change to connected clients over
the `/ws/tasks` WebSocket. When a browser connects, the server first sends the
current task snapshot. The frontend updates its displayed list from these
messages and attempts to reconnect if the socket closes.

Tasks are currently stored in the backend process's memory. They are not
persisted to a database, so restarting the backend clears the task list.

## Project structure

- `backend/main.py` — FastAPI application, task API routes, in-memory task
  store, and WebSocket broadcasting.
- `backend/Dockerfile` — instructions for building the Python backend image.
- `frontend/` — React application built with Vite; contains the task board UI,
  HTTP API helpers, and WebSocket hook.
- `frontend/Dockerfile` — instructions for building the frontend image.
- `compose.yaml` — defines and connects the backend and frontend services.

## Requirements

- Python 3.12 or newer
- [uv](https://docs.astral.sh/uv/)
- Node.js and npm

## Run locally

Start the backend from the project root:

```powershell
uv sync
uv run uvicorn backend.main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API documentation
is at `http://localhost:8000/docs`.

In a second terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (by default, `http://localhost:5173`). Keep both
the backend and frontend development servers running while using the board.

## Run with Docker Compose

### Requirements

- Docker Desktop (Windows or macOS), or Docker Engine with the Compose plugin
  (Linux)
- Docker Compose v2, available as `docker compose`

### How the Docker setup is configured

Compose defines two services in `compose.yaml`:

- **`backend`** builds from the project root using `backend/Dockerfile`. The
  Dockerfile starts from Astral's Python 3.12 image with `uv` included, installs
  the locked Python dependencies with `uv sync`, and starts Uvicorn on
  `0.0.0.0:8000`. Compose publishes that container port as port `8000` on your
  computer.
- **`frontend`** builds from the `frontend/` folder using
  `frontend/Dockerfile`. The Dockerfile installs the npm dependencies, then
  starts Vite listening on `0.0.0.0:5173`. Compose publishes that container
  port as port `5173` on your computer.

The frontend uses `localhost:8000` for HTTP and WebSocket requests. Publishing
the backend port makes that address reachable from the browser on your
computer. `depends_on` starts the backend service before the frontend service;
it does not wait for the backend to become fully ready.

### Build and start

From the project root (the folder containing `compose.yaml`), run:

```powershell
docker compose up --build
```

The first build downloads the base images and project dependencies, so it may
take a while. When the services are running:

- Open the task board at `http://localhost:5173`.
- Open the FastAPI interactive API documentation at
  `http://localhost:8000/docs`.

Keep the terminal running to see container logs. Press **Ctrl+C** to stop the
services. To stop and remove the containers and Compose network, run:

```powershell
docker compose down
```

### Rebuild after changes

The Compose configuration does not mount source folders into the containers.
After changing application code or dependencies, rebuild and start the
services again:

```powershell
docker compose up --build
```

If a host port is already in use, stop the application using it or change the
left-hand (host) port in `compose.yaml`. For example, `"5174:5173"` exposes the
frontend at `http://localhost:5174`.

## API overview

- `GET /tasks` — list all current tasks.
- `POST /tasks` — create a task from a JSON body such as `{"title":"Write docs"}`.
- `PATCH /tasks/{task_id}` — update a task, for example with
  `{"done":true}`.
- `DELETE /tasks/{task_id}` — delete a task.
- `WS /ws/tasks` — receive an initial snapshot and subsequent task events.

WebSocket event types sent by the backend are `snapshot`, `task_created`,
`task_updated`, and `task_deleted`.

## Current limitations

- Task data is in memory and is lost when the backend restarts.
- This is a local development setup; the frontend API and WebSocket addresses
  are configured for `localhost`.
- The backend currently allows browser API requests from the local Vite
  development origins `http://localhost:5173` and `http://127.0.0.1:5173`.
