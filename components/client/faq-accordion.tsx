'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FAQAccordionProps {
    productName: string;
}

export default function FAQAccordion({ productName }: FAQAccordionProps) {
    const faqData = [
        {
            question: `Giá lăn bánh xe ${productName} tại Cần Thơ bao nhiêu?`,
            answer: `Giá lăn bánh ${productName} tại Cần Thơ bao gồm giá niêm yết cộng thêm phí ra biển số, phí bảo trì đường bộ và bảo hiểm trách nhiệm dân sự. Đặc biệt, xe ô tô điện đang được miễn 100% lệ phí trước bạ.`
        },
        {
            question: `Mua xe ${productName} trả góp cần giấy tờ gì?`,
            answer: `Đại lý VinFast Xanh Mekong hỗ trợ vay trả góp ${productName} lên đến 80% giá trị xe với lãi suất ưu đãi. Thủ tục vô cùng đơn giản gồm: CCCD gắn chip, Giấy xác nhận tình trạng hôn nhân và Chứng minh thu nhập.`
        },
        {
            question: `${productName} có chính sách thuê pin không?`,
            answer: `Có. Đối với dòng xe ${productName}, VinFast cung cấp tùy chọn: mua xe kèm pin hoặc mua xe thuê pin. Pin sẽ được VinFast bảo hành và thay mới hoàn toàn miễn phí khi dung lượng sạc tối đa giảm xuống dưới 70%.`
        },
        {
            question: `Sạc pin xe ${productName} ở đâu? Có sạc tại nhà được không?`,
            answer: `VinFast sở hữu hệ thống trạm sạc công cộng phủ sóng khắp 63 tỉnh thành phố. Ngoài ra, bạn hoàn toàn có thể chủ động sạc ${productName} tại nhà bằng bộ sạc di động chính hãng đi kèm vô cùng tiện lợi và an toàn.`
        }
    ];

    return (
        <section className="py-8 md:py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Header */}
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-[#152B4D] mb-4 tracking-tight uppercase flex flex-col md:flex-row items-center justify-center gap-3">
                        <HelpCircle className="text-vinfast-blue w-8 h-8" />
                        <span>Hỏi đáp về {productName}</span>
                    </h2>
                    <div className="w-16 h-1 bg-vinfast-blue mx-auto rounded-full" />
                </div>

                {/* FAQ Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5">
                    {faqData.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md p-5 md:p-6 border border-gray-100 flex flex-col hover:shadow-lg transition-all duration-300"
                        >
                            <h3 className="text-lg font-bold text-vinfast-blue mb-2 md:mb-3 tracking-tight leading-snug">
                                {item.question}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base leading-relaxed mt-2 text-justify">
                                {item.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
