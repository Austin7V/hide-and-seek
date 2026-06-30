import { useEffect, useState } from "react";
import "./App.css";
import { socket } from "./socket";

type MatchmakingStatus =
  | {
      status: "waiting";
      roomId: string;
    }
  | {
      status: "started";
      roomId: string;
      role: "seeker" | "hider";
    };

type RoomInfo = {
  roomId: string;
  status: "waiting" | "started";
  playersCount: number;
};

function App() {
  const [matchmakingStatus, setMatchmakingStatus] =
    useState<MatchmakingStatus | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  useEffect(() => {
    function handleConnect() {
      console.log(`Connected to server: ${socket.id}`);

      socket.emit("test-event", "Hello from client");
    }

    function handleTestReply(message: string) {
      console.log(`Reply from server: ${message}`);
    }

    function handleMatchmakingStatus(status: MatchmakingStatus) {
      console.log("Matchmaking status:", status);

      setMatchmakingStatus(status);
    }

    function handleRoomsList(roomsList: RoomInfo[]) {
      console.log("Roomslist:", roomsList);
      setRooms(roomsList);
    }

    socket.on("rooms-list", handleRoomsList);
    socket.on("connect", handleConnect);
    socket.on("test-reply", handleTestReply);
    socket.on("matchmaking-status", handleMatchmakingStatus);

    socket.connect();

    return () => {
      socket.off("rooms-list", handleRoomsList);
      socket.off("connect", handleConnect);
      socket.off("test-reply", handleTestReply);
      socket.off("matchmaking-status", handleMatchmakingStatus);

      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Hide and Seek</h1>

      {!matchmakingStatus && <p>Connecting...</p>}

      {matchmakingStatus?.status === "waiting" && (
        <div>
          <p>Waiting for another player...</p>
          <p>Room: {matchmakingStatus.roomId}</p>
        </div>
      )}

      {matchmakingStatus?.status === "started" && (
        <div>
          <p>Game started!</p>
          <p>Room: {matchmakingStatus.roomId}</p>
          <p>Your role: {matchmakingStatus.role}</p>
        </div>
      )}

      <h2>Rooms</h2>
      {rooms.length === 0 && <p>No rooms yet.</p>}
      {rooms.map((room) => (
        <div key={room.roomId}>
          <p>
            {room.roomId} — {room.status} — {room.playersCount}/2 players
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;
