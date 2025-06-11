'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/Auth/AuthProvider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import styles from './Campuses.module.css';

interface Campus {
  id: string;
  name: string;
  description: string;
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

// For now, we only have Duke, but this can be expanded
const AVAILABLE_CAMPUSES: Campus[] = [
  {
    id: 'duke',
    name: 'Duke University',
    description: 'Duke University is a private research university in Durham, North Carolina.',
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
  },
  {
    id: 'american-high',
    name: 'American High School',
    description: 'American High School is a public high school in Fremont, California.',
    bounds: {
      north: 37.5500,
      south: 37.5400,
      east: -121.9800,
      west: -122.0000
    },
    center: {
      lat: 37.5450,
      lng: -121.9900
    }
  }
];

export default function CampusesPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized || !user) return;

    const loadUserCampus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (userData?.selectedCampus) {
          setSelectedCampus(userData.selectedCampus);
        }
      } catch (error) {
        console.error('Error loading user campus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCampus();
  }, [user, isInitialized]);

  const handleCampusSelect = async (campusId: string) => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        selectedCampus: campusId
      }, { merge: true });

      setSelectedCampus(campusId);
      router.push(`/map?campus=${campusId}`);
    } catch (error) {
      console.error('Error saving campus selection:', error);
    }
  };

  if (!isInitialized || isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Select Your Campus</h1>
        <p>Choose a campus to view and share food events in your area</p>
      </div>

      <div className={styles.campusGrid}>
        {AVAILABLE_CAMPUSES.map((campus) => (
          <div
            key={campus.id}
            className={`${styles.campusCard} ${selectedCampus === campus.id ? styles.selected : ''}`}
            onClick={() => handleCampusSelect(campus.id)}
          >
            <div className={styles.campusInfo}>
              <h2>{campus.name}</h2>
              <p>{campus.description}</p>
              <button 
                className={styles.selectButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCampusSelect(campus.id);
                }}
              >
                {selectedCampus === campus.id ? 'Selected' : 'Select Campus'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 