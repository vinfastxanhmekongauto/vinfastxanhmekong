import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">404 - Không tìm thấy trang</h2>
            <p className="text-gray-600 mb-8">Trang quản trị bạn đang tìm kiếm không tồn tại.</p>
            <Link
                href="/admin/dashboard"
                className="px-6 py-3 bg-vinfast-blue text-white rounded-md hover:bg-blue-800 transition-colors"
            >
                Quay lại Dashboard
            </Link>
        </div>
    );
}
