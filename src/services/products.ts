import { supabase } from '../lib/supabaseClient';

export interface ProductPriceRecord {
  id?: string;
  user_id?: string;
  product_name: string;
  brand: string;
  presentation: string;
  price: number;
  store: string;
  created_at?: string;
}

export interface PurchaseSuggestion extends ProductPriceRecord {
  averageDaysInterval: number;
  lastPurchaseDate: string;
  nextEstimatedPurchaseDate: string;
  isDue: boolean; // Indica si ya se cumplió o venció el ciclo de compra
}

// 1. Guardar una nueva compra
export const addProductRecord = async (record: Omit<ProductPriceRecord, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('product_price_history')
    .insert([
      {
        user_id: user.id,
        product_name: record.product_name,
        brand: record.brand,
        presentation: record.presentation,
        price: record.price,
        store: record.store,
      }
    ])
    .select();

  if (error) throw error;
  return data;
};

// 2. Obtener Sugerencias Basadas en Frecuencia y Hábitos de Compra
export const fetchSmartPurchaseSuggestions = async (): Promise<PurchaseSuggestion[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) return [];

  // Agrupar compras por producto (Llave: nombre-marca-presentacion)
  const productGroups = new Map<string, ProductPriceRecord[]>();
  data.forEach((item) => {
    const key = `${item.product_name.toLowerCase()}-${(item.brand || '').toLowerCase()}-${(item.presentation || '').toLowerCase()}`;
    if (!productGroups.has(key)) {
      productGroups.set(key, []);
    }
    productGroups.get(key)!.push(item);
  });

  const suggestions: PurchaseSuggestion[] = [];
  const today = new Date();

  productGroups.forEach((records) => {
    const lastRecord = records[records.length - 1];
    
    // Si solo hay 1 compra, asumimos un ciclo genérico de 15 días o sugerencia estándar
    let avgDays = 14; 

    if (records.length > 1) {
      let totalDays = 0;
      for (let i = 1; i < records.length; i++) {
        const prevDate = new Date(records[i - 1].created_at!).getTime();
        const currDate = new Date(records[i].created_at!).getTime();
        const diffDays = (currDate - prevDate) / (1000 * 3600 * 24);
        totalDays += diffDays;
      }
      avgDays = Math.round(totalDays / (records.length - 1)) || 1;
    }

    const lastDate = new Date(lastRecord.created_at!);
    const nextEstimatedDate = new Date(lastDate);
    nextEstimatedDate.setDate(nextEstimatedDate.getDate() + avgDays);

    // Es sugerencia si la fecha estimada es menor o igual a hoy + 2 días de tolerancia
    const isDue = nextEstimatedDate <= new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000));

    suggestions.push({
      ...lastRecord,
      averageDaysInterval: avgDays,
      lastPurchaseDate: lastRecord.created_at!,
      nextEstimatedPurchaseDate: nextEstimatedDate.toISOString(),
      isDue,
    });
  });

  // Priorizar las compras que ya están vencidas/próximas a vencer
  return suggestions.sort((a, b) => (b.isDue ? 1 : 0) - (a.isDue ? 1 : 0));
};

// 3. Obtener Historial de un Producto Específico
export const fetchProductHistory = async (productName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('user_id', user.id)
    .ilike('product_name', productName)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};