export default function BlogDetailLoading() {
    return (
        <div className="bg-vinfast-gray min-h-screen pb-20 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-8"></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-8 w-24 bg-blue-50 rounded-md"></div>
                        <div className="h-6 w-32 bg-gray-100 rounded"></div>
                    </div>

                    <div className="h-14 md:h-20 w-full bg-gray-200 rounded-xl mb-8"></div>

                    <div className="border-l-4 border-gray-200 pl-6 mb-12 space-y-3">
                        <div className="h-5 w-full bg-gray-100 rounded"></div>
                        <div className="h-5 w-5/6 bg-gray-100 rounded"></div>
                        <div className="h-5 w-4/6 bg-gray-100 rounded"></div>
                    </div>

                    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-gray-200 rounded-3xl shadow-sm border border-gray-100"></div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container mx-auto px-4 md:px-8 mt-12 max-w-4xl">
                <div className="bg-white p-8 md:p-14 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="h-6 w-full bg-gray-100 rounded"></div>
                    <div className="h-6 w-full bg-gray-100 rounded"></div>
                    <div className="h-6 w-5/6 bg-gray-100 rounded"></div>
                    <div className="h-6 w-full bg-gray-100 rounded mt-8"></div>
                    <div className="h-6 w-4/6 bg-gray-100 rounded"></div>
                    <div className="h-6 w-5/6 bg-gray-100 rounded"></div>
                </div>
            </div>
        </div>
    );
}
