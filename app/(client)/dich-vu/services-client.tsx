'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Wrench, CarFront, Settings, ArrowRight, CheckCircle2, Shield, PhoneCall } from 'lucide-react';

export default function ServicesClient() {
    // State for managing the active warranty tab
    const [activeWarrantyTab, setActiveWarrantyTab] = useState(0);

    // Mock data for the warranty tabs
    const warrantyTabs = [
        {
            title: "Chính sách bảo hành xe mới",
            description: "Chính sách bảo hành chính hãng ưu việt cho các dòng ô tô điện VinFast.",
            content: (
                <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-xl font-bold text-gray-900 font-display uppercase tracking-wide">
                            Bảo hành xe mới vượt trội
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">Áp dụng cho toàn bộ các dòng xe điện chính hãng mua mới.</p>
                    </div>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base">
                        <p>
                            VinFast tự tin cam kết chất lượng sản phẩm vượt trội cùng dịch vụ hậu mãi tốt nhất thị trường với chính sách bảo hành dài hạn:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#00358E]">
                                <h5 className="font-bold text-gray-900 mb-1">Dòng xe VF 8, VF 9</h5>
                                <p className="text-sm">Bảo hành chính hãng <strong>10 năm hoặc 200.000 km</strong> (tùy điều kiện nào đến trước).</p>
                            </div>
                             <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#00358E]">
                                 <h5 className="font-bold text-gray-900 mb-1">Dòng xe VF e34, VF 5, VF 6, VF 7, MPV7, EC Van, minio green, herio green, limo green</h5>
                                 <p className="text-sm">Bảo hành chính hãng <strong>7 năm hoặc 140.000 km</strong> (tùy điều kiện nào đến trước).</p>
                             </div>
                        </div>
                        <ul className="space-y-2 mt-4">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span>Phạm vi bảo hành bao gồm sửa chữa, thay thế các chi tiết bị lỗi do nhà sản xuất trong điều kiện sử dụng bình thường.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span>Thực hiện sửa chữa bảo hành miễn phí 100% tại toàn bộ các Xưởng dịch vụ ủy quyền của VinFast trên toàn quốc.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: "Chính sách bảo hành Pin độc quyền",
            description: "Chế độ bảo hành pin thông minh giúp khách hàng an tâm tuyệt đối khi vận hành.",
            content: (
                <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-xl font-bold text-gray-900 font-display uppercase tracking-wide">
                            Chính sách bảo hành Pin xe điện
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">Áp dụng cho pin cao áp đi kèm theo xe ô tô điện VinFast.</p>
                    </div>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base">
                        <p>
                            Nhằm mang lại trải nghiệm tối ưu nhất cho người sử dụng ô tô điện, VinFast áp dụng chính sách bảo hành Pin cực kỳ linh hoạt:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="p-4 bg-[#F5F5F5] rounded-lg border-l-4 border-red-600">
                                <h5 className="font-bold text-gray-900 mb-1">Dành cho khách hàng Thuê Pin</h5>
                                <p className="text-sm">VinFast sẽ sửa chữa hoặc thay thế pin miễn phí khi dung lượng pin tối đa (SOH) <strong>giảm xuống dưới 70%</strong>.</p>
                            </div>
                            <div className="p-4 bg-[#F5F5F5] rounded-lg border-l-4 border-red-600">
                                <h5 className="font-bold text-gray-900 mb-1">Dành cho khách hàng Mua Pin</h5>
                                <p className="text-sm">Bảo hành pin chính hãng từ <strong>8 đến 10 năm không giới hạn số km</strong> (tùy thuộc vào từng dòng xe cụ thể).</p>
                            </div>
                        </div>
                        <p className="text-sm bg-blue-50 text-[#00358E] p-3 rounded-md border border-blue-100 mt-3">
                            <strong>Lưu ý:</strong> Việc bảo hành pin không áp dụng trong các trường hợp pin bị tháo dỡ trái phép, hư hỏng do tai nạn nghiêm trọng hoặc ngập nước quá mức cho phép trong thời gian dài.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Dịch vụ cứu hộ & Sửa chữa lưu động",
            description: "Dịch vụ hỗ trợ sự cố khẩn cấp 24/7 và sửa chữa tận nơi Mobile Service.",
            content: (
                <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-xl font-bold text-gray-900 font-display uppercase tracking-wide">
                            Hỗ trợ khẩn cấp & Mobile Service
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">Dịch vụ chăm sóc khách hàng mọi lúc mọi nơi trên toàn quốc.</p>
                    </div>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base">
                        <p>
                            VinFast cung cấp các gói giải pháp cứu hộ và sửa chữa linh động giúp khách hàng luôn vững tâm hành trình:
                        </p>
                        <div className="space-y-3 mt-2">
                            <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                                <div className="p-2 bg-red-50 text-red-600 rounded">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900">Cứu hộ miễn phí 24/7</h5>
                                    <p className="text-sm mt-0.5">Áp dụng trong thời gian bảo hành đối với các sự cố kỹ thuật nằm trong phạm vi bảo hành khiến xe không thể tự di chuyển.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                                <div className="p-2 bg-blue-50 text-[#00358E] rounded">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900">Sửa chữa lưu động (Mobile Service)</h5>
                                    <p className="text-sm mt-0.5">Kỹ thuật viên thực hiện các hạng mục bảo dưỡng, sửa chữa nhẹ ngay tại địa chỉ khách hàng chỉ định mà không cần mang xe tới xưởng.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Chính sách bảo hành Phụ tùng chính hãng",
            description: "Chất lượng phụ tùng thay thế được đảm bảo bởi cam kết từ nhà sản xuất.",
            content: (
                <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-xl font-bold text-gray-900 font-display uppercase tracking-wide">
                            Bảo hành phụ tùng thay thế
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">Áp dụng cho phụ tùng và phụ kiện chính hiệu VinFast.</p>
                    </div>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base">
                        <p>
                            Khi thay lắp phụ tùng chính hiệu tại xưởng dịch vụ ủy quyền của VinFast, khách hàng được hưởng chính sách bảo hành phụ tùng đáng tin cậy:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Thời hạn bảo hành phụ tùng: <strong>12 tháng hoặc 20.000 km</strong> (tùy điều kiện nào đến trước) kể từ ngày ký biên bản bàn giao xe sửa chữa xong.</li>
                            <li>Chỉ bảo hành đối với những phụ tùng do các Xưởng dịch vụ của VinFast cung cấp và trực tiếp lắp đặt.</li>
                            <li>Chính sách không bảo hành cho các phụ tùng tiêu hao tự nhiên (như má phanh, gạt mưa, dung dịch lọc gió, các loại nhớt) trừ khi phát hiện có khuyết tật từ nhà sản xuất.</li>
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="w-full min-h-screen bg-gray-50 scroll-smooth">
            {/* 1. Hero Section */}
            <section 
                className="relative h-[450px] w-full bg-cover bg-center bg-no-repeat flex items-center justify-center text-center px-4"
                style={{ backgroundImage: "url('/banner-dich-vu.webp')" }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-[#0c1b33]/75"></div>

                {/* Content */}
                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-wide font-display drop-shadow-sm">
                        Dịch vụ sau bán hàng
                    </h1>
                    <div className="h-[2px] w-20 mx-auto bg-red-600 my-4"></div>
                    <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
                        Hệ thống Xưởng Dịch vụ VinFast Xanh Mekong được đầu tư trang thiết bị công nghệ hiện đại cùng đội ngũ kỹ thuật viên tay nghề cao, luôn sẵn sàng đồng hành và mang đến sự an tâm tuyệt đối cho quý khách.
                    </p>
                    <div className="pt-2">
                        <Link 
                            href="/dat-lich-dich-vu"
                            className="inline-block bg-[#E82429] hover:bg-red-700 text-white font-bold text-sm tracking-widest px-8 py-3.5 rounded shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-red-950/20"
                        >
                            ĐẶT HẸN DỊCH VỤ
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Anchor Navigation Cards */}
            <section className="max-w-7xl mx-auto px-4 -mt-16 relative z-20 pb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* Card 1 */}
                    <a 
                        href="#bao-hanh"
                        className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md border-b-4 border-transparent hover:border-[#E82429] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-50 text-[#E82429] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-gray-800 font-bold text-sm md:text-base text-center font-display tracking-tight transition-colors duration-200 group-hover:text-[#E82429]">
                            Chính sách bảo hành
                        </span>
                    </a>

                    {/* Card 2 */}
                    <a 
                        href="#bao-duong"
                        className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md border-b-4 border-transparent hover:border-[#00358E] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#00358E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <span className="text-gray-800 font-bold text-sm md:text-base text-center font-display tracking-tight transition-colors duration-200 group-hover:text-[#00358E]">
                            Dịch vụ bảo dưỡng
                        </span>
                    </a>

                    {/* Card 3 */}
                    <a 
                        href="#sua-chua"
                        className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md border-b-4 border-transparent hover:border-[#00358E] hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#00358E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <CarFront className="w-6 h-6" />
                        </div>
                        <span className="text-gray-800 font-bold text-sm md:text-base text-center font-display tracking-tight transition-colors duration-200 group-hover:text-[#00358E]">
                            Dịch vụ sửa chữa
                        </span>
                    </a>

                    {/* Card 4 */}
                    <a 
                        href="#phu-tung"
                        className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md border-b-4 border-transparent hover:border-amber-500 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Settings className="w-6 h-6" />
                        </div>
                        <span className="text-gray-800 font-bold text-sm md:text-base text-center font-display tracking-tight transition-colors duration-200 group-hover:text-amber-600">
                            Phụ tùng, phụ kiện
                        </span>
                    </a>
                </div>
            </section>

            {/* 3. Detailed Content Sections */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-20 pb-24">
                
                {/* SECTION A: CHÍNH SÁCH BẢO HÀNH */}
                <section id="bao-hanh" className="scroll-mt-24 space-y-8">
                    <div className="border-l-4 border-[#E82429] pl-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#E82429]">Dành Cho Khách Hàng</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase font-display mt-1">
                            Chính sách bảo hành
                        </h2>
                    </div>

                    {/* Vertical Tab UI Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Tab list buttons (1/3 width) */}
                        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:flex lg:flex-col lg:col-span-1">
                            {warrantyTabs.map((tab, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveWarrantyTab(idx)}
                                    className={`text-left p-3 md:p-4 rounded-lg transition-all duration-300 border-l-4 flex flex-col gap-1 shadow-sm w-full ${
                                        activeWarrantyTab === idx
                                            ? 'bg-white border-[#E82429] text-[#E82429]'
                                            : 'bg-white hover:bg-gray-100 border-transparent text-gray-700 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="font-bold font-display text-sm">
                                        {tab.title}
                                    </span>
                                    <span className={`text-xs ${
                                        activeWarrantyTab === idx ? 'text-gray-500' : 'text-gray-400'
                                    } line-clamp-2`}>
                                        {tab.description}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Right Column: Tab Content (2/3 width) */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-100 min-h-[300px] flex flex-col justify-between transition-all duration-300">
                            {warrantyTabs[activeWarrantyTab].content}
                            <div className="border-t border-gray-100 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Shield className="w-4 h-4 text-green-600" />
                                    <span>Hỗ trợ tư vấn bảo hành chuyên nghiệp</span>
                                </div>
                                <Link
                                    href="/dat-lich-dich-vu"
                                    className="inline-flex items-center gap-1 text-[#00358E] hover:text-blue-800 text-sm font-bold tracking-wider uppercase group"
                                >
                                    Đăng ký kiểm tra định kỳ 
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION B: DỊCH VỤ BẢO DƯỠNG */}
                <section id="bao-duong" className="scroll-mt-24 space-y-8">
                    <div className="border-l-4 border-[#00358E] pl-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#00358E]">Chăm Sóc Xe Định Kỳ</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase font-display mt-1">
                            Dịch vụ bảo dưỡng
                        </h2>
                    </div>

                    {/* Premium Placeholder Content Box */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
                            <p className="text-gray-600 max-w-3xl text-sm md:text-base leading-relaxed">
                                Bảo dưỡng xe định kỳ là chìa khóa để chiếc xe của bạn luôn hoạt động êm ái, an toàn và duy trì giá trị lâu dài. VinFast Xanh Mekong đề xuất lịch trình bảo dưỡng định kỳ mỗi 5.000 km hoặc sau mỗi 6 tháng sử dụng.
                            </p>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Standard 5,000 km Maintenance */}
                            <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition">
                                <h4 className="font-bold text-gray-900 text-base mb-2 font-display">BẢO DƯỠNG CẤP NHỎ (5.000 km)</h4>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Kiểm tra chẩn đoán lỗi bằng máy chuyên dụng.</li>
                                    <li>• Kiểm tra hệ thống phanh, lốp xe và áp suất lốp.</li>
                                    <li>• Vệ sinh lọc gió điều hòa, bổ sung nước rửa kính.</li>
                                </ul>
                            </div>
                            {/* Standard 10,000 km Maintenance */}
                            <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition">
                                <h4 className="font-bold text-gray-900 text-base mb-2 font-display">BẢO DƯỠNG CẤP TRUNG (10.000 km)</h4>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Toàn bộ các hạng mục kiểm tra cấp nhỏ.</li>
                                    <li>• Thay thế lọc gió điều hòa cabin xe.</li>
                                    <li>• Đảo lốp xe định kỳ, căn chỉnh độ chụm bánh xe.</li>
                                </ul>
                            </div>
                            {/* Major Maintenance */}
                            <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition">
                                <h4 className="font-bold text-gray-900 text-base mb-2 font-display">BẢO DƯỠNG CẤP LỚN (20.000 km)</h4>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Toàn bộ các hạng mục kiểm tra cấp trung.</li>
                                    <li>• Thay thế dầu phanh và dung dịch làm mát pin cao áp.</li>
                                    <li>• Vệ sinh và bảo dưỡng hệ thống phanh đĩa chi tiết.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION C: DỊCH VỤ SỬA CHỮA */}
                <section id="sua-chua" className="scroll-mt-24 space-y-8">
                    <div className="border-l-4 border-[#00358E] pl-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#00358E]">Chất Lượng Vượt Trội</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase font-display mt-1">
                            Dịch vụ sửa chữa
                        </h2>
                    </div>

                    {/* Premium Placeholder Content Box */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
                            <p className="text-gray-600 max-w-3xl text-sm md:text-base leading-relaxed">
                                Xưởng sửa chữa VinFast Xanh Mekong được đầu tư hạ tầng đồng bộ cùng phòng sơn sấy hiện đại tiêu chuẩn cao. Đội ngũ kỹ thuật viên dày dạn kinh nghiệm được đào tạo bài bản từ VinFast Việt Nam đảm bảo chẩn đoán chính xác và xử lý triệt để mọi hư hỏng.
                            </p>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                                <span className="font-black text-2xl text-blue-200 select-none">01</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Sửa chữa chung & Chẩn đoán lỗi</h4>
                                    <p className="text-sm text-gray-500">Sử dụng thiết bị chẩn đoán độc quyền OBD kết nối hệ thống phần mềm VinFast toàn cầu, định vị chính xác mã lỗi trên hệ thống điện tử và động cơ điện.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                                <span className="font-black text-2xl text-blue-200 select-none">02</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Đồng sơn công nghệ cao</h4>
                                    <p className="text-sm text-gray-500">Phục hồi nguyên trạng thân vỏ xe tai nạn, trầy xước bằng công nghệ pha sơn vi tính và hệ thống phòng sơn sấy khép kín hiện đại bậc nhất.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION D: PHỤ TÙNG, PHỤ KIỆN */}
                <section id="phu-tung" className="scroll-mt-24 space-y-8">
                    <div className="border-l-4 border-amber-500 pl-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500">Cam Kết Chính Hãng</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase font-display mt-1">
                            Phụ tùng, phụ kiện
                        </h2>
                    </div>

                    {/* Premium Placeholder Content Box */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-amber-50/30 to-transparent">
                            <p className="text-gray-600 max-w-3xl text-sm md:text-base leading-relaxed">
                                Tránh xa phụ tùng trôi nổi, kém chất lượng gây nguy hiểm khi vận hành. VinFast Xanh Mekong cung cấp 100% linh kiện, phụ tùng và phụ kiện chính hiệu dành riêng cho các dòng xe VinFast với mức giá niêm yết rõ ràng.
                            </p>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="p-5 bg-amber-50/20 rounded-lg border border-amber-100 text-center">
                                <h4 className="font-bold text-gray-900 text-base mb-1">Linh kiện động cơ & phanh</h4>
                                <p className="text-xs text-gray-500">Bánh răng, má phanh, đĩa phanh chính hãng giúp duy trì phản ứng lực cản tối ưu.</p>
                            </div>
                            <div className="p-5 bg-amber-50/20 rounded-lg border border-amber-100 text-center">
                                <h4 className="font-bold text-gray-900 text-base mb-1">Phụ kiện sạc thông minh</h4>
                                <p className="text-xs text-gray-500">Bộ sạc di động 3.5 kW, trạm sạc treo tường thông minh 7.4 kW cho gia đình.</p>
                            </div>
                            <div className="p-5 bg-amber-50/20 rounded-lg border border-amber-100 text-center">
                                <h4 className="font-bold text-gray-900 text-base mb-1">Dầu mỡ & dung dịch bổ sung</h4>
                                <p className="text-xs text-gray-500">Nước mát chuyên dụng làm dịu pin cao thế, dầu phanh xe điện chính hãng.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
