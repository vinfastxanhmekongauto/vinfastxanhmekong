import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Battery } from "lucide-react";
import LeadForm from "@/components/client/lead-form";
import { supabase } from "@/lib/supabase";
import ProductShowcase from "@/components/client/product-showcase";
import { ProductDisplay } from "@/components/client/product-card";
import HeroBanner, { type PromotionSlide } from "@/components/client/hero-banner";
import AboutDealership from "@/components/client/about-dealership";

// Khắc phục Cache cho Next.js 14 server components nếu cần
export const revalidate = 60;

export default async function Home() {
  // Fetch all products
  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  const productsRaw = (productsData as any[]) || [];
  const products = productsRaw.map(p => {
    const prices = p.variants && Array.isArray(p.variants) ? p.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
    const price_from = prices.length > 0 ? Math.min(...prices) : null;
    return {
      ...p,
      price_from,
      specs: null,
    };
  });

  // Fetch Promotions
  const { data: promotions } = await supabase
    .from("promotions")
    .select(
      "*",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const activePromotions = (promotions as unknown as (PromotionSlide & { start_date?: string; end_date?: string; created_at?: string })[]) || [];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Banner Carousel */}
      <HeroBanner promotions={activePromotions} />

      {/* About Dealership & Quick Actions */}
      <AboutDealership />

      {/* Product Showcase */}
      <ProductShowcase products={products} />

      {/* Lead Form Subsystem Registration */}
      <LeadForm />

      {/* Dịch vụ bảo dưỡng & Sửa chữa */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Dịch vụ bảo dưỡng & Sửa chữa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link href="/dat-lich-dich-vu" className="relative group overflow-hidden h-[450px] rounded-2xl cursor-pointer block shadow-md hover:shadow-xl transition-all duration-300">
              <Image
                src="/images/service/service-1.webp"
                alt="Bảo dưỡng định kỳ"
                fill
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <h3 className="text-xl font-bold mb-2">Bảo dưỡng định kỳ</h3>
                <p className="text-sm text-gray-200 mb-4 line-clamp-3">
                  Trong quá trình vận hành, nhiều chi tiết trên xe bị mài mòn theo thời gian. Bảo dưỡng định kỳ giúp xe luôn trong tình trạng hoàn hảo.
                </p>
                <button className="border border-white px-5 py-2 text-sm font-medium hover:bg-white hover:text-black transition-colors rounded">
                  Đặt lịch bảo dưỡng
                </button>
              </div>
            </Link>

            {/* Card 2 */}
            <Link href="/dat-lich-dich-vu" className="relative group overflow-hidden h-[450px] rounded-2xl cursor-pointer block shadow-md hover:shadow-xl transition-all duration-300">
              <Image
                src="/images/service/service-2.webp"
                alt="Dịch vụ sửa chữa"
                fill
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <h3 className="text-xl font-bold mb-2">Dịch vụ sửa chữa</h3>
                <p className="text-sm text-gray-200 mb-4 line-clamp-3">
                  Ngoài bảo dưỡng, VinFast cung cấp dịch vụ sửa chữa chuyên nghiệp khắc phục mọi vấn đề của xe.
                </p>
                <button className="border border-white px-5 py-2 text-sm font-medium hover:bg-white hover:text-black transition-colors rounded">
                  Đặt lịch sửa chữa
                </button>
              </div>
            </Link>

            {/* Card 3 */}
            <Link href="/cham-soc-khach-hang" className="relative group overflow-hidden h-[450px] rounded-2xl cursor-pointer block shadow-md hover:shadow-xl transition-all duration-300">
              <Image
                src="/images/service/service-3.webp"
                alt="Chính sách bảo hành"
                fill
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <h3 className="text-xl font-bold mb-2">Chính sách bảo hành</h3>
                <p className="text-sm text-gray-200 mb-4 line-clamp-3">
                  Chế độ bảo hành vượt trội mang lại sự an tâm tuyệt đối cho khách hàng sở hữu xe điện VinFast.
                </p>
                <button className="border border-white px-5 py-2 text-sm font-medium hover:bg-white hover:text-black transition-colors rounded">
                  Xem chính sách
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Tin tức & Khuyến mãi */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Tin tức & Khuyến mãi
              </h2>
              <p className="text-gray-650 text-sm md:text-base">
                Cập nhật những tin tức mới nhất và các chương trình ưu đãi hấp dẫn từ VinFast Xanh Mekong.
              </p>
            </div>
            <Link
              href="/khuyen-mai"
              className="hidden md:inline-flex items-center text-vinfast-blue font-semibold hover:text-blue-800 transition-colors gap-1 group"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activePromotions.slice(0, 3).map((promotion) => {
              const startDateStr = promotion.start_date
                ? new Date(promotion.start_date).toLocaleDateString('vi-VN')
                : '';
              const endDateStr = promotion.end_date
                ? new Date(promotion.end_date).toLocaleDateString('vi-VN')
                : '';
              const dateDisplay = startDateStr && endDateStr
                ? `${startDateStr} - ${endDateStr}`
                : startDateStr
                  ? `Từ ${startDateStr}`
                  : 'Đang diễn ra';

              let imageUrl = promotion.banner_url || `/images/placeholder.webp`;
              if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/promotions/') && imageUrl !== '/images/placeholder.webp') {
                imageUrl = `/images/promotions/${imageUrl.split('/').pop()}`;
              }

              const plainText = promotion.description
                ? promotion.description.replace(/<[^>]+>/g, '')
                : '';
              const cleanExcerpt = plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;

              return (
                <div
                  key={promotion.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg overflow-hidden flex flex-col group border border-gray-100 transition-all duration-300"
                >
                  <Link href={`/khuyen-mai/${promotion.slug}`} className="h-56 w-full relative overflow-hidden bg-gray-200 block">
                    <Image
                      src={imageUrl}
                      alt={promotion.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </Link>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-xs font-semibold mb-4 text-gray-500">
                      <span className="bg-blue-50 text-vinfast-blue px-2.5 py-1 rounded-md border border-blue-100">
                        Khuyến mãi
                      </span>
                      <span>{dateDisplay}</span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                      <Link href={`/khuyen-mai/${promotion.slug}`}>
                        {promotion.title}
                      </Link>
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {cleanExcerpt || 'Chi tiết chương trình khuyến mãi...'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <Link
                        href={`/khuyen-mai/${promotion.slug}`}
                        className="inline-flex items-center text-vinfast-blue font-bold text-sm hover:text-blue-800 transition-colors gap-1 group/btn"
                      >
                        <span>Đọc chi tiết</span>
                        <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile view-all button */}
          <div className="text-center mt-12 md:hidden">
            <Link
              href="/khuyen-mai"
              className="inline-block border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors active:scale-95 duration-200"
            >
              Xem tất cả bài viết
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
