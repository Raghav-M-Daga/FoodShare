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

function MapPageClient() {
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

  // ... (rest of the MapPage function body from page.tsx, unchanged)

  // Copy the full return statement from your previous MapPage function here:
  return (
    <main className={styles.main}>
      {/* ...rest of your map page JSX... */}
    </main>
  );
}

export default MapPageClient; 