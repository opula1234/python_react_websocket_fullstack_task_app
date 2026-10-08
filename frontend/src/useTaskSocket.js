import { useEffect, useState } from "react";

// WebSocket endpoint exposed by the FastAPI task server.
const WS_URL = "ws://localhost:8000/ws/tasks";

/**
 * Opens a WebSocket to receive live task changes and keeps React state in sync.
 * The connection is retried after it closes and cleaned up when the caller unmounts.
 */
export function useTaskSocket() {
    // Local task snapshot and the current connection status for the UI.
    const [tasks, setTasks] = useState([]);
    const [status, setStatus] = useState("connecting");

    // Start the socket for this component instance; the empty dependency list means
    // this setup runs once on mount.
    useEffect(() => {
        // Keep handles for cleanup and avoid reconnecting after unmount.
        let ws;
        let retryTimer;
        let closed = false;

        // Open a connection and register handlers for connection and server events.
        function connect() {
            ws = new WebSocket(WS_URL);

            // Mark the connection ready when the server accepts it.
            ws.onopen = () => setStatus("connected");

            // Decode each JSON event and apply its task change to local state.
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "snapshot":
                        // Replace local tasks with the full list sent on connection.
                        setTasks(msg.tasks);
                        break;

                    case "task_created":
                        // Append the newly created task without mutating the old array.
                        setTasks((prev) => [...prev, msg.task]);
                        break;

                    case "task_updated":
                        // Replace only the task whose ID matches the updated task.
                        setTasks((prev) =>
                            prev.map((t) => (t.id === msg.task.id ? msg.task : t)));
                        break;

                    case "task_deleted":
                        // Keep all tasks except the one identified by the delete event.
                        setTasks((prev) => prev.filter((t) => t.id !== msg.id));
                        break;

                    default:
                        // Ignore message types this hook does not handle.
                        break;
                }
            };

            // Reflect a dropped connection and retry unless the hook was unmounted.
            ws.onclose = () => {
                setStatus("disconnected");
                if (!closed) {
                    retryTimer = setTimeout(connect, 2000);
                }
            };
        }

        // Establish the initial connection when the effect runs.
        connect();

        // On unmount, cancel pending retries and close the active socket.
        return () => {
            closed = true;
            clearTimeout(retryTimer);
            ws?.close();
        };
    }, []);

    return { tasks, status };
}