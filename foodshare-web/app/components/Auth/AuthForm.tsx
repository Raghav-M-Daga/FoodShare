import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './Auth.module.css';
import { useAuth } from '../../AuthProvider';

interface AuthFormProps {
  defaultMode?: 'signin' | 'signup';
}

export default function AuthForm({ defaultMode = 'signin' }: AuthFormProps) {
  const [isSignIn, setIsSignIn] = useState(defaultMode === 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isSignIn) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.authCard}
      >
        <div className={styles.authHeader}>
          <Image
            src="/foodshare-logo.png"
            alt="FoodShare"
            width={120}
            height={40}
            className={styles.logo}
          />
          <h1 className={styles.title}>
            {isSignIn ? 'Welcome back!' : 'Create an account'}
          </h1>
          <p className={styles.subtitle}>
            {isSignIn 
              ? 'Sign in to continue to FoodShare'
              : 'Join the community and share food events'}
          </p>
        </div>

        <button 
          className={styles.googleButton}
          onClick={handleGoogleSignIn}
        >
          <Image
            src="/google-logo.png"
            alt="Google"
            width={20}
            height={20}
            className={styles.googleIcon}
          />
          Continue with Google
        </button>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <div className={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryButton}>
            {isSignIn ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={styles.footer}>
          {isSignIn ? (
            <p>
              Don't have an account?{' '}
              <button 
                className={styles.footerLink}
                onClick={() => setIsSignIn(false)}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                className={styles.footerLink}
                onClick={() => setIsSignIn(true)}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
