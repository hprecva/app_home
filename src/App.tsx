import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user.id);
    } else {
      setProfile(null);
    }
  }, [session]);

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
  }

  // 1. REGISTRO (Botón Verde)
  async function handleSignUp() {
    if (!email || !password || !fullName) {
      alert('Faltan datos obligatorios para el registro.');
      return;
    }
    
    setLoading(true);

    // Paso A: Registrar en Supabase Auth (Ya no dará error 500 porque quitamos el trigger)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      alert('Error de Autenticación: ' + authError.message);
      setLoading(false);
      return;
    }

    // Paso B: Si el usuario se creó en Auth, creamos manualmente su fila en profiles
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, // Enlazamos usando el UUID idéntico de Auth
            username: fullName,
            household_id: null
          }
        ]);

      if (profileError) {
        console.error("Error al crear el perfil público:", profileError.message);
        alert('Usuario autenticado, pero hubo un detalle con su perfil: ' + profileError.message);
      } else {
        alert('¡Usuario y perfil registrados con éxito! Ya puedes iniciar sesión.');
        setPassword('');
      }
    }

    setLoading(false);
  }

  // 2. INICIO DE SESIÓN (Botón Morado)
  async function handleLogin() {
    // Alerta de rastreo para confirmar qué función se activó
    alert(`[RASTREO] Ejecutando: handleLogin.\nCorreo: "${email}"`);
    
    if (!email || !password) {
      alert('Por favor ingresa correo y contraseña para iniciar sesión.');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Error al ingresar: ' + error.message);
    setLoading(false);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user || !fullName) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ username: fullName })
      .eq('id', session.user.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      alert('¡Nombre de perfil actualizado con éxito!');
      fetchUserProfile(session.user.id);
    }
    setLoading(false);
  }

  if (!session) {
    return (
      <div style={styles.container}>
        <h2 style={{ textAlign: 'center' }}>Kitchen Intelligence - Acceso 🔐</h2>
        <div style={styles.cardForm}>
          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Nombre Completo (Solo para registrarse):</label>
            <input 
              type="text" 
              placeholder="Ej. Juan Pérez" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Correo Electrónico:</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Contraseña (Mínimo 6 caracteres):</label>
            <input 
              type="password" 
              placeholder="******" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={() => handleLogin()} 
              disabled={loading} 
              style={styles.btnPrimary}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
            
            <button 
              type="button" 
              onClick={() => handleSignUp()} 
              disabled={loading} 
              style={styles.btnSecondary}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Bienvenido a tu Cuenta 👋</h2>
      {profile ? (
        <div style={styles.profileBox}>
          <h3>Datos de tu sesión segura (READ):</h3>
          <p><strong>Tu ID único (UUID):</strong> <span style={{ fontSize: '12px', color: '#555' }}>{profile.id}</span></p>
          <p><strong>Nombre en Perfil:</strong> {profile.username || 'Sin nombre'}</p>
          <p><strong>Hogar Asociado:</strong> {profile.household_id || 'Ninguno de momento'}</p>
        </div>
      ) : (
        <p>Cargando datos del perfil...</p>
      )}

      <form onSubmit={handleUpdateProfile} style={styles.cardForm}>
        <h3>Modificar mis Datos (UPDATE)</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={styles.label}>Nuevo Nombre Completo:</label>
          <input 
            type="text" 
            placeholder="Cambiar tu nombre" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            style={styles.input}
            required
          />
        </div>
        <button type="submit" disabled={loading} style={styles.btnPrimary}>
          {loading ? 'Actualizando...' : 'Guardar Cambios'}
        </button>
      </form>

      <button onClick={() => supabase.auth.signOut()} style={styles.btnDanger}>
        Cerrar Sesión
      </button>
    </div>
  );
}

const styles = {
  container: { padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '480px', margin: '40px auto' },
  cardForm: { border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  label: { display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' },
  input: { width: '100%', padding: '10px', fontSize: '15px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'box-sizing' as any },
  profileBox: { padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #4F46E5' },
  btnPrimary: { flex: 1, padding: '11px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as any, cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '11px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as any, cursor: 'pointer' },
  btnDanger: { width: '100%', padding: '11px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as any, cursor: 'pointer', marginTop: '15px' }
};