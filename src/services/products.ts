import{ supabase } from '../lib/supabaseClient';

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

export const addProductRecord = async (record: Omit<ProductPriceRecord, 'id' | 'user_id' | 'created_at'>) => {
  // Obtenemos la sesión/usuario actual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('No hay una sesión activa. Por favor, inicia sesión de nuevo.');
  }

  // Insertamos incluyendo el user_id para cumplir con la regla WITH CHECK (auth.uid() = user_id)
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

  if (error) {
    console.error('Error de Supabase:', error);
    throw error;
  }

  return data;
};

export const fetchProductSuggestions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('product_price_history')
    .select('product_name, brand, presentation, price, store, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo sugerencias:', error);
    return [];
  }

  // Agrupar por producto único para obtener su precio registrado más reciente
  const uniqueProductsMap = new Map<string, ProductPriceRecord>();
  data.forEach((item) => {
    const key = `${item.product_name.toLowerCase()}-${(item.brand || '').toLowerCase()}-${(item.presentation || '').toLowerCase()}`;
    if (!uniqueProductsMap.has(key)) {
      uniqueProductsMap.set(key, item);
    }
  });

  return Array.from(uniqueProductsMap.values());
};


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
