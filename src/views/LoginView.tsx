import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const LoginView: React.FC = () => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === 'register') {
        // Registro de cuenta mapeando el full_name para el Display Name
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username,
            },
          },
        });
        if (error) throw error;
        setMessage({ text: '¡Registro exitoso! Revisa tu correo o inicia sesión.', type: 'success' });
        setView('login');
      } else {
        // Inicio de sesión tradicional
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Ocurrió un error en la autenticación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Privada'}</h2>
        <p style={styles.subtitle}>
          {view === 'login' ? 'Ingresa para gestionar tus consumos' : 'Regístrate para comenzar a optimizar tus gastos.'}
        </p>

        {message && (
          <div style={{ ...styles.alert, backgroundColor: message.type === 'success' ? '#065f46' : '#991b1b' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={styles.form}>
          {view === 'register' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre de Usuario</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="ej: hector_pv"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="tu@correo.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="********"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Procesando...' : view === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <p style={styles.switchText}>
          {view === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span style={styles.link} onClick={() => setView(view === 'login' ? 'register' : 'login')}>
            {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  card: { background: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)' },
  title: { textAlign: 'center' as const, fontSize: '28px', marginBottom: '10px', color: '#fff' },
  subtitle: { textAlign: 'center' as const, color: '#94a3b8', fontSize: '14px', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  label: { fontSize: '14px', color: '#cbd5e1' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '16px' },
  button: { padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' as const, cursor: 'pointer', marginTop: '10px' },
  switchText: { textAlign: 'center' as const, fontSize: '14px', marginTop: '20px', color: '#94a3b8' },
  link: { color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' as const },
  alert: { padding: '12px', borderRadius: '6px', color: '#fff', textAlign: 'center' as const, fontSize: '14px', marginBottom: '15px' }
};