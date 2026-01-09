import { useState, useEffect } from 'react';
import { DollarSign, Plus, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import api from '../../services/api';

export default function PricesPage() {
  const [prices, setPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomFuelType, setIsCustomFuelType] = useState(false);
  const [formData, setFormData] = useState({
    fuelType: '',
    unitPrice: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pricesRes, historyRes] = await Promise.all([
        api.get('/prices/current'),
        api.get('/prices/history'),
      ]);

      if (pricesRes.data.success) setPrices(pricesRes.data.data);
      if (historyRes.data.success) {
        // Sort by effectiveFrom first, then by createdAt to ensure newest updates appear at top
        const sortedHistory = (historyRes.data.data || []).sort((a, b) => {
          const dateA = new Date(a.effectiveFrom || a.createdAt);
          const dateB = new Date(b.effectiveFrom || b.createdAt);
          return dateB - dateA; // Descending order (newest first)
        });
        setPriceHistory(sortedHistory);
      }
    } catch (error) {
      toast.error('Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/prices', {
        fuelType: formData.fuelType,
        unitPrice: parseFloat(formData.unitPrice),
        effectiveFrom: formData.effectiveFrom,
      });

      if (response.data.success) {
        toast.success('Price updated successfully');
        setIsModalOpen(false);
        setIsCustomFuelType(false);
        setFormData({
          fuelType: '',
          unitPrice: '',
          effectiveFrom: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update price');
    } finally {
      setSubmitting(false);
    }
  };

  const commonFuelTypes = ['Petrol', 'Diesel', 'Octane', 'CNG'];

  return (
    <DashboardLayout role="admin">
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* Current Prices Card */}
        <Card
          title="Current Fuel Prices"
          subtitle={`${prices.length} fuel type${prices.length !== 1 ? 's' : ''} available`}
          action={
            <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
              Update Price
            </Button>
          }
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
              <div className="spinner"></div>
            </div>
          ) : prices.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
              {prices.map((price) => (
                <div
                  key={price._id}
                  style={{
                    padding: 'var(--spacing-lg)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <DollarSign size={20} />
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{price.fuelType}</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                    ৳{price.unitPrice.toFixed(2)}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                    per liter
                  </p>
                  <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Updated: {new Date(price.effectiveFrom).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
              No prices set. Click "Update Price" to add fuel prices.
            </p>
          )}
        </Card>

        {/* Price History Card */}
        <Card
          title="Price History"
          subtitle="Recent price changes"
          icon={<TrendingUp />}
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
              <div className="spinner"></div>
            </div>
          ) : priceHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Fuel Type
                    </th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Price (per L)
                    </th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Source
                    </th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Effective From
                    </th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                      Updated By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.slice(0, 20).map((record, index) => (
                    <tr
                      key={record._id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: index % 2 === 0 ? 'transparent' : 'var(--color-bg-secondary)',
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                        {record.fuelType}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                        ৳{record.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: record.source === 'manual' ? 'var(--color-bg-secondary)' : 'var(--color-primary-light, #e3f2fd)',
                          color: record.source === 'manual' ? 'var(--color-text-primary)' : 'var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}>
                          {record.source}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(record.effectiveFrom).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                        {record.createdBy?.name || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
              No price history available.
            </p>
          )}
        </Card>
      </div>

      {/* Add/Update Price Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Fuel Price" size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div className="input-wrapper">
            <label className="input-label">Fuel Type</label>
            <select
              className="input"
              value={isCustomFuelType ? 'custom' : formData.fuelType}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomFuelType(true);
                  setFormData({ ...formData, fuelType: '' });
                } else {
                  setIsCustomFuelType(false);
                  setFormData({ ...formData, fuelType: e.target.value });
                }
              }}
              required
            >
              <option value="">Select fuel type</option>
              {commonFuelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value="custom">Custom Type...</option>
            </select>
          </div>

          {isCustomFuelType && (
            <Input
              label="Custom Fuel Type"
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              placeholder="e.g., Premium Diesel"
              required
            />
          )}

          <Input
            label="Unit Price (BDT per liter)"
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            leftIcon={<DollarSign size={18} />}
            placeholder="e.g., 119.50"
            helperText="Enter the price per liter"
            required
          />

          <Input
            label="Effective From"
            type="date"
            value={formData.effectiveFrom}
            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            helperText="This price will be effective from the selected date"
            required
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button type="submit" fullWidth loading={submitting}>
              Update Price
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
