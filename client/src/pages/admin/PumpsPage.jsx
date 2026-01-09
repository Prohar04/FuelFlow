import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/shared/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import api from '../../services/api';

export default function PumpsPage() {
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [selectedPump, setSelectedPump] = useState(null);
  const [terminateReason, setTerminateReason] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPumps();
  }, []);

  const fetchPumps = async () => {
    try {
      const response = await api.get('/pumps');
      if (response.data.success) {
        setPumps(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load pumps');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/pumps', {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      });

      if (response.data.success) {
        toast.success('Pump created successfully!');
        setIsModalOpen(false);
        setFormData({ name: '', street: '', city: '', state: '', zipCode: '' });
        fetchPumps();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create pump');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pump) => {
    setSelectedPump(pump);
    setFormData({
      name: pump.name,
      street: pump.address?.street || '',
      city: pump.address?.city || '',
      state: pump.address?.state || '',
      zipCode: pump.address?.zipCode || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.patch(`/pumps/${selectedPump._id}`, {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      });

      if (response.data.success) {
        toast.success('Pump updated successfully!');
        setIsEditModalOpen(false);
        setSelectedPump(null);
        fetchPumps();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update pump');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = (pump) => {
    setSelectedPump(pump);
    setTerminateReason('');
    setIsTerminateModalOpen(true);
  };

  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post(`/pumps/${selectedPump._id}/terminate`, {
        reason: terminateReason,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Pump terminated successfully!');
        setIsTerminateModalOpen(false);
        setSelectedPump(null);
        setTerminateReason('');
        fetchPumps();
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to terminate pump');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <Card 
        title="Pump Locations" 
        subtitle={`${pumps.length} pump${pumps.length !== 1 ? 's' : ''} registered`}
        action={
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Add Pump
          </Button>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
            <div className="spinner"></div>
          </div>
        ) : pumps.length > 0 ? (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {pumps.map((pump) => (
              <div 
                key={pump._id} 
                style={{ 
                  padding: 'var(--spacing-lg)', 
                  background: 'var(--color-bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                  <div style={{ 
                    padding: 'var(--spacing-md)', 
                    background: 'var(--color-primary)', 
                    color: 'white', 
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                  }}>
                    {pump.code}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>{pump.name}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                      <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {pump.address?.street}, {pump.address?.city}, {pump.address?.state} {pump.address?.zipCode}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    leftIcon={<Edit size={16} />}
                    onClick={() => handleEdit(pump)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    leftIcon={<Trash size={16} />}
                    onClick={() => handleTerminate(pump)}
                  >
                    Terminate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
            No pumps found. Click "Add Pump" to create one.
          </p>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Pump" size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Pump Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main Station"
            required
          />

          <Input
            label="Street Address"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="e.g., 123 Main Street"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Dhaka"
              required
            />

            <Input
              label="State/Division"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g., Dhaka Division"
              required
            />
          </div>

          <Input
            label="ZIP Code"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="e.g., 1000"
            required
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button type="submit" fullWidth loading={submitting}>
              Create Pump
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Pump" 
        size="md"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Pump Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main Station"
            required
          />

          <Input
            label="Street Address"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="e.g., 123 Main Street"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Dhaka"
              required
            />

            <Input
              label="State/Division"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g., Dhaka Division"
              required
            />
          </div>

          <Input
            label="ZIP Code"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="e.g., 1000"
            required
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button type="submit" fullWidth loading={submitting}>
              Update Pump
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isTerminateModalOpen} 
        onClose={() => setIsTerminateModalOpen(false)} 
        title={`Terminate Pump: ${selectedPump?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleTerminateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ 
            padding: 'var(--spacing-md)', 
            background: 'var(--color-error-light)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-error)',
          }}>
            <p style={{ margin: 0, color: 'var(--color-error-dark)', fontWeight: '500' }}>
              ⚠️ Warning: This action cannot be undone
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: 'var(--color-error-dark)' }}>
              All employees assigned to this pump will receive termination emails, lose their access, 
              and their data will be permanently deleted from the database.
            </p>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--spacing-xs)', 
              fontWeight: '500',
              color: 'var(--color-text-primary)' 
            }}>
              Termination Reason *
            </label>
            <textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Please provide a reason for terminating this pump location..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button type="submit" variant="danger" fullWidth loading={submitting}>
              Terminate Pump & Remove Employees
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setIsTerminateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
