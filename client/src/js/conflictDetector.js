/**
 * VAMS Agenda & Scheduling Conflict Detection Engine
 * Detects:
 * 1. Speaker assigned to two sessions simultaneously
 * 2. Same venue assigned to overlapping sessions
 * 3. Sessions exceeding venue capacity
 * 4. Invalid session timings (end before start or duration < 15 min)
 */

export function detectScheduleConflicts(sessions, venues) {
  const conflicts = [];

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isOverlapping = (startA, endA, startB, endB) => {
    return Math.max(startA, startB) < Math.min(endA, endB);
  };

  sessions.forEach((session, i) => {
    const startM = timeToMinutes(session.startTime);
    const endM = timeToMinutes(session.endTime);

    // 1. Invalid Timing Check
    if (endM <= startM) {
      conflicts.push({
        type: 'invalid_timing',
        severity: 'danger',
        sessionId: session.id,
        sessionTitle: session.title,
        message: `Invalid timing for "${session.title}": End time (${session.endTime}) must be after start time (${session.startTime}).`,
        suggestion: `Adjust session duration so start precedes end time.`
      });
    } else if (endM - startM < 15) {
      conflicts.push({
        type: 'too_short',
        severity: 'warning',
        sessionId: session.id,
        sessionTitle: session.title,
        message: `Session "${session.title}" duration is less than 15 minutes.`,
        suggestion: `Ensure adequate transition buffer between presentations.`
      });
    }

    // 2. Capacity vs Venue Check
    if (session.venueId && venues) {
      const venue = venues.find(v => v.id === session.venueId);
      if (venue && session.capacity > venue.capacity) {
        conflicts.push({
          type: 'capacity_overflow',
          severity: 'danger',
          sessionId: session.id,
          sessionTitle: session.title,
          message: `Capacity overflow: Session "${session.title}" requires ${session.capacity} seats, but venue "${venue.name}" has maximum capacity of ${venue.capacity}.`,
          suggestion: `Move to Main Auditorium or reduce registrant capacity.`
        });
      }
    }

    // 3. Pairwise Cross-Session Checks (Overlapping Speaker & Venue)
    for (let j = i + 1; j < sessions.length; j++) {
      const other = sessions[j];
      if (session.day !== other.day) continue;

      const otherStartM = timeToMinutes(other.startTime);
      const otherEndM = timeToMinutes(other.endTime);

      if (isOverlapping(startM, endM, otherStartM, otherEndM)) {
        // Speaker overlap
        if (session.speaker && other.speaker && session.speaker.trim() === other.speaker.trim()) {
          conflicts.push({
            type: 'speaker_double_booked',
            severity: 'danger',
            sessionId: session.id,
            relatedSessionId: other.id,
            message: `Double-booked speaker: "${session.speaker}" is simultaneously scheduled for "${session.title}" (${session.startTime}-${session.endTime}) and "${other.title}" (${other.startTime}-${other.endTime}) on ${session.day}.`,
            suggestion: `Reschedule one of the sessions or assign a co-speaker.`
          });
        }

        // Venue / Room overlap
        if (session.venueId && other.venueId && session.venueId === other.venueId && session.room === other.room) {
          conflicts.push({
            type: 'venue_room_collision',
            severity: 'danger',
            sessionId: session.id,
            relatedSessionId: other.id,
            message: `Room collision: Both "${session.title}" and "${other.title}" are booked in "${session.room}" at overlapping times (${session.startTime}-${session.endTime} vs ${other.startTime}-${other.endTime}).`,
            suggestion: `Reassign one session to another seminar hall or adjust start time.`
          });
        }
      }
    }
  });

  return conflicts;
}

