import json
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskIn(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    title: str | None = None
    done: str | None = None


# In-memory store, Swap for PostgreSQL once the real-time flow works.
tasks: dict[int, dict[str, Any]] = {}
next_id = 1

# Connected WebSocket clients
clients: set[WebSocket] = set()


async def broadcast(event: dict[str, Any]) -> None:
    message = json.dumps(event)
    dead: list[WebSocket] = []
    for ws in clients:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)


@app.websocket("/ws/tasks")
async def tasks_socket(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        # Send the current snapshot so a new client starts in sync
        await websocket.send_text(
            json.dumps({"type": "snapshot", "tasks": list(tasks.values())}))
        while True:
            # Keep the conection open. We don't expect client messages yet.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)


@app.get("/tasks")
def list_tasks():
    return list(tasks.values())


@app.post("/tasks", status_code=201)
async def create_task(payload: TaskIn):
    global next_id
    task = {"id": next_id, "title": payload.title, "done": False}
    tasks[next_id] = task
    next_id += 1
    await broadcast({"type": "task_created", "task": task})
    return task


@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, payload: TaskUpdate):
    task = tasks.get(task_id)
    if task is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    changes = payload.model_dump(exclude_none=True)
    task.update(changes)
    await broadcast({"type": "task_updated", "task": task})
    return task


@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int):
    if tasks.pop(task_id, None) is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    await broadcast({"type": "task_deleted", "id": task_id})
