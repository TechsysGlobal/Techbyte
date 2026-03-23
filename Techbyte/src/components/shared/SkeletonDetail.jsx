import React from 'react';

const SkeletonDetail = () => {
    return (
        <div className="container mx-auto px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite] z-10"></div>
            <div className="flex items-center gap-2 mb-8 h-4 bg-gray-200 rounded w-1/3 relative z-0"></div>
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
                <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                <div className="space-y-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        <div className="flex gap-4">
                            <div className="h-12 bg-gray-200 rounded w-32"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-14 bg-gray-200 rounded-xl"></div>
                        <div className="h-14 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonDetail;
