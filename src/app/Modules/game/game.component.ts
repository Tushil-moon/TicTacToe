import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../Services/Socket/socket.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, tap } from 'rxjs';
import { PopupService } from '../../Services/popup/popup.service';
declare var particlesJS: any;

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {
  private socket = inject(SocketService);
  private popup = inject(PopupService);

  state = new BehaviorSubject<boolean>(false);

  /**
   * A signal that represents whether the user has chosen a room.
   * Defaults to `false`.
   */
  chooseRoom = signal<boolean>(
    JSON.parse(
      localStorage.getItem('chooseRoom')
        ? localStorage.getItem('chooseRoom')
        : JSON.parse('false')
    )
  );

  /**
   * A signal that holds the message to be displayed at the end of the game.
   * Defaults to an empty string.
   */
  endMessage = signal<string>('');

  /**
   * A signal that indicates whether the end screen is displayed.
   * Defaults to `false`.
   */
  endScreen = signal<boolean>(
    JSON.parse(
      localStorage.getItem('endScreen')
        ? localStorage.getItem('endScreen')
        : JSON.parse('false')
    )
  );

  /**
   * A signal that represents whether the game screen is active.
   * Defaults to `false`.
   */
  gameScreen = signal<boolean>(
    JSON.parse(
      localStorage.getItem('gameScreen')
        ? localStorage.getItem('gameScreen')
        : JSON.parse('false')
    )
  );

  /**
   * A signal representing the player's name.
   * Defaults to an empty string.
   */
  playerName = signal<string>(
    localStorage.getItem('playerName')
      ? JSON.parse(localStorage.getItem('playerName')!)
      : ''
  );

  /**
   * A signal that holds the current room object, which can be set to any type.
   * Defaults to `null`.
   */
  room = signal<any>(
    localStorage.getItem('room')
      ? JSON.parse(localStorage.getItem('room')!)
      : null
  );

  /**
   * A signal representing the room ID.
   * Defaults to an empty string.
   */
  roomId = signal<string>(
    localStorage.getItem('roomId')
      ? JSON.parse(localStorage.getItem('roomId')!)
      : ''
  );

  /**
   * A signal that indicates whether the start screen is displayed.
   * Defaults to `true`.
   */
  startScreen = signal<boolean>(
    JSON.parse(
      localStorage.getItem('startScreen')
        ? localStorage.getItem('startScreen')
        : JSON.parse('true')
    )
  );

  /**
   * A signal representing the symbol associated with the player.
   * Defaults to an empty string.
   */
  symbol = signal<string>(
    localStorage.getItem('symbol')
      ? JSON.parse(localStorage.getItem('symbol')!)
      : ''
  );

  /**
   * A signal that indicates whether the symbol selection screen is displayed.
   * Defaults to `false`.
   */
  symbolScreen = signal<boolean>(
    JSON.parse(
      localStorage.getItem('symbolScreen')
        ? localStorage.getItem('symbolScreen')
        : JSON.parse('false')
    )
  );

  state$ = toSignal(
    this.state.pipe(
      tap(() => {
        console.log(this.room());

        if (this.room()) {
          this.socket.stateRestore(this.roomId(), this.room());
        }
      })
    )
  );
  /**
   * A signal that listens for a game restart event via the socket.
   * When the game is restarted, it updates the `room`, hides the end screen,
   * shows the game screen, and displays a popup message.
   */
  onGameRestart = toSignal(
    this.socket.onGameRestart().pipe(
      tap((res: any) => {
        console.log(res);
        this.room.set(res);
        this.endScreen.set(false);
        this.gameScreen.set(true);
        this.popup.showMessage('Game restarted!');
      })
    )
  );

  /**
   * A signal that listens for a move event via the socket.
   * When a move is made, it updates the board and the current turn in the `room`.
   */
  onMove = toSignal(
    this.socket.onMove().pipe(
      tap((res: any) => {
        this.room().board = res.board;
        this.room().currentTurn = res.currentTurn;
      })
    )
  );

  /**
   * A signal that listens for a game start event via the socket.
   * When the game starts, it assigns the first player to the `room` object,
   * hides the symbol screen, and displays the game screen.
   */
  onGameStart = toSignal(
    this.socket.onGameStart().pipe(
      tap((res: any) => {
        localStorage.removeItem('room');
        console.log('symbol');
        this.room().players[0] = res;
        localStorage.setItem('room', JSON.stringify(this.room()));
        this.symbolScreen.set(false);
        localStorage.setItem('symbolScreen', JSON.stringify('false'));
        this.gameScreen.set(true);
        localStorage.setItem('gameScreen', JSON.stringify('true'));
      })
    )
  );

  /**
   * A signal that listens for a player join event via the socket.
   * When a player joins, it updates the `room` object, assigns the player's symbol
   * if the player is the current player, hides the room selection screen,
   * and shows the game screen.
   */
  onplayerJoin = toSignal(
    this.socket.onPlayerJoined().pipe(
      tap((res: any) => {
        if (res) {
          const data = res;

          this.room.set(data);
          if (this.room().players[1].name === this.playerName()) {
            this.symbol.set(this.room().players[1].symbol);
          }
          this.chooseRoom.set(false);
          this.gameScreen.set(true);
        }
        console.log(this.room(), this.symbol());
        console.log('player joined', res);
      })
    )
  );

  /**
   * A signal that listens for a win event via the socket.
   * When a player wins, it updates the game state:
   * - Hides the game screen.
   * - Shows the end screen.
   * - Displays a winner message based on the winner's symbol.
   * If the game is a draw, it displays a draw message.
   * Updates the `room` object with the result.
   */
  onWining = toSignal(
    this.socket.onWin().pipe(
      tap((res: any) => {
        console.log(res);
        if (res.isGameOver) {
          this.gameScreen.set(false);
          this.endScreen.set(true);
          if (res.winner === this.symbol() && res.winner !== 'Draw') {
            this.endMessage.set(`The winner is ${this.playerName()} 😘`);
          } else {
            const opponent = this.room().players.find(
              (player: any) => player.symbol !== this.symbol()
            );
            this.endMessage.set(`The winner is ${opponent.name} 😘`);
          }

          if (res.winner === 'Draw') {
            this.endMessage.set(`Its a Draw 😂😂`);
          }
        }
        this.room.set(res);
      })
    )
  );

  /**
   * A signal that listens for a room creation event via the socket.
   * When a room is created, it updates the `room` object and updates the screen states:
   * - Hides the start screen.
   * - Hides the room selection screen.
   * - Displays the symbol selection screen.
   */
  onRoomCreated = toSignal(
    this.socket.onRoomCreated().pipe(
      tap((res: any) => {
        console.log(res);
        this.room.set(res.room);
        localStorage.setItem('room', JSON.stringify(res.room));
        this.chooseRoom.set(false);
        localStorage.setItem('chooseRoom', JSON.stringify(false));
        this.symbolScreen.set(true);
        localStorage.setItem('symbolScreen', JSON.stringify(true));
      })
    )
  );

  /**
   * Starts the game by hiding the start screen and displaying the room selection screen.
   */
  startUp(): void {
    this.startScreen.set(false);
    localStorage.setItem('startScreen', JSON.stringify(false));
    this.chooseRoom.set(true);
    localStorage.setItem('chooseRoom', JSON.stringify(true));
  }

  /**
   * Creates a room by sending the room ID and player name to the socket.
   * If the room ID or player name is missing, it shows a popup message requesting both.
   */
  createRoom(): void {
    if (this.roomId() && this.playerName()) {
      this.socket.createRoom(this.roomId(), this.playerName());
      localStorage.setItem('roomId', JSON.stringify(this.roomId()));
      localStorage.setItem('playerName', JSON.stringify(this.playerName()));
    } else {
      this.popup.showMessage('Enter name and room id!!');
    }
  }

  /**
   * Joins an existing room by sending the room ID and player name to the socket.
   * If the room ID or player name is missing, it shows a popup message requesting both.
   */
  joinRoom(): void {
    if (this.roomId() && this.playerName()) {
      this.socket.joinRoom(this.roomId(), this.playerName());
    } else {
      this.popup.showMessage('Enter name and room id!!');
    }
  }

  /**
   * Selects a symbol for the player and sends the symbol selection to the socket.
   * @param symbol The symbol selected by the player (e.g., 'X' or 'O').
   */
  onSymbol(symbol: string) {
    this.symbol.set(symbol);
    localStorage.setItem('symbol', JSON.stringify(symbol));
    this.socket.symbolSelect(this.roomId(), symbol);
  }

  /**
   * Makes a move on the game board by sending the move data to the socket.
   * A move can only be made if:
   * - The game is not over.
   * - It's the current player's turn.
   * - There are exactly two players in the room.
   * @param cellIndex The index of the cell on the board where the player wants to make a move.
   */
  makeMove(cellIndex: number): void {
    console.log(this.room(), this.symbol());
    if (
      !this.room().isGameOver &&
      this.room().currentTurn === this.symbol() &&
      this.room().players.length === 2
    ) {
      console.log(this.symbol(), cellIndex);
      this.socket.makeMove(this.roomId(), cellIndex, this.symbol());
    }
  }

  /**
   * Restarts the game by sending a game restart request to the socket.
   */
  restartGame(): void {
    this.socket.gameRestart(this.roomId());
  }

  /**
   * Retrieves the player's name based on their symbol.
   * If the player is not found, returns 'Unknown' or the default player name format.
   * @param symbol The symbol of the player (e.g., 'X' or 'O').
   * @returns The player's name or 'Unknown' if not found.
   */
  getPlayerName(symbol: any) {
    if (!this.room().players) {
      return 'Unknown';
    }
    const player = this.room().players.find(
      (player: any) => player.symbol === symbol
    );
    return player?.name || `Player ${symbol}`;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: '#ffffff' },
          shape: { type: 'circle' },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 6,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false,
          },
        },
      });
    }, 100);
  }
}
