// Base address of the backend API used by the task board.
const API = "http://localhost:8000";

/**
 * Sends a request to create a task and returns the created task parsed from JSON.
 * @param {string} title - The title to give the new task.
 */
export async function createTask(title) {
    // POST the task title as a JSON request body.
    const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });

    // Parse and return the server's response body.
    return res.json();
}

/**
 * Sends a partial update to change whether a task is done.
 * @param {number} id - The ID of the task to update.
 * @param {boolean} done - The task's new done state.
 */
export async function toggleTask(id, done) {
    // PATCH only the done field for the selected task.
    await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
    });
}

/**
 * Sends a request to delete the task with the given ID.
 * @param {number} id - The ID of the task to delete.
 */
export async function deleteTask(id) {
    // DELETE the selected task from the backend.
    await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
}