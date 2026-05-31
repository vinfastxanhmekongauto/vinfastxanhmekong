import Image from 'next/image';
import { Target, Eye, ShieldCheck, Wrench, MapPin } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Giới thiệu VinFast Xanh Mekong | Showroom Xe Máy Điện Cần Thơ',
    description: 'Tìm hiểu về VinFast Xanh Mekong - Đại lý ủy quyền xe máy điện VinFast uy tín hàng đầu tại khu vực Cần Thơ và miền Tây.',
    openGraph: {
        title: 'Giới thiệu VinFast Xanh Mekong | Showroom Xe Máy Điện Cần Thơ',
        description: 'Tìm hiểu về VinFast Xanh Mekong - Đại lý ủy quyền xe máy điện VinFast uy tín hàng đầu tại khu vực Cần Thơ và miền Tây.',
        url: '/about',
        images: [{ url: '/logo-vinfast.jpg' }],
    }
};

export default function AboutPage() {
    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* 1. Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] bg-vinfast-blue flex items-center justify-center overflow-hidden">
                <Image
                    src="/images/About/chuyen-doi-xanh-uu-d_compressed.webp"
                    alt="VinFast Showroom"
                    fill
                    className="object-cover opacity-30 mix-blend-overlay"
                    priority
                />
                <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
                        VinFast Xanh Mekong <br className="hidden md:block" />
                        <span className="text-blue-200">Tiên Phong Kỷ Nguyên Di Chuyển Xanh</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-50 font-light leading-relaxed drop-shadow-md">
                        Đại lý xe máy điện VinFast chính hãng hàng đầu tại Cần Thơ, mang đến giải pháp di chuyển thông minh và thân thiện với môi trường.
                    </p>
                </div>
                {/* Decorative bottom curve */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-vinfast-gray to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 md:px-8 -mt-10 relative z-20">
                {/* 2. Story & Mission */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-16 mb-16 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-blue-50 rounded-2xl shrink-0 text-vinfast-blue">
                                    <Target size={36} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Tầm Nhìn</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        Trở thành biểu tượng tin cậy cho cộng đồng sử dụng xe điện tại khu vực Đồng bằng sông Cửu Long, tiên phong kiến tạo một hệ sinh thái giao thông không khí thải, hiện đại và đẳng cấp.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-blue-50 rounded-2xl shrink-0 text-vinfast-blue">
                                    <Eye size={36} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Sứ Mệnh</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        Cam kết cung cấp các dòng xe máy điện VinFast thế hệ mới nhất (Evo200, Feliz S, Klara S...) với chất lượng kiểm định nghiêm ngặt, trải nghiệm mua sắm tuyệt vời cùng dịch vụ bảo trì chuyên nghiệp, tận tâm trọn đời.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-80 rounded-2xl overflow-hidden shadow-md">
                            <Image
                                src="/images/About/chuyen-doi-xanh-uu-d_compressed.webp"
                                alt="Cộng đồng VinFast"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Why Choose Us? */}
                <div className="mb-20">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-vinfast-blue mb-4">Tại Sao Chọn VinFast Xanh Mekong?</h2>
                        <p className="text-gray-600 text-lg">Ba giá trị cốt lõi xây dựng niềm tin của hàng ngàn khách hàng.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow text-center border border-gray-100 group">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-vinfast-blue group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Chính Hãng 100%</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Cam kết phân phối xe máy điện, phụ tùng và phụ kiện chính hãng nhập trực tiếp từ nhà máy VinFast, đảm bảo chất lượng tuyệt đối.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow text-center border border-gray-100 group">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-vinfast-blue group-hover:scale-110 transition-transform duration-300">
                                <Wrench size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Dịch Vụ Tận Tâm</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Đội ngũ kỹ thuật viên được đào tạo bài bản, chuẩn hóa quy trình bảo dưỡng. Hỗ trợ sự cố kỹ thuật giải quyết nhanh chóng, chuyên nghiệp.
                            </p>
                        </div>

                        <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow text-center border border-gray-100 group">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-vinfast-blue group-hover:scale-110 transition-transform duration-300">
                                <MapPin size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Vị Trí Đắc Địa</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Showroom hiện đại sang trọng đặt tại khu đô thị sầm uất Nam Cần Thơ, không gian rộng rãi thuận tiện cho khách hàng tham quan và trải nghiệm lái xe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
