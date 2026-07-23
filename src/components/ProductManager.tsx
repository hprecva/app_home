import React, { useState, useEffect } from 'react';
import { 
  addProductRecord, 
  fetchSmartPurchaseSuggestions, 
  fetchProductHistory, 
  ProductPriceRecord, 
  PurchaseSuggestion 
} from '../services/products';

export const ProductManager: React.FC = () => {
  // Formulario
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [presentation, setPresentation] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [store, setStore] = useState('');

  // Sugerencias e Historial
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [lastPurchaseInfo, setLastPurchaseInfo] = useState<{ store: string; unitPrice: number; qty: number } | null>(null);
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

  // Al seleccionar una sugerencia inteligente
  const handleSelectSuggestion = async (item: PurchaseSuggestion) => {
    setProductName(item.product_name);
    setBrand(item.brand || '');
    setPresentation(item.presentation || '');
    setStore(item.store || '');
    setQuantity(item.quantity ? item.quantity.toString() : '1');
    setUnitPrice(item.unit_price ? item.unit_price.toString() : item.price.toString());
    
    setLastPurchaseInfo({
      store: item.store || 'No especificado',
      unitPrice: item.unit_price || item.price,
      qty: item.quantity || 1,
    });

    const history = await fetchProductHistory(item.product_name);
    setSelectedProductHistory(history);
  };

  // Cálculo automático del precio total
  const calculatedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !unitPrice || !quantity) return;

    setLoading(true);
    setMessage(null);

    const parsedQty = parseFloat(quantity);
    const parsedUnitPrice = parseFloat(unitPrice);
    const totalPrice = parsedQty * parsedUnitPrice;

    try {
      await addProductRecord({
        product_name: productName,
        brand,
        presentation,
        quantity: parsedQty,
        unit_price: parsedUnitPrice,
        price: totalPrice,
        store,
      });

      setMessage('¡Compra registrada exitosamente!');
      setProductName('');
      setBrand('');
      setPresentation('');
      setQuantity('1');
      setUnitPrice('');
      setStore('');
      setLastPurchaseInfo(null);
      await loadSuggestions();
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
        Las sugerencias muestran el último lugar de compra, cantidad habitual, precio unitario y el total estimado.
      </p>

      {/* SECCIÓN 1: SUGERENCIAS CON LUGAR, CANTIDAD Y PRECIOS */}
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
                  <p>📍 Última tienda: <strong style={{ color: '#38bdf8' }}>{item.store || 'No especificada'}</strong></p>
                  <p>📦 Cantidad anterior: <strong>{item.quantity || 1} u.</strong></p>
                  <p>💲 P. Unitario anterior: <strong style={{ color: '#10b981' }}>${(item.unit_price || item.price).toFixed(2)}</strong></p>
                  <p>💰 Total anterior: <strong style={{ color: '#f59e0b' }}>${item.price.toFixed(2)}</strong></p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Frecuencia: Cada {item.averageDaysInterval} días</p>
                </div>

                <button 
                  style={styles.applyBtn} 
                  onClick={() => handleSelectSuggestion(item)}
                >
                  Cargar / Actualizar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: FORMULARIO CON DETALLE DE PRECIOS */}
      <div style={styles.formBox}>
        <h3>{lastPurchaseInfo !== null ? '✏️ Actualizar Registro de Compra' : '➕ Registrar Producto Nuevo'}</h3>
        
        {lastPurchaseInfo !== null && (
          <div style={styles.priceNotice}>
            💡 <strong>Última compra registrada:</strong> En <u>{lastPurchaseInfo.store}</u> ({lastPurchaseInfo.qty} u. a <strong>${lastPurchaseInfo.unitPrice.toFixed(2)}</strong> c/u). Ajusta o confirma los valores para la compra de hoy.
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
              <label style={styles.label}>Lugar / Tienda</label>
              <input
                type="text"
                placeholder="Ej: Walmart, Costco, Soriana"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.gridRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Cantidad Comprada *</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Precio Unitario ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                style={{ ...styles.input, borderColor: '#38bdf8' }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Precio Total Calculado</label>
              <div style={styles.totalDisplay}>
                ${calculatedTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Guardando...' : `Confirmar Compra Total: $${calculatedTotal.toFixed(2)}`}
          </button>

          {message && <p style={{ color: message.startsWith('Error') ? '#ef4444' : '#10b981', textAlign: 'center' }}>{message}</p>}
        </form>
      </div>

      {/* SECCIÓN 3: HISTORIAL DE COMPRAS */}
      {selectedProductHistory.length > 0 && (
        <div style={styles.historyBox}>
          <h3>📈 Historial Completo: {productName}</h3>
          <div style={styles.timeline}>
            {selectedProductHistory.map((item, idx) => (
              <div key={idx} style={styles.timelineCard}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {new Date(item.created_at || '').toLocaleDateString('es-MX')}
                </span>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                  📍 {item.store || 'Tienda N/A'}
                </span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                  {item.quantity || 1} u. × ${(item.unit_price || item.price).toFixed(2)}
                </span>
                <strong style={{ fontSize: '16px', color: '#10b981', marginTop: '2px' }}>
                  Total: ${item.price.toFixed(2)}
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
  suggestionCard: { minWidth: '240px', background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid', display: 'flex', flexDirection: 'column' as const, gap: '5px', position: 'relative' as const },
  badgeDue: { position: 'absolute' as const, top: '10px', right: '10px', background: '#0284c7', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' as const },
  freqInfo: { margin: '10px 0', fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid #334155', paddingTop: '8px', display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  applyBtn: { padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '12px' },
  formBox: { background: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155' },
  priceNotice: { backgroundColor: '#0284c722', borderLeft: '4px solid #38bdf8', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
  gridRow: { display: 'flex', gap: '15px', flexWrap: 'wrap' as const },
  inputGroup: { flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  label: { fontSize: '14px', color: '#cbd5e1' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' },
  totalDisplay: { padding: '10px', borderRadius: '6px', border: '1px solid #10b981', backgroundColor: '#064e3b', color: '#34d399', fontWeight: 'bold' as const, fontSize: '18px', textAlign: 'center' as const },
  submitBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#0f172a', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '16px', marginTop: '10px' },
  historyBox: { background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' },
  timeline: { display: 'flex', gap: '15px', overflowX: 'auto' as const, paddingTop: '10px' },
  timelineCard: { background: '#0f172a', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', minWidth: '160px', border: '1px solid #334155' }
};