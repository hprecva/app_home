import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ProductManager } from '../components/ProductManager';

interface DashboardViewProps {
  session: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ session }) => {
  const [username, setUsername] = useState<string>('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Consultamos la tabla profiles filtrando por la ID de la sesión actual
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (data) setUsername(data.username);
      } catch (err) {
        // Fallback inmediato a los metadatos si RLS o la sincronización tarda milisegundos
        setUsername(session.user.user_metadata?.full_name || 'Usuario');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Barra de navegación del panel */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <span style={styles.logoDot}></span>
          <h1 style={styles.logoText}>Control de Consumo</h1>
        </div>
        <button onClick={handleSignOut} style={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      {/* Banner Principal y Módulos */}
      <main style={styles.mainContent}>
        <div style={styles.welcomeBanner}>
          <h2>
            Panel Privado:{' '}
            <span style={styles.accentText}>
              {loadingProfile ? 'Cargando...' : username}
            </span>
          </h2>
          <p style={styles.bannerSubtitle}>
            Gestiona tus recursos financieros y analiza las sugerencias de compra inteligentes.
          </p>
        </div>

        {/* INYECCIÓN DEL MÓDULO DE PRODUCTOS */}
        <section style={styles.moduleSection}>
          <ProductManager />
        </section>
      </main>
    </div>
  );
};

const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1e293b', backgroundColor: '#1e293b' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoDot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#38bdf8' },
  logoText: { fontSize: '20px', margin: 0, fontWeight: 'bold' as const },
  logoutBtn: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: 'bold' as const, cursor: 'pointer', transition: 'all 0.2s' },
  mainContent: { padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: '30px' },
  welcomeBanner: { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '30px', borderRadius: '12px', border: '1px solid #334155' },
  accentText: { color: '#38bdf8' },
  bannerSubtitle: { color: '#94a3b8', margin: '10px 0 0 0', fontSize: '16px' },
  moduleSection: { width: '100%' }
};