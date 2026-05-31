export default function ProductDetailLoading() {
    return (
        <div className="bg-[#f7f8fa] min-h-screen pb-20 animate-pulse">
            {/* Hero Skeleton */}
            <div className="bg-gradient-to-b from-white via-white to-[#f0f4ff] border-b border-gray-100">
                <div className="container mx-auto px-4 md:px-8 py-10 lg:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                        {/* Gallery Skeleton */}
                        <div className="space-y-3">
                            <div className="bg-gray-100 rounded-3xl aspect-[4/3] w-full"></div>
                            <div className="flex gap-2.5">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] bg-gray-100 rounded-xl shrink-0"></div>
                                ))}
                            </div>
                        </div>

                        {/* Info Skeleton */}
                        <div className="flex flex-col space-y-5">
                            <div className="h-5 bg-blue-100 rounded-full w-20"></div>
                            <div className="h-14 bg-gray-200 rounded-xl w-3/4"></div>
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                                <div className="flex gap-8">
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                        <div className="h-8 bg-gray-200 rounded w-40"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-40"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <div className="h-14 bg-blue-100 rounded-full flex-1"></div>
                                <div className="h-14 bg-gray-100 rounded-full flex-1"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Specs Strip Skeleton */}
            <div className="container mx-auto px-4 md:px-8">
                <div className="bg-[#152B4D] rounded-2xl lg:rounded-3xl p-6 md:p-8 -mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                                <div className="h-3 bg-white/10 rounded w-16"></div>
                                <div className="h-6 bg-white/10 rounded w-24"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Description Skeleton */}
            <div className="container mx-auto px-4 md:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                        <div className="h-40 bg-gray-50 rounded-2xl w-full mt-4"></div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="h-[460px] bg-white rounded-3xl border border-gray-100"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
