import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en la sesión de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20%' }}>Cargando aplicación...</div>;

  // Enrutamiento básico basado en el estado de la sesión
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      {session ? <DashboardView session={session} /> : <LoginView />}
    </div>
  );
}