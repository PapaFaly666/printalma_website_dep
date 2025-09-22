import React from 'react';
import { fundsRequestService, type CreateFundsRequestPayload, type FundsRequest } from '../services/fundsRequestService';
import { toast } from 'sonner';

export const VendorFundsPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [earnings, setEarnings] = React.useState<{ availableAmount: number; pendingAmount: number; totalEarnings: number } | null>(null);
  const [requests, setRequests] = React.useState<FundsRequest[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [form, setForm] = React.useState<CreateFundsRequestPayload>({
    amount: 0,
    description: '',
    paymentMethod: 'WAVE',
    phoneNumber: '',
    iban: '',
    orderIds: []
  });

  const isBank = form.paymentMethod === 'BANK_TRANSFER';

  const normalizeIban = (value: string) => value.replace(/\s+/g, '').toUpperCase();
  const isValidIban = (value: string) => {
    const raw = normalizeIban(value);
    // Regex IBAN générique (longueur 15-34)
    const basic = /^[A-Z]{2}[0-9A-Z]{13,32}$/;
    return basic.test(raw);
  };

  const loadAll = React.useCallback(async () => {
    try {
      setLoading(true);
      const [e, list] = await Promise.all([
        fundsRequestService.getEarnings(),
        fundsRequestService.list({ page, limit })
      ]);
      setEarnings(e.data);
      setRequests(list.data.items);
      setTotal(list.data.total);
    } catch (err: any) {
      toast.error(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const canRequest = (earnings?.availableAmount || 0) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!earnings) return;
      if (form.amount <= 0) {
        toast.error('Montant invalide');
        return;
      }
      if (form.amount > earnings.availableAmount) {
        toast.error(`Montant supérieur au disponible (${earnings.availableAmount.toLocaleString()} FCFA)`);
        return;
      }
      if (isBank) {
        if (!form.iban || !isValidIban(form.iban)) {
          toast.error('IBAN invalide');
          return;
        }
      } else {
        if (!form.phoneNumber || form.phoneNumber.trim().length < 6) {
          toast.error('Numéro de téléphone requis');
          return;
        }
      }
      setLoading(true);
      const payload: CreateFundsRequestPayload = isBank
        ? { amount: form.amount, description: form.description, paymentMethod: form.paymentMethod, iban: normalizeIban(form.iban || '') }
        : { amount: form.amount, description: form.description, paymentMethod: form.paymentMethod, phoneNumber: (form.phoneNumber || '').trim() };
      await fundsRequestService.create(payload);
      toast.success('Demande créée et approuvée');
      setForm(prev => ({ ...prev, amount: 0, description: '', phoneNumber: '', iban: '' }));
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Erreur création demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Mes gains</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Disponible</div>
          <div className="text-xl font-semibold">{earnings?.availableAmount?.toLocaleString() || 0} FCFA</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">En attente</div>
          <div className="text-xl font-semibold">{earnings?.pendingAmount?.toLocaleString() || 0} FCFA</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-xl font-semibold">{earnings?.totalEarnings?.toLocaleString() || 0} FCFA</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Demander un retrait</h2>
      <form onSubmit={submit} className="p-4 border rounded mb-8 space-y-3">
        <div>
          <label className="block text-sm mb-1">Montant (FCFA)</label>
          <input type="number" className="w-full border p-2 rounded" value={form.amount}
                 onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Méthode de paiement</label>
          <select className="w-full border p-2 rounded" value={form.paymentMethod}
                  onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}>
            <option value="WAVE">WAVE</option>
            <option value="ORANGE_MONEY">ORANGE_MONEY</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
          </select>
        </div>
        {!isBank && (
          <div>
            <label className="block text-sm mb-1">Téléphone</label>
            <input type="tel" className="w-full border p-2 rounded" value={form.phoneNumber}
                   onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))} />
          </div>
        )}
        {isBank && (
          <div>
            <label className="block text-sm mb-1">IBAN</label>
            <input type="text" className="w-full border p-2 rounded" value={form.iban || ''}
                   onChange={e => setForm(prev => ({ ...prev, iban: e.target.value }))}
                   placeholder="SN08 0000 0000 0000 0000 0000 0000" />
            {form.iban && !isValidIban(form.iban) && (
              <div className="text-xs text-red-600 mt-1">IBAN invalide</div>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">Description (optionnel)</label>
          <textarea className="w-full border p-2 rounded" rows={3} value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
        </div>
        <button type="submit" className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                disabled={loading || !canRequest}>
          {loading ? 'En cours...' : 'Demander un retrait'}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-3">Mes demandes</h2>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Montant</th>
              <th className="text-left p-2">Méthode</th>
              <th className="text-left p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">{r.amount.toLocaleString()} FCFA</td>
                <td className="p-2">{r.paymentMethod}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-white ${r.status === 'PAID' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td className="p-3 text-center text-gray-500" colSpan={4}>Aucune demande</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between p-3">
          <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Précédent</button>
          <div>Page {page} • Total {total}</div>
          <button className="px-3 py-1 border rounded" disabled={(page*limit)>=total} onClick={() => setPage(p => p+1)}>Suivant</button>
        </div>
      </div>
    </div>
  );
};

export default VendorFundsPage;


