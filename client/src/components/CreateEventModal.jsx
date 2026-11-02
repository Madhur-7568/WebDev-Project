import React, { useState } from 'react';
import { X, Sparkles, Image, Calendar, MapPin, Tag } from 'lucide-react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Gaming'];

export default function CreateEventModal({ isOpen, onClose, onCreateEvent }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    venue: '',
    date: '',
    capacity: 100,
    tags: '',
    image: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateEvent(formData);
      onClose();
      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        venue: '',
        date: '',
        capacity: 100,
        tags: '',
        image: ''
      });
    } catch (err) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Campus Event</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. AI Agents & Prompt Engineering Bootcamp"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Seating Capacity *</label>
              <input
                type="number"
                min="10"
                max="2000"
                required
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue / Hall *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Seminar Hall 1 or Lab 4"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              required
              rows={3}
              className="form-textarea"
              placeholder="Describe event agenda, eligibility, rules, and speaker details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Banner Image URL (Optional)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (Comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="AI, WebDev, Coding, CashPrize"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
