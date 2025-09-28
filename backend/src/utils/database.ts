import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Database initialization
export const initDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create picks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS picks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        projection_id VARCHAR(255) NOT NULL,
        pick_type VARCHAR(10) CHECK (pick_type IN ('OVER', 'UNDER')) NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        player_image_url TEXT,
        stat_type VARCHAR(100) NOT NULL,
        line_score DECIMAL(10,2) NOT NULL,
        outcome VARCHAR(10) CHECK (outcome IN ('WIN', 'LOSS')),
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create custom_bets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_bets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
        player VARCHAR(255) NOT NULL,
        stat VARCHAR(100) NOT NULL,
        line DECIMAL(10,2) NOT NULL,
        creator_pick_type VARCHAR(5) CHECK (creator_pick_type IN ('OVER', 'UNDER')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED')) DEFAULT 'PENDING',
        outcome VARCHAR(10) CHECK (outcome IN ('WIN', 'LOSS', 'TBD')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add creator_pick_type column to existing tables if it doesn't exist
    await pool.query(`
      ALTER TABLE custom_bets 
      ADD COLUMN IF NOT EXISTS creator_pick_type VARCHAR(5) CHECK (creator_pick_type IN ('OVER', 'UNDER'))
    `);

    // Create custom_bet_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_bet_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bet_id UUID REFERENCES custom_bets(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        pick_type VARCHAR(10) CHECK (pick_type IN ('OVER', 'UNDER')) NOT NULL,
        outcome VARCHAR(10) CHECK (outcome IN ('WIN', 'LOSS', 'TBD')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(bet_id, user_id)
      )
    `);

    console.log('Database tables initialized successfully');
    // Add player_image_url column to existing picks table if it doesn't exist
    await pool.query(`
      ALTER TABLE picks 
      ADD COLUMN IF NOT EXISTS player_image_url TEXT
    `);

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool;
