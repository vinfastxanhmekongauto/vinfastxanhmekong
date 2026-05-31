export default function PromotionDetailLoading() {
    return (
        <div className="bg-vinfast-gray min-h-screen pb-32 md:pb-20 animate-pulse">
            {/* Hero Skeleton */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-0 md:px-8 py-0 md:py-12">
                    <div className="w-full aspect-[4/3] md:aspect-[21/9] bg-gray-200 md:rounded-3xl shadow-sm"></div>
                </div>
            </div>

            {/* Content Display Skeleton */}
            <div className="container mx-auto px-4 md:px-8 mt-8 md:mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-12 rounded-3xl border border-gray-100">
                        <div className="h-6 w-32 bg-blue-100 rounded-lg"></div>
                        <div className="h-12 w-3/4 bg-gray-200 rounded-xl"></div>
                        <div className="h-12 w-2/4 bg-gray-100 rounded-xl mt-6"></div>

                        <div className="space-y-4 pt-8">
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                            <div className="h-4 w-4/6 bg-gray-100 rounded"></div>
                        </div>
                    </div>

                    {/* Form Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="h-[500px] w-full bg-white rounded-3xl border border-gray-100"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
