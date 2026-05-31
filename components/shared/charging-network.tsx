import Image from "next/image";

export default function ChargingNetwork() {
    return (
        <section className="w-full bg-gray-900 text-white overflow-hidden relative">
            {/* Transition 2: Dark Tech Specs to Navy Charging Map */}
            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10"></div>
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 py-24">

                {/* Cột trái: Nội dung văn bản */}
                <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                        3,5 km - Khoảng cách <br />
                        <span className="text-blue-500">nhỏ cho mục tiêu lớn.</span>
                    </h2>

                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        Định hình tiên phong thúc đẩy ngành công nghiệp xe điện, hướng tới một tương lai Xanh và Thông Minh,
                        VinFast đã đầu tư hàng trăm triệu USD phát triển hạ tầng, từng bước "phủ rộng" trạm sạc xe điện:
                    </p>

                    <ul className="space-y-4 mb-10">
                        {[
                            "Hệ thống trạm sạc xe điện VinFast trải dài 63 Tỉnh và Thành phố.",
                            "106 tuyến quốc lộ quan trọng đều có trạm sạc.",
                            "80/85 thành phố đã được lắp đặt hệ thống trạm sạc.",
                            "Khoảng cách ngắn 3,5 km giữa 2 trạm sạc trong thành phố."
                        ].map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                                <span className="text-gray-200">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-gray-800/50 border-l-4 border-blue-500 p-6 italic text-gray-300">
                        VinFast cam kết nỗ lực mang đến nhiều tiện ích, giúp hành trình lái xe điện của người Việt thật dễ dàng!
                    </div>
                </div>

                {/* Cột phải: Bản đồ */}
                <div className="relative bg-[#3B5998] min-h-[500px] flex items-center justify-center">
                    <div className="relative w-full h-full ">
                        <Image
                            src="/vf7-cam-ket-tien-ich.webp" // Bạn hãy upload ảnh bản đồ vào thư mục public/images/
                            alt="Bản đồ trạm sạc VinFast"
                            fill
                            className="object-contain "
                            priority
                        />
                    </div>

                    {/* Label Quần đảo (Trang trí thêm cho chuyên nghiệp) */}
                    {/* <div className="absolute bottom-10 right-10 text-right opacity-60 text-xs tracking-widest uppercase">
                        <p>Quần đảo Hoàng Sa</p>
                        <p className="mt-8">Quần đảo Trường Sa</p>
                    </div> */}
                </div>

            </div>
        </section>
    );
}