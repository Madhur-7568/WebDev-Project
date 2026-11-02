import React, { useState } from 'react';
import { X, LogIn, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleQuickFill = (roleType) => {
    setError('');
    if (roleType === 'student') {
      setEmail('student@college.edu');
      setPassword('student123');
    } else if (roleType === 'organizer') {
      setEmail('organizer@college.edu');
      setPassword('organizer123');
    } else if (roleType === 'admin') {
      setEmail('admin@college.edu');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, role, department });
      } else {
        await login(email, password);
      }
      onSuccess(isRegister ? 'Account created successfully!' : 'Logged in successfully!');
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {isRegister ? 'Create Student Account' : 'Welcome to CampusSync'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Demo Fill Buttons (Crucial for College Lab Viva Demo) */}
          {!isRegister && (
            <div className="demo-box">
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Quick Demo Logins (Click to autofill):
              </p>
              <div className="demo-buttons">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleQuickFill('student')}
                  style={{ background: '#fff' }}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleQuickFill('organizer')}
                  style={{ background: '#fff' }}
                >
                  🎪 Organizer
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleQuickFill('admin')}
                  style={{ background: '#fff' }}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Role *</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Student / Attendee</option>
                    <option value="organizer">Club Organizer / Faculty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Computer Science, Mechanical"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">College Email *</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setIsRegister(false)}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to CampusSync?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setIsRegister(true)}
                >
                  Register here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
