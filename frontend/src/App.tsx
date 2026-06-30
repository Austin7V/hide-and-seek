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

type Position = {
  row: number;
  col: number;
};

type GameState = {
  roomId: string;
  status: "waiting" | "running" | "finished";
  seeker: {
    socketId: string;
    position: Position;
  };
  hider: {
    socketId: string;
    position: Position;
  };
  timeRemaining: number;
};

function App() {
  const [matchmakingStatus, setMatchmakingStatus] =
    useState<MatchmakingStatus | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

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

    function handleGameState(newGameState: GameState) {
      console.log("Game State:", newGameState);

      setGameState(newGameState);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!gameState || gameState.status !== "running") {
        return;
      }

      if (event.key === "ArrowUp") {
        socket.emit("move", "up");
      }

      if (event.key === "ArrowDown") {
        socket.emit("move", "down");
      }

      if (event.key === "ArrowLeft") {
        socket.emit("move", "left");
      }

      if (event.key === "ArrowRight") {
        socket.emit("move", "right");
      }
    }

    socket.on("rooms-list", handleRoomsList);
    socket.on("connect", handleConnect);
    socket.on("test-reply", handleTestReply);
    socket.on("matchmaking-status", handleMatchmakingStatus);
    socket.on("game-state", handleGameState);

    window.addEventListener("keydown", handleKeyDown);

    socket.connect();

    return () => {
      socket.off("rooms-list", handleRoomsList);
      socket.off("connect", handleConnect);
      socket.off("test-reply", handleTestReply);
      socket.off("matchmaking-status", handleMatchmakingStatus);
      socket.off("game-state", handleGameState);

      window.removeEventListener("keydown", handleKeyDown);

      socket.disconnect();
    };
  }, [gameState]);

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

      {gameState && (
        <div>
          <h2>Game State</h2>
          <p>Status: {gameState.status}</p>
          <p>Time: {gameState.timeRemaining}</p>
          <p>
            Seeker position: row {gameState.seeker.position.row}, col{" "}
            {gameState.seeker.position.col}
          </p>
          <p>
            Hider position: row {gameState.hider.position.row}, col{" "}
            {gameState.hider.position.col}
          </p>
        </div>
      )}

      {gameState && (
        <div>
          <h2>Grid</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, 40px)",
              gap: "4px",
            }}
          >
            {Array.from({ length: 100 }).map((_, index) => {
              const row = Math.floor(index / 10);
              const col = index % 10;

              const isSeeker =
                gameState.seeker.position.row === row &&
                gameState.seeker.position.col === col;

              const isHider =
                gameState.hider.position.row === row &&
                gameState.hider.position.col === col;

              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "1px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {isSeeker && "S"}
                  {isHider && "H"}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
