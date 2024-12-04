import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { PopupService } from '../popup/popup.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private poppup = inject(PopupService);
  private socket: Socket;

  constructor() {
    // Initialize the socket connection with CORS enabled server
    this.socket = io('http://192.168.1.177:3000');

    this.socket.on('room-exists', (data) => {
      console.log(data);
      this.poppup.showMessage(data.message);
    });

    this.socket.on('room-not-found', (data) => {
      this.poppup.showMessage(data.message);
    });

    this.socket.on('room-full', (data) => {
      this.poppup.showMessage(data.message);
    });
  }

  /**
   * Creates a new room with the specified room ID and player name.
   * @param roomId - The ID of the room to create.
   * @param playerName - The name of the player creating the room.
   */
  createRoom(roomId: string, playerName: string): void {
    console.log(roomId, playerName);
    this.socket.emit('create-room', { roomId, playerName });
  }

  /**
   * Joins an existing room with the specified room ID and player name.
   * @param roomId - The ID of the room to join.
   * @param playerName - The name of the player joining the room.
   */
  joinRoom(roomId: string, playerName: String): void {
    console.log(roomId, playerName);
    this.socket.emit('join-room', { roomId, playerName });
  }

  /**
   * Selects a symbol (e.g., 'X' or 'O') for the player and sends it to the server.
   * @param roomId - The ID of the room where the player is.
   * @param symbol - The symbol selected by the player (e.g., 'X' or 'O').
   */
  symbolSelect(roomId: string, symbol: String): void {
    this.socket.emit('symbol-select', { roomId, symbol });
  }

  /**
   * Restarts the game in the specified room.
   * @param roomId - The ID of the room to restart the game.
   */
  gameRestart(roomId: string): void {
    this.socket.emit('restart-game', roomId);
  }

  stateRestore(roomId: string, room: any): void {
    this.socket.emit('state', { roomId, room });
  }

  /**
   * Listens for the 'game-start' event and emits an observable with the data when the game starts.
   * @returns Observable emitting the data when the game starts.
   */
  onGameStart(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('game-start', (data: any) => {
        console.log(data);
        observer.next(data);
      });
    });
  }

  /**
   * Listens for the 'player-joined' event and emits an observable with the updated list of players in the room.
   * @returns Observable emitting the list of players in the room when a player joins.
   */
  onPlayerJoined(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('player-joined', (players: any[]) => {
        console.log(players);
        observer.next(players);
      });
    });
  }

  /**
   * Listens for the 'room-created' event and emits an observable with the updated list of players in the room.
   * @returns Observable emitting the list of players in the room when the room is created.
   */
  onRoomCreated(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('room-created', (players: any[]) => {
        console.log(players);
        observer.next(players);
      });
    });
  }

  /**
   * Listens for the 'game-over' event and emits an observable with the data when the game ends.
   * @returns Observable emitting the result data when the game ends.
   */
  onWin(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('game-over', (data: any) => {
        console.log(data);
        observer.next(data);
      });
    });
  }

  /**
   * Listens for the 'room-full' event and emits an observable when the room becomes full.
   * @returns Observable emitting a signal when the room is full.
   */
  onRoomFull(): Observable<void> {
    return new Observable((observer) => {
      this.socket.on('room-full', () => {
        observer.next();
      });
    });
  }

  /**
   * Emits a move made by the player in the game.
   * @param roomId - The ID of the room where the game is taking place.
   * @param cellIndex - The index of the cell that was selected.
   * @param symbol - The player's symbol ('X' or 'O').
   */
  makeMove(roomId: string, cellIndex: number, symbol: string): void {
    this.socket.emit('make-move', { roomId, cellIndex, symbol });
  }

  /**
   * Listens for the 'player-move' event and emits an observable with the move details made by another player.
   * @returns Observable emitting the move data when another player makes a move.
   */
  onPlayerMove(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('player-move', (move: any) => {
        observer.next(move);
      });
    });
  }

  /**
   * Listens for the 'player-left' event and emits an observable with the updated list of players in the room.
   * @returns Observable emitting the list of players in the room when a player leaves.
   */
  onPlayerLeft(): Observable<any[]> {
    return new Observable((observer) => {
      this.socket.on('player-left', (players: any[]) => {
        observer.next(players);
      });
    });
  }

  /**
   * Listens for the 'move-made' event and emits an observable with the move data made by any player.
   * @returns Observable emitting the move details made by any player.
   */
  onMove(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('move-made', (data: any[]) => {
        observer.next(data);
      });
    });
  }

  /**
   * Listens for the 'game-restarted' event and emits an observable with the data when the game is restarted.
   * @returns Observable emitting the restart data when the game is restarted.
   */
  onGameRestart(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('game-restarted', (data: any) => {
        observer.next(data);
      });
    });
  }

  /**
   * Disconnects from the socket server.
   */
  disconnect(): void {
    this.socket.disconnect();
  }

  /**
   * Reconnects to the socket server.
   */
  reconnect(): void {
    this.socket.connect();
  }
}
