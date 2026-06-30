import { Injectable } from '@nestjs/common';

type PlayerRole = 'seeker' | 'hider';

type GameStatus = 'waiting' | 'running' | 'finished';

type Position = {
  row: number;
  col: number;
};

type GameState = {
  roomId: string;
  status: GameStatus;
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

type AddPlayerResult =
  | {
      status: 'waiting';
      roomId: string;
    }
  | {
      status: 'started';
      roomId: string;
      players: {
        socketId: string;
        role: PlayerRole;
      }[];
    };

type Room = {
  id: string;
  players: string[];
  gameState?: GameState;
};

@Injectable()
export class GameService {
  private rooms = new Map<string, Room>();

  private playerRooms = new Map<
    string,
    { roomId: string; role?: PlayerRole }
  >();

  private waitingRoomId: string | null = null;

  private roomCounter = 1;

  addPlayer(socketId: string): AddPlayerResult {
    if (!this.waitingRoomId) {
      const roomId = `room-${this.roomCounter}`;
      this.roomCounter++;

      this.rooms.set(roomId, {
        id: roomId,
        players: [socketId],
      });

      this.playerRooms.set(socketId, {
        roomId,
      });

      this.waitingRoomId = roomId;

      return {
        status: 'waiting',
        roomId,
      };
    }

    const roomId = this.waitingRoomId;
    const room = this.rooms.get(roomId);

    if (!room) {
      this.waitingRoomId = null;
      return this.addPlayer(socketId);
    }

    room.players.push(socketId);

    const [firstPlayer, secondPlayer] = room.players;

    const firstPlayerIsSeeker = Math.random() < 0.5;

    const firstPlayerRole: PlayerRole = firstPlayerIsSeeker
      ? 'seeker'
      : 'hider';

    const secondPlayerRole: PlayerRole = firstPlayerIsSeeker
      ? 'hider'
      : 'seeker';

    this.playerRooms.set(firstPlayer, {
      roomId,
      role: firstPlayerRole,
    });

    this.playerRooms.set(secondPlayer, {
      roomId,
      role: secondPlayerRole,
    });

    this.waitingRoomId = null;

    const gameState: GameState = {
      roomId,
      status: 'running',
      seeker: {
        socketId: firstPlayerRole === 'seeker' ? firstPlayer : secondPlayer,
        position: {
          row: 0,
          col: 0,
        },
      },
      hider: {
        socketId: firstPlayerRole === 'hider' ? firstPlayer : secondPlayer,
        position: {
          row: 9,
          col: 9,
        },
      },
      timeRemaining: 60,
    };

    room.gameState = gameState;

    return {
      status: 'started',
      roomId,
      players: [
        {
          socketId: firstPlayer,
          role: firstPlayerRole,
        },
        {
          socketId: secondPlayer,
          role: secondPlayerRole,
        },
      ],
    };
  }

  getGameState(roomId: string) {
    const room = this.rooms.get(roomId);

    return room?.gameState;
  }

  getRoomsList() {
    return Array.from(this.rooms.values()).map((room) => {
      return {
        roomId: room.id,

        status: room.players.length === 1 ? 'waiting' : 'started',
        playersCount: room.players.length,
      };
    });
  }
}
