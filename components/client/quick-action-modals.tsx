'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { submitLead } from '@/app/actions/lead';
import { supabase } from '@/lib/supabase';

// --- Modal Wrapper ---
export function ModalWrapper({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto cursor-pointer"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-[2rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] w-full max-w-4xl my-auto relative flex flex-col border border-white/10 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors z-[100] bg-white/90 backdrop-blur shadow-md border border-gray-100"
              aria-label="Close modal"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
            <div className="w-full">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

// --- Common Data ---
const CAR_MODELS = ['VF 3', 'VF 5 Plus', 'VF 6', 'VF 7', 'VF 8', 'VF 9'];
const BATTERY_OPTIONS = ['Thuê pin', 'Mua pin'];
const LOCATIONS = ['Hà Nội', 'TP.HCM', 'Tỉnh/Thành phố khác'];
const LOAN_TERMS = [3, 5, 8];

// --- Helper functions ---
export function getCarDisplayName(productName: string = '', variantName?: string) {
  let displayName = productName;
  if (variantName) {
    const vName = variantName.trim();
    const pName = productName.trim();
    if (vName.toLowerCase() !== pName.toLowerCase() && vName !== 'Không có phiên bản') {
      const hasBrandPrefix = vName.toLowerCase().startsWith('vinfast');
      displayName = hasBrandPrefix ? vName : `VinFast ${vName}`;
    }
  }
  return displayName;
}

// --- Searchable Car Select Component ---
export function SearchableCarSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn dòng xe...',
  bgColorClass = 'bg-white',
  roundedClass = 'rounded-md',
  paddingClass = 'px-4 py-3'
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  bgColorClass?: string;
  roundedClass?: string;
  paddingClass?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(opt => {
    const normalizedSearch = searchTerm.toLowerCase().replace(/\s+/g, '');
    const normalizedOption = opt.toLowerCase().replace(/\s+/g, '');
    return normalizedOption.includes(normalizedSearch);
  });

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${paddingClass} ${bgColorClass} border border-gray-200 ${roundedClass} focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none text-left flex justify-between items-center`}
      >
        <span className="text-gray-900">{value || placeholder}</span>
        <ChevronDown size={18} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center gap-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm dòng xe..."
              className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-vinfast-blue focus:border-vinfast-blue text-sm"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    value === opt ? 'bg-blue-50 text-vinfast-blue font-semibold' : 'text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                Không tìm thấy dòng xe
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 1 & 4. Lead Form Modal (Test Drive & Quote) ---
export function LeadFormModal({ 
  title, 
  onClose,
  selectedCar,
  initialNotes,
  leadType
}: { 
  title: string; 
  onClose: () => void;
  selectedCar?: string;
  initialNotes?: string;
  leadType?: string;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, variants')
          .order('name');
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error loading products for LeadFormModal:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  const carVariantOptions = useMemo(() => {
    const options: string[] = [];
    products.forEach(p => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          options.push(getCarDisplayName(p.name, v.name));
        });
      } else {
        options.push(getCarDisplayName(p.name));
      }
    });
    return options.length > 0 ? options : CAR_MODELS;
  }, [products]);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    car_model: selectedCar || CAR_MODELS[0],
    notes: initialNotes || ''
  });

  useEffect(() => {
    if (selectedCar) {
      setFormData(prev => ({ ...prev, car_model: selectedCar }));
    } else if (carVariantOptions.length > 0 && carVariantOptions[0] !== CAR_MODELS[0]) {
      setFormData(prev => {
        if (!prev.car_model || prev.car_model === CAR_MODELS[0]) {
          return { ...prev, car_model: carVariantOptions[0] };
        }
        return prev;
      });
    }
  }, [selectedCar, carVariantOptions]);

  useEffect(() => {
    if (initialNotes) {
      setFormData(prev => ({ ...prev, notes: initialNotes }));
    }
  }, [initialNotes]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    if (!formData.full_name.trim() || !formData.phone.trim()) {
      setStatus('error');
      setErrorMessage('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      setLoading(false);
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    if (!phoneRegex.test(formData.phone)) {
      setStatus('error');
      setErrorMessage('Số điện thoại không hợp lệ.');
      setLoading(false);
      return;
    }

    try {
      const detectedLeadType = leadType || (title.includes('Lái Thử') ? 'test_drive' : 'quote');
      const result = await submitLead({ ...formData, lead_type: detectedLeadType });

      if (!result.success) {
        setStatus('error');
        setErrorMessage(result.error || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.');
        return;
      }

      setStatus('success');
    } catch (error) {
      console.error('Lead submission error:', error);
      setStatus('error');
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-16 px-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-3xl font-bold text-gray-900">Gửi thành công!</h3>
        <p className="text-gray-600 text-lg">Chúng tôi sẽ liên hệ lại sớm nhất để hỗ trợ bạn.</p>
        <button
          onClick={onClose}
          className="mt-6 px-8 py-3 bg-vinfast-blue text-white rounded-md font-semibold hover:bg-blue-800 transition-colors"
        >
          Đóng cửa sổ
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 w-full">
      {/* Left Column: Branding */}
      <div className="hidden md:flex md:col-span-2 text-white flex-col justify-center p-8 relative overflow-hidden bg-[#152B4D]">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/bg-vinfast-cars.webp')" }}></div>
        <div className="relative z-10">
          <h3 className="text-3xl font-bold mb-4 leading-tight text-white">Khởi Đầu<br/>Hành Trình Xanh</h3>
          <p className="text-blue-100 mb-8 text-sm leading-relaxed">Cùng VinFast kiến tạo tương lai di chuyển thông minh và bền vững ngay hôm nay.</p>
          <ul className="space-y-5">
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="text-[#1464F4]" size={20} /> Lái thử tận nhà
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="text-[#1464F4]" size={20} /> Hỗ trợ trả góp 80%
            </li>
            <li className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="text-[#1464F4]" size={20} /> Thủ tục nhanh gọn
            </li>
          </ul>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="md:col-span-3 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
        {status === 'error' && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
              placeholder="Nhập họ tên của bạn"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
              placeholder="VD: 0912345678"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Không bắt buộc)</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
              placeholder="Nhập địa chỉ email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dòng xe quan tâm</label>
            <SearchableCarSelect
              value={formData.car_model}
              onChange={val => setFormData(prev => ({ ...prev, car_model: val }))}
              options={
                selectedCar && !carVariantOptions.includes(selectedCar)
                  ? Array.from(new Set([selectedCar, ...carVariantOptions]))
                  : carVariantOptions
              }
              bgColorClass="bg-gray-50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Lời nhắn tư vấn <span className="text-gray-400 font-normal">(Không bắt buộc)</span></label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none resize-none"
            placeholder="Bạn có yêu cầu gì khác..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-vinfast-blue text-white py-4 rounded-md font-bold text-lg hover:bg-blue-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} />
              <span>Gửi yêu cầu</span>
            </>
          )}
        </button>
      </form>
    </div>
  </div>
  );
}

export function CostEstimateModal({
  onQuoteTrigger
}: {
  onQuoteTrigger?: (carName: string, notes: string) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [carSearchTerm, setCarSearchTerm] = useState('');
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCarDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, variants')
          .order('name');
        if (error) throw error;
        setProducts(data || []);
        if (data && data.length > 0) {
          setSelectedProduct(data[0]);
          if (Array.isArray(data[0].variants) && data[0].variants.length > 0) {
            setSelectedVariant(data[0].variants[0]);
          }
        }
      } catch (err) {
        console.error('Error loading products for estimator:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleProductChange = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setSelectedProduct(prod);
      if (Array.isArray(prod.variants) && prod.variants.length > 0) {
        setSelectedVariant(prod.variants[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const normalizedSearch = carSearchTerm.toLowerCase().replace(/\s+/g, '');
    const normalizedProductName = p.name.toLowerCase().replace(/\s+/g, '');
    return normalizedProductName.includes(normalizedSearch);
  });

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      setSelectedVariant(prod.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setIsCarDropdownOpen(false);
    setCarSearchTerm('');
  };

  const handleVariantChange = (index: number) => {
    if (selectedProduct && Array.isArray(selectedProduct.variants)) {
      const v = selectedProduct.variants[index];
      if (v) {
        setSelectedVariant(v);
      }
    }
  };

  const selectedVariantIndex = selectedProduct && Array.isArray(selectedProduct.variants)
    ? selectedProduct.variants.findIndex((v: any) => v === selectedVariant)
    : -1;

  const carPrice = selectedVariant?.price || 0;
  const hasVariants = selectedProduct && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;
  const hasPrice = hasVariants && carPrice > 0;
  
  // Registration fees
  const registrationFee = carPrice * 0; // EV registration fee is 0% currently
  const plateFee = location === 'Hà Nội' || location === 'TP.HCM' ? 20000000 : 1000000;
  const inspectionFee = 340000;
  const roadMaintenanceFee = 1560000;
  const insuranceFee = 480700;

  const totalCost = carPrice + registrationFee + plateFee + inspectionFee + roadMaintenanceFee + insuranceFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-vinfast-blue mb-8 text-center">Dự Toán Chi Phí Lăn Bánh</h2>
      
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Đang tải dữ liệu sản phẩm...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-5">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Thông tin xe</h3>
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dòng xe</label>
              <button
                type="button"
                onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none text-left flex justify-between items-center"
              >
                <span className="text-gray-900">{selectedProduct?.name || 'Chọn dòng xe...'}</span>
                <ChevronDown size={18} className={`text-gray-500 transition-transform duration-200 ${isCarDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCarDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto flex flex-col">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center gap-2">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={carSearchTerm}
                      onChange={e => setCarSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm dòng xe..."
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-vinfast-blue focus:border-vinfast-blue text-sm"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="py-1">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                            selectedProduct?.id === p.id ? 'bg-blue-50 text-vinfast-blue font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">
                        Không tìm thấy dòng xe
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phiên bản</label>
              <select
                value={selectedVariantIndex !== -1 ? selectedVariantIndex : ''}
                onChange={e => handleVariantChange(parseInt(e.target.value, 10))}
                disabled={!hasVariants}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {hasVariants ? (
                  selectedProduct.variants.map((v: any, index: number) => (
                    <option key={index} value={index}>
                      {v.name} {v.note ? '(' + v.note + ')' : ''} - {formatCurrency(v.price)}
                    </option>
                  ))
                ) : (
                  <option value="">Đang cập nhật giá...</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nơi đăng ký</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white p-6 rounded-xl border-2 border-vinfast-blue/20 shadow-lg flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bảng tính chi tiết</h3>
            
            <div className="space-y-3 flex-grow">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 truncate max-w-[280px]" title={selectedVariant ? `${selectedVariant.name}${selectedVariant.note ? ` - ${selectedVariant.note}` : ''}` : 'Chưa chọn'}>
                  Giá xe ({selectedVariant ? `${selectedVariant.name}${selectedVariant.note ? ` - ${selectedVariant.note}` : ''}` : 'Chưa chọn'})
                </span>
                <span className="font-semibold text-gray-900 shrink-0">
                  {hasPrice ? formatCurrency(carPrice) : 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className={hasPrice ? 'text-gray-600' : 'text-gray-400'}>Phí trước bạ (0%)</span>
                <span className={`font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(registrationFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className={hasPrice ? 'text-gray-600' : 'text-gray-400'}>Phí ra biển số ({location})</span>
                <span className={`font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(plateFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className={hasPrice ? 'text-gray-600' : 'text-gray-400'}>Phí đăng kiểm</span>
                <span className={`font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(inspectionFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className={hasPrice ? 'text-gray-600' : 'text-gray-400'}>Phí bảo trì đường bộ (1 năm)</span>
                <span className={`font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(roadMaintenanceFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className={hasPrice ? 'text-gray-600' : 'text-gray-400'}>Bảo hiểm TNDS (1 năm)</span>
                <span className={`font-semibold ${hasPrice ? 'text-gray-900' : 'text-gray-400'}`}>{formatCurrency(insuranceFee)}</span>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-sm text-vinfast-blue font-semibold mb-1">TỔNG CHI PHÍ LĂN BÁNH</div>
              <div className="text-3xl font-bold text-vinfast-blue">
                {hasPrice ? formatCurrency(totalCost) : 'Liên hệ để nhận báo giá'}
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">* Bảng tính chỉ mang tính chất tham khảo. Vui lòng liên hệ đại lý để có báo giá chính xác nhất.</p>
            </div>

            {onQuoteTrigger && (
              <button
                type="button"
                onClick={() => {
                  const formattedTotalCost = hasPrice ? formatCurrency(totalCost) : 'Liên hệ để nhận báo giá';
                  const notes = hasPrice 
                    ? `Tôi cần tư vấn chi phí lăn bánh cho xe ${selectedProduct?.name || ''} - Phiên bản: ${selectedVariant?.name || ''}. Nơi đăng ký: ${location}. Tổng dự toán tham khảo: ${formattedTotalCost}.`
                    : `Tôi cần tư vấn chi phí lăn bánh cho xe ${selectedProduct?.name || ''}. Nơi đăng ký: ${location}.`;
                  const selectedCarCombined = getCarDisplayName(selectedProduct?.name, selectedVariant?.name);
                  onQuoteTrigger(selectedCarCombined, notes);
                }}
                className="w-full bg-[#1464F4] text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                <span>Nhận báo giá lăn bánh chính xác</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. Installment Modal ---
export function InstallmentModal({
  onQuoteTrigger
}: {
  onQuoteTrigger?: (carName: string, notes: string) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(5); // loanYears
  const [interestRateYearly] = useState(8); // interestRateYearly state default 8

  const [carSearchTerm, setCarSearchTerm] = useState('');
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCarDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, variants')
          .order('name');
        if (error) throw error;
        setProducts(data || []);
        if (data && data.length > 0) {
          setSelectedProduct(data[0]);
          if (Array.isArray(data[0].variants) && data[0].variants.length > 0) {
            setSelectedVariant(data[0].variants[0]);
          }
        }
      } catch (err) {
        console.error('Error loading products for installment estimator:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      setSelectedVariant(prod.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setIsCarDropdownOpen(false);
    setCarSearchTerm('');
  };

  const handleVariantChange = (index: number) => {
    if (selectedProduct && Array.isArray(selectedProduct.variants)) {
      const v = selectedProduct.variants[index];
      if (v) {
        setSelectedVariant(v);
      }
    }
  };

  const selectedVariantIndex = selectedProduct && Array.isArray(selectedProduct.variants)
    ? selectedProduct.variants.findIndex((v: any) => v === selectedVariant)
    : -1;

  const carPrice = selectedVariant?.price || 0;
  const hasVariants = selectedProduct && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;
  const hasPrice = hasVariants && carPrice > 0;

  const filteredProducts = products.filter(p => {
    const normalizedSearch = carSearchTerm.toLowerCase().replace(/\s+/g, '');
    const normalizedProductName = p.name.toLowerCase().replace(/\s+/g, '');
    return normalizedProductName.includes(normalizedSearch);
  });

  // Calculations
  const downPaymentAmount = carPrice * (downPaymentPercent / 100);
  const loanAmount = carPrice - downPaymentAmount;
  const months = loanTerm * 12;
  
  // Standard EMI formula
  const r = (interestRateYearly / 100) / 12;
  const n = months;
  const monthlyPayment = (hasPrice && loanAmount > 0)
    ? loanAmount * ((r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-vinfast-blue mb-8 text-center">Ước Tính Chi Phí Trả Góp</h2>
      
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Đang tải dữ liệu sản phẩm...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dòng xe</label>
              <button
                type="button"
                onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none text-left flex justify-between items-center"
              >
                <span className="text-gray-900">{selectedProduct?.name || 'Chọn dòng xe...'}</span>
                <ChevronDown size={18} className={`text-gray-500 transition-transform duration-200 ${isCarDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCarDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto flex flex-col">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center gap-2">
                    <Search size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={carSearchTerm}
                      onChange={e => setCarSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm dòng xe..."
                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-vinfast-blue focus:border-vinfast-blue text-sm"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="py-1">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                            selectedProduct?.id === p.id ? 'bg-blue-50 text-vinfast-blue font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">
                        Không tìm thấy dòng xe
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phiên bản</label>
              <select
                value={selectedVariantIndex !== -1 ? selectedVariantIndex : ''}
                onChange={e => handleVariantChange(parseInt(e.target.value, 10))}
                disabled={!hasVariants}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {hasVariants ? (
                  selectedProduct.variants.map((v: any, index: number) => (
                    <option key={index} value={index}>
                      {v.name} {v.note ? '(' + v.note + ')' : ''} - {formatCurrency(v.price)}
                    </option>
                  ))
                ) : (
                  <option value="">Đang cập nhật giá...</option>
                )}
              </select>
              <div className="mt-2 text-sm text-gray-500 text-right">
                Giá xe: <span className="font-semibold text-gray-900">{hasPrice ? formatCurrency(carPrice) : 'Đang cập nhật'}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Tỷ lệ trả trước</label>
                <span className="font-bold text-vinfast-blue text-lg">{downPaymentPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={downPaymentPercent}
                onChange={e => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vinfast-blue"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>10%</span>
                <span>80%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Thời gian vay</label>
                <span className="font-bold text-vinfast-blue text-lg">{loanTerm} năm ({loanTerm * 12} tháng)</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={loanTerm}
                onChange={e => setLoanTerm(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vinfast-blue"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1 năm</span>
                <span>8 năm</span>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white p-6 rounded-xl border-2 border-vinfast-blue/20 shadow-lg flex flex-col justify-center space-y-6">
            <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-sm text-gray-600 mb-1">Số tiền trả trước (Nhận xe)</div>
              <div className="text-3xl font-bold text-gray-900">
                {hasPrice ? formatCurrency(downPaymentAmount) : 'Đang cập nhật'}
              </div>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-vinfast-blue text-white shadow-md">
              <div className="text-sm text-blue-100 mb-2">Góp ước tính mỗi tháng</div>
              <div className="text-4xl font-bold">
                {hasPrice ? formatCurrency(monthlyPayment) : 'Đang cập nhật'}
              </div>
              <div className="text-xs text-blue-200 mt-2">
                Trong {months} tháng (Lãi suất tham khảo {interestRateYearly}%/năm)
              </div>
            </div>

            {onQuoteTrigger && (
              <button
                type="button"
                onClick={() => {
                  const formattedMonthlyPayment = hasPrice ? formatCurrency(monthlyPayment) : 'Đang cập nhật';
                  const notes = hasPrice 
                    ? `Tôi muốn tư vấn trả góp xe ${selectedProduct?.name || ''}${selectedVariant?.name ? ` - ${selectedVariant.name}` : ''}. Trả trước: ${downPaymentPercent}%. Thời gian vay: ${loanTerm} năm. Trả mỗi tháng khoảng: ${formattedMonthlyPayment}.`
                    : `Tôi muốn nhận tư vấn trả góp cho xe ${selectedProduct?.name || ''}.`;
                  const selectedCarCombined = getCarDisplayName(selectedProduct?.name, selectedVariant?.name);
                  onQuoteTrigger(selectedCarCombined, notes);
                }}
                className="w-full bg-[#1464F4] text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Nhận báo giá & Lãi suất chính xác</span>
              </button>
            )}

            <p className="text-xs text-gray-500 text-center italic mt-4 px-4">
              * Bảng tính chỉ mang tính chất tham khảo. Lãi suất và số tiền thực tế có thể thay đổi tùy theo ngân hàng và thời điểm vay.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
