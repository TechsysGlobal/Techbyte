import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-white border border-border rounded-xl relative overflow-hidden group h-full">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite] z-10"></div>

            <div className="relative p-5 bg-bg-light aspect-square flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gray-200 rounded-lg"></div>
            </div>

            <div className="p-4 relative z-0">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-1"></div>

                {/* Fixed height space for the name just like h-10 in ProductCard */}
                <div className="h-10 mb-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
