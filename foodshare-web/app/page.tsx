"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/Auth/AuthProvider";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import styles from "./HomePage.module.css";
import Image from "next/image";
import type { User } from 'firebase/auth';

interface Pin {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  createdAt: Date;
  userId: string; 
}

export default function HomePage() {
  const router = useRouter();
  const { 
    user, 
    isLoading: authLoading, 
    isInitialized, 
    loginWithGoogle, 
    loginWithEmail,
    registerWithEmail, 
    logout 
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadUserPins = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const pinsRef = collection(db, 'pins');
      const q = query(pinsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const pins: Pin[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure the data has the correct types
        const pin: Pin = {
          id: doc.id,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          description: String(data.description || ''),
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
          userId: String(data.userId)
        };
        pins.push(pin);
      });
    } catch (error: unknown) {
      handleAuthError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserPins();
    }
  }, [user, loadUserPins]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await loginWithGoogle();
      await saveUserToFirestore(userCredential.user);
      router.push('/campuses');
    } catch (error: unknown) {
      handleAuthError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = isRegistering
        ? await registerWithEmail(email, password)
        : await loginWithEmail(email, password);
      await saveUserToFirestore(userCredential.user);
      router.push('/campuses');
    } catch (error: unknown) {
      handleAuthError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error: unknown) => {
    console.error('Auth error:', error);
    setError((error as Error).message || 'Authentication failed. Please try again.');
  };

  const saveUserToFirestore = async (user: User) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date(),
      }, { merge: true });
    } catch (error: unknown) {
      handleAuthError(error as Error);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.authSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.authCard}
        >
          <div className={styles.authHeader}>
            <div className={styles.logoWrapper}>
              <Image src="/tasty.png" alt="FoodShare" className={styles.logo} width={120} height={40} />
            </div>
            <h1 className={styles.heroTitle}>{'Join FoodShare'}</h1>
          </div>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className={styles.heroDescription}
        >
          Connect with your campus community through food! Share and discover local food events, 
          meetups, and gatherings happening around you.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className={styles.heroButtonWrapper}
        >
          {user ? (
            <>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.heroButton}
                  onClick={() => router.push("/map")}
                >
                  Find Food!
                </button>
                <button
                  className={`${styles.heroButton} ${styles.logoutButton}`}
                  onClick={logout}
                >
                  Sign Out
                </button>
              </div>
            
            </>
          ) : (
            <>
              {!showEmailForm ? (
                <div className={styles.authButtons}>
                  
                  <button
                    className={`${styles.heroButton} ${isLoading || authLoading ? styles.loading : ''}`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading || authLoading || !isInitialized}
                  >
                    <Image 
                      src="/google-logo.png" 
                      alt="Continue with Google"
                      className={styles.googleLogo}
                      width={20}
                      height={20}
                    />
                    {isLoading || authLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                  <button
                    className={styles.heroButton}
                    onClick={() => setShowEmailForm(true)}
                    disabled={isLoading || authLoading || !isInitialized}
                  >
                    Use Email Instead
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailAuth} className={styles.emailForm}>
                  <h3>{isRegistering ? 'Create an Account' : 'Sign In'}</h3>
                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.input}
                      required
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`${styles.heroButton} ${isLoading || authLoading ? styles.loading : ''}`}
                    disabled={isLoading || authLoading || !isInitialized}
                  >
                    {isLoading || authLoading 
                      ? 'Processing...' 
                      : isRegistering 
                        ? 'Create Account' 
                        : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    className={styles.switchAuthMode}
                    onClick={() => setIsRegistering(!isRegistering)}
                  >
                    {isRegistering 
                      ? 'Already have an account? Sign In' 
                      : 'Need an account? Register'}
                  </button>
                  <button
                    type="button"
                    className={styles.switchAuthMode}
                    onClick={() => {
                      setShowEmailForm(false);
                      setError(null);
                    }}
                  >
                    Back to Options
                  </button>
                  {error && <p className={styles.errorText}>{error}</p>}
                </form>
              )}
              {error && <p className={styles.errorText}>{error}</p>}
            </>
          )}
        </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
