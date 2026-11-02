import React from 'react';
import { Calendar, MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EventCard({ event, onSelect, onRegister, onCancelRegistration }) {
  const { user, isAuthenticated } = useAuth();

  const isUserRegistered = user && event.attendees && event.attendees.includes(user.id);
  const seatsLeft = Math.max(0, (event.capacity || 100) - (event.registeredCount || 0));
  const capacityPercent = Math.min(100, Math.round(((event.registeredCount || 0) / (event.capacity || 100)) * 100));

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="event-card">
      {/* Event Banner & Category Badge */}
      <div className="event-image-wrap">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.title}
          className="event-image"
          loading="lazy"
        />
        <span className={`category-badge badge-${event.category}`}>
          {event.category}
        </span>
      </div>

      {/* Card Content */}
      <div className="event-content">
        <div className="event-date-row">
          <Calendar size={14} />
          <span>{formatDate(event.date)}</span>
        </div>

        <h3 className="event-title" title={event.title}>{event.title}</h3>
        <p className="event-desc">{event.description}</p>

        <div className="event-meta">
          <div className="meta-item">
            <MapPin size={14} />
            <span>{event.venue}</span>
          </div>
          <div className="meta-item">
            <Users size={14} />
            <span>Hosted by {event.organizerName || 'Campus Society'}</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="capacity-bar-wrap">
          <div className="capacity-text">
            <span>Seats: {event.registeredCount || 0} / {event.capacity || 100}</span>
            <span>{seatsLeft > 0 ? `${seatsLeft} left` : 'Housefull'}</span>
          </div>
          <div className="capacity-track">
            <div className="capacity-fill" style={{ width: `${capacityPercent}%` }}></div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="event-card-footer">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onSelect(event)}
          >
            <span>Details</span>
            <ArrowRight size={14} />
          </button>

          {isUserRegistered ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="btn btn-success btn-sm" style={{ cursor: 'default' }}>
                <CheckCircle size={14} />
                <span>Registered</span>
              </span>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              disabled={seatsLeft === 0}
              onClick={() => onRegister(event.id)}
            >
              {seatsLeft === 0 ? 'Full' : 'RSVP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

