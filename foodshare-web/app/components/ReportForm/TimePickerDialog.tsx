import React, { useState, useEffect } from 'react';

interface TimePickerDialogProps {
  open: boolean;
  value: string; // e.g. '13:00'
  onChange: (val: string) => void;
  onCancel: () => void;
}

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minutes = ['00', '15', '30', '45'];
const ampmOptions = ['AM', 'PM'];

function to12Hour(val: string) {
  if (!val) return { hour: '12', minute: '00', ampm: 'AM' };
  const [h, m] = val.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: hour12.toString(), minute: m, ampm };
}

function to24Hour(hour: string, minute: string, ampm: string) {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute}`;
}

const TimePickerDialog: React.FC<TimePickerDialogProps> = ({ open, value, onChange, onCancel }) => {
  const { hour, minute, ampm } = to12Hour(value);
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);
  const [ap, setAp] = useState(ampm);

  useEffect(() => {
    if (open) {
      setH(hour);
      setM(minute);
      setAp(ampm);
    }
  }, [open, hour, minute, ampm]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #6949FF22', padding: 32, minWidth: 340, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 18, letterSpacing: 1 }}>ENTER TIME</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <select value={h} onChange={e => setH(e.target.value)} style={{ fontSize: 32, border: '2px solid #6949FF', borderRadius: 8, width: 60, height: 60, textAlign: 'center', color: '#6949FF', fontWeight: 600, outline: 'none', background: '#fff' }}>
            {hours.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <span style={{ fontSize: 32, color: '#888' }}>:</span>
          <select value={m} onChange={e => setM(e.target.value)} style={{ fontSize: 32, border: 'none', borderRadius: 8, width: 60, height: 60, textAlign: 'center', color: '#222', fontWeight: 600, outline: 'none', background: '#f3f3f3' }}>
            {minutes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
            {ampmOptions.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setAp(opt)}
                style={{
                  background: ap === opt ? '#f3eaff' : '#fff',
                  color: ap === opt ? '#6949FF' : '#222',
                  border: ap === opt ? '2px solid #6949FF' : '1px solid #ccc',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 18,
                  marginBottom: 2,
                  padding: '6px 0',
                  cursor: 'pointer',
                  width: 48
                }}
              >{opt}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 18 }}>
          <button type="button" onClick={onCancel} style={{ color: '#6949FF', background: 'none', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>CANCEL</button>
          <button type="button" onClick={() => onChange(to24Hour(h, m, ap))} style={{ color: '#6949FF', background: 'none', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerDialog; 