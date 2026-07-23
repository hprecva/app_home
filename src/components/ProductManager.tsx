import React, { useState, useEffect } from 'react';
import { addProductRecord, fetchProductSuggestions, fetchProductHistory, ProductPriceRecord } from '../services/products';

export const ProductManager: React.FC = () => {
  // Estados del formulario
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [presentation, setPresentation] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');

  // Estados de datos
  const [suggestions, setSuggestions] = useState<ProductPriceRecord[]>([]);
  const [selectedPreviousPrice, setSelectedPreviousPrice] = useState<number | null>(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState<ProductPriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const list = await fetchProductSuggestions();
    setSuggestions(list);
  };

  // Al seleccionar una sugerencia existente de compra anterior
  const handleSelectSuggestion = async (item: ProductPriceRecord) => {
    setProductName(item.product_name);
    setBrand(item.brand || '');
    setPresentation(item.presentation || '');
    setStore(item.store || '');
    setSelectedPreviousPrice(item.price);

    // Cargar historial para la representación gráfica/tendencia
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

      setMessage('¡Registro de compra guardado correctamente!');
      setProductName('');
      setBrand('');
      setPresentation('');
      setPrice('');
      setStore('');
      setSelectedPreviousPrice(null);
      await loadSuggestions();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🛒 Módulo de Registro de Compras</h2>
      <p style={{ color: '#94a3b8' }}>Ingresa tus productos comprados. Si ya existe, se sugerirá con su precio anterior para comparar la variación.</p>

      {/* SUGERENCIAS DE PRODUCTOS PREVIAMENTE REGISTRADOS */}
      {suggestions.length > 0 && (
        <div style={styles.suggestionsContainer}>
          <p style={styles.sectionTitle}>💡 Selecciona un producto recurrente para actualizar su precio:</p>
          <div style={styles.chipsRow}>
            {suggestions.map((item, idx) => (
              <button key={idx} style={styles.chip} onClick={() => handleSelectSuggestion(item)}>
                <strong>{item.product_name}</strong> {item.brand && `(${item.brand})`}
                <span style={styles.chipPrice}>Último: ${item.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO DE INGRESO DE COMPRA */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {selectedPreviousPrice !== null && (
          <div style={styles.priceAlert}>
            ⚠️ Precio anterior registrado para este artículo: <strong>${selectedPreviousPrice.toFixed(2)}</strong>
          </div>
        )}

        <div style={styles.gridRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre del Producto *</label>
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
              placeholder="Ej: 1 Litro, Pack 6 uds"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Establecimiento / Tienda</label>
            <input
              type="text"
              placeholder="Ej: Walmart, Costco, Tiendita"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Precio Nuevo Pagado ($) *</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ ...styles.input, borderColor: '#38bdf8', fontSize: '18px' }}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Guardando...' : 'Guardar Nuevo Registro de Precio'}
        </button>

        {message && <p style={{ color: message.startsWith('Error') ? '#ef4444' : '#10b981' }}>{message}</p>}
      </form>

      {/* REPRESENTACIÓN DE HISTORIAL DE TENDENCIA DE PRECIO */}
      {selectedProductHistory.length > 1 && (
        <div style={styles.historyBox}>
          <h3>📈 Historial y Variación de Precio: {productName}</h3>
          <div style={styles.timeline}>
            {selectedProductHistory.map((item, idx) => (
              <div key={idx} style={styles.timelineItem}>
                <span style={styles.timelineDate}>{new Date(item.created_at || '').toLocaleDateString('es-MX')}</span>
                <span style={styles.timelineStore}>{item.store || 'Tienda N/A'}</span>
                <strong style={styles.timelinePrice}>${item.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { background: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155', color: '#fff' },
  suggestionsContainer: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px' },
  sectionTitle: { margin: '0 0 10px 0', fontSize: '14px', color: '#38bdf8' },
  chipsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  chip: { background: '#334155', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  chipPrice: { background: '#1e293b', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#10b981' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
  gridRow: { display: 'flex', gap: '15px' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  label: { fontSize: '14px', color: '#cbd5e1' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' },
  priceAlert: { backgroundColor: '#854d0e', padding: '10px', borderRadius: '6px', fontSize: '14px', color: '#fef08a' },
  submitBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#0f172a', fontWeight: 'bold' as const, cursor: 'pointer', marginTop: '10px' },
  historyBox: { marginTop: '25px', backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px' },
  timeline: { display: 'flex', gap: '15px', overflowX: 'auto' as const, paddingTop: '10px' },
  timelineItem: { background: '#1e293b', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', minWidth: '120px' },
  timelineDate: { fontSize: '12px', color: '#94a3b8' },
  timelineStore: { fontSize: '12px', color: '#38bdf8' },
  timelinePrice: { fontSize: '16px', marginTop: '5px', color: '#10b981' }
};