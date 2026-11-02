const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Pre-seeded users
const defaultUsers = [
  {
    id: 'usr_student_1',
    name: 'Rahul Sharma',
    email: 'student@college.edu',
    passwordHash: bcrypt.hashSync('student123', 10),
    role: 'student',
    collegeId: 'CS2023010',
    department: 'Computer Science & Engineering',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_organizer_1',
    name: 'Priya Verma (ACM Student Chapter)',
    email: 'organizer@college.edu',
    passwordHash: bcrypt.hashSync('organizer123', 10),
    role: 'organizer',
    collegeId: 'FAC_CS_04',
    department: 'Student Affairs & Technical Council',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_admin_1',
    name: 'Dr. S. K. Mehta (Dean Academics)',
    email: 'admin@college.edu',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    collegeId: 'ADMIN_01',
    department: 'University Administration',
    createdAt: new Date().toISOString()
  }
];

// Pre-seeded college events
const defaultEvents = [
  {
    id: 'evt_101',
    title: 'HackCampus 2026: 24h National Hackathon',
    description: 'Flagship annual inter-college hackathon focusing on AI Agents, Web3, and Smart Campus solutions. Win prizes worth ₹1,50,000!',
    category: 'Technical',
    venue: 'Main Auditorium & CS Labs 3 & 4',
    date: '2026-11-20T09:00:00.000Z',
    endDate: '2026-11-21T09:00:00.000Z',
    capacity: 150,
    registeredCount: 94,
    organizerId: 'usr_organizer_1',
    organizerName: 'ACM Student Chapter',
    tags: ['Coding', 'Hackathon', 'AI', 'Prizes'],
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
    attendees: ['usr_student_1'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt_102',
    title: 'Vibrance 2026: Annual Cultural Night & Battle of Bands',
    description: 'An evening of scintillating music, dance face-offs, street play drama, and celebrity guest band performance. Free entry for all students.',
    category: 'Cultural',
    venue: 'Open Air Amphitheatre',
    date: '2026-11-25T17:30:00.000Z',
    endDate: '2026-11-25T22:00:00.000Z',
    capacity: 400,
    registeredCount: 310,
    organizerId: 'usr_organizer_1',
    organizerName: 'Cultural Society',
    tags: ['Music', 'Dance', 'Bands', 'Fest'],
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
    attendees: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt_103',
    title: 'Inter-Department Cricket & Football Championship',
    description: 'Compete for the prestigious Dean Trophy! 16 department teams, knockout rounds, professional referees, and refreshment stalls.',
    category: 'Sports',
    venue: 'University Sports Ground & Pavilion',
    date: '2026-12-02T08:00:00.000Z',
    endDate: '2026-12-04T18:00:00.000Z',
    capacity: 250,
    registeredCount: 160,
    organizerId: 'usr_organizer_1',
    organizerName: 'Sports Council',
    tags: ['Cricket', 'Football', 'Athletics', 'Trophy'],
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
    attendees: ['usr_student_1'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt_104',
    title: 'Hands-on Workshop: Full-Stack Web Dev with AI Tooling',
    description: 'Learn modern React patterns, Node REST architectures, Git collaboration, and automated CI/CD workflows from industry engineers.',
    category: 'Workshop',
    venue: 'Seminar Hall 2 (Block B)',
    date: '2026-11-15T14:00:00.000Z',
    endDate: '2026-11-15T17:00:00.000Z',
    capacity: 80,
    registeredCount: 78,
    organizerId: 'usr_organizer_1',
    organizerName: 'Web Development Club',
    tags: ['Workshop', 'React', 'NodeJS', 'Certification'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60',
    attendees: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'evt_105',
    title: 'Campus Esports Arena: Valorant & FIFA 26 Tournament',
    description: '5v5 LAN tournament on high-end gaming rigs. Live commentary, shoutcasters, and custom trophy for winning squads.',
    category: 'Gaming',
    venue: 'Computer Center LAN Hall',
    date: '2026-11-28T11:00:00.000Z',
    endDate: '2026-11-28T20:00:00.000Z',
    capacity: 100,
    registeredCount: 88,
    organizerId: 'usr_organizer_1',
    organizerName: 'Gaming Club',
    tags: ['Esports', 'Valorant', 'FIFA', 'Gaming'],
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
    attendees: ['usr_student_1'],
    createdAt: new Date().toISOString()
  }
];

// In-Memory Data Store (Persisted to storage.json if directory is writable)
const dataDir = path.join(__dirname, '../data');
const storageFile = path.join(dataDir, 'storage.json');

let store = {
  users: [...defaultUsers],
  events: [...defaultEvents]
};

// Ensure data folder exists & load stored data if present
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(storageFile)) {
    const raw = fs.readFileSync(storageFile, 'utf8');
    store = JSON.parse(raw);
    console.log('📦 Loaded existing data store from storage.json');
  } else {
    fs.writeFileSync(storageFile, JSON.stringify(store, null, 2), 'utf8');
    console.log('📦 Initialized persistent storage.json with default college events');
  }
} catch (err) {
  console.warn('⚠️  Could not write storage.json. Operating in active memory mode:', err.message);
}

const persist = () => {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    // Silent fail in environments where fs write is restricted
  }
};

