-- VAMS Smart Event Management — PostgreSQL Relational Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'organizer',
    college_id VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(200) NOT NULL,
    capacity INT NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    facilities JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    status VARCHAR(30) DEFAULT 'approved',
    availability JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    venue_id VARCHAR(50) REFERENCES venues(id) ON DELETE SET NULL,
    venue VARCHAR(200),
    date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50),
    capacity INT NOT NULL,
    registered_count INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'published',
    visibility VARCHAR(30) DEFAULT 'public',
    image TEXT,
    organizer_id VARCHAR(50),
    organizer_name VARCHAR(150) NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speakers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    topic VARCHAR(150),
    bio TEXT,
    experience_years INT DEFAULT 3,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    speaker_id VARCHAR(50) REFERENCES speakers(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    room VARCHAR(100) NOT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(50),
    attendee_name VARCHAR(100) NOT NULL,
    attendee_email VARCHAR(150) NOT NULL,
    ticket_type VARCHAR(50) DEFAULT 'Standard Pass',
    section_name VARCHAR(100),
    seat_number VARCHAR(20),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'completed',
    qr_payload TEXT NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE,
    checkin_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, seat_number)
);

CREATE TABLE IF NOT EXISTS budget_items (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    estimated_amount DECIMAL(12, 2) NOT NULL,
    actual_amount DECIMAL(12, 2) NOT NULL,
    entry_type VARCHAR(20) DEFAULT 'expense',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
