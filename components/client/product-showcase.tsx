'use client';

import { Car } from 'lucide-react';
import ProductCard, { ProductDisplay } from './product-card';

interface ProductShowcaseProps {
    products: ProductDisplay[];
}

export default function ProductShowcase({ products }: ProductShowcaseProps) {
    // Filter products based on category
    const privateVehicles = products.filter(product => product.category === 'dong_co_dien');
    const serviceVehicles = products.filter(product => product.category === 'dich_vu');

    return (
        <section className="relative w-full py-28 bg-[#F6F8FA]" id="cars-showcase">
            {/* Top Edge Fade (White to Transparent) */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-4 md:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                        DANH SÁCH DÒNG XE
                    </h2>
                    <div className="w-20 h-1 bg-vinfast-blue mx-auto mb-6 rounded-full"></div>
                    <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
                        Khám phá các dòng ô tô điện VinFast đột phá, thiết kế hiện đại cùng công nghệ thông minh dẫn đầu hành trình xanh.
                    </p>
                </div>

                {/* Block 1: Dòng xe động cơ điện */}
                {privateVehicles.length > 0 && (
                    <div className="mb-24">
                        <div className="text-center mb-10">
                            <h3 className="font-display text-3xl font-bold text-vinfast-blue uppercase mb-3">
                                Dòng xe động cơ điện
                            </h3>
                            <div className="w-12 h-1 bg-vinfast-blue mx-auto rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {privateVehicles.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Block 2: Dòng xe dịch vụ */}
                {serviceVehicles.length > 0 && (
                    <div>
                        <div className="text-center mb-10">
                            <h3 className="font-display text-3xl font-bold text-vinfast-blue uppercase mb-3">
                                Dòng xe dịch vụ
                            </h3>
                            <div className="w-12 h-1 bg-vinfast-blue mx-auto rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {serviceVehicles.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}

                {privateVehicles.length === 0 && serviceVehicles.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm px-4">
                        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Đang cập nhật dòng xe</h3>
                        <p className="text-gray-500 max-w-md mx-auto">Các sản phẩm đang được cập nhật thông số. Xin vui lòng quay lại sau.</p>
                    </div>
                )}
            </div>

            {/* Bottom Edge Fade (Transparent to White) */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </section>
    );
}
