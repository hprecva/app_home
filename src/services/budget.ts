import {supabase} from '../lib/supabaseClient';

export const addBudgetLog = async (monthYear: string, amount: number, carriedOver: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from('budget_logs')
    .insert([
      {
        user_id: user.id,
        month_year: monthYear,
        amount_added: amount,
        carried_over: carriedOver
      }
    ])
    .select();

  if (error) throw error;
  return data;
};

export const fetchBudgetLogs = async () => {
    const { data, error} = await supabase
        .from('budget_logs')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};