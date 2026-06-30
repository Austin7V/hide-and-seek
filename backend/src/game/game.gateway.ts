import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  private broadcastRoomsList() {
    const rooms = this.gameService.getRoomsList();
    this.server.emit('rooms-list', rooms);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const result = this.gameService.addPlayer(client.id);

    client.join(result.roomId);

    if (result.status === 'waiting') {
      client.emit('matchmaking-status', {
        status: 'waiting',
        roomId: result.roomId,
      });

      console.log(`Player ${client.id} is waiting in ${result.roomId}`);

      this.broadcastRoomsList();

      return;
    }

    for (const player of result.players) {
      this.server.to(player.socketId).emit('matchmaking-status', {
        status: 'started',
        roomId: result.roomId,
        role: player.role,
      });
    }

    console.log(`Game started in ${result.roomId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('test-event')
  handleTestEvent(client: Socket, payload: string) {
    console.log(`Test event from ${client.id}: ${payload}`);

    client.emit('test-reply', 'Hello from server');
  }
}
