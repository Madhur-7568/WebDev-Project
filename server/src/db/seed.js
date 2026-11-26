/**
 * PostgreSQL Demo Data Seeder for VAMS
 * Runs automatically on boot only if tables are empty.
 */
const bcrypt = require('bcryptjs');

const seedDatabase = async ({ query }) => {
  // 1. Seed Demo Users if empty
  const userCheck = await query('SELECT COUNT(*)::int AS count FROM users');
  if (userCheck.rows[0].count === 0) {
    const salt = await bcrypt.genSalt(10);
    const demoHash = await bcrypt.hash('password123', salt);

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, college_id, department) VALUES
       ($1, $2, $3, $4, $5, $6, $7),
       ($8, $9, $10, $11, $12, $13, $14)`,
      [
        'usr_org_1', 'Priya Verma', 'organizer@vams.edu', demoHash, 'organizer', 'FAC-1042', 'Computer Science',
        'usr_att_1', 'Rahul Sharma', 'rahul@vams.edu', demoHash, 'attendee', '2024CS089', 'Computer Science'
      ]
    );
  }

  // 2. Seed Venues if empty
  const venueCheck = await query('SELECT COUNT(*)::int AS count FROM venues');
  if (venueCheck.rows[0].count === 0) {
    const venues = [
      {
        id: 'ven_1',
        name: 'Main Auditorium (Dr. APJ Abdul Kalam Hall)',
        description: 'Acoustically treated multi-tier grand auditorium with 4K laser projection, digital line-array sound, and green rooms.',
        location: 'Central Campus, Academic Block A',
        capacity: 800,
        hourly_rate: 3500,
        facilities: ['Dolby Surround Sound', 'Central Air Conditioning', 'Motorized Stage Curtains', 'Dual Green Rooms', 'VIP Green Lounge', 'Wheelchair Access'],
        image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
        availability: { '2026-11-20': 'booked', '2026-11-21': 'booked', '2026-11-24': 'blocked' }
      },
      {
        id: 'ven_2',
        name: 'Ramanujan Computing Center',
        description: 'High-performance computing lab with 120 workstations, gigabit ethernet, UPS backup, and dual interactive smart displays.',
        location: 'Department of Computing, 2nd Floor',
        capacity: 120,
        hourly_rate: 1500,
        facilities: ['High-speed Fiber LAN', 'Dual Interactive Smartboards', 'Linux & Windows Dual Boot', 'Central AC', 'Surveillance'],
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        availability: { '2026-11-18': 'booked' }
      },
      {
        id: 'ven_3',
        name: 'Tagore Open-Air Theatre (OAT)',
        description: 'Amphitheatre surrounded by lawns for cultural galas, live band performances, dramas, and movie screenings under the stars.',
        location: 'North Campus Gardens',
        capacity: 1500,
        hourly_rate: 4000,
        facilities: ['Open-air Stage Lights', 'Surround PA System', 'Lawn Seating', 'Food Stalls Space', 'Emergency Medical Post'],
        image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        availability: { '2026-11-28': 'booked', '2026-11-29': 'booked', '2026-11-30': 'booked' }
      },
      {
        id: 'ven_4',
        name: 'Vikram Sarabhai Seminar Hall',
        description: 'Executive conference hall designed for research symposiums, guest lectures, and faculty meetings with telepresence equipment.',
        location: 'Research Complex, 4th Floor',
        capacity: 180,
        hourly_rate: 2000,
        facilities: ['Cisco WebEx Telepresence', 'Podium with Touch Panel', 'Reclining Theater Chairs', 'Wi-Fi 6', 'Buffet Dining Area'],
        image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
        availability: { '2026-12-18': 'booked' }
      },
      {
        id: 'ven_5',
        name: 'University Sports Arena & Complex',
        description: 'Multi-purpose indoor sports pavilion equipped for basketball, badminton, table tennis, and surrounding athletic tracks.',
        location: 'Sports Grounds Complex',
        capacity: 600,
        hourly_rate: 2500,
        facilities: ['Wooden Maple Flooring', 'Electronic Scoreboards', 'Changing Rooms & Showers', 'First Aid Station', 'Floodlights'],
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        availability: { '2026-12-05': 'booked', '2026-12-06': 'booked' }
      },
      {
        id: 'ven_6',
        name: 'Innovation & Gaming Hub',
        description: 'Dedicated modern creator space featuring high-spec tournament rigs, podcast studio, and VR demo zones.',
        location: 'Incubation Centre, Block C',
        capacity: 100,
        hourly_rate: 1800,
        facilities: ['240Hz Gaming Monitors', 'Soundproof Podcast Booth', 'Gigabit Leased Line', 'VR Setup', 'Chillout Lounge'],
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        availability: { '2026-12-12': 'booked', '2026-12-13': 'booked' }
      }
    ];

    for (const v of venues) {
      await query(
        `INSERT INTO venues (id, name, description, location, capacity, hourly_rate, facilities, image, status, availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, 'approved', $9::jsonb)`,
        [v.id, v.name, v.description, v.location, v.capacity, v.hourly_rate, JSON.stringify(v.facilities), v.image, JSON.stringify(v.availability)]
      );
    }
  }

  // 3. Seed Events if empty
  const eventCheck = await query('SELECT COUNT(*)::int AS count FROM events');
  if (eventCheck.rows[0].count === 0) {
    const events = [
      {
        id: 'evt_101',
        title: 'HackCampus 2026: 24h National Hackathon',
        description: 'Flagship annual inter-college hackathon focusing on AI Agents, Web3, and Smart Campus solutions. Win prizes worth ₹1,50,000!',
        category: 'Technical',
        venue_id: 'ven_1',
        venue: 'Main Auditorium & CS Labs 3 & 4',
        date: '2026-11-20T09:00',
        end_date: '2026-11-21T09:00',
        capacity: 250,
        registered_count: 198,
        price: 0,
        is_paid: false,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        organizer_id: 'usr_org_1',
        organizer_name: 'ACM & GDSC Chapter',
        tags: ['Hackathon', 'AI', 'Coding', 'Cash Prizes']
      },
      {
        id: 'evt_102',
        title: 'Tarangini 2026: Annual Inter-College Cultural Gala',
        description: 'A 3-day spectacle of classical and fusion music, drama, street play, celebrity concert night, and culinary festivals.',
        category: 'Cultural',
        venue_id: 'ven_3',
        venue: 'Tagore Open-Air Theatre (OAT)',
        date: '2026-11-28T17:30',
        end_date: '2026-11-30T22:00',
        capacity: 1200,
        registered_count: 840,
        price: 250,
        is_paid: true,
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        organizer_id: 'usr_org_1',
        organizer_name: 'Cultural & Arts Society',
        tags: ['Music', 'Dance', 'Concert', 'Fashion']
      },
      {
        id: 'evt_103',
        title: 'Full-Stack GenAI & Agentic Systems Workshop',
        description: 'Hands-on intensive masterclass on LLM prompt engineering, LangChain, MCP tooling, and autonomous agent orchestration.',
        category: 'Workshop',
        venue_id: 'ven_2',
        venue: 'Ramanujan Computing Center',
        date: '2026-11-18T14:00',
        end_date: '2026-11-18T18:00',
        capacity: 80,
        registered_count: 76,
        price: 150,
        is_paid: true,
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
        organizer_id: 'usr_org_1',
        organizer_name: 'AI & Data Science Lab',
        tags: ['AI', 'Workshop', 'Hands-on', 'Certification']
      },
      {
        id: 'evt_104',
        title: 'Inter-Department Cricket & Futsal Trophy',
        description: 'Annual inter-department sports showdown featuring 16 cricket teams, 8 futsal squads, and live digital scoreboard streaming.',
        category: 'Sports',
        venue_id: 'ven_5',
        venue: 'University Sports Arena & Grounds',
        date: '2026-12-05T08:00',
        end_date: '2026-12-08T18:00',
        capacity: 500,
        registered_count: 320,
        price: 0,
        is_paid: false,
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
        organizer_id: 'usr_org_1',
        organizer_name: 'Sports Council',
        tags: ['Cricket', 'Futsal', 'Trophy', 'Athletics']
      },
      {
        id: 'evt_105',
        title: 'Valorant & BGMI Campus Esports Championship',
        description: 'LAN tournament featuring high-refresh monitors, fiber connectivity, shoutcasting streams, and ₹50,000 prize pool.',
        category: 'Gaming',
        venue_id: 'ven_6',
        venue: 'Innovation & Gaming Hub',
        date: '2026-12-12T10:00',
        end_date: '2026-12-13T20:00',
        capacity: 128,
        registered_count: 112,
        price: 200,
        is_paid: true,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        organizer_id: 'usr_org_1',
        organizer_name: 'Gaming & Interactive Media Guild',
        tags: ['Esports', 'Valorant', 'BGMI', 'Prizes']
      }
    ];

    for (const e of events) {
      await query(
        `INSERT INTO events (id, title, description, category, venue_id, venue, date, end_date, capacity, registered_count, price, is_paid, status, visibility, image, organizer_id, organizer_name, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'published', 'public', $13, $14, $15, $16::jsonb)`,
        [e.id, e.title, e.description, e.category, e.venue_id, e.venue, e.date, e.end_date, e.capacity, e.registered_count, e.price, e.is_paid, e.image, e.organizer_id, e.organizer_name, JSON.stringify(e.tags)]
      );
    }
  }

  // 4. Seed Sample Bookings if empty
  const bookingCheck = await query('SELECT COUNT(*)::int AS count FROM bookings');
  if (bookingCheck.rows[0].count === 0) {
    await query(
      `INSERT INTO bookings (id, event_id, attendee_name, attendee_email, ticket_type, section_name, seat_number, total_amount, qr_payload, checked_in)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        'VAMS-TKT-1001', 'evt_101', 'Aarav Mehta', 'aarav@vams.edu', 'VIP Pass', 'VIP Front Stage Tier', 'A1', 0, 'VAMS|evt_101|A1|aarav@vams.edu', true,
        'VAMS-TKT-1002', 'evt_102', 'Sneha Kapoor', 'sneha@vams.edu', 'VIP Pass', 'VIP Front Stage Tier', 'A2', 375, 'VAMS|evt_102|A2|sneha@vams.edu', false
      ]
    );
  }
};

module.exports = { seedDatabase };
