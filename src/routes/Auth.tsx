// Auth page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail } from '../lib/auth';
import { uploadProfilePhoto } from '../lib/storage';
import { auth } from '../lib/firebase';
import lumoLogo from '../assets/lumo-logo.svg';
import './Auth.css';

type AuthMode = 'signin' | 'signup';

export const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/feed');
    } catch (err) {
      console.error('Error signing in with Google:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Por favor ingresa tu nombre y apellido');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        // Upload profile photo if provided
        let photoURL: string | undefined;
        if (photoFile) {
          photoURL = await uploadProfilePhoto(photoFile, newUser.uid);
        }
        
        // Combine first name and last name
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        // Update profile with name and photo
        await updateProfile(newUser, {
          displayName: fullName,
          photoURL: photoURL || undefined,
        });
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/feed');
    } catch (err) {
      console.error('Error with email auth:', err);
      
      let errorMessage = 'Error al autenticar';
      if (err instanceof Error) {
        const firebaseError = err as { code?: string; message: string };
        errorMessage =
          firebaseError.code === 'auth/email-already-in-use'
            ? 'Este correo ya está registrado'
            : firebaseError.code === 'auth/invalid-email'
            ? 'Correo electrónico inválido'
            : firebaseError.code === 'auth/user-not-found'
            ? 'Usuario no encontrado'
            : firebaseError.code === 'auth/wrong-password'
            ? 'Contraseña incorrecta'
            : firebaseError.message || 'Error al autenticar';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-title-container">
          <img src={lumoLogo} alt="Lumo" className="auth-logo" />
          <h1 className="auth-title">Lumo</h1>
        </div>
        <p className="auth-subtitle">Donde cada foto ilumina una historia</p>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
        >
          <svg viewBox="0 0 24 24" className="google-icon">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <form onSubmit={handleEmailAuth} className="auth-form">
          {mode === 'signup' && (
            <>
              <input
                type="text"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
              
              <input
                type="text"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
              
              <div className="auth-photo-upload">
                <label htmlFor="photo-upload" className="photo-upload-label">
                  {photoFile ? (
                    <img 
                      src={URL.createObjectURL(photoFile)} 
                      alt="Preview" 
                      className="photo-preview"
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
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
                      <span>Foto de perfil (opcional)</span>
                    </div>
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="photo-input"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          {mode === 'signup' && (
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              disabled={loading}
            />
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? 'Cargando...'
              : mode === 'signup'
              ? 'Crear cuenta'
              : 'Iniciar sesión'}
          </button>
        </form>

        <button
          className="auth-toggle-btn"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          type="button"
        >
          {mode === 'signin'
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
};
