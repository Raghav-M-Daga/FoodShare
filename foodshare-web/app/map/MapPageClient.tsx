'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, getDoc, deleteDoc, updateDoc, doc, onSnapshot, arrayUnion, query, getDocs, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../components/Auth/AuthProvider';
import ReportForm from '../components/ReportForm/ReportForm';
import { Issue } from '../components/types';
import styles from './MapPage.module.css';
import { Home } from 'lucide-react';
import { FoodEvent } from '../components/ReportForm/ReportForm';
import { isAfter, isBefore, parseISO, format, parse } from 'date-fns';

const Map = dynamic(() => import('../components/Map/Map'), { ssr: false });

interface Campus {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

const CAMPUSES: Record<string, Campus> = {
  duke: {
    id: 'duke',
    name: 'Duke University',
    bounds: {
      north: 36.0135,
      south: 36.0000,
      east: -78.9300,
      west: -78.9500
    },
    center: {
      lat: 36.00160553451508,
      lng: -78.93957298090419
    }
  }
};

export default function MapPageClient() {
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{ lng: number; lat: number } | null>(null);
  const mapContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarIssues, setSidebarIssues] = useState<Issue[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterToday, setFilterToday] = useState(false);
  const [filterStartHour, setFilterStartHour] = useState('');
  const [filterStartAmPm, setFilterStartAmPm] = useState('AM');
  const [filterEndHour, setFilterEndHour] = useState('');
  const [filterEndAmPm, setFilterEndAmPm] = useState('PM');
  const [tempStartHour, setTempStartHour] = useState('');
  const [tempStartAmPm, setTempStartAmPm] = useState('AM');
  const [tempEndHour, setTempEndHour] = useState('');
  const [tempEndAmPm, setTempEndAmPm] = useState('PM');
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FoodEvent | null>(null);
  const foodTypes = ['mains', 'drinks', 'desserts'];
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const campusId = searchParams.get('campus');
  const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) router.replace('/');
  }, [user, router, isInitialized, authLoading]);

  useEffect(() => {
    if (!campusId || !CAMPUSES[campusId]) {
      router.replace('/campuses');
      return;
    }
    setCurrentCampus(CAMPUSES[campusId]);
  }, [campusId, router]);

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized');
      return;
    }
    if (!currentCampus) {
      return;
    }
    const pinsCollection = collection(db, 'pins');
    const unsubscribe = onSnapshot(pinsCollection, (snapshot) => {
      const updatedPins = snapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.location || typeof data.location.lng !== 'number' || typeof data.location.lat !== 'number') {
          return null;
        }
        if (data.campusId !== currentCampus.id) {
          return null;
        }
        const processedPin = {
          id: doc.id,
          location: {
            lng: data.location.lng,
            lat: data.location.lat
          },
          title: data.title || '',
          description: data.description || '',
          host: data.host || '',
          date: data.date || '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          cost: data.cost || 'Free',
          userId: data.userId,
          createdAt: data.createdAt || new Date().toISOString(),
          category: data.category || '',
          upvotes: typeof data.upvotes === 'number' ? data.upvotes : 0,
          votedUserIds: Array.isArray(data.votedUserIds) ? data.votedUserIds : [],
          campusId: data.campusId
        } as Issue;
        return processedPin;
      }).filter(pin => pin !== null) as Issue[];
      setIssues(updatedPins);
      setSidebarIssues(updatedPins);
      setIsLoading(false);
    }, () => {
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentCampus]);

  useEffect(() => {
    if (!db || !user) return;
    const pinsCollection = collection(db, 'pins');
    (async () => {
      const q = query(pinsCollection);
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(pinsCollection, {
          location: { lng: 2.3522, lat: 48.8566 },
          title: 'Sample Food Event',
          description: 'Enjoy free food in the park!',
          host: 'FoodShare Paris',
          date: '2024-06-01',
          startTime: '12:00',
          endTime: '14:00',
          cost: 'Free',
          userId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!db || !user) return;
    const pinsCollection = collection(db, 'pins');
    const unsubscribe = onSnapshot(pinsCollection, (snapshot) => {
      const bookmarks: string[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.bookmarkedBy) && data.bookmarkedBy.includes(user.uid)) {
          bookmarks.push(doc.id);
        }
      });
      setBookmarkedIds(bookmarks);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!db || !user) return;
    const userRef = doc(db, 'users', user.uid);
    getDoc(userRef).then(snapshot => {
      const data = snapshot.data();
      if (data && data.filters) {
        setFilterCategory(data.filters.filterCategory || []);
        setFilterToday(data.filters.filterToday || false);
        setFilterStartHour(data.filters.filterStartHour || '');
        setFilterStartAmPm(data.filters.filterStartAmPm || 'AM');
        setFilterEndHour(data.filters.filterEndHour || '');
        setFilterEndAmPm(data.filters.filterEndAmPm || 'PM');
        setTempStartHour(data.filters.filterStartHour || '');
        setTempStartAmPm(data.filters.filterStartAmPm || 'AM');
        setTempEndHour(data.filters.filterEndHour || '');
        setTempEndAmPm(data.filters.filterEndAmPm || 'PM');
      }
    });
  }, [user]);

  useEffect(() => {
    if (!db || !user) return;
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, {
      filters: {
        filterCategory,
        filterToday,
        filterStartHour,
        filterEndHour
      }
    }, { merge: true });
  }, [user, filterCategory, filterToday, filterStartHour, filterEndHour]);

  const handleMapClick = async (location: { lng: number; lat: number }) => {
    if (!user) return;
    setSelectedLocation(location);
    setPendingLocation(location);
  };

  const handleNewEvent = async (event: FoodEvent) => {
    if (!user || !db || !currentCampus) return;
    try {
      const pinData = {
        location: event.location,
        title: event.title,
        description: event.description,
        host: event.host,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        cost: event.isFree ? 'Free' : 'Paid',
        category: event.category.join(','),
        userId: user.uid,
        createdAt: new Date().toISOString(),
        upvotes: 0,
        votedUserIds: [],
        campusId: currentCampus.id
      };
      await addDoc(collection(db, 'pins'), pinData);
      setSelectedLocation(null);
      setPendingLocation(null);
    } catch {}
  };

  const handleDeletePin = async (pinId: string, userId: string) => {
    if (!user || user.uid !== userId || !db) return;
    try {
      await deleteDoc(doc(db, 'pins', pinId));
      setIssues(prev => prev.filter(issue => issue.id !== pinId));
    } catch {}
  };

  const toggleBookmark = async (eventId: string, isBookmarked: boolean) => {
    if (!db || !user) return;
    const pinRef = doc(db, 'pins', eventId);
    await updateDoc(pinRef, {
      bookmarkedBy: isBookmarked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const isLiveEvent = (event: Issue) => {
    if (!event.date || !event.startTime || !event.endTime) return false;
    const now = new Date();
    const start = parseISO(`${event.date}T${event.startTime}`);
    const end = parseISO(`${event.date}T${event.endTime}`);
    return now >= start && now <= end;
  };

  const isPastEvent = (event: Issue) => {
    const end = event.endTime && event.date ? parseISO(`${event.date}T${event.endTime}`) : null;
    return end && isBefore(end, new Date());
  };

  const isUpcomingEvent = (event: Issue) => {
    const end = event.endTime && event.date ? parseISO(`${event.date}T${event.endTime}`) : null;
    return end && isAfter(end, new Date());
  };

  const sortedSidebarIssues = [...sidebarIssues].sort((a, b) => {
    const aLive = isLiveEvent(a);
    const bLive = isLiveEvent(b);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    return 0;
  });

  const to24Hour = (hour: string, ampm: string) => {
    if (!hour) return '';
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h.toString().padStart(2, '0');
  };
  const applyFilters = (events: Issue[]) => {
    return events.filter(event => {
      if (
        filterCategory.length > 0 &&
        !filterCategory.some(cat => (event.category ?? '').includes(cat))
      ) return false;
      if (filterToday && event.date !== new Date().toISOString().split('T')[0]) return false;
      if (filterStartHour) {
        const eventStartHour = event.startTime ? event.startTime.slice(0,2) : '';
        if (eventStartHour && eventStartHour < to24Hour(filterStartHour, filterStartAmPm)) return false;
      }
      if (filterEndHour) {
        const eventEndHour = event.endTime ? event.endTime.slice(0,2) : '';
        if (eventEndHour && eventEndHour > to24Hour(filterEndHour, filterEndAmPm)) return false;
      }
      return true;
    });
  };

  const filteredSidebarIssues = selectedTab === 'past'
    ? applyFilters(sortedSidebarIssues.filter(isPastEvent))
    : applyFilters(sortedSidebarIssues.filter(isUpcomingEvent));

  const filteredMapPins = useMemo(() => applyFilters(issues.filter(isUpcomingEvent)), [issues, applyFilters]);

  const handleMapBackgroundClick = () => {
    if (!isEditing) {
      setSelectedPinId(null);
      setExpandedEventId(null);
    }
  };

  const handlePinClick = (eventId: string) => {
    if (selectedPinId === eventId) {
      setSelectedPinId(null);
      setExpandedEventId(null);
    } else {
      setSelectedPinId(eventId);
      setExpandedEventId(eventId);
      const eventElement = document.getElementById(`event-${eventId}`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  useEffect(() => {
    if (isEditing && editingEvent?.id) {
      setSelectedPinId(editingEvent.id);
      setExpandedEventId(editingEvent.id);
    }
  }, [isEditing, editingEvent]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM d, yyyy');
  };

  const handleSaveFilters = () => {
    setFilterStartHour(tempStartHour);
    setFilterStartAmPm(tempStartAmPm);
    setFilterEndHour(tempEndHour);
    setFilterEndAmPm(tempEndAmPm);
  };

  const handleEditEvent = (event: Issue) => {
    const foodEvent: FoodEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      host: event.host,
      location: event.location,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      isFree: event.cost === 'Free',
      userId: event.userId,
      createdAt: event.createdAt,
      category: event.category ? event.category.split(',') : []
    };
    setEditingEvent(foodEvent);
    setIsEditing(true);
    setSelectedLocation(event.location);
  };

  const handleUpdateEvent = async (updatedEvent: FoodEvent) => {
    if (!user || !db || !editingEvent?.id) return;
    try {
      const eventRef = doc(db, 'pins', editingEvent.id);
      await updateDoc(eventRef, {
        title: updatedEvent.title,
        description: updatedEvent.description,
        host: updatedEvent.host,
        date: updatedEvent.date,
        startTime: updatedEvent.startTime,
        endTime: updatedEvent.endTime,
        cost: updatedEvent.isFree ? 'Free' : 'Paid',
        category: updatedEvent.category.join(',')
      });
      const updatedIssue: Issue = {
        id: editingEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        host: updatedEvent.host,
        date: updatedEvent.date,
        startTime: updatedEvent.startTime,
        endTime: updatedEvent.endTime,
        cost: updatedEvent.isFree ? 'Free' : 'Paid',
        category: Array.isArray(updatedEvent.category) ? updatedEvent.category.join(',') : updatedEvent.category,
        location: updatedEvent.location,
        userId: updatedEvent.userId,
        createdAt: typeof updatedEvent.createdAt === 'string' 
          ? updatedEvent.createdAt 
          : updatedEvent.createdAt.toISOString()
      };
      setIssues(prev => prev.map(issue => 
        issue.id === editingEvent.id ? updatedIssue : issue
      ));
      setSidebarIssues(prev => prev.map(issue => 
        issue.id === editingEvent.id ? updatedIssue : issue
      ));
      setIsEditing(false);
      setEditingEvent(null);
      setSelectedLocation(null);
    } catch {}
  };

  const handlePinDragEnd = async (eventId: string, lngLat: { lng: number; lat: number }) => {
    if (!user || !db || !editingEvent) return;
    try {
      const eventRef = doc(db, 'pins', eventId);
      await updateDoc(eventRef, {
        location: { lng: lngLat.lng, lat: lngLat.lat }
      });
      setIssues(prev => prev.map(issue =>
        issue.id === eventId ? { ...issue, location: { lng: lngLat.lng, lat: lngLat.lat } } : issue
      ));
      setSidebarIssues(prev => prev.map(issue =>
        issue.id === eventId ? { ...issue, location: { lng: lngLat.lng, lat: lngLat.lat } } : issue
      ));
      setEditingEvent(prev => prev ? { ...prev, location: { lng: lngLat.lng, lat: lngLat.lat } } : prev);
    } catch {}
  };

  if (!isInitialized || authLoading) {
    return <div className={styles.loadingContainer}>Checking authentication...</div>;
  }
  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading map data...</div>;
  }
  if (!user) {
    return <div className={styles.loadingContainer}>Please sign in to continue...</div>;
  }

  return (
    <main className={styles.main}>
      <button onClick={() => router.push('/campuses')} className={styles.homeButton}>
        <Home size={20} />
      </button>
      {currentCampus && (
        <div className={styles.campusHeader}>
          <h1>{currentCampus.name}</h1>
        </div>
      )}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1001, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 12, display: 'flex', gap: 12, alignItems: 'center', fontFamily: "'Inter', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {foodTypes.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '1px solid #6949FF',
                background: filterCategory.includes(cat) ? '#6949FF' : '#fff',
                color: filterCategory.includes(cat) ? '#fff' : '#6949FF',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
          <input type='checkbox' checked={filterToday} onChange={e => setFilterToday(e.target.checked)} />
          Today
        </label>
        <select value={tempStartHour} onChange={e => setTempStartHour(e.target.value)} style={{ minWidth: 70, fontFamily: 'inherit' }}>
          <option value=''>Start</option>
          {Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h.toString()}>{h}</option>)}
        </select>
        <select value={tempStartAmPm} onChange={e => setTempStartAmPm(e.target.value)} style={{ minWidth: 60, fontFamily: 'inherit' }}>
          <option value='AM'>AM</option>
          <option value='PM'>PM</option>
        </select>
        <select value={tempEndHour} onChange={e => setTempEndHour(e.target.value)} style={{ minWidth: 70, fontFamily: 'inherit' }}>
          <option value=''>End</option>
          {Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h.toString()}>{h}</option>)}
        </select>
        <select value={tempEndAmPm} onChange={e => setTempEndAmPm(e.target.value)} style={{ minWidth: 60, fontFamily: 'inherit' }}>
          <option value='AM'>AM</option>
          <option value='PM'>PM</option>
        </select>
        <button 
          onClick={handleSaveFilters}
          style={{ 
            padding: '8px 8px',
            background: '#6949FF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontFamily: 'inherit'
          }}
        >
          Save Filters
        </button>
        <button 
          onClick={() => { 
            setFilterCategory([]); 
            setFilterToday(false); 
            setFilterStartHour(''); 
            setFilterStartAmPm('AM'); 
            setFilterEndHour(''); 
            setFilterEndAmPm('PM');
            setTempStartHour('');
            setTempStartAmPm('AM');
            setTempEndHour('');
            setTempEndAmPm('PM');
          }} 
          style={{ 
            fontFamily: 'inherit',
            padding: '8px 12px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      <div style={{ width: '100vw', height: '90vh', position: 'relative' }}>
        <div ref={mapContainerRef} className={styles.mapWrapper} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Map
            issues={filteredMapPins}
            pendingLocation={pendingLocation}
            onMapClick={handleMapClick}
            onPinClick={handlePinClick}
            selectedPinId={selectedPinId}
            isEditing={isEditing}
            editingEventId={editingEvent?.id || null}
            onPinDragEnd={handlePinDragEnd}
            onMapBackgroundClick={handleMapBackgroundClick}
            campusBounds={currentCampus?.bounds}
            campusCenter={currentCampus?.center}
          />
        </div>
        <aside style={{ position: 'absolute', top: 12, left: 108, width: 370, minWidth: 320, maxWidth: 400, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0002', padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 48px)', zIndex: 10 }}>
          <div style={{ marginBottom: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 26, marginBottom: 4 }}>Events</div>
            <hr style={{ margin: '12px 0 12px 0', border: 'none', borderTop: '1px solid #eee' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setSelectedTab('upcoming')}
              style={{ fontWeight: selectedTab === 'upcoming' ? 700 : 400, background: selectedTab === 'upcoming' ? '#f3f4f6' : 'transparent', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setSelectedTab('past')}
              style={{ fontWeight: selectedTab === 'past' ? 700 : 400, background: selectedTab === 'past' ? '#f3f4f6' : 'transparent', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
            >
              Past Events
            </button>
          </div>
          {filteredSidebarIssues.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No events yet.</div>
          ) : (
            filteredSidebarIssues.map((event: Issue) => {
              const isBookmarked = bookmarkedIds.includes(event.id);
              const expanded = expandedEventId === event.id;
              const isSelected = selectedPinId === event.id;
              const isCreator = user?.uid === event.userId;
              const categories = event.category ? event.category.split(',') : [];
              const live = isLiveEvent(event);
              return (
                <div 
                  key={event.id} 
                  id={`event-${event.id}`}
                  style={{ 
                    borderBottom: '1px solid #eee', 
                    padding: '10px 0',
                    backgroundColor: isSelected ? '#f8f5ff' : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => setExpandedEventId(expanded ? null : event.id)}
                  >
                    {live ? (
                      <span style={{ color: '#e11d48', fontSize: 22, fontWeight: 700, marginRight: 2 }}>★</span>
                    ) : (
                      <button
                        aria-label={isBookmarked ? 'Unbookmark' : 'Bookmark'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(event.id, isBookmarked);
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontSize: 22, 
                          color: isBookmarked ? '#f59e42' : '#888',
                          padding: '4px'
                        }}
                      >
                        {isBookmarked ? '★' : '☆'}
                      </button>
                    )}
                    <div style={{ 
                      flex: 1, 
                      fontWeight: 500, 
                      fontSize: 18,
                      color: isSelected ? '#6949FF' : 'inherit'
                    }}>
                      {event.title}
                      {live && <span style={{ marginLeft: 8, color: '#e11d48', fontWeight: 700, fontSize: 14, letterSpacing: 1, verticalAlign: 'middle' }}>LIVE</span>}
                    </div>
                    <div
                      style={{ 
                        fontSize: 18, 
                        color: '#888',
                        padding: '4px'
                      }}
                    >
                      {expanded ? '▲' : '▼'}
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ 
                      marginTop: 8, 
                      fontSize: 15, 
                      color: '#444',
                      padding: '0 8px'
                    }}>
                      <div><b>Description:</b> {event.description} {live && <span style={{ color: '#e11d48', fontWeight: 700, marginLeft: 8 }}>[LIVE]</span>}</div>
                      <div><b>Host:</b> {event.host}</div>
                      <div><b>Date:</b> {formatDate(event.date)}</div>
                      <div><b>Time:</b> {event.startTime} - {event.endTime}</div>
                      <div><b>Cost:</b> {event.cost}</div>
                      <div style={{ marginTop: 8 }}>
                        <b>Categories:</b>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          {categories.map(cat => (
                            <span
                              key={cat}
                              style={{
                                background: '#f0f0f0',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: '#666'
                              }}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isCreator && (
                        <div style={{ 
                          marginTop: 12, 
                          display: 'flex', 
                          gap: 8,
                          justifyContent: 'flex-end'
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#f0f0f0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this event?')) {
                                handleDeletePin(event.id, event.userId);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#dc2626'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </aside>
        {selectedLocation && (
          <div className={styles.reportFormContainer} style={{ right: 108, top: 12, position: 'absolute', zIndex: 1000 }}>
            <ReportForm
              location={selectedLocation}
              onSubmit={isEditing ? handleUpdateEvent : handleNewEvent}
              onCancel={() => {
                setSelectedLocation(null);
                setPendingLocation(null);
                setIsEditing(false);
                setEditingEvent(null);
              }}
              existingEvent={editingEvent}
            />
          </div>
        )}
      </div>
    </main>
  );
} 