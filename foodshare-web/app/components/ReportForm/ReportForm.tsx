import { useState } from 'react';
import { useAuth } from '../Auth/AuthProvider';
import styles from './ReportForm.module.css';


export interface FoodEvent {
  id?: string;
  title: string;
  description: string;
  host: string;
  location: { lat: number; lng: number;};
  date: string;
  startTime: string;
  endTime: string;
  isFree: boolean;
  userId: string;
  createdAt: string | Date;
  category: string[];
}

interface ReportFormProps {
  location: { lat: number; lng: number;};
  onSubmit: (event: FoodEvent) => void;
  onCancel: () => void;
  onDelete?: (pinId: string, userId: string) => Promise<void>;
  userId?: string;
  existingEvent?: FoodEvent | null;
}

// Helper to convert 24-hour time to 12-hour format
function to12HourParts(time: string) {
  if (!time) return { hour: '12', minute: '00', ampm: 'AM' };
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const minute = m || '00';
  let ampm = 'AM';
  if (hour === 0) {
    hour = 12;
    ampm = 'AM';
  } else if (hour === 12) {
    ampm = 'PM';
  } else if (hour > 12) {
    hour = hour - 12;
    ampm = 'PM';
  }
  return { hour: hour.toString(), minute, ampm };
}

export default function ReportForm({ location, onSubmit, onCancel, existingEvent }: ReportFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [host, setHost] = useState(existingEvent?.host || '');
  const [date, setDate] = useState(existingEvent?.date || '');
  const startParts = existingEvent ? to12HourParts(existingEvent.startTime) : { hour: '12', minute: '00', ampm: 'AM' };
  const endParts = existingEvent ? to12HourParts(existingEvent.endTime) : { hour: '1', minute: '00', ampm: 'PM' };
  const [startHour, setStartHour] = useState(startParts.hour);
  const [startMinute, setStartMinute] = useState(startParts.minute);
  const [startAmPm, setStartAmPm] = useState(startParts.ampm);
  const [endHour, setEndHour] = useState(endParts.hour);
  const [endMinute, setEndMinute] = useState(endParts.minute);
  const [endAmPm, setEndAmPm] = useState(endParts.ampm);
  const [isFree, setIsFree] = useState(existingEvent?.isFree ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<string[]>(existingEvent?.category || []);

  const to24Hour = (hour: string, minute: string, ampm: string) => {
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to create an event');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const eventData: FoodEvent = {
        title,
        description,
        host,
        location,
        date,
        startTime: to24Hour(startHour, startMinute, startAmPm),
        endTime: to24Hour(endHour, endMinute, endAmPm),
        isFree,
        userId: user.uid,
        createdAt: new Date(),
        category
      };

      onSubmit(eventData);
    } catch (error) {
      console.error('Error preparing event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} style={{ position: 'relative' }}>
      {/* X Close Button */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'transparent',
          border: 'none',
          fontSize: 24,
          color: '#888',
          cursor: 'pointer',
          zIndex: 2
        }}
      >
        ×
      </button>
      <h2 className={styles.title}>{existingEvent ? 'Edit Event' : 'Create Food Event'}</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="title">Event Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what food will be available"
          rows={3}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="host">Host/Organization</label>
        <input
          id="host"
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Who is organizing this event?"
          required
        />
      </div>
      <div className={styles.formGroup}>
          <label htmlFor="startDate">Date</label>
          <input
            id="startDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="startTime">Start Time</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <select id="startHour" value={startHour} onChange={e => setStartHour(e.target.value)} style={{ fontFamily: 'inherit' }}>{Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h.toString()}>{h}</option>)}</select>
            <select id="startMinute" value={startMinute} onChange={e => setStartMinute(e.target.value)} style={{ fontFamily: 'inherit' }}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select id="startAmPm" value={startAmPm} onChange={e => setStartAmPm(e.target.value)} style={{ fontFamily: 'inherit' }}>{['AM','PM'].map(ampm => <option key={ampm} value={ampm}>{ampm}</option>)}</select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="endTime">End Time</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <select id="endHour" value={endHour} onChange={e => setEndHour(e.target.value)} style={{ fontFamily: 'inherit' }}>{Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h.toString()}>{h}</option>)}</select>
            <select id="endMinute" value={endMinute} onChange={e => setEndMinute(e.target.value)} style={{ fontFamily: 'inherit' }}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select id="endAmPm" value={endAmPm} onChange={e => setEndAmPm(e.target.value)} style={{ fontFamily: 'inherit' }}>{['AM','PM'].map(ampm => <option key={ampm} value={ampm}>{ampm}</option>)}</select>
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Category</label>
        <div style={{ display: 'flex', gap: 15, padding: '10px 0px 0px 0px' }}>
          {['mains', 'desserts', 'drinks'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              style={{
                padding: '8px 22px',
                borderRadius: 20,
                border: '1px solid #6949FF',
                background: category.includes(cat) ? '#6949FF' : '#fff',
                color: category.includes(cat) ? '#fff' : '#6949FF',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
      </div>      <div className={styles.formGroup}>
        <label>Food Is</label>
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${isFree ? styles.selected : ''}`}
            onClick={() => setIsFree(true)}
          >
            Free
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${!isFree ? styles.selected : ''}`}
            onClick={() => setIsFree(false)}
          >
            Paid
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.secondaryButton}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={styles.primaryButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? (existingEvent ? 'Saving...' : 'Creating...') : (existingEvent ? 'Save Changes' : 'Create Event')}
        </button>
      </div>
    </form>
  );
}
