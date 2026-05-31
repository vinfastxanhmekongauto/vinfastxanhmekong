'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, X, Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, CheckSquare, Square, Star, StarOff, Search, Copy, Upload, Settings2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { JSONContent } from '@tiptap/react';


const ITEMS_PER_PAGE = 8;

type Variant = {
    name: string;
    price: number;
    note?: string;
    is_popular?: boolean;
};

type FeatureItem = {
    url: string;
    text: string;
};

type FeatureSection = {
    title: string;
    items: {
        url: string;
        text: string;
    }[];
};

type Product = {
    id: string;
    name: string;
    slug: string;
    excerpt?: string;
    is_featured: boolean;
    thumbnail_url?: string;
    variants?: Variant[];
    features_carousel?: {
        title: string;
        items: FeatureItem[];
    };
    extra_features_carousel?: {
        title: string;
        items: FeatureItem[];
    };
    feature_sections?: FeatureSection[];
    extra_feature_sections?: FeatureSection[];
    policies?: string[];
    category?: string;
    tech_specs_markdown?: string;
    gallery?: string[];
    hero_banner_url?: string;
    subtitle?: string;
    tagline?: string | null;
    homepage_specs?: {
        range?: string;
        charge_time?: string;
        segment?: string;
    } | null;
    sale_status?: 'available' | 'booking' | 'coming_soon' | null;
    brochure_url?: string | null;
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Search State
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        excerpt: '',
        is_featured: false,
        thumbnail_url: '',
        variants: [] as Variant[],
        features_carousel: { title: '', items: [] as FeatureItem[] },
        extra_features_carousel: { title: '', items: [] as FeatureItem[] },
        feature_sections: [] as FeatureSection[],
        extra_feature_sections: [] as FeatureSection[],
        category: '',
        tech_specs_markdown: '',
        policies: [] as string[],
        gallery: [] as string[],
        hero_banner_url: '',
        subtitle: '',
        tagline: '',
        homepage_specs: { range: '', charge_time: '', segment: '' },
        sale_status: 'available',
        brochure_url: ''
    });

    // States cho upload Feature images
    const [uploadingIndexes, setUploadingIndexes] = useState<number[]>([]);
    const [isAddingFeature, setIsAddingFeature] = useState(false);
    const [uploadingExtraIndexes, setUploadingExtraIndexes] = useState<number[]>([]);
    const [isAddingExtraFeature, setIsAddingExtraFeature] = useState(false);
    const [uploadingSectionItems, setUploadingSectionItems] = useState<string[]>([]); // "sectionIdx-itemIdx"
    const [uploadingExtraSectionItems, setUploadingExtraSectionItems] = useState<string[]>([]); // "sectionIdx-itemIdx"
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
    const [heroBannerFile, setHeroBannerFile] = useState<File | null>(null);
    const [heroBannerPreviewUrl, setHeroBannerPreviewUrl] = useState<string | null>(null);

    // Notification state
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Storage cleanup state
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    const queueImageForDeletion = (url: string | null) => {
        if (!url) return;
        const baseUrl = 'supabase.co/storage/v1/object/public/images/';
        if (url.includes(baseUrl)) {
            // Extract the path after the bucket name
            const filePath = url.split(baseUrl)[1];
            // Decode URI components (e.g., spaces converted to %20)
            const decodedPath = decodeURIComponent(filePath);

            setImagesToDelete(prev => {
                if (!prev.includes(decodedPath)) {
                    return [...prev, decodedPath];
                }
                return prev;
            });
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchInput);
            setCurrentPage(1); // Reset to page 1 on search
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchProducts();
        // Reset selection when changing pages, refetching, or searching
        setSelectedIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);

            if (debouncedSearchTerm) {
                query = query.or(`name.ilike.%${debouncedSearchTerm}%,slug.ilike.%${debouncedSearchTerm}%`);
            }

            const { data, count, error } = await query;

            if (error) throw error;
            setProducts(data || []);
            setTotalProducts(count || 0);
        } catch (error) {
            console.error('Error fetching products:', error);
            showNotification('error', 'Lỗi khi tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD') // Thay đổi các kí tự tiếng Việt có dấu
            .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
            .replace(/\s+/g, '-') // Đổi khoảng trắng thành gạch ngang
            .replace(/[^\w-]+/g, '') // Format lại các ký tự không phải alphanum
            .replace(/--+/g, '-') // Xóa nhiều - liên tiếp
            .replace(/^-+/, '') // Trim - ở đầu
            .replace(/-+$/, ''); // Trim - ở cuối
    };

    const resolveImageUrl = (input: string) => {
        if (!input) return '';
        if (input.startsWith('http')) return input; // Đã là URL đầy đủ thì trả về luôn

        // Nếu là path đơn thuần, chuẩn hoá để lấy URL qua Supabase
        let cleanPath = input.startsWith('/') ? input.substring(1) : input;
        if (cleanPath.startsWith('images/')) {
            cleanPath = cleanPath.substring(7);
        }

        const { data } = supabase.storage.from('images').getPublicUrl(cleanPath);
        return data.publicUrl;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
            // Lưu ý: Nếu biến lưu sản phẩm đang sửa của bạn tên là 'editing' (giống bên Promotions), hãy đổi chữ 'editingItem' thành 'editing' nhé.
            if (editingProduct && editingProduct.thumbnail_url) {
                queueImageForDeletion(editingProduct.thumbnail_url);
            }
            // --- KẾT THÚC ĐOẠN THÊM VÀO ---

            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };
    const handleHeroBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
            // Lưu ý nhỏ: Mình đang để tạm tên cột là 'hero_banner_url'. 
            // Nếu trong Database bảng products của bạn đặt tên khác (ví dụ: 'banner_url', 'cover_url'), 
            // thì bạn nhớ đổi chữ 'hero_banner_url' lại cho khớp nhé!
            if (editingProduct && editingProduct.hero_banner_url) {
                queueImageForDeletion(editingProduct.hero_banner_url);
            }
            // --- KẾT THÚC ĐOẠN THÊM VÀO ---

            setHeroBannerFile(file);
            setHeroBannerPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setGalleryFiles(prev => [...prev, ...files]);

            const newPreviewUrls = files.map(file => URL.createObjectURL(file));
            setGalleryPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const handleFeatureImageUpload = async (file: File, index?: number) => {
        if (index === undefined) setIsAddingFeature(true);
        else setUploadingIndexes(prev => [...prev, index]);

        try {
            const upFormData = new FormData();
            upFormData.append('file', file);
            upFormData.append('folder', 'products/features');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: upFormData
            });

            if (res.ok) {
                const { url } = await res.json();
                if (index === undefined) {
                    setFormData({
                        ...formData,
                        features_carousel: {
                            ...formData.features_carousel,
                            items: [...formData.features_carousel.items, { url, text: '' }]
                        }
                    });
                } else {
                    const newItems = [...formData.features_carousel.items];

                    // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
                    // Trước khi đè url mới, lấy url cũ bỏ vào thùng rác
                    const oldUrl = newItems[index].url;
                    if (oldUrl) {
                        queueImageForDeletion(oldUrl);
                    }
                    // --- KẾT THÚC ĐOẠN THÊM VÀO ---

                    newItems[index].url = url;

                    setFormData({
                        ...formData,
                        features_carousel: { ...formData.features_carousel, items: newItems }
                    });
                }
            } else {
                showNotification('error', 'Lỗi khi tải ảnh lên');
            }
        } catch (error) {
            console.error('Feature upload error:', error);
            showNotification('error', 'Lỗi kết nối khi tải ảnh');
        } finally {
            if (index === undefined) setIsAddingFeature(false);
            else setUploadingIndexes(prev => prev.filter(i => i !== index));
        }
    };



    const handleExtraFeatureImageUpload = async (file: File, index?: number) => {
        if (index === undefined) setIsAddingExtraFeature(true);
        else setUploadingExtraIndexes(prev => [...prev, index]);

        try {
            const upFormData = new FormData();
            upFormData.append('file', file);
            upFormData.append('folder', 'products/features');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: upFormData
            });

            if (res.ok) {
                const { url } = await res.json();
                if (index === undefined) {
                    setFormData({
                        ...formData,
                        extra_features_carousel: {
                            ...formData.extra_features_carousel,
                            items: [...formData.extra_features_carousel.items, { url, text: '' }]
                        }
                    });
                } else {
                    const newItems = [...formData.extra_features_carousel.items];
                    const oldUrl = newItems[index].url;
                    if (oldUrl) {
                        queueImageForDeletion(oldUrl);
                    }
                    newItems[index].url = url;
                    setFormData({
                        ...formData,
                        extra_features_carousel: { ...formData.extra_features_carousel, items: newItems }
                    });
                }
            } else {
                showNotification('error', 'Lỗi khi tải ảnh lên');
            }
        } catch (error) {
            console.error('Extra Feature upload error:', error);
            showNotification('error', 'Lỗi kết nối khi tải ảnh');
        } finally {
            if (index === undefined) setIsAddingExtraFeature(false);
            else setUploadingExtraIndexes(prev => prev.filter(i => i !== index));
        }
    };

    const handleSectionItemImageUpload = async (sectionIdx: number, itemIdx: number, file: File) => {
        const id = `${sectionIdx}-${itemIdx}`;
        setUploadingSectionItems(prev => [...prev, id]);
        try {
            const upFormData = new FormData();
            upFormData.append('file', file);
            upFormData.append('folder', 'products/details');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: upFormData
            });

            if (res.ok) {
                const { url } = await res.json();
                const newSections = [...formData.feature_sections];
                const oldUrl = newSections[sectionIdx].items[itemIdx].url;
                if (oldUrl) {
                    queueImageForDeletion(oldUrl);
                }
                newSections[sectionIdx].items[itemIdx].url = url;
                setFormData({ ...formData, feature_sections: newSections });
            } else {
                showNotification('error', 'Lỗi khi tải ảnh lên');
            }
        } catch (error) {
            console.error('Section item upload error:', error);
            showNotification('error', 'Lỗi kết nối khi tải ảnh');
        } finally {
            setUploadingSectionItems(prev => prev.filter(i => i !== id));
        }
    };

    const handleExtraSectionItemImageUpload = async (sectionIdx: number, itemIdx: number, file: File) => {
        const id = `${sectionIdx}-${itemIdx}`;
        setUploadingExtraSectionItems(prev => [...prev, id]);
        try {
            const upFormData = new FormData();
            upFormData.append('file', file);
            upFormData.append('folder', 'products/details');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: upFormData
            });

            if (res.ok) {
                const { url } = await res.json();
                const newSections = [...formData.extra_feature_sections];
                const oldUrl = newSections[sectionIdx].items[itemIdx].url;
                if (oldUrl) {
                    queueImageForDeletion(oldUrl);
                }
                newSections[sectionIdx].items[itemIdx].url = url;
                setFormData({ ...formData, extra_feature_sections: newSections });
            } else {
                showNotification('error', 'Lỗi khi tải ảnh lên');
            }
        } catch (error) {
            console.error('Extra section item upload error:', error);
            showNotification('error', 'Lỗi kết nối khi tải ảnh');
        } finally {
            setUploadingExtraSectionItems(prev => prev.filter(i => i !== id));
        }
    };

    const removeGalleryImage = (index: number, url: string) => {
        // If it's a blob URL, revoke it
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        } else {
            // It's an existing image, queue it for deletion from storage on save
            queueImageForDeletion(url);
        }

        // Remove from galleryPreviewUrls
        setGalleryPreviewUrls(prev => prev.filter((_, i) => i !== index));

        // Remove corresponding file from galleryFiles if it's a blob URL
        if (url.startsWith('blob:')) {
            const blobUrls = galleryPreviewUrls.filter(u => u.startsWith('blob:'));
            const blobIdx = blobUrls.indexOf(url);
            if (blobIdx !== -1) {
                setGalleryFiles(prev => prev.filter((_, i) => i !== blobIdx));
            }
        }
    };

    const handleOpenModal = (product?: Product) => {
        setImageFile(null);
        setImagePreviewUrl(null);
        setHeroBannerFile(null);
        setHeroBannerPreviewUrl(null);
        setGalleryFiles([]);
        const resolvedGallery = product && Array.isArray(product.gallery) ? product.gallery : [];
        setGalleryPreviewUrls(resolvedGallery);
        if (product) {
            setEditingProduct(product);

            // Xử lý biến đổi URL hoặc gán trực tiếp URL
            const resolvedUrl = product.thumbnail_url ? resolveImageUrl(product.thumbnail_url) : '';

            setFormData({
                name: product.name || '',
                slug: product.slug || '',
                excerpt: product.excerpt || '',
                is_featured: product.is_featured || false,
                thumbnail_url: resolvedUrl, // Lưu trực tiếp Public URL vào state
                variants: Array.isArray(product.variants) ? product.variants : [],
                features_carousel: product.features_carousel || { title: '', items: [] },
                extra_features_carousel: product.extra_features_carousel || { title: '', items: [] },
                feature_sections: Array.isArray(product.feature_sections) ? product.feature_sections : [],
                extra_feature_sections: Array.isArray(product.extra_feature_sections) ? product.extra_feature_sections : [],
                category: product.category || '',
                tech_specs_markdown: product.tech_specs_markdown || '',
                policies: Array.isArray(product.policies) ? product.policies : [],
                gallery: resolvedGallery,
                hero_banner_url: product.hero_banner_url || '',
                subtitle: product.subtitle || '',
                tagline: product.tagline || '',
                homepage_specs: {
                    range: product.homepage_specs?.range || '',
                    charge_time: product.homepage_specs?.charge_time || '',
                    segment: product.homepage_specs?.segment || ''
                },
                sale_status: product.sale_status || 'available',
                brochure_url: product.brochure_url || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                slug: '',
                excerpt: '',
                is_featured: false,
                thumbnail_url: '',
                variants: [],
                features_carousel: { title: '', items: [] },
                extra_features_carousel: { title: '', items: [] },
                feature_sections: [],
                extra_feature_sections: [],
                category: '',
                tech_specs_markdown: '',
                policies: [],
                gallery: [],
                hero_banner_url: '',
                subtitle: '',
                tagline: '',
                homepage_specs: { range: '', charge_time: '', segment: '' },
                sale_status: 'available',
                brochure_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreviewUrl(null);
        setHeroBannerFile(null);
        if (heroBannerPreviewUrl) URL.revokeObjectURL(heroBannerPreviewUrl);
        setHeroBannerPreviewUrl(null);
        setGalleryFiles([]);
        setImagesToDelete([]);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); // memory cleanup
        galleryPreviewUrls.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        setGalleryPreviewUrls([]);
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { name: '', price: 0, note: '', is_popular: false }]
        });
    };

    const removeVariant = (index: number) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index)
        });
    };

    const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let newThumbnailUrl = editingProduct?.thumbnail_url || null;

            // Xử lý upload ảnh mới
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                // Sử dụng slug hiện tại hoặc được tự động sinh làm tên gốc cho file
                const baseSlug = formData.slug || generateSlug(formData.name);
                uploadFormData.append('slug', baseSlug);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.error || 'Lỗi hệ thống khi upload ảnh.');
                }
                const { url } = await uploadRes.json();
                if (editingProduct?.thumbnail_url) {
                    queueImageForDeletion(editingProduct.thumbnail_url);
                }
                newThumbnailUrl = url;
            } else if (formData.thumbnail_url && formData.thumbnail_url !== resolveImageUrl(editingProduct?.thumbnail_url || '')) {
                // Người dùng nhập URL mới trực tiếp vào ô input
                if (editingProduct?.thumbnail_url) {
                    queueImageForDeletion(editingProduct.thumbnail_url);
                }
                newThumbnailUrl = resolveImageUrl(formData.thumbnail_url);
            }

            // Xử lý upload Gallery
            // Note: Ensure the API endpoint saves strictly to bucket 'images', folder 'products' (e.g. images/products/{filename})
            let updatedGallery = galleryPreviewUrls.filter(url => !url.startsWith('blob:'));
            if (galleryFiles.length > 0) {
                for (let i = 0; i < galleryFiles.length; i++) {
                    const gFile = galleryFiles[i];
                    const gFormData = new FormData();
                    gFormData.append('file', gFile);
                    gFormData.append('slug', `${formData.slug || generateSlug(formData.name)}-gallery-${Date.now()}-${i}`);

                    const gUploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: gFormData
                    });

                    if (gUploadRes.ok) {
                        const { url } = await gUploadRes.json();
                        updatedGallery.push(url);
                    }
                }
            }

            // Xử lý upload Hero Banner
            let updatedHeroBannerUrl = formData.hero_banner_url || '';
            if (heroBannerFile) {
                const hFormData = new FormData();
                hFormData.append('file', heroBannerFile);
                hFormData.append('slug', `${formData.slug || generateSlug(formData.name)}-hero`);
                hFormData.append('folder', 'products');

                const hRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: hFormData
                });

                if (hRes.ok) {
                    const { url } = await hRes.json();
                    updatedHeroBannerUrl = url;
                }
            }

            const payload = {
                ...(editingProduct?.id ? { id: editingProduct.id } : {}),
                name: formData.name,
                slug: formData.slug,
                excerpt: formData.excerpt,
                is_featured: formData.is_featured,
                thumbnail_url: newThumbnailUrl || null,
                category: formData.category || null,
                policies: formData.policies.filter(p => p.trim() !== ''),
                gallery: updatedGallery,
                hero_banner_url: updatedHeroBannerUrl,
                subtitle: formData.subtitle,
                variants: formData.variants,
                features_carousel: formData.features_carousel,
                extra_features_carousel: formData.extra_features_carousel,
                feature_sections: formData.feature_sections,
                extra_feature_sections: formData.extra_feature_sections,
                tech_specs_markdown: formData.tech_specs_markdown,
                tagline: formData.tagline || null,
                homepage_specs: formData.homepage_specs,
                sale_status: formData.sale_status || null,
                brochure_url: formData.brochure_url || null
            };

            const { error } = await supabase
                .from('products')
                .upsert(payload, { onConflict: 'id' });

            if (error) throw error;

            // Delete queued images from Supabase storage
            if (imagesToDelete.length > 0) {
                const { error: removeError } = await supabase.storage.from('images').remove(imagesToDelete);
                if (removeError) {
                    console.error("Failed to delete old images:", removeError);
                }
                setImagesToDelete([]);
            }

            fetchProducts();
            handleCloseModal();
            showNotification('success', 'Sản phẩm đã được lưu thành công');
        } catch (error) {
            const e = error as Error & { details?: string };
            console.error('Lỗi chi tiết:', e.message, e.details);
            showNotification('error', `Lỗi khi lưu sản phẩm: ${e.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicate = async (product: Product) => {
        if (!window.confirm(`Bạn có chắc chắn muốn sao chép sản phẩm "${product.name}"?`)) return;

        setLoading(true);
        try {
            const { data: fullProduct, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('id', product.id)
                .single();

            if (fetchError) throw fetchError;

            // Loại bỏ id và created_at
            const { id, created_at, ...productData } = fullProduct;

            const payload = {
                ...productData,
                name: `${productData.name} (Bản sao)`,
                slug: `${productData.slug}-copy-${Date.now()}`
            };

            const { error: insertError } = await supabase
                .from('products')
                .insert([payload]);

            if (insertError) throw insertError;

            showNotification('success', 'Sao chép sản phẩm thành công');
            fetchProducts();
        } catch (error) {
            console.error('Error duplicating product:', error);
            const e = error as Error;
            showNotification('error', `Lỗi khi sao chép: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            showNotification('success', 'Đã xóa sản phẩm');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            const e = error as Error;
            showNotification('error', `Lỗi khi xóa: ${e.message}`);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`)) return;

        try {
            setLoading(true);
            const { error } = await supabase.from('products').delete().in('id', selectedIds);
            if (error) throw error;
            showNotification('success', `Đã xóa ${selectedIds.length} sản phẩm`);
            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting products:', error);
            const e = error as Error;
            showNotification('error', `Lỗi khi xóa: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSetFeatured = async (isFeatured: boolean) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('products')
                .update({ is_featured: isFeatured })
                .in('id', selectedIds);

            if (error) throw error;
            showNotification('success', `Đã cập nhật trạng thái nổi bật cho ${selectedIds.length} sản phẩm`);
            fetchProducts();
        } catch (error) {
            console.error('Error updating products:', error);
            const e = error as Error;
            showNotification('error', `Lỗi khi cập nhật trạng thái: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelectProduct = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getImageUrl = (product: Product) => {
        let url = product.thumbnail_url;
        if (url) {
            // Strict normalization: ensure /images/products/ prefix if it's a relative path lacking it
            if (url.startsWith('/') && !url.startsWith('/images/products/')) {
                url = `/images/products/${url.split('/').pop()}`;
            }
            return url;
        }
        return '/images/placeholder.webp';
    };

    return (
        <div className="space-y-6 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 text-white animate-fade-in-down ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản Phẩm</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên xe, slug..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-vinfast-blue text-white rounded hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm Xe Mới</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-4 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold border-b w-10 text-center">
                                        <button onClick={toggleSelectAll} className="flex items-center justify-center w-full focus:outline-none">
                                            {products.length > 0 && selectedIds.length === products.length ? (
                                                <CheckSquare className="w-5 h-5 text-vinfast-blue" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 font-semibold border-b w-24">Hình ảnh</th>
                                    <th className="px-6 py-4 font-semibold border-b">Tên Xe & Tình Trạng</th>
                                    <th className="px-6 py-4 font-semibold border-b">Giá Xe (VNĐ)</th>
                                    <th className="px-6 py-4 font-semibold border-b">Thông số kỹ thuật</th>
                                    <th className="px-6 py-4 font-semibold border-b text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="w-12 h-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-700 mb-1">
                                                    {debouncedSearchTerm ? 'Không tìm thấy kết quả' : 'Chưa có sản phẩm nào'}
                                                </p>
                                                <p className="text-sm">
                                                    {debouncedSearchTerm
                                                        ? `Không có xe nào phù hợp với từ khóa "${debouncedSearchTerm}"`
                                                        : 'Hãy thêm sản phẩm đầu tiên của bạn vào hệ thống.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => {
                                        const isSelected = selectedIds.includes(product.id);
                                        return (
                                            <tr key={product.id} className={`hover:bg-gray-50 transition-colors group ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                                <td className="px-6 py-3 text-center">
                                                    <button onClick={() => toggleSelectProduct(product.id)} className="flex items-center justify-center w-full focus:outline-none">
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-vinfast-blue" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="relative h-14 w-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                                                        <Image
                                                            src={getImageUrl(product)}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/placeholder.webp';
                                                                target.srcset = '';
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-base">{product.name}</div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-gray-500 text-xs">/{product.slug}</span>
                                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-full ${product.is_featured ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                            }`}>
                                                            {product.is_featured ? 'Nổi bật' : 'Thường'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-vinfast-blue text-base">
                                                    {product.variants && product.variants.length > 0 ? (
                                                        <div className="text-sm">
                                                            Giá từ: {new Intl.NumberFormat('vi-VN').format(Math.min(...product.variants.map(v => v.price)))} ₫
                                                            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">({product.variants.length} phiên bản)</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic font-normal">Chưa có giá</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {product.variants && product.variants.length > 0 ? (
                                                            <>
                                                                {product.variants.slice(0, 2).map((v, i) => (
                                                                    <div key={i} className="flex items-center gap-1">
                                                                        <span className="text-gray-500 truncate max-w-[80px]">{v.name}:</span>
                                                                        <span className="font-medium text-gray-700">{new Intl.NumberFormat('vi-VN').format(v.price)} ₫</span>
                                                                    </div>
                                                                ))}
                                                                {product.variants.length > 2 && (
                                                                    <div className="text-[10px] text-gray-400 italic">... và {product.variants.length - 2} bản khác</div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 italic">N/A</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => handleDuplicate(product)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors tooltip"
                                                            title="Sao chép"
                                                        >
                                                            <Copy className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenModal(product)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors tooltip"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalProducts > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}</span> trong số <span className="font-semibold text-gray-900">{totalProducts}</span> sản phẩm
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">
                                Trang {currentPage} / {Math.ceil(totalProducts / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalProducts / ITEMS_PER_PAGE), p + 1))}
                                disabled={currentPage === Math.ceil(totalProducts / ITEMS_PER_PAGE)}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:ml-32 z-40 bg-white border border-gray-200 shadow-2xl rounded-lg px-6 py-4 flex items-center gap-6 animate-fade-in-up">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded w-8 h-8 flex items-center justify-center">
                            {selectedIds.length}
                        </div>
                        <span className="text-gray-600 font-medium">sản phẩm được chọn</span>
                    </div>

                    <div className="h-8 w-px bg-gray-200"></div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa đã chọn
                        </button>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <button
                            onClick={() => handleBulkSetFeatured(true)}
                            className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded transition-colors text-sm font-medium"
                        >
                            <Star className="w-4 h-4" />
                            Đặt Nổi bật
                        </button>

                        <button
                            onClick={() => handleBulkSetFeatured(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
                        >
                            <StarOff className="w-4 h-4" />
                            Bỏ Nổi bật
                        </button>

                        {selectedIds.length === 1 && (
                            <>
                                <div className="h-6 w-px bg-gray-200"></div>
                                <button
                                    onClick={() => {
                                        const productToEdit = products.find(p => p.id === selectedIds[0]);
                                        if (productToEdit) handleOpenModal(productToEdit);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Sửa
                                </button>
                            </>
                        )}

                        <div className="h-6 w-px bg-gray-200"></div>

                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            title="Bỏ chọn"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
                    style={{ fontFamily: 'var(--font-be-vietnam-pro, "Be Vietnam Pro", sans-serif)' }}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingProduct ? 'Chỉnh sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="product-form" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Tên xe <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => {
                                                const newName = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    name: newName,
                                                    // Auto-generate slug cho Thêm mới hoặc nếu đang nhập tên
                                                    slug: !editingProduct || formData.slug === generateSlug(formData.name) ? generateSlug(newName) : formData.slug
                                                });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="VD: VinFast VF 5 Plus"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Slug (Đường dẫn) <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="VD: vf-5-plus"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-4 border-t border-gray-100 pt-5">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Phiên bản & Giá bán</h4>
                                            <button
                                                type="button"
                                                onClick={addVariant}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-vinfast-blue hover:bg-blue-100 rounded-md transition-colors text-xs font-bold"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Thêm phiên bản
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.variants.length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    Chưa có phiên bản nào. Nhấn "Thêm phiên bản" để bắt đầu.
                                                </p>
                                            )}
                                            {formData.variants.map((variant, index) => (
                                                <div key={index} className="flex flex-col gap-3 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group relative">
                                                    <div className="flex gap-3 items-end">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên phiên bản</label>
                                                            <input
                                                                type="text"
                                                                value={variant.name}
                                                                onChange={e => updateVariant(index, 'name', e.target.value)}
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                                placeholder="VD: VF 7 Plus"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá bán (VNĐ)</label>
                                                            <input
                                                                type="number"
                                                                value={variant.price}
                                                                onChange={e => updateVariant(index, 'price', Number(e.target.value))}
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                                placeholder="VD: 1199000000"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(index)}
                                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Xóa phiên bản"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-4 items-center pl-1">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ghi chú (Note)</label>
                                                            <input
                                                                type="text"
                                                                value={variant.note || ''}
                                                                onChange={e => updateVariant(index, 'note', e.target.value)}
                                                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-xs"
                                                                placeholder="VD: Bản nâng cao, nhiều trang bị..."
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer pt-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={variant.is_popular || false}
                                                                onChange={e => updateVariant(index, 'is_popular', e.target.checked)}
                                                                className="w-4 h-4 text-vinfast-blue border-gray-300 rounded focus:ring-vinfast-blue"
                                                            />
                                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">Mẫu phổ biến</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-gray-700">Nhóm xe (Category) <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white"
                                        >
                                            <option value="" disabled>-- Chọn nhóm xe --</option>
                                            <option value="dong_co_dien">Dòng xe động cơ điện (dong_co_dien)</option>
                                            <option value="dich_vu">Dòng xe dịch vụ (dich_vu)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-gray-700">Trạng thái bán hàng (Sale Status) <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            value={formData.sale_status}
                                            onChange={e => setFormData({ ...formData, sale_status: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white"
                                        >
                                            <option value="available">Sẵn sàng bàn giao</option>
                                            <option value="booking">Đặt cọc trước</option>
                                            <option value="coming_soon">Sắp ra mắt</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Tagline (Chọn phiên bản)</label>
                                        <input
                                            type="text"
                                            value={formData.tagline}
                                            onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="e.g., Khơi nguồn bản lĩnh, công nghệ tương lai"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-4 border-t border-gray-100 pt-4">
                                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Thông số kỹ thuật (Card product)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-600">Quãng đường sạc (range)</label>
                                                <input
                                                    type="text"
                                                    value={formData.homepage_specs.range}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        homepage_specs: { ...formData.homepage_specs, range: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                    placeholder="e.g., 431 km"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-600">Thời gian sạc (charge_time)</label>
                                                <input
                                                    type="text"
                                                    value={formData.homepage_specs.charge_time}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        homepage_specs: { ...formData.homepage_specs, charge_time: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                    placeholder="e.g., 24 phút (10-80%)"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-600">Phân khúc xe (segment)</label>
                                                <input
                                                    type="text"
                                                    value={formData.homepage_specs.segment}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        homepage_specs: { ...formData.homepage_specs, segment: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                    placeholder="e.g., C-SUV or Xe Taxi/Vận tải"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-center pt-6 md:col-span-2">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={formData.is_featured}
                                                    onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                                />
                                                <div className={`block w-11 h-6 rounded-full transition-colors ${formData.is_featured ? 'bg-vinfast-blue' : 'bg-gray-300'}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_featured ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Sản phẩm nổi bật</span>
                                        </label>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Mô tả ngắn (Carousel màu xe)</label>
                                        <textarea
                                            value={formData.excerpt}
                                            onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="VD: Nhập một câu ngắn gọn, thu hút để giới thiệu tổng quan về dòng xe này."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Slogan - Banner đầu trang</label>
                                        <textarea
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="VD: Nhập một đoạn mô tả chi tiết hơn về các ưu điểm nổi bật."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Link Brochure (Google Drive PDF)</label>
                                        <input
                                            type="text"
                                            value={formData.brochure_url}
                                            onChange={e => setFormData({ ...formData, brochure_url: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="https://drive.google.com/file/d/..."
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2 flex gap-6 items-start bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-gray-800 block">Tải ảnh sản phẩm lên (Thumbnail)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2.5 file:px-4
                                                        file:rounded-md file:border-0
                                                        file:text-sm file:font-bold
                                                        file:bg-vinfast-blue file:text-white
                                                        hover:file:bg-blue-800 transition-colors cursor-pointer outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <div className="h-px bg-gray-300 flex-1"></div>
                                                <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">hoặc nhập id / url có sẵn</span>
                                                <div className="h-px bg-gray-300 flex-1"></div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <input
                                                    type="text"
                                                    value={formData.thumbnail_url}
                                                    onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm disabled:opacity-50 disabled:bg-gray-100"
                                                    placeholder="VD: https://xxxx.supabase.co/storage/v1/object/public/images/..."
                                                    disabled={!!imageFile}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm group">
                                            <Image
                                                src={
                                                    imagePreviewUrl
                                                        ? imagePreviewUrl
                                                        : formData.thumbnail_url
                                                            ? resolveImageUrl(formData.thumbnail_url)
                                                            : `/images/products/${formData.slug || 'placeholder'}.webp`
                                                }
                                                alt="Preview"
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                                unoptimized
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/images/placeholder.webp';
                                                    target.srcset = '';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Hero Banner Upload Section */}
                                    <div className="space-y-1.5 md:col-span-2 flex gap-6 items-start bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-gray-800 block">Ảnh Bìa (Hero Banner) - Tỷ lệ ngang 16:9</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleHeroBannerChange}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2.5 file:px-4
                                                        file:rounded-md file:border-0
                                                        file:text-sm file:font-bold
                                                        file:bg-vinfast-blue file:text-white
                                                        hover:file:bg-blue-800 transition-colors cursor-pointer outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <div className="h-px bg-gray-300 flex-1"></div>
                                                <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">hoặc nhập url có sẵn</span>
                                                <div className="h-px bg-gray-300 flex-1"></div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <input
                                                    type="text"
                                                    value={formData.hero_banner_url}
                                                    onChange={e => setFormData({ ...formData, hero_banner_url: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm disabled:opacity-50 disabled:bg-gray-100"
                                                    placeholder="VD: https://xxxx.supabase.co/storage/v1/object/public/images/..."
                                                    disabled={!!heroBannerFile}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-48 h-28 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm group">
                                            <Image
                                                src={
                                                    heroBannerPreviewUrl
                                                        ? heroBannerPreviewUrl
                                                        : formData.hero_banner_url
                                                            ? formData.hero_banner_url
                                                            : '/images/placeholder.webp'
                                                }
                                                alt="Hero Preview"
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                                unoptimized
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/images/placeholder.webp';
                                                    target.srcset = '';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Gallery Upload Section */}
                                    <div className="space-y-1.5 md:col-span-2 flex flex-col gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-2">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-sm font-bold text-gray-800 block">Bộ sưu tập ảnh (Gallery)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleGalleryChange}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2.5 file:px-4
                                                    file:rounded-md file:border-0
                                                    file:text-sm file:font-bold
                                                    file:bg-vinfast-blue file:text-white
                                                    hover:file:bg-blue-800 transition-colors cursor-pointer outline-none"
                                            />
                                            <p className="text-xs text-gray-500 italic mt-1">Lưu ý: Ảnh sẽ được tự động lưu vào bucket images, thư mục products.</p>
                                        </div>
                                        {/* Gallery Preview Grid */}
                                        {galleryPreviewUrls.length > 0 && (
                                            <div className="flex flex-wrap gap-4 mt-4">
                                                {galleryPreviewUrls.map((url, idx) => (
                                                    <div key={idx} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                                        <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeGalleryImage(idx, url)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Xóa ảnh"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>



                                {/* FEATURE CAROUSEL SECTION */}
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200">
                                        <div className="flex flex-col gap-4 mb-6">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-black text-[#152B4D] uppercase tracking-wider">Cấu hình Feature Carousel</h4>
                                                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm cursor-pointer ${isAddingFeature ? 'bg-gray-100 text-gray-400' : 'bg-vinfast-blue text-white hover:bg-blue-800'}`}>
                                                    {isAddingFeature ? (
                                                        <>
                                                            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                            Đang xử lý...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Thêm ảnh tính năng
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        disabled={isAddingFeature}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFeatureImageUpload(file);
                                                            e.target.value = ''; // Reset input
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tiêu đề Carousel</label>
                                                <input
                                                    type="text"
                                                    value={formData.features_carousel.title}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        features_carousel: { ...formData.features_carousel, title: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm font-medium"
                                                    placeholder="VD: Tính năng nổi bật trên VinFast VF 7"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.features_carousel.items.length === 0 ? (
                                                <div className="text-sm text-gray-400 italic text-center py-8 bg-white/50 rounded-xl border border-dashed border-gray-200">
                                                    Chưa có ảnh tính năng nào. Nhấn "Thêm ảnh tính năng" để bắt đầu.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {formData.features_carousel.items.map((item, index) => (
                                                        <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group animate-fade-in">
                                                            <div className="flex gap-4 items-start">
                                                                {/* Thumbnail Preview / Upload */}
                                                                <div className="w-24 h-24 shrink-0 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group/thumb">
                                                                    {uploadingIndexes.includes(index) ? (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-5 h-5 border-2 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                                                                            <span className="text-[10px] font-bold text-vinfast-blue">Đang tải...</span>
                                                                        </div>
                                                                    ) : item.url ? (
                                                                        <>
                                                                            <Image
                                                                                src={item.url}
                                                                                alt={`Feature ${index}`}
                                                                                fill
                                                                                className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                                                                                unoptimized
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white backdrop-blur-sm">
                                                                                    <Upload size={16} />
                                                                                    <input
                                                                                        type="file"
                                                                                        className="sr-only"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) handleFeatureImageUpload(file, index);
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-2">
                                                                            <Upload size={20} className="text-gray-400" />
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tải ảnh lên</span>
                                                                            <input
                                                                                type="file"
                                                                                className="sr-only"
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) handleFeatureImageUpload(file, index);
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 grid grid-cols-1 gap-4">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL Hình ảnh (Tự động khi upload)</label>
                                                                        <input
                                                                            type="text"
                                                                            readOnly
                                                                            value={item.url}
                                                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-xs cursor-not-allowed"
                                                                            placeholder="Chọn ảnh bên trái để tải lên..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Văn bản hiển thị (Không bắt buộc)</label>
                                                                        <textarea
                                                                            value={item.text || ''}
                                                                            onChange={e => {
                                                                                const newItems = [...formData.features_carousel.items];
                                                                                newItems[index].text = e.target.value;
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    features_carousel: { ...formData.features_carousel, items: newItems }
                                                                                });
                                                                            }}
                                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm"
                                                                            placeholder="Ví dụ: Hệ thống trần kính toàn cảnh hiện đại"
                                                                            rows={2}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
                                                                        // Lấy ra URL của cái ảnh ở vị trí sắp bị xóa
                                                                        const urlToDelete = formData.features_carousel.items[index].url;

                                                                        // Nếu có link ảnh, ném nó vào danh sách chờ xóa
                                                                        if (urlToDelete) {
                                                                            queueImageForDeletion(urlToDelete);
                                                                        }
                                                                        // --- KẾT THÚC ĐOẠN THÊM VÀO ---

                                                                        // Đoạn code cũ của bạn (Xóa khỏi giao diện)
                                                                        const newItems = formData.features_carousel.items.filter((_, i) => i !== index);
                                                                        setFormData({
                                                                            ...formData,
                                                                            features_carousel: { ...formData.features_carousel, items: newItems }
                                                                        });
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 mt-1"
                                                                    title="Xóa item này"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>



                                {/* DETAILED FEATURE SECTIONS */}
                                <div className="pt-8 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h4 className="text-base font-black text-[#152B4D] uppercase tracking-wider">Thông Tin Tính Năng Chi Tiết</h4>
                                            <p className="text-xs text-gray-500 mt-1">Cấu hình các khối nội dung đánh giá chi tiết sản phẩm</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                feature_sections: [...formData.feature_sections, { title: '', items: [] }]
                                            })}
                                            className="flex items-center gap-2 px-4 py-2 bg-vinfast-blue text-white hover:bg-blue-800 rounded-xl transition-all text-sm font-bold shadow-md active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm Section Mới
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        {formData.feature_sections.length === 0 ? (
                                            <div className="py-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                    <Settings2 className="text-gray-300 w-8 h-8" />
                                                </div>
                                                <p className="text-gray-400 font-medium max-w-xs">Chưa có section chi tiết nào. Hãy bắt đầu xây dựng nội dung cho Landing Page.</p>
                                            </div>
                                        ) : (
                                            formData.feature_sections.map((section, sIdx) => (
                                                <div key={sIdx} className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-100/50 overflow-hidden animate-fade-in">
                                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="bg-vinfast-blue text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                                                                {sIdx + 1}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={section.title}
                                                                onChange={e => {
                                                                    const newSections = [...formData.feature_sections];
                                                                    newSections[sIdx].title = e.target.value;
                                                                    setFormData({ ...formData, feature_sections: newSections });
                                                                }}
                                                                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold text-[#152B4D] placeholder:text-gray-300"
                                                                placeholder="Nhập tiêu đề Section (VD: Thiết kế ngoại thất)"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSections = [...formData.feature_sections];
                                                                    newSections[sIdx].items.push({ url: '', text: '' });
                                                                    setFormData({ ...formData, feature_sections: newSections });
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-vinfast-blue hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Thêm Item
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSections = formData.feature_sections.filter((_, i) => i !== sIdx);
                                                                    setFormData({ ...formData, feature_sections: newSections });
                                                                }}
                                                                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                                                                title="Xóa Section"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 space-y-4">
                                                        {section.items.length === 0 ? (
                                                            <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                                Chưa có item nào trong section này.
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {section.items.map((item, iIdx) => (
                                                                    <div key={iIdx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-5 relative group">
                                                                        {/* Section Item Image Upload */}
                                                                        <div className="w-40 h-28 shrink-0 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group/thumb">
                                                                            {uploadingSectionItems.includes(`${sIdx}-${iIdx}`) ? (
                                                                                <div className="flex flex-col items-center gap-2">
                                                                                    <div className="w-5 h-5 border-2 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                                                                                    <span className="text-[10px] font-bold text-vinfast-blue">Đang tải...</span>
                                                                                </div>
                                                                            ) : item.url ? (
                                                                                <>
                                                                                    <Image
                                                                                        src={item.url}
                                                                                        alt={`Detail ${sIdx}-${iIdx}`}
                                                                                        fill
                                                                                        className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                                                                                        unoptimized
                                                                                    />
                                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                                        <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white backdrop-blur-sm">
                                                                                            <Upload size={16} />
                                                                                            <input
                                                                                                type="file"
                                                                                                className="sr-only"
                                                                                                accept="image/*"
                                                                                                onChange={(e) => {
                                                                                                    const file = e.target.files?.[0];
                                                                                                    if (file) handleSectionItemImageUpload(sIdx, iIdx, file);
                                                                                                }}
                                                                                            />
                                                                                        </label>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-2">
                                                                                    <Upload size={20} className="text-gray-400" />
                                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tải ảnh lên</span>
                                                                                    <input
                                                                                        type="file"
                                                                                        className="sr-only"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) handleSectionItemImageUpload(sIdx, iIdx, file);
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex-1 space-y-3">
                                                                            <div className="space-y-1.5">
                                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nội dung văn bản</label>
                                                                                <textarea
                                                                                    value={item.text}
                                                                                    onChange={e => {
                                                                                        const newSections = [...formData.feature_sections];
                                                                                        newSections[sIdx].items[iIdx].text = e.target.value;
                                                                                        setFormData({ ...formData, feature_sections: newSections });
                                                                                    }}
                                                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm leading-relaxed"
                                                                                    placeholder="Nhập nội dung chi tiết cho tính năng này..."
                                                                                    rows={3}
                                                                                />
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-400 italic truncate max-w-md">URL: {item.url || 'Chưa có ảnh'}</div>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newSections = [...formData.feature_sections];

                                                                                // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
                                                                                // Chụp lấy URL của item chuẩn bị bị xóa
                                                                                const imageToDelete = newSections[sIdx].items[iIdx].url;
                                                                                if (imageToDelete) {
                                                                                    queueImageForDeletion(imageToDelete);
                                                                                }

                                                                                newSections[sIdx].items = newSections[sIdx].items.filter((_, i) => i !== iIdx);
                                                                                setFormData({ ...formData, feature_sections: newSections });
                                                                            }}
                                                                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                            title="Xóa Item"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {/* EXTRA FEATURE CAROUSEL SECTION */}
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100">
                                        <div className="flex flex-col gap-4 mb-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="text-sm font-black text-[#152B4D] uppercase tracking-wider">Cấu hình Carousel Phụ (Dưới cùng)</h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">Sử dụng cho các hình ảnh bổ sung ở cuối trang</p>
                                                </div>
                                                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold shadow-sm cursor-pointer ${isAddingExtraFeature ? 'bg-gray-100 text-gray-400' : 'bg-vinfast-blue text-white hover:bg-blue-800'}`}>
                                                    {isAddingExtraFeature ? (
                                                        <>
                                                            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                            Đang xử lý...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Thêm ảnh phụ
                                                        </>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        disabled={isAddingExtraFeature}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleExtraFeatureImageUpload(file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tiêu đề Carousel Phụ</label>
                                                <input
                                                    type="text"
                                                    value={formData.extra_features_carousel.title}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        extra_features_carousel: { ...formData.extra_features_carousel, title: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm font-medium"
                                                    placeholder="VD: Hình ảnh thực tế / Màu sắc đa dạng"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.extra_features_carousel.items.length === 0 ? (
                                                <div className="text-sm text-gray-400 italic text-center py-8 bg-white/50 rounded-xl border border-dashed border-gray-200">
                                                    Chưa có ảnh phụ nào.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {formData.extra_features_carousel.items.map((item, index) => (
                                                        <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group animate-fade-in">
                                                            <div className="flex gap-4 items-start">
                                                                <div className="w-24 h-24 shrink-0 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group/thumb">
                                                                    {uploadingExtraIndexes.includes(index) ? (
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <div className="w-5 h-5 border-2 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                                                                            <span className="text-[10px] font-bold text-vinfast-blue">Đang tải...</span>
                                                                        </div>
                                                                    ) : item.url ? (
                                                                        <>
                                                                            <Image
                                                                                src={item.url}
                                                                                alt={`Extra Feature ${index}`}
                                                                                fill
                                                                                className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                                                                                unoptimized
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white backdrop-blur-sm">
                                                                                    <Upload size={16} />
                                                                                    <input
                                                                                        type="file"
                                                                                        className="sr-only"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) handleExtraFeatureImageUpload(file, index);
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-2">
                                                                            <Upload size={20} className="text-gray-400" />
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tải ảnh</span>
                                                                            <input
                                                                                type="file"
                                                                                className="sr-only"
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) handleExtraFeatureImageUpload(file, index);
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 grid grid-cols-1 gap-4">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL Hình ảnh</label>
                                                                        <input
                                                                            type="text"
                                                                            readOnly
                                                                            value={item.url}
                                                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-xs cursor-not-allowed"
                                                                            placeholder="Chọn ảnh để tải lên..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Văn bản hiển thị (Không bắt buộc)</label>
                                                                        <textarea
                                                                            value={item.text || ''}
                                                                            onChange={e => {
                                                                                const newItems = [...formData.extra_features_carousel.items];
                                                                                newItems[index].text = e.target.value;
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    extra_features_carousel: { ...formData.extra_features_carousel, items: newItems }
                                                                                });
                                                                            }}
                                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm"
                                                                            placeholder="Nhập nội dung hiển thị trên ảnh..."
                                                                            rows={2}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
                                                                        // Chụp lấy URL của item chuẩn bị bị xóa
                                                                        const urlToDelete = formData.extra_features_carousel.items[index].url;
                                                                        if (urlToDelete) {
                                                                            queueImageForDeletion(urlToDelete);
                                                                        }
                                                                        // --- KẾT THÚC ĐOẠN THÊM VÀO ---

                                                                        // Code cũ của bạn để xóa item khỏi giao diện
                                                                        const newItems = formData.extra_features_carousel.items.filter((_, i) => i !== index);
                                                                        setFormData({
                                                                            ...formData,
                                                                            extra_features_carousel: { ...formData.extra_features_carousel, items: newItems }
                                                                        });
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 mt-1"
                                                                    title="Xóa item"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* EXTRA DETAILED FEATURE SECTIONS */}
                                <div className="pt-8 border-t border-gray-100">
                                    <div className="bg-blue-50/20 p-6 rounded-[2rem] border border-blue-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h4 className="text-base font-black text-[#152B4D] uppercase tracking-wider">Thông Tin Chi Tiết Phụ (Dưới cùng)</h4>
                                                <p className="text-xs text-gray-500 mt-1">Sử dụng cho các khối nội dung bổ sung ở phần cuối trang</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    extra_feature_sections: [...formData.extra_feature_sections, { title: '', items: [] }]
                                                })}
                                                className="flex items-center gap-2 px-4 py-2 bg-vinfast-blue text-white hover:bg-blue-800 rounded-xl transition-all text-sm font-bold shadow-md active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Thêm Section Phụ
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {formData.extra_feature_sections.length === 0 ? (
                                                <div className="py-12 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6">
                                                    <p className="text-gray-400 font-medium max-w-xs">Chưa có section phụ nào.</p>
                                                </div>
                                            ) : (
                                                formData.extra_feature_sections.map((section, sIdx) => (
                                                    <div key={sIdx} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs">
                                                                    {sIdx + 1}
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={section.title}
                                                                    onChange={e => {
                                                                        const newSections = [...formData.extra_feature_sections];
                                                                        newSections[sIdx].title = e.target.value;
                                                                        setFormData({ ...formData, extra_feature_sections: newSections });
                                                                    }}
                                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold text-[#152B4D] placeholder:text-gray-300"
                                                                    placeholder="Nhập tiêu đề Section Phụ"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = [...formData.extra_feature_sections];
                                                                        newSections[sIdx].items.push({ url: '', text: '' });
                                                                        setFormData({ ...formData, extra_feature_sections: newSections });
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-vinfast-blue hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" /> Thêm Item
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSections = formData.extra_feature_sections.filter((_, i) => i !== sIdx);
                                                                        setFormData({ ...formData, extra_feature_sections: newSections });
                                                                    }}
                                                                    className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 space-y-4">
                                                            {section.items.length === 0 ? (
                                                                <p className="text-sm text-gray-400 italic text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                                    Chưa có item nào.
                                                                </p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {section.items.map((item, iIdx) => (
                                                                        <div key={iIdx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-5 relative group">
                                                                            <div className="w-40 h-28 shrink-0 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group/thumb">
                                                                                {uploadingExtraSectionItems.includes(`${sIdx}-${iIdx}`) ? (
                                                                                    <div className="flex flex-col items-center gap-2">
                                                                                        <div className="w-5 h-5 border-2 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                                                                                        <span className="text-[10px] font-bold text-vinfast-blue">Đang tải...</span>
                                                                                    </div>
                                                                                ) : item.url ? (
                                                                                    <>
                                                                                        {item.url.match(/\.(mp4|webm|mov)$/) || item.url.includes('video') ? (
                                                                                            <video
                                                                                                src={item.url}
                                                                                                className="w-full h-full object-cover"
                                                                                                autoPlay
                                                                                                muted
                                                                                                loop
                                                                                                playsInline
                                                                                            />
                                                                                        ) : (
                                                                                            <Image
                                                                                                src={item.url}
                                                                                                alt={`Extra Detail ${sIdx}-${iIdx}`}
                                                                                                fill
                                                                                                className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                                                                                                unoptimized
                                                                                            />
                                                                                        )}
                                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white backdrop-blur-sm">
                                                                                                <Upload size={16} />
                                                                                                <input
                                                                                                    type="file"
                                                                                                    className="sr-only"
                                                                                                    accept="image/*,video/mp4,video/webm"
                                                                                                    onChange={(e) => {
                                                                                                        const file = e.target.files?.[0];
                                                                                                        if (file) handleExtraSectionItemImageUpload(sIdx, iIdx, file);
                                                                                                    }}
                                                                                                />
                                                                                            </label>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-2">
                                                                                        <Upload size={20} className="text-gray-400" />
                                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tải ảnh/video</span>
                                                                                        <input
                                                                                            type="file"
                                                                                            className="sr-only"
                                                                                            accept="image/*,video/mp4,video/webm"
                                                                                            onChange={(e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) handleExtraSectionItemImageUpload(sIdx, iIdx, file);
                                                                                            }}
                                                                                        />
                                                                                    </label>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 space-y-3">
                                                                                <div className="space-y-1.5">
                                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nội dung văn bản</label>
                                                                                    <textarea
                                                                                        value={item.text}
                                                                                        onChange={e => {
                                                                                            const newSections = [...formData.extra_feature_sections];
                                                                                            newSections[sIdx].items[iIdx].text = e.target.value;
                                                                                            setFormData({ ...formData, extra_feature_sections: newSections });
                                                                                        }}
                                                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all text-sm leading-relaxed"
                                                                                        placeholder="Nhập nội dung chi tiết..."
                                                                                        rows={3}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    // --- BẮT ĐẦU ĐOẠN THÊM VÀO ---
                                                                                    // 1. Lấy ra cái Section chuẩn bị bị "trảm"
                                                                                    const sectionToDelete = formData.extra_feature_sections[sIdx];

                                                                                    // 2. Chạy vòng lặp qua tất cả các items bên trong nó, thấy ảnh nào thì ném vào thùng rác
                                                                                    if (sectionToDelete && sectionToDelete.items) {
                                                                                        sectionToDelete.items.forEach(item => {
                                                                                            if (item.url) {
                                                                                                queueImageForDeletion(item.url);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                    // --- KẾT THÚC ĐOẠN THÊM VÀO ---

                                                                                    // 3. Code cũ của bạn: Xóa Section đó khỏi giao diện
                                                                                    const newSections = formData.extra_feature_sections.filter((_, i) => i !== sIdx);
                                                                                    setFormData({ ...formData, extra_feature_sections: newSections });
                                                                                }}
                                                                                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                                title="Xóa item này"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* TECH SPECS MARKDOWN */}
                                <div className="pt-8 border-t border-gray-100">
                                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h4 className="text-base font-black text-[#152B4D] uppercase tracking-wider">Thông Số Kỹ Thuật (Markdown)</h4>
                                                <p className="text-xs text-gray-500 mt-1">Sử dụng định dạng Markdown để tạo bảng thông số chi tiết</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={formData.tech_specs_markdown}
                                            onChange={e => setFormData({ ...formData, tech_specs_markdown: e.target.value })}
                                            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-vinfast-blue/20 focus:border-vinfast-blue transition-all font-mono text-sm leading-relaxed"
                                            placeholder="| Tổng quan sự khác biệt | VF 7 Eco | VF 7 Plus |\n| :--- | :--- | :--- |\n| Chiều dài cơ sở (mm) | 2.840 | 2.840 |"
                                            rows={10}
                                        />
                                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <div className="bg-blue-600 text-white p-1 rounded-full shrink-0">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                            </div>
                                            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                                Mẹo: Bạn có thể copy bảng thông số từ Excel hoặc Word và sử dụng các công cụ "Excel to Markdown" trực tuyến để nhanh chóng tạo nội dung cho phần này.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* policies */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Chính sách ưu đãi</h4>
                                    <div className="space-y-3">
                                        {formData.policies.map((policy, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={policy}
                                                    onChange={(e) => {
                                                        const newPolicies = [...formData.policies];
                                                        newPolicies[index] = e.target.value;
                                                        setFormData({ ...formData, policies: newPolicies });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                                                    placeholder="VD: Bảo hành chính hãng 5 năm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPolicies = formData.policies.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, policies: newPolicies });
                                                    }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                                                    title="Xóa chính sách này"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, policies: [...formData.policies, ''] })}
                                            className="flex items-center gap-2 px-3 py-2 text-vinfast-blue hover:bg-blue-50 border border-vinfast-blue rounded-md transition-colors text-sm font-medium w-fit"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm chính sách
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                form="product-form"
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-vinfast-blue rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 transition-colors disabled:opacity-70 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang lưu...
                                    </>
                                ) : 'Lưu sản phẩm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}