# Wordle Sandbox

A full-stack Wordle game implementation with React TypeScript client and Express.js server. This project implements all 4 required tasks plus bonus multiplayer features.

## 🎯 Assignment Tasks Implementation

### ✅ Task 1: Normal Wordle
**Location**: `wordle-client/src/` and `wordle-server/src/`
- **Configurable settings**: Max rounds (6) and word list in `wordle-server/src/config.ts`
- **Win/Lose logic**: Server tracks game state and determines win/lose conditions
- **Scoring rules**: Hit (green), Present (yellow), Miss (gray) implemented in `wordle-server/src/gameLogic.ts`

### ✅ Task 2: Server/Client Wordle  
**Location**: `wordle-client/` and `wordle-server/`
- **Client-server architecture**: Client handles UI, server handles all game logic
- **Answer security**: Client never knows answer until game ends
- **Input validation**: Server validates all guesses using external dictionary API

### ✅ Task 3: Host Cheating Wordle
**Location**: `wordle-client/HOST_CHEATING_README.md`
- **Documentation**: Complete implementation guide for host cheating feature
- **Scoring algorithm**: Prioritizes Hit over Present when selecting candidates
- **Candidate filtering**: Maintains lowest-scoring words that match previous rounds

### ✅ Task 4: Multi-player Wordle
**Location**: `wordle-server/src/` (Socket.IO integration)
- **Real-time multiplayer**: Players can join rooms and play simultaneously
- **Room system**: Players create/join rooms to play together
- **Progress monitoring**: Players can see opponents' progress in real-time

## 🏆 Bonus: Multiplayer Room Feature

**Implementation**: Socket.IO integration in both client and server
- **Room creation**: Players can create private game rooms
- **Real-time updates**: Live game state synchronization
- **Player interaction**: Chat and progress sharing
- **Enhanced UX**: Modern multiplayer interface

## 🚀 Quick Start

1. **Start Server**:
   ```bash
   cd wordle-server && npm install && npm run dev
   ```

2. **Start Client**:
   ```bash
   cd wordle-client && npm install && npm start
   ```

3. **Play**: Open `http://localhost:3000`

## 🎮 Features

- **6 attempts** to guess 5-letter words
- **Real-time feedback**: Green (Hit), Yellow (Present), Gray (Miss)
- **External validation**: Free Dictionary API for word verification
- **Multiplayer rooms**: Create/join rooms for multiplayer games
- **Security**: Server-side logic prevents cheating

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/game/start` | Start new game |
| `POST` | `/api/game/{gameId}/guess` | Submit guess |
| `GET` | `/api/game/{gameId}` | Get game status |
| `GET` | `/health` | Health check |

## 🔧 Tech Stack

- **Client**: React 18 + TypeScript + Socket.IO
- **Server**: Express.js + TypeScript + Socket.IO
- **Validation**: Free Dictionary API
- **Security**: Rate limiting, CORS, Helmet

## 📚 Documentation

- [Client README](./wordle-client/README.md)
- [Server README](./wordle-server/README.md) 
- [Host Cheating Guide](./wordle-client/HOST_CHEATING_README.md) 