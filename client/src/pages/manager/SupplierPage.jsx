import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import DashboardLayout from '../../components/shared/DashboardLayout';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/supplierApi';
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import SupplierModal from '../../components/manager/SupplierModal';
import './SupplierPage.css';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Octane', 'CNG'];

export default function SupplierPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, selectedFuelType]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedFuelType) params.fuelType = selectedFuelType;
      
      const response = await getSuppliers(params);
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleSubmit = async (supplierData) => {
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier._id, supplierData);
        alert(language === 'bn' ? 'সরবরাহকারী আপডেট হয়েছে!' : 'Supplier updated successfully!');
      } else {
        await createSupplier(supplierData);
        alert(language === 'bn' ? 'সরবরাহকারী যোগ করা হয়েছে!' : 'Supplier added successfully!');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      alert(error.message || 'Failed to save supplier');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(language === 'bn' ? 'এই সরবরাহকারী মুছবেন?' : 'Delete this supplier?')) {
      return;
    }

    try {
      await deleteSupplier(id);
      alert(language === 'bn' ? 'সরবরাহকারী মুছে ফেলা হয়েছে!' : 'Supplier deleted successfully!');
      fetchSuppliers();
    } catch (error) {
      alert(error.message || 'Failed to delete supplier');
    }
  };

  return (
    <DashboardLayout role="manager">
      <div className="supplier-page">
        <div className="page-header">
          <div>
            <h1>{language === 'bn' ? 'সরবরাহকারী' : 'Suppliers'}</h1>
            <p className="text-secondary">
              {language === 'bn' ? 'জ্বালানী সরবরাহকারী পরিচালনা করুন' : 'Manage fuel suppliers'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleAddSupplier}>
            <Plus size={20} />
            {language === 'bn' ? 'সরবরাহকারী যোগ করুন' : 'Add Supplier'}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder={language === 'bn' ? 'কোম্পানি বা যোগাযোগ ব্যক্তি অনুসন্ধান করুন...' : 'Search by company or contact person...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="fuel-type-filters">
            <button
              className={`filter-chip ${selectedFuelType === '' ? 'active' : ''}`}
              onClick={() => setSelectedFuelType('')}
            >
              {language === 'bn' ? 'সব' : 'All'}
            </button>
            {FUEL_TYPES.map((type) => (
              <button
                key={type}
                className={`filter-chip ${selectedFuelType === type ? 'active' : ''}`}
                onClick={() => setSelectedFuelType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="loading">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading suppliers...'}</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} />
            <p>{language === 'bn' ? 'কোন সরবরাহকারী পাওয়া যায়নি' : 'No suppliers found'}</p>
            <button className="btn btn-primary" onClick={handleAddSupplier}>
              {language === 'bn' ? 'প্রথম সরবরাহকারী যোগ করুন' : 'Add First Supplier'}
            </button>
          </div>
        ) : (
          <div className="suppliers-grid">
            {suppliers.map((supplier) => (
              <div key={supplier._id} className="supplier-card">
                <div className="supplier-header">
                  <div>
                    <h3>{supplier.companyName}</h3>
                    <span className={`status-badge status-${supplier.status}`}>
                      {supplier.status === 'active'
                        ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                        : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button className="btn-icon" onClick={() => handleEditSupplier(supplier)}>
                      <Edit size={18} />
                    </button>
                    {user.role === 'admin' && (
                      <button className="btn-icon danger" onClick={() => handleDelete(supplier._id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="supplier-details">
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{supplier.contactPerson}</span>
                  </div>
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{supplier.address.city}, {supplier.address.state}</span>
                  </div>
                </div>

                <div className="fuel-types">
                  {supplier.fuelTypes.map((type) => (
                    <span key={type} className="fuel-badge">{type}</span>
                  ))}
                </div>

                {supplier.paymentTerms && (
                  <div className="payment-terms">
                    <strong>{language === 'bn' ? 'পেমেন্ট:' : 'Payment:'}</strong> {supplier.paymentTerms}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Supplier Modal */}
        <SupplierModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSupplier(null);
          }}
          onSubmit={handleSubmit}
          supplier={selectedSupplier}
          language={language}
        />
      </div>
    </DashboardLayout>
  );
}
