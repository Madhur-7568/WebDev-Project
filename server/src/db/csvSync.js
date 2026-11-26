/**
 * Automatic PostgreSQL -> Excel/CSV Sync Utility
 * Keeps human-readable .csv files in server/data/exports/ synchronized
 * with the live PostgreSQL tables on every database write.
 */
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '../../data/exports');

const ensureExportsDir = () => {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
};

const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const TABLE_QUERIES = {
  users: 'SELECT id, name, email, role, college_id, department, created_at FROM users ORDER BY created_at DESC',
  venues: 'SELECT id, name, location, capacity, hourly_rate, status, facilities, availability FROM venues ORDER BY id ASC',
  events: 'SELECT id, title, category, venue_id, venue, date, end_date, capacity, registered_count, price, is_paid, status, organizer_name FROM events ORDER BY date ASC',
  bookings: 'SELECT id AS ticket_id, event_id, attendee_name, attendee_email, ticket_type, section_name, seat_number, total_amount, payment_status, checked_in, checkin_time, created_at FROM bookings ORDER BY created_at DESC'
};

const syncTableToCsv = async (tableName, queryFn) => {
  try {
    const sql = TABLE_QUERIES[tableName];
    if (!sql) return;

    ensureExportsDir();
    const result = await queryFn(sql);
    const rows = result.rows || [];

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const lines = [];
    if (headers.length > 0) {
      lines.push(headers.map(escapeCsvCell).join(','));
      for (const row of rows) {
        lines.push(headers.map(h => escapeCsvCell(row[h])).join(','));
      }
    }

    const filePath = path.join(EXPORTS_DIR, `${tableName}.csv`);
    fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  } catch (err) {
    console.warn(`⚠️ CSV sync failed for ${tableName}:`, err.message);
  }
};

const syncAllTablesToCsv = async (queryFn) => {
  for (const tableName of Object.keys(TABLE_QUERIES)) {
    await syncTableToCsv(tableName, queryFn);
  }
};

module.exports = {
  EXPORTS_DIR,
  syncTableToCsv,
  syncAllTablesToCsv
};
