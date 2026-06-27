import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { styles } from './styles';

export default function App() {
  // Estados de navegación e interfaz
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Estados de los formularios de acceso
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // NUEVOS ESTADOS: Presupuesto y Gestión de Productos
  const [budget, setBudget] = useState<number>(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState('');

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Escuchar la sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setView('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setView('dashboard');
      } else {
        setUser(null);
        setProfile(null);
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar perfil y el presupuesto guardado (si existe en tu tabla de perfiles)
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
      if (data?.budget) {
        setBudget(data.budget);
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  // Guardar el presupuesto en la base de datos de manera privada
  const handleSaveBudget = async () => {
    const parsedBudget = parseFloat(tempBudget);
    if (isNaN(parsedBudget) || parsedBudget < 0) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ budget: parsedBudget })
        .eq('id', user.id);

      if (error) throw error;
      setBudget(parsedBudget);
      setIsEditingBudget(false);
    } catch (err) {
      console.error("Error al guardar presupuesto:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al iniciar sesión', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage(null);
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username, // Al usar 'full_name', Supabase llena la columna "Display name"
        }
      }
    });

    if (authError) throw authError;
    
    setMessage({ text: '¡Registro exitoso! Ya puedes iniciar sesión.', type: 'success' });
    setView('login');
    setUsername('');
  } catch (err: any) {
    setMessage({ text: err.message || 'Error al registrar', type: 'error' });
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setBudget(0);
    setView('landing');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo} onClick={() => view !== 'dashboard' && setView('landing')}>
          💰 SmartBuyer
        </div>
        {view === 'dashboard' && (
          <button style={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión</button>
        )}
      </header>

      <main style={styles.main}>
        {/* VISTA 1: LANDING PAGE ADAPTADA */}
        {view === 'landing' && (
          <div style={styles.landingWrapper}>
            <h1 style={styles.heroTitle}>Tus compras habituales, optimizadas para tu bolsillo</h1>
            <p style={styles.heroSubtitle}>
              Define tu presupuesto disponible y recibe sugerencias inteligentes de compra para los productos que ya consumes día con día. Tu información es 100% privada.
            </p>
            <div style={styles.btnGroup}>
              <button style={styles.primaryBtn} onClick={() => setView('login')}>Iniciar Sesión</button>
              <button style={styles.secondaryBtn} onClick={() => setView('register')}>Registrarse</button>
            </div>
          </div>
        )}

        {/* VISTA 2: LOGIN */}
        {view === 'login' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Iniciar Sesión</h2>
            <p style={styles.cardSubtitle}>Ingresa para gestionar tu presupuesto de forma privada.</p>
            {message && <div style={message.type === 'success' ? styles.successBox : styles.errorBox}>{message.text}</div>}
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input type="email" style={styles.input} placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contraseña</label>
                <input type="password" style={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" style={styles.submitBtn} disabled={loading}>{loading ? 'Accediendo...' : 'Entrar'}</button>
            </form>
            <p style={styles.switchText}>¿No tienes una cuenta? <span style={styles.switchLink} onClick={() => { setView('register'); setMessage(null); }}>Regístrate aquí</span></p>
          </div>
        )}

        {/* VISTA 3: REGISTRO */}
        {view === 'register' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Crear Cuenta Privada</h2>
            <p style={styles.cardSubtitle}>Regístrate para comenzar a optimizar tus gastos de consumo.</p>
            {message && <div style={message.type === 'success' ? styles.successBox : styles.errorBox}>{message.text}</div>}
            <form onSubmit={handleRegister} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de Usuario</label>
                <input type="text" style={styles.input} placeholder="Ej: hector_pv" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input type="email" style={styles.input} placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contraseña</label>
                <input type="password" style={styles.input} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" style={styles.submitBtn} disabled={loading}>{loading ? 'Registrando...' : 'Registrarse'}</button>
            </form>
            <p style={styles.switchText}>¿Ya tienes cuenta? <span style={styles.switchLink} onClick={() => { setView('login'); setMessage(null); }}>Inicia sesión aquí</span></p>
          </div>
        )}

        {/* VISTA 4: PANEL DE CONTROL */}
        {view === 'dashboard' && (
          <div style={styles.dashboard}>
            <div style={styles.welcomeBanner}>
              <h2>
                Panel Privado: <span style={styles.accentText}>{profile?.username || user?.user_metadata?.full_name || 'Usuario'}</span>
              </h2>
              <p>Gestiona tus recursos y analiza las sugerencias de compra inteligentes.</p>
            </div>

            {/* SECCIÓN DE PRESUPUESTO */}
            <div style={styles.budgetSection}>
              {isEditingBudget ? (
                <div style={styles.budgetEditRow}>
                  <input
                    type="number"
                    style={styles.inputBudget}
                    placeholder="Introduce tu presupuesto (ingresos)"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                  />
                  <button style={styles.saveBudgetBtn} onClick={handleSaveBudget}>Guardar</button>
                  <button style={styles.cancelBudgetBtn} onClick={() => setIsEditingBudget(false)}>Cancelar</button>
                </div>
              ) : (
                <div style={styles.budgetDisplayRow}>
                  <div>
                    <span style={styles.budgetLabel}>Tu Presupuesto Mensual Asignado:</span>
                    <span style={styles.budgetValue}> ${budget.toLocaleString('es-MX')}</span>
                  </div>
                  <button style={styles.editBudgetBtn} onClick={() => { setTempBudget(budget.toString()); setIsEditingBudget(true); }}>
                    {budget === 0 ? 'Asignar Presupuesto' : 'Modificar'}
                  </button>
                </div>
              )}
            </div>

            {/* GRID DE MÉTRICAS NUEVAS */}
            <div style={styles.grid}>
              <div style={styles.dashboardCard}>
                <div style={styles.cardHeaderIcon}>🛒</div>
                <h3>Tus Productos Frecuentes</h3>
                <p style={styles.metric}>8 Artículos</p>
                <span style={styles.metricSub}>Monitoreados en tiempo real</span>
              </div>

              <div style={styles.dashboardCard}>
                <div style={styles.cardHeaderIcon}>💡</div>
                <h3>Sugerencias de Optimización</h3>
                <p style={styles.metric}>3 Alertas</p>
                <span style={styles.metricSub}>Opciones con mejor relación calidad/precio</span>
              </div>

              <div style={styles.dashboardCard}>
                <div style={styles.cardHeaderIcon}>📉</div>
                <h3>Ahorro Estimado</h3>
                <p style={styles.metric}>15.2%</p>
                <span style={styles.metricSub}>Proyección si aplicas las sugerencias</span>
              </div>
            </div>

            {/* PANEL DE SUGERENCIAS SIMULADAS */}
            <div style={styles.suggestionsBox}>
              <h3 style={{ marginBottom: '15px' }}>⚡ Sugerencias de compra personalizadas</h3>
              <div style={styles.suggestionItem}>
                <strong>Artículos de despensa básica:</strong> Detectamos que el Supermercado B tiene un descuento del 10% por volumen en los productos de limpieza que ya usas con frecuencia.
              </div>
              <div style={styles.suggestionItem}>
                <strong>Sustitución inteligente:</strong> El café de la marca X (que está en tu lista habitual) tiene una alternativa premium local con un precio 20% menor este mes.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}