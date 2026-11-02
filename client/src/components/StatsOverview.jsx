import React from 'react';
import { Calendar, Users, Layers, Sparkles } from 'lucide-react';

export default function StatsOverview({ stats }) {
  if (!stats) return null;

  return (
    <div className="container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.totalEvents || 0}</h4>
            <p>Total Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.totalRegistrations || 0}</h4>
            <p>Total RSVPs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.activeCategories || 5}</h4>
            <p>Categories</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <h4>{stats.upcomingEvents || 0}</h4>
            <p>Upcoming Live</p>
          </div>
        </div>
      </div>
    </div>
  );
}

