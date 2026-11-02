import React from 'react';
import { Calendar, PlusCircle, LogIn, LogOut, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenCreate, activeView, setActiveView }) {
  const { user, isAuthenticated, isOrganizer, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-content">
        {/* Brand Logo */}
        <div className="nav-logo" onClick={() => setActiveView('all')}>
          <div className="nav-logo-icon">CS</div>
          <span>CampusSync</span>
        </div>

        {/* Navigation & Actions */}
        <div className="nav-actions">
          {/* View Toggles */}
          <button
            className={`btn ${activeView === 'all' ? 'btn-secondary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveView('all')}
          >
            <Calendar size={16} />
            <span>All Events</span>
          </button>

          {isAuthenticated && (
            <button
              className={`btn ${activeView === 'my-registrations' ? 'btn-secondary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveView('my-registrations')}
            >
              <CheckCircle2 size={16} />
              <span>My Registrations</span>
            </button>
          )}

          {/* Create Event Button (Organizers / Admins only) */}
          {isAuthenticated && isOrganizer && (
            <button className="btn btn-primary btn-sm" onClick={onOpenCreate}>
              <PlusCircle size={16} />
              <span>Host Event</span>
            </button>
          )}

          {/* User Account / Login State */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  {user.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {user.role}
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={logout}
                title="Log out"
                style={{ padding: '8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

