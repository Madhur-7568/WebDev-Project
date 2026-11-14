/**
 * VAMS Smart Event Management — SaaS Data Store & LocalStorage Persistence
 * Manages Events, Venues, Seating, Agenda, Attendees, Speakers, Sponsors,
 * Volunteers, Budget, Bookings, and Notifications.
 */

const STORAGE_KEYS = {
  EVENTS: 'vams_events_data',
  VENUES: 'vams_venues_data',
  ATTENDEES: 'vams_attendees_data',
  SESSIONS: 'vams_sessions_data',
  SPEAKERS: 'vams_speakers_data',
  SPONSORS: 'vams_sponsors_data',
  VOLUNTEERS: 'vams_volunteers_data',
  BUDGET: 'vams_budget_data',
  BOOKINGS: 'vams_bookings_data',
  NOTIFICATIONS: 'vams_notifications_data',
  USER: 'vams_current_user',
  THEME: 'vams_active_theme',
  EVENT_SEATS: 'vams_event_seats_map'
};

// Initial Realistic Enterprise Demo Datasets
const DEFAULT_EVENTS = [
  {
    id: 'evt_101',
    title: 'HackCampus 2026: 24h National Hackathon',
    description: 'Flagship annual inter-college hackathon focusing on AI Agents, Web3, and Smart Campus solutions. Win prizes worth ₹1,50,000!',
    category: 'Technical',
    venueId: 'ven_1',
    venue: 'Main Auditorium & CS Labs 3 & 4',
    date: '2026-11-20T09:00',
    endDate: '2026-11-21T09:00',
    capacity: 250,
    registeredCount: 198,
    price: 0,
    isPaid: false,
    status: 'published',
    visibility: 'public',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    organizerName: 'ACM & GDSC Chapter',
    tags: ['Hackathon', 'AI', 'Coding', 'Cash Prizes']
  },
  {
    id: 'evt_102',
    title: 'Tarangini 2026: Annual Inter-College Cultural Gala',
    description: 'A 3-day spectacle of classical and fusion music, drama, street play, celebrity concert night, and culinary festivals.',
    category: 'Cultural',
    venueId: 'ven_3',
    venue: 'Tagore Open-Air Theatre (OAT)',
    date: '2026-11-28T17:30',
    endDate: '2026-11-30T22:00',
    capacity: 1200,
    registeredCount: 840,
    price: 250,
    isPaid: true,
    status: 'published',
    visibility: 'public',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    organizerName: 'Cultural & Arts Society',
    tags: ['Music', 'Dance', 'Concert', 'Fashion']
  },
  {
    id: 'evt_103',
    title: 'Full-Stack GenAI & Agentic Systems Workshop',
    description: 'Hands-on intensive masterclass on LLM prompt engineering, LangChain, MCP tooling, and autonomous agent orchestration.',
    category: 'Workshop',
    venueId: 'ven_2',
    venue: 'Ramanujan Computing Center',
    date: '2026-11-18T14:00',
    endDate: '2026-11-18T18:00',
    capacity: 80,
    registeredCount: 76,
    price: 150,
    isPaid: true,
    status: 'published',
    visibility: 'public',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    organizerName: 'AI & Data Science Lab',
    tags: ['AI', 'Workshop', 'Hands-on', 'Certification']
  },
  {
    id: 'evt_104',
    title: 'Inter-Department Cricket & Futsal Trophy',
    description: 'Annual inter-department sports showdown featuring 16 cricket teams, 8 futsal squads, and live digital scoreboard streaming.',
    category: 'Sports',
    venueId: 'ven_5',
    venue: 'University Sports Arena & Grounds',
    date: '2026-12-05T08:00',
    endDate: '2026-12-08T18:00',
    capacity: 500,
    registeredCount: 320,
    price: 0,
    isPaid: false,
    status: 'published',
    visibility: 'public',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    organizerName: 'Sports Council',
    tags: ['Cricket', 'Futsal', 'Trophy', 'Athletics']
  },
  {
    id: 'evt_105',
    title: 'Valorant & BGMI Campus Esports Championship',
    description: 'LAN tournament featuring high-refresh monitors, fiber connectivity, shoutcasting streams, and ₹50,000 prize pool.',
    category: 'Gaming',
    venueId: 'ven_6',
    venue: 'Innovation & Gaming Hub',
    date: '2026-12-12T10:00',
    endDate: '2026-12-13T20:00',
    capacity: 128,
    registeredCount: 112,
    price: 200,
    isPaid: true,
    status: 'published',
    visibility: 'public',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    organizerName: 'Gaming & Interactive Media Guild',
    tags: ['Esports', 'Valorant', 'BGMI', 'Prizes']
  },
  {
    id: 'evt_106',
    title: 'Global Tech Leadership Summit 2026',
    description: 'Executive conference gathering CTOs, VCs, and researchers to discuss cloud architectures, quantum computing, and green tech.',
    category: 'Technical',
    venueId: 'ven_4',
    venue: 'Vikram Sarabhai Seminar Hall',
    date: '2026-12-18T10:00',
    endDate: '2026-12-18T17:00',
    capacity: 150,
    registeredCount: 120,
    price: 499,
    isPaid: true,
    status: 'draft',
    visibility: 'private',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    organizerName: 'Department of Computer Science',
    tags: ['Leadership', 'Conference', 'Networking']
  }
];

