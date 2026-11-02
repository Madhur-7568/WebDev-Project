import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import FilterBar from './components/FilterBar';
import EventCard from './components/EventCard';
import EventDetailsModal from './components/EventDetailsModal';
import CreateEventModal from './components/CreateEventModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Sparkles, CalendarX, Plus } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, isOrganizer } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('all'); // 'all' | 'my-registrations'

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Events from Backend
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getEvents({
        category: selectedCategory,
        search: searchQuery
      });
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      addToast('Could not connect to backend server. Make sure port 5000 is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Fetch Platform Stats
  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data.stats);
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadStats();
  }, []);

  // Filter events if "My Registrations" view is selected
  const displayedEvents = activeView === 'my-registrations'
    ? events.filter((e) => user && e.attendees && e.attendees.includes(user.id))
    : events;

  // Event Handlers
  const handleRegister = async (eventId) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      addToast('Please sign in or use quick-demo to RSVP for events.', 'error');
      return;
    }

    try {
      const res = await api.registerForEvent(eventId);
      addToast(`🎉 ${res.message}! Ticket ID: ${res.ticketId}`, 'success');

      // Update local state smoothly
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId
            ? {
                ...evt,
                registeredCount: (evt.registeredCount || 0) + 1,
                attendees: [...(evt.attendees || []), user.id]
              }
            : evt
        )
      );

      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => ({
          ...prev,
          registeredCount: (prev.registeredCount || 0) + 1,
          attendees: [...(prev.attendees || []), user.id]
        }));
      }

      loadStats();
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await api.cancelRegistration(eventId);
      addToast('Registration cancelled successfully.', 'success');

      // Update local state smoothly
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId
            ? {
                ...evt,
                registeredCount: Math.max(0, (evt.registeredCount || 1) - 1),
                attendees: (evt.attendees || []).filter((uid) => uid !== user.id)
              }
            : evt
        )
      );

      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => ({
          ...prev,
          registeredCount: Math.max(0, (prev.registeredCount || 1) - 1),
          attendees: (prev.attendees || []).filter((uid) => uid !== user.id)
        }));
      }

      loadStats();
    } catch (err) {
      addToast(err.message || 'Failed to cancel registration', 'error');
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const res = await api.createEvent(eventData);
      addToast('🚀 New campus event published successfully!', 'success');
      loadEvents();
      loadStats();
    } catch (err) {
      addToast(err.message || 'Failed to publish event', 'error');
      throw err;
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(eventId);
      addToast('Event deleted.', 'success');
      setSelectedEvent(null);
      loadEvents();
      loadStats();
    } catch (err) {
      addToast(err.message || 'Failed to delete event', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Official Campus Portal</span>
          </div>
          <h1 className="hero-title">
            Discover & Experience <span>Campus Events</span>
          </h1>
          <p className="hero-subtitle">
            From premier 24-hour hackathons and technical bootcamps to annual cultural galas and sports showdowns. Register instantly with your student credentials.
          </p>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <StatsOverview stats={stats} />

      {/* Main Content Area */}
      <main className="container">
        {/* Filters and Search Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Section Heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {activeView === 'my-registrations' ? '🎟️ My Event Registrations' : 'Explore Upcoming Events'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {activeView === 'my-registrations'
                ? 'All college events and sessions you have RSVP’d for'
                : `Showing ${displayedEvents.length} events matching your selection`}
            </p>
          </div>

          {activeView === 'my-registrations' && (
            <button className="btn btn-outline btn-sm" onClick={() => setActiveView('all')}>
              ← Back to All Events
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading events...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedEvents.length === 0 && (
          <div
            style={{
              background: '#ffffff',
              border: '1px dashed var(--border)',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '2rem auto 4rem'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#f1f5f9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#64748b'
              }}
            >
              <CalendarX size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
              {activeView === 'my-registrations' ? 'No Registered Events Yet' : 'No Events Found'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {activeView === 'my-registrations'
                ? 'Browse upcoming technical or cultural events and reserve your seat.'
                : 'Try clearing your search query or choosing another category.'}
            </p>
            {activeView === 'my-registrations' ? (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveView('all')}>
                Explore Events
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && displayedEvents.length > 0 && (
          <div className="events-grid">
            {displayedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={(evt) => setSelectedEvent(evt)}
                onRegister={handleRegister}
                onCancelRegistration={handleCancelRegistration}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={handleRegister}
        onCancelRegistration={handleCancelRegistration}
        onDeleteEvent={handleDeleteEvent}
      />

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
