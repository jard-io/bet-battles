# PrizePicks-Style Betting App

A React Native app inspired by PrizePicks that allows users to make picks on player stats, compete on leaderboards, and create custom bets with friends.

## Features

### 🎯 Board Tab
- Fetches real PrizePicks data using their API
- Display player stats with OVER/UNDER betting options
- Clean, modern UI matching PrizePicks aesthetic
- Pull-to-refresh functionality

### 🏆 Leaderboard Tab
- Group leaderboard comparing pick accuracy
- Win/loss tracking and win percentage calculation
- User ranking system
- Personal stats display

### 🎲 Custom Bets Tab
- Create custom bets with any player, stat, and line
- Share bet links with friends
- Accept/decline bet challenges
- Track bet outcomes and results

## Tech Stack

### Frontend (React Native)
- **Expo Router** - File-based navigation
- **TypeScript** - Type safety
- **React Native** - Cross-platform mobile development
- **Expo** - Development toolchain

### Backend (Node.js)
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **TypeScript** - Type safety
- **bcrypt** - Password hashing

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Expo CLI
- iOS Simulator or Android emulator (for testing)

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platform:**
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://username:password@localhost:5432/prizepicks_db
   JWT_SECRET=your_super_secure_jwt_secret_here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:8081
   ```

4. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb prizepicks_db
   
   # Database tables will be created automatically when the server starts
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Picks
- `POST /api/picks` - Create a pick
- `GET /api/picks` - Get user's picks
- `POST /api/picks/:pickId/resolve` - Resolve a specific pick
- `POST /api/picks/resolve-all` - Resolve all user's picks

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/my-rank` - Get user's rank

### Custom Bets
- `POST /api/custom-bets` - Create custom bet
- `GET /api/custom-bets` - Get user's custom bets
- `GET /api/custom-bets/:betId` - Get specific bet (public)
- `POST /api/custom-bets/:betId/join` - Join a bet
- `POST /api/custom-bets/:betId/decline` - Decline a bet
- `POST /api/custom-bets/:betId/resolve` - Resolve a bet

## How It Works

### PrizePicks Integration
The app fetches real data from PrizePicks API:
```javascript
const response = await fetch("https://api.prizepicks.com/projections?league_id=9&in_game=true&single_stat=true&game_mode=pickem");
```

### Random Outcome Generation
Since this is a demo app, bet outcomes are determined randomly:
- **Pick outcomes**: Simulated based on line and pick type
- **Custom bet outcomes**: Random WIN/LOSS generation
- **Win rate**: Calculated from cumulative wins and losses

### User Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected API endpoints

### Database Schema
- **users**: User accounts and win/loss records
- **picks**: Individual picks on PrizePicks projections
- **custom_bets**: User-created custom bets
- **custom_bet_participants**: Participants in custom bets

## Development Notes

### Current Limitations
- Bet outcomes are randomly generated (not real sports data)
- No real money transactions (demo purposes only)
- Limited to specific PrizePicks league (NBA - league_id=9)

### Future Enhancements
- Real sports data integration
- Push notifications for bet results
- Social features (friends, groups)
- Advanced statistics and analytics
- Payment integration for real betting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes only.