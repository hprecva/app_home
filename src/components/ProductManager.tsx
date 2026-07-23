import React, { useState, useEffect } from 'react';
import { 
  addProductRecord, 
  fetchSmartPurchaseSuggestions, 
  fetchProductHistory, 
  ProductPriceRecord, 
  PurchaseSuggestion 
} from '../services/products';

export const ProductManager: React.FC = () => {
  // Estados del Formulario
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [presentation, setPresentation] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');

  // Estados de Hábitos y Sugerencias
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [selectedPreviousPrice, setSelectedPreviousPrice] = useState<number | null>(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState<ProductPriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const smartList = await fetchSmartPurchaseSuggestions();
    setSuggestions(smartList);
  };

  // Al seleccionar una sugerencia inteligente basada en frecuencia
  const handleSelectSuggestion = async (item: PurchaseSuggestion) => {
    setProductName(item.product_name);
    setBrand(item.brand || '');
    setPresentation(item.presentation || '');
    setStore(item.store || '');
    setPrice(item.price.toString()); // Sugiere mantener el precio anterior
    setSelectedPreviousPrice(item.price);

    // Cargar historial completo para la gráfica/tendencia
    const history = await fetchProductHistory(item.product_name);
    setSelectedProductHistory(history);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !price) return;

    setLoading(true);
    setMessage(null);

    try {
      await addProductRecord({
        product_name: productName,
        brand,
        presentation,
        price: parseFloat(price),
        store,
      });

      setMessage('¡Compra registrada exitosamente!');
      setProductName('');
      setBrand('');
      setPresentation('');
      setPrice('');
      setStore('');
      setSelectedPreviousPrice(null);
      await loadSuggestions(); // Recalcula frecuencias con la nueva fecha de compra
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🛒 Gestión de Compras y Hábitos</h2>
      <p style={{ color: '#94a3b8' }}>
        El sistema aprende cada cuántos días compras un producto y te lo sugiere automáticamente al vencer el ciclo.
      </p>

      {/* SECCIÓN 1: CUADRO DE SUGERENCIAS POR FRECUENCIA / HÁBITOS */}
      {suggestions.length > 0 && (
        <div style={styles.suggestionsContainer}>
          <h3 style={styles.sectionTitle}>🔔 Sugerencias de Compra Según tus Hábitos:</h3>
          <div style={styles.cardsGrid}>
            {suggestions.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  ...styles.suggestionCard, 
                  borderColor: item.isDue ? '#38bdf8' : '#334155' 
                }}
              >
                {item.isDue && <span style={styles.badgeDue}>Sugerido Hoy</span>}
                <strong style={{ fontSize: '16px', color: '#fff' }}>{item.product_name}</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {item.brand} {item.presentation && `• ${item.presentation}`}
                </span>
                
                <div style={styles.freqInfo}>
                  <p>Frecuencia: <strong>Cada {item.averageDaysInterval} días</strong></p>
                  <p>Último precio: <strong style={{ color: '#10b981' }}>${item.price.toFixed(2)}</strong></p>
                </div>

                <button 
                  style={styles.applyBtn} 
                  onClick={() => handleSelectSuggestion(item)}
                >
                  Cargar / Actualizar Precio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: FORMULARIO DE NUEVA COMPRA / ACTUALIZACIÓN */}
      <div style={styles.formBox}>
        <h3>{selectedPreviousPrice !== null ? '✏️ Actualizar Registro de Compra' : '➕ Registrar Producto Nuevo'}</h3>
        
        {selectedPreviousPrice !== null && (
          <div style={styles.priceNotice}>
            💡 Precio anterior cargado: <strong>${selectedPreviousPrice.toFixed(2)}</strong>. Puedes mantenerlo o escribir el precio nuevo si cambió.
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.gridRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Producto *</label>
              <input
                type="text"
                required
                placeholder="Ej: Leche Entera"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Marca</label>
              <input
                type="text"
                placeholder="Ej: Alpura"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.gridRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Presentación</label>
              <input
                type="text"
                placeholder="Ej: 1 Litro"
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Establecimiento</label>
              <input
                type="text"
                placeholder="Ej: Walmart"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Precio Pagado Hoy ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ ...styles.input, borderColor: '#38bdf8', fontSize: '18px', fontWeight: 'bold' }}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Guardando...' : 'Confirmar y Guardar Compra'}
          </button>

          {message && <p style={{ color: message.startsWith('Error') ? '#ef4444' : '#10b981', textAlign: 'center' }}>{message}</p>}
        </form>
      </div>

      {/* SECCIÓN 3: TENDENCIA / HISTORIAL DEL PRODUCTO SELECCIONADO */}
      {selectedProductHistory.length > 1 && (
        <div style={styles.historyBox}>
          <h3>📈 Historial de Precios: {productName}</h3>
          <div style={styles.timeline}>
            {selectedProductHistory.map((item, idx) => (
              <div key={idx} style={styles.timelineCard}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(item.created_at || '').toLocaleDateString('es-MX')}
                </span>
                <span style={{ fontSize: '12px', color: '#38bdf8' }}>{item.store || 'Tienda N/A'}</span>
                <strong style={{ fontSize: '18px', color: '#10b981', marginTop: '5px' }}>
                  ${item.price.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column' as const, gap: '25px', color: '#fff' },
  suggestionsContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' },
  sectionTitle: { margin: '0 0 15px 0', fontSize: '16px', color: '#38bdf8' },
  cardsGrid: { display: 'flex', gap: '15px', overflowX: 'auto' as const, paddingBottom: '10px' },
  suggestionCard: { minWidth: '220px', background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid', display: 'flex', flexDirection: 'column' as const, gap: '5px', position: 'relative' as const },
  badgeDue: { position: 'absolute' as const, top: '10px', right: '10px', background: '#0284c7', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' as const },
  freqInfo: { margin: '10px 0', fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid #334155', paddingTop: '8px' },
  applyBtn: { padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '12px' },
  formBox: { background: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155' },
  priceNotice: { backgroundColor: '#0284c722', borderLeft: '4px solid #38bdf8', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
  gridRow: { display: 'flex', gap: '15px' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  label: { fontSize: '14px', color: '#cbd5e1' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' },
  submitBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#0f172a', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '16px', marginTop: '10px' },
  historyBox: { background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' },
  timeline: { display: 'flex', gap: '15px', overflowX: 'auto' as const, paddingTop: '10px' },
  timelineCard: { background: '#0f172a', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', minWidth: '110px' }
};