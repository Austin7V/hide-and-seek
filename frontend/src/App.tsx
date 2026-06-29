import { useEffect } from "react";
import "./App.css";
import { socket } from "./socket";

function App() {
  useEffect(() => {
    function handleConnect() {
      console.log(`Connected to server: ${socket.id}`);

      socket.emit("test-event", "Hello from client");
    }

    function handleTestReply(message: string) {
      console.log(`Reply from server: ${message}`);
    }

    socket.on("connect", handleConnect);
    socket.on("test-reply", handleTestReply);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("test-reply", handleTestReply);
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Hide and Seek</h1>
    </div>
  );
}

export default App;
