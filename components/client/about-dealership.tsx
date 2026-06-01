'use client';

import { useState } from 'react';
import { Car, Calculator, BadgePercent, FileText } from 'lucide-react';
import { ModalWrapper, LeadFormModal, CostEstimateModal, InstallmentModal } from './quick-action-modals';
import QuickActionCard from './quick-action-card';

export default function AboutDealership() {
    const [activeModal, setActiveModal] = useState<'testDrive' | 'estimate' | 'installment' | 'quote' | null>(null);
    const [preFilledCar, setPreFilledCar] = useState('');
    const [preFilledNotes, setPreFilledNotes] = useState('');

    const handleCloseModal = () => {
        setActiveModal(null);
        setPreFilledCar('');
        setPreFilledNotes('');
    };

    return (
        <section className="relative w-full bg-white pb-12">
            {/* Top Section - Dark Background */}
            <div
                className="relative pt-16 pb-32 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/bg-vinfast-cars.webp')" }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-[#152B4D]/90"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wide">
                        VINFAST XANH MEKONG
                    </h2>
                    <div className="h-[1px] w-24 mx-auto bg-gray-300 my-6"></div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-4 ">
                        VinFast Xanh Mekong là đại lý ủy quyền chính thức từ VinFast Việt Nam, với phương châm hoạt động tận tâm, chu đáo và hết mình vì khách hàng. Đại lý luôn không ngừng nỗ lực để mang đến những sản phẩm xe điện thông minh và trải nghiệm dịch vụ tốt nhất dành cho bạn.
                    </p>
                    <div className="h-[1px] w-70 mx-auto bg-gray-300 my-6"></div>

                    <p className="text-gray-300 text-lg leading-relaxed">
                        Phân phối các dòng xe điện VinFast chính hãng nổi bật như:{' '}
                        <span className="text-blue-400 font-semibold">VF 3, VF 5 Plus, VF 6, VF 7, VF 8, VF 9</span>{' '}
                        với nhiều ưu đãi hấp dẫn, hỗ trợ vay trả góp lãi suất tốt nhất thị trường.
                    </p>
                </div>
            </div>

            {/* Bottom Section - Overlapping Cards */}
            <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <QuickActionCard
                        title="ĐĂNG KÝ LÁI THỬ"
                        icon={Car}
                        desc="Trải nghiệm thực tế cảm giác lái mượt mà của các dòng xe điện VinFast."
                        onClick={() => {
                            setPreFilledCar('');
                            setPreFilledNotes('');
                            setActiveModal('testDrive');
                        }}
                    />
                    <QuickActionCard
                        title="DỰ TOÁN CHI PHÍ"
                        icon={Calculator}
                        desc="Nhập thông tin để nhận bảng tính chi phí lăn bánh chính xác nhất."
                        onClick={() => setActiveModal('estimate')}
                    />
                    <QuickActionCard
                        title="CHI PHÍ TRẢ GÓP"
                        icon={BadgePercent}
                        desc="VinFast hỗ trợ vay tối đa 80% giá trị xe, cùng chương trình ưu đãi trả góp hấp dẫn."
                        onClick={() => setActiveModal('installment')}
                    />
                    <QuickActionCard
                        title="BÁO GIÁ XE"
                        icon={FileText}
                        desc="Nhận báo giá nhanh chóng và chi tiết các gói ưu đãi khuyến mãi ngay hôm nay."
                        onClick={() => {
                            setPreFilledCar('');
                            setPreFilledNotes('');
                            setActiveModal('quote');
                        }}
                    />
                </div>
            </div>

            {/* Modals */}
            <ModalWrapper isOpen={activeModal !== null} onClose={handleCloseModal}>
                {activeModal === 'testDrive' && (
                    <LeadFormModal 
                        title="Đăng Ký Lái Thử" 
                        onClose={handleCloseModal} 
                        selectedCar={preFilledCar}
                        initialNotes={preFilledNotes}
                    />
                )}
                {activeModal === 'estimate' && (
                    <CostEstimateModal 
                        onQuoteTrigger={(carName, notes) => {
                            setPreFilledCar(carName);
                            setPreFilledNotes(notes);
                            setActiveModal('quote');
                        }}
                    />
                )}
                {activeModal === 'installment' && (
                    <InstallmentModal 
                        onQuoteTrigger={(carName, notes) => {
                            setPreFilledCar(carName);
                            setPreFilledNotes(notes);
                            setActiveModal('quote');
                        }}
                    />
                )}
                {activeModal === 'quote' && (
                    <LeadFormModal 
                        title="Nhận Báo Giá Chi Tiết" 
                        onClose={handleCloseModal} 
                        selectedCar={preFilledCar}
                        initialNotes={preFilledNotes}
                    />
                )}
            </ModalWrapper>
        </section>
    );
}
