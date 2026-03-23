import React, { useState, useEffect, useMemo } from 'react';
import FilterSidebar from '../components/products/FilterSidebar';
import ProductCard from '../components/shared/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Grid, Search, SlidersHorizontal } from 'lucide-react';
import SkeletonCard from '../components/shared/SkeletonCard';
import '../pages/pages-enhanced.css';

const ITEMS_PER_PAGE = 12;

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const brandParam = searchParams.get('brand') || '';
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [activeFilters, setActiveFilters] = useState({
        region: [],
        brand: brandParam ? [brandParam.toLowerCase()] : [],
        color: [],
        storage: []
    });
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [debouncedPriceRange, setDebouncedPriceRange] = useState({ min: 0, max: 10000 });
    const [sortBy, setSortBy] = useState('default');
    const [isPriceRangeInitialized, setIsPriceRangeInitialized] = useState(false);

    // Sync brand filter with URL param
    useEffect(() => {
        if (brandParam) {
            setActiveFilters(prev => ({
                ...prev,
                brand: [brandParam.toLowerCase()]
            }));
        }
    }, [brandParam]);

    // Construct API Params
    const apiParams = useMemo(() => {
        const params = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
        };

        if (searchQuery) params.search = searchQuery;

        if (activeFilters.brand.length > 0) params.brand = activeFilters.brand[0];
        if (activeFilters.color.length > 0) params.color = activeFilters.color[0];
        if (activeFilters.storage.length > 0) params.storage = activeFilters.storage[0];
        if (activeFilters.region.length > 0) params.region = activeFilters.region[0];

        if (debouncedPriceRange.min > 0) params.minPrice = debouncedPriceRange.min;
        if (debouncedPriceRange.max < 10000) params.maxPrice = debouncedPriceRange.max;

        // Server-side filtering for stock
        params.inStock = 'true';

        switch (sortBy) {
            case 'price-low':
                params.sort = 'variantPrice';
                params.order = 'asc';
                break;
            case 'price-high':
                params.sort = 'variantPrice';
                params.order = 'desc';
                break;
            case 'name':
                params.sort = 'title';
                params.order = 'asc';
                break;
            default:
                params.sort = 'variantInventoryQty';
                params.order = 'desc';
                break;
        }
        return params;
    }, [currentPage, searchQuery, activeFilters, debouncedPriceRange, sortBy]);

    // Use React Query Hook
    const {
        data: productData,
        isLoading: loading,
        isError: error,
        isPlaceholderData
    } = useProducts(apiParams);

    // useProducts now returns already filtered data from backend
    const products = productData?.products || [];
    const availableFilters = productData?.availableFilters || null;

    const totalPages = productData?.pagination?.totalPages || 1;
    const totalCount = productData?.pagination?.total || 0;

    // Initialize bounds once loaded
    useEffect(() => {
        if (availableFilters?.priceRange && !isPriceRangeInitialized) {
            setPriceRange(availableFilters.priceRange);
            setIsPriceRangeInitialized(true);
        }
    }, [availableFilters, isPriceRangeInitialized]);

    // Debounce slider updates API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPriceRange(priceRange);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [priceRange]);

    // Reset page when filters change (except page change itself)
    // Note: useProducts handles refetching automatically when params change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters, searchQuery, sortBy, debouncedPriceRange]);

    const clearSearch = () => {
        searchParams.delete('search');
        setSearchParams(searchParams);
    };

    const clearBrandFilter = () => {
        searchParams.delete('brand');
        setSearchParams(searchParams);
        setActiveFilters(prev => ({ ...prev, brand: [] }));
    };

    const handleFilterChange = (type, value) => {
        setActiveFilters(prev => {
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });

        if (type === 'brand' && brandParam) {
            searchParams.delete('brand');
            setSearchParams(searchParams);
        }
    };

    const handlePriceChange = (range) => {
        setPriceRange(range);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8">
                <div className="text-sm text-text-muted mb-6 flex gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Products</span>
                </div>

                <div className="products-page-header flex justify-between items-center">
                    <div>
                        <h1 className="flex items-center gap-3">
                            <Grid size={32} className="text-primary" />
                            Products
                        </h1>
                        <p className="text-text-muted mt-2">{totalCount} products available</p>
                    </div>
                    {/* Mobile Filter Toggle */}
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="lg:hidden flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-sm active:scale-95 transition-all"
                    >
                        <SlidersHorizontal size={18} />
                        Filters
                    </button>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || brandParam) && (
                    <div className="mb-6 flex flex-wrap items-center gap-3 animate-fade-in-up">
                        {searchQuery && (
                            <div className="filter-tag">
                                <Search size={14} />
                                "{searchQuery}"
                                <button onClick={clearSearch} className="hover:scale-125 transition-transform">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        {brandParam && (
                            <div className="filter-tag bg-secondary/10 text-secondary">
                                {brandParam.charAt(0).toUpperCase() + brandParam.slice(1)}
                                <button onClick={clearBrandFilter} className="hover:scale-125 transition-transform">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-10">
                    <div className={`${isMobileFilterOpen ? 'fixed inset-0 z-[60] p-6 bg-white overflow-y-auto' : 'hidden'} lg:block lg:static lg:p-0 lg:bg-transparent`}>
                        <div className="lg:hidden flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl">Filters</h3>
                            <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-bg-light rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <FilterSidebar
                            filters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onPriceChange={handlePriceChange}
                            priceRange={priceRange}
                            availableFilters={availableFilters}
                        />
                        <button
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="lg:hidden w-full bg-primary text-white py-4 rounded-xl font-bold mt-6 shadow-lg shadow-primary/20"
                        >
                            Apply Filters
                        </button>
                    </div>

                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            {/* Pagination Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-text-muted hover:bg-primary hover:border-primary hover:text-white'}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {getPageNumbers().map((page, i) => (
                                    <button
                                        key={i}
                                        onClick={() => typeof page === 'number' && goToPage(page)}
                                        disabled={page === '...'}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${page === currentPage
                                            ? 'bg-primary text-white'
                                            : page === '...'
                                                ? 'text-text-muted cursor-default'
                                                : 'border border-border text-text-muted hover:bg-primary hover:border-primary hover:text-white'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-text-muted hover:bg-primary hover:border-primary hover:text-white'}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            <span className="text-sm text-text-muted">
                                Showing {products.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} Products
                            </span>

                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                <span>Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={handleSortChange}
                                    className="bg-transparent border-none outline-none text-text-dark font-medium cursor-pointer"
                                >
                                    <option value="default">Best selling</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name">Alphabetical</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid */}
                        {(loading || isPlaceholderData) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">
                                {error}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {products.length === 0 && (
                                    <div className="text-center py-20 text-text-muted">
                                        No products found matching your filters.
                                    </div>
                                )}
                            </>
                        )}

                        {/* Bottom Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-10">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-text-muted hover:bg-primary hover:border-primary hover:text-white'}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {getPageNumbers().map((page, i) => (
                                    <button
                                        key={i}
                                        onClick={() => typeof page === 'number' && goToPage(page)}
                                        disabled={page === '...'}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${page === currentPage
                                            ? 'bg-primary text-white'
                                            : page === '...'
                                                ? 'text-text-muted cursor-default'
                                                : 'border border-border text-text-muted hover:bg-primary hover:border-primary hover:text-white'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-text-muted hover:bg-primary hover:border-primary hover:text-white'}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
