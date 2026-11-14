import React from 'react';
import { Calendar, PlusCircle, LogIn, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenCreate, activeView, setActiveView }) {
  const { user, isAuthenticated, isOrganizer, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-content">
        {/* Brand Logo with Image */}
        <div className="nav-brand" onClick={() => setActiveView('all')}>
          <img src="/vams-logo.png" alt="VAMS Logo" className="nav-logo-image" />
          <div className="nav-brand-text">
            <div className="nav-brand-title">
              <span>VAMS</span>
              <span className="nav-badge-pill">PORTAL</span>
            </div>
            <span className="nav-brand-sub">Smart Event Management</span>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="nav-actions">
          {/* View Toggles */}
          <button
            className={`btn ${activeView === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveView('all')}
          >
            <Calendar size={15} />
            <span>All Events</span>
          </button>

          {isAuthenticated && (
            <button
              className={`btn ${activeView === 'my-registrations' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveView('my-registrations')}
            >
              <CheckCircle2 size={15} />
              <span>My Passes</span>
            </button>
          )}

          {/* Create Event Button (Organizers / Admins only) */}
          {isAuthenticated && isOrganizer && (
            <button className="btn btn-accent btn-sm" onClick={onOpenCreate}>
              <PlusCircle size={15} />
              <span>Host Event</span>
            </button>
          )}

          {/* User Account / Login State */}
          {isAuthenticated ? (
            <div className="user-profile-bar">
              <div className="user-info-text">
                <div className="user-name">
                  {user.name.split(' ')[0]}
                </div>
                <span className={`user-role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </div>

              <button
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={logout}
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button className="btn btn-gradient btn-sm" onClick={onOpenAuth}>
              <LogIn size={15} />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
