import React from 'react';
import { X, Calendar, MapPin, Users, Tag, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EventDetailsModal({ event, onClose, onRegister, onCancelRegistration, onDeleteEvent }) {
  const { user, isAuthenticated, isOrganizer } = useAuth();

  if (!event) return null;

  const isUserRegistered = user && event.attendees && event.attendees.includes(user.id);
  const seatsLeft = Math.max(0, (event.capacity || 100) - (event.registeredCount || 0));
  const isOwnerOrAdmin = user && (user.id === event.organizerId || user.role === 'admin');

  const ticketId = isUserRegistered ? `TCK-${event.id.toUpperCase()}-${user.id.slice(-4).toUpperCase()}` : null;

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span className={`category-badge badge-${event.category}`} style={{ position: 'static' }}>
              {event.category}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Banner */}
        <div style={{ height: '220px', overflow: 'hidden' }}>
          <img
            src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>
            {event.title}
          </h2>

          <div className="event-meta" style={{ marginBottom: '1.25rem', gap: '10px' }}>
            <div className="meta-item">
              <Calendar size={16} color="var(--primary)" />
              <strong style={{ color: '#0f172a' }}>Date & Time:</strong>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="meta-item">
              <MapPin size={16} color="var(--primary)" />
              <strong style={{ color: '#0f172a' }}>Venue:</strong>
              <span>{event.venue}</span>
            </div>
            <div className="meta-item">
              <Users size={16} color="var(--primary)" />
              <strong style={{ color: '#0f172a' }}>Organizer:</strong>
              <span>{event.organizerName || 'Campus Committee'}</span>
            </div>
          </div>

          <p style={{ color: '#334155', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {event.description}
          </p>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <Tag size={15} color="#64748b" />
              {event.tags.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    background: '#f1f5f9',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Digital Ticket Representation if Registered */}
          {isUserRegistered && (
            <div className="ticket-preview">
              <div className="ticket-header">
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
                    Official Campus Pass
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{user.name}</div>
                </div>
                <div className="ticket-id">{ticketId}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.9 }}>
                <div>Student ID: <strong>{user.collegeId || 'CS2023010'}</strong></div>
                <div>Status: <span style={{ color: '#4ade80', fontWeight: 700 }}>VERIFIED RSVP</span></div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Confirmed RSVPs: <strong>{event.registeredCount || 0}</strong> / {event.capacity || 100}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {isOwnerOrAdmin && onDeleteEvent && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDeleteEvent(event.id)}
                  title="Delete event"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}

              {isUserRegistered ? (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onCancelRegistration(event.id)}
                >
                  Cancel RSVP
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={seatsLeft === 0}
                  onClick={() => onRegister(event.id)}
                >
                  {seatsLeft === 0 ? 'Event Full' : 'Confirm Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
