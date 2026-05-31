'use client';

export default function ProductSkeleton() {
    return (
        <div className="bg-white h-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col pointer-events-none animate-pulse">
            {/* Image Placeholder */}
            <div className="relative h-56 md:h-64 w-full bg-gray-200"></div>

            <div className="p-6 flex flex-col flex-grow">
                {/* Range Label Placeholder */}
                <div className="w-1/2 h-4 bg-gray-200 rounded mb-4"></div>

                {/* Title Placeholder */}
                <div className="w-3/4 h-8 bg-gray-300 rounded mb-4"></div>

                {/* Description/Specs Placeholder */}
                <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-5/6 h-4 bg-gray-200 rounded mb-6 flex-grow"></div>

                {/* Footer Placeholder (Price & Button) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="w-1/3 h-6 bg-gray-300 rounded"></div>
                    <div className="w-1/4 h-10 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}
