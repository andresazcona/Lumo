// Settings page
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { uploadProfilePhoto } from '../lib/storage';
import userPlaceholder from '../assets/user-placeholder.png';
import './Settings.css';

export const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Split displayName into first and last name
  const nameParts = (user?.displayName || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePhoto = async () => {
    if (!photoFile) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload new photo
      const photoURL = await uploadProfilePhoto(photoFile, user.uid);

      await updateProfile(user, {
        photoURL: photoURL,
      });
      
      setSuccess(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating photo:', err);
      setError('Error al actualizar la foto de perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('Por favor completa nombre y apellido');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, {
        displayName: fullName,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <Header />

      <main className="settings-main">
        <div className="settings-header">
          <button className="back-button" onClick={() => navigate('/feed')} aria-label="Volver">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1>Mi Perfil</h1>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <h2>Foto de perfil</h2>
            
            {/* Photo upload */}
            <div className="settings-item">
              <div className="profile-photo-container">
                <img 
                  src={photoPreview || user.photoURL || userPlaceholder} 
                  alt="Foto de perfil" 
                  className="profile-photo-preview"
                />
                <div className="profile-photo-actions">
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                      />
                    </svg>
                    Seleccionar foto
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      className="save-photo-btn"
                      onClick={handleSavePhoto}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar foto'}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>Información de la cuenta</h2>
            
            <form onSubmit={handleSave}>
              {/* Email field */}
              <div className="settings-item">
                <label className="settings-label">Correo electrónico</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="settings-input disabled"
                />
                <p className="settings-help">El correo electrónico no se puede modificar</p>
              </div>

              {/* First name field */}
              <div className="settings-item">
                <label className="settings-label" htmlFor="firstName">
                  Nombre
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="settings-input"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Last name field */}
              <div className="settings-item">
                <label className="settings-label" htmlFor="lastName">
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="settings-input"
                  placeholder="Tu apellido"
                  required
                />
              </div>

              {error && <div className="settings-error">{error}</div>}
              {success && <div className="settings-success">¡Perfil actualizado correctamente!</div>}

              <button
                type="submit"
                className="settings-save-btn"
                disabled={loading || !firstName.trim() || !lastName.trim()}
              >
                {loading ? 'Guardando...' : 'Guardar nombre'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
