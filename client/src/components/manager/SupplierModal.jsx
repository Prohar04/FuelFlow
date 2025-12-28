import { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, FileText, DollarSign } from 'lucide-react';
import './SupplierModal.css';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Octane', 'CNG'];

export default function SupplierModal({ isOpen, onClose, onSubmit, supplier, language = 'en' }) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternativePhone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Bangladesh',
    },
    fuelTypes: [],
    taxId: '',
    paymentTerms: 'Net 30',
    creditLimit: '',
    minimumOrderQuantity: '',
    notes: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        ...supplier,
        creditLimit: supplier.creditLimit || '',
        minimumOrderQuantity: supplier.minimumOrderQuantity || '',
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFuelTypeToggle = (fuelType) => {
    const newFuelTypes = formData.fuelTypes.includes(fuelType)
      ? formData.fuelTypes.filter((t) => t !== fuelType)
      : [...formData.fuelTypes, fuelType];
    setFormData({ ...formData, fuelTypes: newFuelTypes });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    if (!formData.phone.trim()) newErrors.phone = 'Required';
    if (!formData.address.line1.trim()) newErrors.addressLine1 = 'Required';
    if (!formData.address.city.trim()) newErrors.city = 'Required';
    if (!formData.address.state.trim()) newErrors.state = 'Required';
    if (formData.fuelTypes.length === 0) newErrors.fuelTypes = 'Select at least one fuel type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Building2 size={24} />
            {supplier
              ? (language === 'bn' ? 'সরবরাহকারী সম্পাদনা করুন' : 'Edit Supplier')
              : (language === 'bn' ? 'নতুন সরবরাহকারী যোগ করুন' : 'Add New Supplier')}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Basic Information */}
          <div className="form-section">
            <h3>{language === 'bn' ? 'মৌলিক তথ্য' : 'Basic Information'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{language === 'bn' ? 'কোম্পানির নাম' : 'Company Name'} *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={errors.companyName ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'যোগাযোগ ব্যক্তি' : 'Contact Person'} *</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className={errors.contactPerson ? 'error' : ''}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{language === 'bn' ? 'ইমেইল' : 'Email'} *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'ফোন' : 'Phone'} *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'বিকল্প ফোন' : 'Alternative Phone'}</label>
                <input
                  type="tel"
                  name="alternativePhone"
                  value={formData.alternativePhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="form-section">
            <h3>{language === 'bn' ? 'ঠিকানা' : 'Address'}</h3>
            <div className="form-group">
              <label>{language === 'bn' ? 'ঠিকানা লাইন 1' : 'Address Line 1'} *</label>
              <input
                type="text"
                name="address.line1"
                value={formData.address.line1}
                onChange={handleChange}
                className={errors.addressLine1 ? 'error' : ''}
              />
            </div>
            <div className="form-group">
              <label>{language === 'bn' ? 'ঠিকানা লাইন 2' : 'Address Line 2'}</label>
              <input
                type="text"
                name="address.line2"
                value={formData.address.line2}
                onChange={handleChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{language === 'bn' ? 'শহর' : 'City'} *</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className={errors.city ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'রাজ্য/বিভাগ' : 'State/Division'} *</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className={errors.state ? 'error' : ''}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'পোস্টাল কোড' : 'Postal Code'}</label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="form-section">
            <h3>{language === 'bn' ? 'ব্যবসায়িক বিবরণ' : 'Business Details'}</h3>
            <div className="form-group">
              <label>{language === 'bn' ? 'জ্বালানীর ধরন' : 'Fuel Types'} *</label>
              <div className="fuel-type-selector">
                {FUEL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`fuel-type-btn ${formData.fuelTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => handleFuelTypeToggle(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.fuelTypes && <span className="error-text">{errors.fuelTypes}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{language === 'bn' ? 'ট্যাক্স আইডি' : 'Tax ID'}</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'পেমেন্ট শর্তাবলী' : 'Payment Terms'}</label>
                <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                  <option value="COD">COD</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{language === 'bn' ? 'ক্রেডিট সীমা' : 'Credit Limit'}</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>{language === 'bn' ? 'ন্যূনতম অর্ডার পরিমাণ' : 'Minimum Order Quantity'}</label>
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  value={formData.minimumOrderQuantity}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>{language === 'bn' ? 'নোট' : 'Notes'}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              {supplier
                ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                : (language === 'bn' ? 'যোগ করুন' : 'Add Supplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
