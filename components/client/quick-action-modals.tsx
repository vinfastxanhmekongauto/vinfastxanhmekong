'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitLead } from '@/app/actions/lead';

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

// --- 1 & 4. Lead Form Modal (Test Drive & Quote) ---
export function LeadFormModal({ 
  title, 
  onClose,
  selectedCar 
}: { 
  title: string; 
  onClose: () => void;
  selectedCar?: string;
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    car_model: selectedCar || CAR_MODELS[0],
    notes: ''
  });

  useEffect(() => {
    if (selectedCar) {
      setFormData(prev => ({ ...prev, car_model: selectedCar }));
    }
  }, [selectedCar]);
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
      const result = await submitLead(formData);

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
            <select
              value={formData.car_model}
              onChange={e => setFormData({ ...formData, car_model: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
            >
              {selectedCar && !CAR_MODELS.includes(selectedCar) && (
                <option value={selectedCar}>{selectedCar}</option>
              )}
              {CAR_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
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
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>Gửi Yêu Cầu <Send size={18} /></>
          )}
        </button>
      </form>
      </div>
    </div>
  );
}

// --- 2. Cost Estimate Modal ---
export function CostEstimateModal() {
  const [model, setModel] = useState(CAR_MODELS[0]);
  const [battery, setBattery] = useState(BATTERY_OPTIONS[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);

  // Dummy prices mapping
  const basePrices: Record<string, number> = {
    'VF 3': 240000000,
    'VF 5 Plus': 468000000,
    'VF 6': 675000000,
    'VF 7': 850000000,
    'VF 8': 1090000000,
    'VF 9': 1490000000,
  };

  const basePrice = basePrices[model] || 500000000;
  const batteryPrice = battery === 'Mua pin' ? 90000000 : 0;
  const carPrice = basePrice + batteryPrice;
  
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-5">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Thông tin xe</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dòng xe</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
            >
              {CAR_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tùy chọn pin</label>
            <div className="grid grid-cols-2 gap-3">
              {BATTERY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setBattery(opt)}
                  className={`py-3 rounded-md border font-medium transition-colors ${
                    battery === opt 
                      ? 'bg-vinfast-blue border-vinfast-blue text-white' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-vinfast-blue/50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
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
              <span className="text-gray-600">Giá xe ({battery})</span>
              <span className="font-semibold text-gray-900">{formatCurrency(carPrice)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Phí trước bạ (0%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(registrationFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Phí ra biển số ({location})</span>
              <span className="font-semibold text-gray-900">{formatCurrency(plateFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Phí đăng kiểm</span>
              <span className="font-semibold text-gray-900">{formatCurrency(inspectionFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Phí bảo trì đường bộ (1 năm)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(roadMaintenanceFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bảo hiểm TNDS (1 năm)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(insuranceFee)}</span>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-vinfast-blue font-semibold mb-1">TỔNG CHI PHÍ LĂN BÁNH</div>
            <div className="text-3xl font-bold text-vinfast-blue">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-gray-500 mt-2 italic">* Bảng tính chỉ mang tính chất tham khảo. Vui lòng liên hệ đại lý để có báo giá chính xác nhất.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. Installment Modal ---
export function InstallmentModal() {
  const [model, setModel] = useState(CAR_MODELS[0]);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(5);

  // Dummy prices mapping
  const basePrices: Record<string, number> = {
    'VF 3': 240000000,
    'VF 5 Plus': 468000000,
    'VF 6': 675000000,
    'VF 7': 850000000,
    'VF 8': 1090000000,
    'VF 9': 1490000000,
  };

  const carPrice = basePrices[model] || 500000000;
  
  // Calculations
  const downPaymentAmount = (carPrice * downPaymentPercent) / 100;
  const loanAmount = carPrice - downPaymentAmount;
  const months = loanTerm * 12;
  const interestRatePerYear = 0.08; // 8% dummy interest
  const interestRatePerMonth = interestRatePerYear / 12;
  
  // Standard amortization formula (EMI)
  const monthlyPayment = loanAmount > 0 
    ? (loanAmount * interestRatePerMonth * Math.pow(1 + interestRatePerMonth, months)) / (Math.pow(1 + interestRatePerMonth, months) - 1)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-3xl font-bold text-vinfast-blue mb-8 text-center">Ước Tính Chi Phí Trả Góp</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dòng xe</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
            >
              {CAR_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="mt-2 text-sm text-gray-500 text-right">
              Giá xe: <span className="font-semibold text-gray-900">{formatCurrency(carPrice)}</span>
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
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(downPaymentAmount)}</div>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-vinfast-blue text-white shadow-md">
            <div className="text-sm text-blue-100 mb-2">Góp ước tính mỗi tháng</div>
            <div className="text-4xl font-bold">{formatCurrency(monthlyPayment)}</div>
            <div className="text-xs text-blue-200 mt-2">Trong {months} tháng (Lãi suất tham khảo 8%/năm)</div>
          </div>

          <p className="text-xs text-gray-500 text-center italic mt-4 px-4">
            * Bảng tính chỉ mang tính chất tham khảo. Lãi suất và số tiền thực tế có thể thay đổi tùy theo ngân hàng và thời điểm vay.
          </p>
        </div>
      </div>
    </div>
  );
}
