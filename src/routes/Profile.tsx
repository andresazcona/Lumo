// Profile page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import './Profile.css';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchPhotoCount = async () => {
      try {
        const q = query(collection(db, 'photos'), where('ownerUid', '==', user.uid));
        const snapshot = await getDocs(q);
        setPhotoCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching photo count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoCount();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="profile-container">
      <Header />

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Usuario'} />
            ) : (
              <div className="profile-avatar-placeholder">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="profile-name">{user.displayName || 'Usuario'}</h1>
          <p className="profile-email">{user.email}</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">
                {loading ? '...' : photoCount}
              </span>
              <span className="profile-stat-label">
                {photoCount === 1 ? 'Foto subida' : 'Fotos subidas'}
              </span>
            </div>
          </div>

          <button className="profile-back-btn" onClick={() => navigate('/feed')}>
            Volver al feed
          </button>
        </div>
      </main>
    </div>
  );
};