const DEFAULT_VENUES = [
  {
    id: 'ven_1',
    name: 'Main Auditorium (Dr. APJ Abdul Kalam Hall)',
    description: 'Acoustically treated multi-tier grand auditorium with 4K laser projection, digital line-array sound, and green rooms.',
    location: 'Central Campus, Academic Block A',
    capacity: 800,
    hourlyRate: 3500,
    facilities: ['Dolby Surround Sound', 'Central Air Conditioning', 'Motorized Stage Curtains', 'Dual Green Rooms', 'VIP Green Lounge', 'Wheelchair Access'],
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
    status: 'approved',
    availability: {
      '2026-11-20': 'booked',
      '2026-11-21': 'booked',
      '2026-11-22': 'available',
      '2026-11-23': 'available',
      '2026-11-24': 'blocked'
    }
  },
  {
    id: 'ven_2',
    name: 'Ramanujan Computing Center',
    description: 'High-performance computing lab with 120 workstations, gigabit ethernet, UPS backup, and dual interactive smart displays.',
    location: 'Department of Computing, 2nd Floor',
    capacity: 120,
    hourlyRate: 1500,
    facilities: ['High-speed Fiber LAN', 'Dual Interactive Smartboards', 'Linux & Windows Dual Boot', 'Central AC', 'Surveillance'],
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    status: 'approved',
    availability: {
      '2026-11-18': 'booked',
      '2026-11-19': 'available',
      '2026-11-20': 'available'
    }
  },
  {
    id: 'ven_3',
    name: 'Tagore Open-Air Theatre (OAT)',
    description: 'Amphitheatre surrounded by lawns for cultural galas, live band performances, dramas, and movie screenings under the stars.',
    location: 'North Campus Gardens',
    capacity: 1500,
    hourlyRate: 4000,
    facilities: ['Open-air Stage Lights', 'Surround PA System', 'Lawn Seating', 'Food Stalls Space', 'Emergency Medical Post'],
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    status: 'approved',
    availability: {
      '2026-11-28': 'booked',
      '2026-11-29': 'booked',
      '2026-11-30': 'booked'
    }
  },
  {
    id: 'ven_4',
    name: 'Vikram Sarabhai Seminar Hall',
    description: 'Executive conference hall designed for research symposiums, guest lectures, and faculty meetings with telepresence equipment.',
    location: 'Research Complex, 4th Floor',
    capacity: 180,
    hourlyRate: 2000,
    facilities: ['Cisco WebEx Telepresence', 'Podium with Touch Panel', 'Reclining Theater Chairs', 'Wi-Fi 6', 'Buffet Dining Area'],
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
    status: 'approved',
    availability: {
      '2026-12-18': 'booked',
      '2026-12-19': 'available'
    }
  },
  {
    id: 'ven_5',
    name: 'University Sports Arena & Complex',
    description: 'Multi-purpose indoor sports pavilion equipped for basketball, badminton, table tennis, and surrounding athletic tracks.',
    location: 'Sports Grounds Complex',
    capacity: 600,
    hourlyRate: 2500,
    facilities: ['Wooden Maple Flooring', 'Electronic Scoreboards', 'Changing Rooms & Showers', 'First Aid Station', 'Floodlights'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    status: 'approved',
    availability: {
      '2026-12-05': 'booked',
      '2026-12-06': 'booked'
    }
  },
  {
    id: 'ven_6',
    name: 'Innovation & Gaming Hub',
    description: 'Dedicated modern creator space featuring high-spec tournament rigs, podcast studio, and VR demo zones.',
    location: 'Incubation Centre, Block C',
    capacity: 100,
    hourlyRate: 1800,
    facilities: ['240Hz Gaming Monitors', 'Soundproof Podcast Booth', 'Gigabit Leased Line', 'VR Setup', 'Chillout Lounge'],
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    status: 'approved',
    availability: {
      '2026-12-12': 'booked',
      '2026-12-13': 'booked'
    }
  }
];

const DEFAULT_ATTENDEES = [
  { id: 'att_1', name: 'Rahul Sharma', email: 'rahul.s@college.edu', eventId: 'evt_101', role: 'Student', ticketId: 'TCK-EVT101-7782', status: 'checked-in', regDate: '2026-11-10' },
  { id: 'att_2', name: 'Ananya Iyer', email: 'ananya.i@college.edu', eventId: 'evt_101', role: 'Student', ticketId: 'TCK-EVT101-3341', status: 'registered', regDate: '2026-11-11' },
  { id: 'att_3', name: 'Dev Patel', email: 'dev.p@college.edu', eventId: 'evt_102', role: 'Student', ticketId: 'TCK-EVT102-9901', status: 'checked-in', regDate: '2026-11-09' },
  { id: 'att_4', name: 'Priya Verma', email: 'priya.v@college.edu', eventId: 'evt_103', role: 'Organizer', ticketId: 'TCK-EVT103-1204', status: 'checked-in', regDate: '2026-11-12' },
  { id: 'att_5', name: 'Arjun Nair', email: 'arjun.n@college.edu', eventId: 'evt_104', role: 'Student', ticketId: 'TCK-EVT104-5542', status: 'registered', regDate: '2026-11-13' },
  { id: 'att_6', name: 'Sneha Kulkarni', email: 'sneha.k@college.edu', eventId: 'evt_105', role: 'Student', ticketId: 'TCK-EVT105-8819', status: 'registered', regDate: '2026-11-14' },
  { id: 'att_7', name: 'Vikram Joshi', email: 'vikram.j@college.edu', eventId: 'evt_101', role: 'Student', ticketId: 'TCK-EVT101-4412', status: 'registered', regDate: '2026-11-11' },
  { id: 'att_8', name: 'Meera Nambiar', email: 'meera.n@college.edu', eventId: 'evt_103', role: 'Student', ticketId: 'TCK-EVT103-6623', status: 'checked-in', regDate: '2026-11-13' }
];

const DEFAULT_SESSIONS = [
  { id: 'ses_1', eventId: 'evt_101', title: 'Keynote: The Age of Agentic AI', speaker: 'Dr. Ramesh Sundaram', venueId: 'ven_1', room: 'Main Auditorium', startTime: '09:30', endTime: '10:45', day: 'Day 1', capacity: 250 },
  { id: 'ses_2', eventId: 'evt_101', title: 'Hackathon Problem Statement Briefing', speaker: 'Priya Verma', venueId: 'ven_1', room: 'Main Auditorium', startTime: '11:00', endTime: '12:00', day: 'Day 1', capacity: 250 },
  { id: 'ses_3', eventId: 'evt_101', title: 'Building Autonomous Agents with MCP', speaker: 'Kavita Menon', venueId: 'ven_2', room: 'Computing Lab 3', startTime: '14:00', endTime: '16:00', day: 'Day 1', capacity: 80 },
  { id: 'ses_4', eventId: 'evt_103', title: 'LLM Fine-Tuning & Quantization Workshop', speaker: 'Dr. Ramesh Sundaram', venueId: 'ven_2', room: 'Ramanujan Lab', startTime: '14:00', endTime: '16:30', day: 'Day 1', capacity: 80 }
];

const DEFAULT_SPEAKERS = [
  { id: 'spk_1', name: 'Dr. Ramesh Sundaram', designation: 'AI Principal Scientist & Author', bio: 'Former DeepMind researcher specializing in autonomous AI architectures and LLM reasoning.', topics: ['Agentic AI', 'Deep Learning'], image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
  { id: 'spk_2', name: 'Kavita Menon', designation: 'VP of Engineering @ CloudScale', bio: 'Distributed systems veteran leading developer infrastructure and real-time streaming tools.', topics: ['Cloud Systems', 'MCP Tooling'], image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400' },
  { id: 'spk_3', name: 'Tanmay Saxena', designation: 'Co-Founder @ CampusByte', bio: 'Young entrepreneur passionate about college innovation hubs and developer toolkits.', topics: ['Startup Pitching', 'Product Design'], image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' }
];

const DEFAULT_SPONSORS = [
  { id: 'spn_1', name: 'Google Cloud Platform', tier: 'Platinum', contribution: 100000, booth: 'Booth A1 (Auditorium Foyer)', contact: 'partnerships@google.com', logo: 'https://img.shields.io/badge/Google_Cloud-Platinum-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white' },
  { id: 'spn_2', name: 'GitHub Campus', tier: 'Gold', contribution: 50000, booth: 'Booth B2', contact: 'campus@github.com', logo: 'https://img.shields.io/badge/GitHub-Gold-181717?style=for-the-badge&logo=github&logoColor=white' },
  { id: 'spn_3', name: 'Devfolio', tier: 'Silver', contribution: 25000, booth: 'Booth C4', contact: 'hello@devfolio.co', logo: 'https://img.shields.io/badge/Devfolio-Silver-3770FF?style=for-the-badge&logo=devfolio&logoColor=white' }
];

const DEFAULT_VOLUNTEERS = [
  { id: 'vol_1', name: 'Aditya Gupta', duty: 'Registration Desk & Badge Printing', shift: '08:30 - 13:00', phone: '+91 98765 43210', status: 'checked-in' },
  { id: 'vol_2', name: 'Rhea Sen', duty: 'Stage Logistics & Audio Setup', shift: '09:00 - 17:00', phone: '+91 98765 43211', status: 'checked-in' },
  { id: 'vol_3', name: 'Mohit Rao', duty: 'Crowd Flow & Security Assistance', shift: '12:30 - 18:30', phone: '+91 98765 43212', status: 'scheduled' },
  { id: 'vol_4', name: 'Pooja Hegde', duty: 'VIP Guest Escort & Hospitality', shift: '09:30 - 16:00', phone: '+91 98765 43213', status: 'checked-in' }
];

const DEFAULT_BUDGET = {
  estimatedBudget: 350000,
  sponsorshipRevenue: 175000,
  ticketRevenue: 185000,
  expenses: [
    { id: 'exp_1', title: 'Auditorium Booking & AC Tariff', category: 'Venue', amount: 45000, status: 'Paid' },
    { id: 'exp_2', title: 'Catering: Meals & Coffee for 250 Participants', category: 'Catering', amount: 85000, status: 'Paid' },
    { id: 'exp_3', title: 'Stage Sound & Lighting AV Setup', category: 'Equipment', amount: 50000, status: 'Paid' },
    { id: 'exp_4', title: 'Participant Swag, Badges & T-Shirts', category: 'Marketing', amount: 65000, status: 'Paid' },
    { id: 'exp_5', title: 'Keynote Speakers Travel & Honorarium', category: 'Speaker', amount: 40000, status: 'Pending' }
  ]
};

const DEFAULT_NOTIFICATIONS = [
  { id: 'notif_1', title: 'RSVP Milestone', message: 'HackCampus 2026 has crossed 80% capacity (198/250 seats allocated).', time: '10 mins ago', isRead: false, type: 'info' },
  { id: 'notif_2', title: 'Schedule Conflict Warning', message: 'Dr. Ramesh Sundaram has overlapping sessions detected on Day 1 at 14:00.', time: '1 hour ago', isRead: false, type: 'warning' },
  { id: 'notif_3', title: 'New Sponsorship Received', message: 'Google Cloud Platform confirmed Platinum Sponsorship (₹1,00,000).', time: '3 hours ago', isRead: true, type: 'success' },
  { id: 'notif_4', title: 'QR Check-in Alert', message: 'Registration desk checked in 54 attendees in the last 30 minutes.', time: '5 hours ago', isRead: true, type: 'info' }
];

const DEFAULT_USER = {
  id: 'usr_organizer_1',
  name: 'Priya Verma',
  email: 'organizer@vams.edu',
  role: 'organizer', // superadmin | organizer | venue_manager | staff | attendee
  department: 'ACM Student Chapter & Faculty Tech Council',
  avatar: 'PV'
};

// Data Store Class Definition
export class VAMSStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.resetAll();
    }
  }

  resetAll() {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(DEFAULT_EVENTS));
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(DEFAULT_VENUES));
    localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(DEFAULT_ATTENDEES));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.SPEAKERS, JSON.stringify(DEFAULT_SPEAKERS));
    localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(DEFAULT_SPONSORS));
    localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(DEFAULT_VOLUNTEERS));
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
  }

  // Generic Getters/Setters
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Events API
  getEvents() {
    return this.get(STORAGE_KEYS.EVENTS) || DEFAULT_EVENTS;
  }

  getEventById(id) {
    return this.getEvents().find(e => e.id === id);
  }

  saveEvent(eventData) {
    const events = this.getEvents();
    if (eventData.id) {
      const index = events.findIndex(e => e.id === eventData.id);
      if (index !== -1) {
        events[index] = { ...events[index], ...eventData, updatedAt: new Date().toISOString() };
      }
    } else {
      const newEvent = {
        ...eventData,
        id: 'evt_' + Date.now(),
        registeredCount: 0,
        status: eventData.status || 'published',
        createdAt: new Date().toISOString()
      };
      events.unshift(newEvent);
    }
    this.set(STORAGE_KEYS.EVENTS, events);
    return events;
  }

  deleteEvent(id) {
    const events = this.getEvents().filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EVENTS, events);
    return events;
  }

  duplicateEvent(id) {
    const target = this.getEventById(id);
    if (!target) return null;
    const clone = {
      ...target,
      id: 'evt_' + Date.now(),
      title: `${target.title} (Copy)`,
      registeredCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    const events = this.getEvents();
    events.unshift(clone);
    this.set(STORAGE_KEYS.EVENTS, events);
    return clone;
  }

  // Venues API
  getVenues() {
    return this.get(STORAGE_KEYS.VENUES) || DEFAULT_VENUES;
  }

  getVenueById(id) {
    return this.getVenues().find(v => v.id === id);
  }

  saveVenue(venueData) {
    const venues = this.getVenues();
    if (venueData.id) {
      const index = venues.findIndex(v => v.id === venueData.id);
      if (index !== -1) venues[index] = { ...venues[index], ...venueData };
    } else {
      venues.unshift({ ...venueData, id: 'ven_' + Date.now() });
    }
    this.set(STORAGE_KEYS.VENUES, venues);
    return venues;
  }

  // Attendees API
  getAttendees() {
    return this.get(STORAGE_KEYS.ATTENDEES) || DEFAULT_ATTENDEES;
  }

  // Per-Event Booked Seats Management
  getBookedSeatsForEvent(eventId) {
    const seatMap = this.get(STORAGE_KEYS.EVENT_SEATS) || {
      'evt_101': ['A2', 'A5', 'B3', 'C1', 'C6', 'D4', 'E2'],
      'evt_102': ['A1', 'A2', 'B4', 'C7', 'D11'],
      'evt_103': ['A3', 'B2', 'C4', 'E8']
    };
    return seatMap[eventId] || ['A2', 'B4'];
  }

  bookSeatsForEvent(eventId, seatIds) {
    const seatMap = this.get(STORAGE_KEYS.EVENT_SEATS) || {};
    const existing = seatMap[eventId] || ['A2', 'B4'];
    const updated = Array.from(new Set([...existing, ...seatIds]));
    seatMap[eventId] = updated;
    this.set(STORAGE_KEYS.EVENT_SEATS, seatMap);
    return updated;
  }

  addAttendee(data) {
    const attendees = this.getAttendees();
    const allocatedSeats = (data.seats && data.seats.length > 0) ? data.seats : ['A1'];

    const newAttendee = {
      ...data,
      id: 'att_' + Date.now(),
      ticketId: `TCK-${(data.eventId || 'EVT').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      seats: allocatedSeats,
      seatSection: data.seatSection || (allocatedSeats[0]?.startsWith('A') || allocatedSeats[0]?.startsWith('B') ? 'VIP Section' : (allocatedSeats[0]?.startsWith('C') || allocatedSeats[0]?.startsWith('D') ? 'Premium Section' : 'General Gallery')),
      status: 'registered',
      regDate: new Date().toISOString().split('T')[0]
    };
    attendees.unshift(newAttendee);
    this.set(STORAGE_KEYS.ATTENDEES, attendees);

    // Mark seats as booked for this event
    if (data.eventId) {
      this.bookSeatsForEvent(data.eventId, allocatedSeats);

      const events = this.getEvents();
      const evt = events.find(e => e.id === data.eventId);
      if (evt) {
        evt.registeredCount = (evt.registeredCount || 0) + allocatedSeats.length;
        this.set(STORAGE_KEYS.EVENTS, events);
      }
    }
    return newAttendee;
  }

  checkInAttendee(ticketId) {
    const attendees = this.getAttendees();
    const target = attendees.find(a => a.ticketId === ticketId);
    if (!target) return { success: false, message: 'Ticket ID not found in system.' };
    if (target.status === 'checked-in') {
      return { success: false, message: `Duplicate Check-In! Attendee ${target.name} has already checked in.` };
    }
    target.status = 'checked-in';
    target.checkInTime = new Date().toLocaleTimeString();
    this.set(STORAGE_KEYS.ATTENDEES, attendees);
    return { success: true, message: `Checked in successfully: ${target.name} (${target.role})`, attendee: target };
  }

  // Sessions & Agenda API
  getSessions() {
    return this.get(STORAGE_KEYS.SESSIONS) || DEFAULT_SESSIONS;
  }

  saveSession(sessionData) {
    const sessions = this.getSessions();
    if (sessionData.id) {
      const idx = sessions.findIndex(s => s.id === sessionData.id);
      if (idx !== -1) sessions[idx] = { ...sessions[idx], ...sessionData };
    } else {
      sessions.push({ ...sessionData, id: 'ses_' + Date.now() });
    }
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return sessions;
  }

  deleteSession(id) {
    const sessions = this.getSessions().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SESSIONS, sessions);
    return sessions;
  }

  // Speakers, Sponsors, Volunteers, Budget, Notifications
  getSpeakers() { return this.get(STORAGE_KEYS.SPEAKERS) || DEFAULT_SPEAKERS; }
  getSponsors() { return this.get(STORAGE_KEYS.SPONSORS) || DEFAULT_SPONSORS; }
  getVolunteers() { return this.get(STORAGE_KEYS.VOLUNTEERS) || DEFAULT_VOLUNTEERS; }
  getBudget() { return this.get(STORAGE_KEYS.BUDGET) || DEFAULT_BUDGET; }
  getNotifications() { return this.get(STORAGE_KEYS.NOTIFICATIONS) || DEFAULT_NOTIFICATIONS; }

  markNotificationAsRead(id) {
    const notifs = this.getNotifications();
    const item = notifs.find(n => n.id === id);
    if (item) item.isRead = true;
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return notifs;
  }

  markAllNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, isRead: true }));
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return notifs;
  }

  // User Profile & Role Switcher
  getCurrentUser() {
    return this.get(STORAGE_KEYS.USER) || DEFAULT_USER;
  }

  setCurrentUserRole(role) {
    const user = this.getCurrentUser();
    user.role = role;
    if (role === 'superadmin') {
      user.name = 'Dr. S. K. Mehta';
      user.department = 'University Dean & Super Administrator';
    } else if (role === 'organizer') {
      user.name = 'Priya Verma';
      user.department = 'ACM Student Chapter & Faculty Tech Council';
    } else if (role === 'venue_manager') {
      user.name = 'Col. Rajesh Bakshi';
      user.department = 'Campus Infrastructure & Venue Allocation Directorate';
    } else if (role === 'staff') {
      user.name = 'Aditya Gupta';
      user.department = 'Event Operations & QR Check-In Desk';
    } else if (role === 'attendee') {
      user.name = 'Rahul Sharma';
      user.department = 'Computer Science & Engineering (B.Tech 3rd Year)';
    }
    user.avatar = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    this.set(STORAGE_KEYS.USER, user);
    return user;
  }
}

export const store = new VAMSStore();