const dataStore = {
  // Users
  findUserByEmail: (email) => {
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id) => {
    return store.users.find(u => u.id === id);
  },
  createUser: (userData) => {
    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      ...userData,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);
    persist();
    return newUser;
  },

  // Events
  getAllEvents: ({ category, search, status } = {}) => {
    let result = [...store.events];

    if (category && category !== 'All') {
      result = result.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q))) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    if (status) {
      const now = new Date();
      if (status === 'upcoming') {
        result = result.filter(e => new Date(e.date) >= now);
      } else if (status === 'past') {
        result = result.filter(e => new Date(e.date) < now);
      }
    }

    // Sort by date ascending (soonest first)
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
  },

  findEventById: (id) => {
    return store.events.find(e => e.id === id);
  },

  createEvent: (eventData) => {
    const newEvent = {
      id: 'evt_' + Date.now().toString(36),
      registeredCount: 0,
      attendees: [],
      createdAt: new Date().toISOString(),
      ...eventData
    };
    store.events.push(newEvent);
    persist();
    return newEvent;
  },

  updateEvent: (id, updateData) => {
    const idx = store.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    store.events[idx] = { ...store.events[idx], ...updateData };
    persist();
    return store.events[idx];
  },

  deleteEvent: (id) => {
    const idx = store.events.findIndex(e => e.id === id);
    if (idx === -1) return false;
    store.events.splice(idx, 1);
    persist();
    return true;
  },

  registerUserForEvent: (eventId, userId) => {
    const event = store.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    if (!event.attendees) event.attendees = [];

    if (event.attendees.includes(userId)) {
      return { success: false, message: 'You have already registered for this event' };
    }

    if (event.capacity && event.attendees.length >= event.capacity) {
      return { success: false, message: 'Event is fully booked' };
    }

    event.attendees.push(userId);
    event.registeredCount = event.attendees.length;
    persist();

    const ticketId = `TCK-${eventId.toUpperCase()}-${userId.slice(-4).toUpperCase()}`;
    return { success: true, message: 'Registration confirmed', ticketId, event };
  },

  cancelUserRegistration: (eventId, userId) => {
    const event = store.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    if (!event.attendees || !event.attendees.includes(userId)) {
      return { success: false, message: 'You are not registered for this event' };
    }

    event.attendees = event.attendees.filter(id => id !== userId);
    event.registeredCount = event.attendees.length;
    persist();

    return { success: true, message: 'Registration cancelled successfully', event };
  },

  getStats: () => {
    const totalEvents = store.events.length;
    const totalRegistrations = store.events.reduce((sum, e) => sum + (e.attendees ? e.attendees.length : 0), 0);
    const categories = [...new Set(store.events.map(e => e.category))];
    const now = new Date();
    const upcomingEvents = store.events.filter(e => new Date(e.date) >= now).length;

    return {
      totalEvents,
      totalRegistrations,
      activeCategories: categories.length,
      upcomingEvents
    };
  }
};

module.exports = dataStore;

