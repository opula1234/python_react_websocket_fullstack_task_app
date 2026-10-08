import { useState } from "react";
import { useTaskSocket } from "./useTaskSocket";
import { createTask, toggleTask, deleteTask } from "./api";

export default function App() {
  const { tasks, status } = useTaskSocket();
  const [title, setTitle] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(title.trim());
    setTitle("");
  }

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Live Task Board</h1>
      <p>Status: {status}</p>
      <form onSubmit={handleAdd}>
        <input value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Task" />
        <button type="submit">Add task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id, !task.done)} />
              <span style={{ textDecoration: task.done ? "line-through" : "none" }}>
                {task.title}
              </span>
            </label> {" "}
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}