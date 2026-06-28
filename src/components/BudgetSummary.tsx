import React from 'react';

interface BudgetSummaryProps {
  amountAdded: number;
  carriedOver: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ amountAdded, carriedOver }) => {
  const totalAvailable = amountAdded + carriedOver;

  return (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
      <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', flex: 1 }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>Remanente Mes Pasado</p>
        <h3 style={{ margin: '5px 0 0 0', color: '#fff' }}>${carriedOver.toFixed(2)}</h3>
      </div>
      <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', flex: 1 }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>Presupuesto Asignado</p>
        <h3 style={{ margin: '5px 0 0 0', color: '#fff' }}>${amountAdded.toFixed(2)}</h3>
      </div>
      <div style={{ padding: '15px', background: '#0369a1', borderRadius: '8px', flex: 1 }}>
        <p style={{ color: '#e0f2fe', margin: 0 }}>Total Disponible</p>
        <h3 style={{ margin: '5px 0 0 0', color: '#fff' }}>${totalAvailable.toFixed(2)}</h3>
      </div>
    </div>
  );
};