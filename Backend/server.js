const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Allow CORS for HTTP server (if needed for REST endpoints)
app.use(
  cors({
    origin: "*",
  })
);

const server = http.createServer(app);

// Create Socket.IO server with CORS settings
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Winning combinations for Tic Tac Toe
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  console.log(rooms);

  socket.on("state", ({ roomId, room }) => {
    rooms[roomId] = room;
    console.log("stateRestorde", rooms);
  });

  socket.on("create-room", ({ roomId, playerName }) => {
    if (rooms[roomId]) {
      socket.emit("room-exists", { message: "Room already exists!" });
      return;
    }

    // Initialize room data
    rooms[roomId] = {
      players: [{ id: socket.id, name: playerName, symbol: null }],
      maxPlayers: 2,
      board: Array(9).fill(null),
      currentTurn: null,
      winner: null,
      isGameOver: false,
    };
    socket.join(roomId);
    console.log(rooms);
    socket.emit("room-created", { room: rooms[roomId] });
    console.log(`${playerName} created room ${roomId}`);
  });

  // Handle joining a room
  socket.on("join-room", ({ roomId, playerName }) => {
    if (!rooms[roomId]) {
      socket.emit("room-not-found", { message: "Room does not exist!" });
      return;
    }

    const room = rooms[roomId];

    if (room.players.length >= room.maxPlayers) {
      socket.emit("room-full", { message: "Room is full!" });
      return;
    }

    // Check if the player is already in the room
    const isPlayerInRoom = room.players.some(
      (player) => player.id === socket.id
    );

    if (isPlayerInRoom) {
      socket.emit("already-in-room", {
        message: "You are already in this room!",
      });
      return;
    }

    const currentPlayerSymbol =
      room.players.length > 0 ? room.players[0].symbol : null;
    const symbol = currentPlayerSymbol === "X" ? "O" : "X";

    // Add player to the room
    const player = { id: socket.id, name: playerName, symbol: symbol };
    room.players.push(player);
    socket.join(roomId);

    // Notify both players that the game can start
    io.to(roomId).emit("player-joined", room);
    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on("symbol-select", ({ roomId, symbol }) => {
    const room = rooms[roomId];
    console.log(roomId, symbol);
    rooms[roomId].players[0].symbol = symbol;
    rooms[roomId].currentTurn = symbol;
    console.log( rooms[roomId].players)
    io.to(roomId).emit("game-start", room.players[0]);
  });

  // Handle game moves
  socket.on("make-move", ({ roomId, cellIndex }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("room-not-found", { message: "Room does not exist!" });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      socket.emit("not-in-room", { message: "You are not in this room!" });
      return;
    }

    if (room.isGameOver) {
      socket.emit("game-over", { winner: room.winner });
      return;
    }

    // Ensure it's the player's turn
    if (player.symbol !== room.currentTurn) {
      socket.emit("not-your-turn", { message: "It's not your turn!" });
      return;
    }

    // Check if the cell is already occupied
    if (room.board[cellIndex] !== null) {
      socket.emit("invalid-move", { message: "Cell already occupied!" });
      return;
    }

    // Update the board
    room.board[cellIndex] = player.symbol;

    // Check for a winner or a draw
    const winner = checkWinner(room.board);
    if (winner) {
      room.isGameOver = true;
      room.winner = winner;
      io.to(roomId).emit("game-over", room);
    } else if (room.board.every((cell) => cell !== null)) {
      room.isGameOver = true;
      room.winner = "Draw";
      io.to(roomId).emit("game-over", room);
    } else {
      // Switch turns
      room.currentTurn = room.currentTurn === "X" ? "O" : "X";
      io.to(roomId).emit("move-made", {
        board: room.board,
        currentTurn: room.currentTurn,
      });
    }
  });

  socket.on("restart-game", (roomId) => {
    const room = rooms[roomId];
    if (room) {
      // Reset the game state for the room
      room.board = Array(9).fill(null);
      room.currentTurn = "X";
      room.isGameOver = false;
      room.winner = null;
      io.to(roomId).emit("game-restarted", room);
    } else {
      socket.emit("error", "Room not found");
    }
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit("player-left", room.players);

        // Clean up the room if empty
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted`);
        }
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
function checkWinner(board) {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}
