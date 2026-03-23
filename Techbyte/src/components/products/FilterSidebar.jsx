import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DualRangeSlider from '../shared/DualRangeSlider';

const FilterSection = ({ title, options, selected, onChange, type, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="border-b border-border py-4 last:border-0">
            <button
                type="button"
                className="w-full flex justify-between items-center cursor-pointer mb-2 text-left"
                onClick={toggleOpen}
            >
                <h4 className="font-medium text-sm">{title}</h4>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="space-y-2 mt-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <p className="text-xs text-text-muted mb-2">{selected.length} Selected</p>
                    {options.map(option => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <label key={option.value} className="flex items-center gap-3 cursor-pointer group select-none">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => onChange(type, option.value)}
                                />
                                <span className={`text-sm transition-colors ${isSelected ? 'text-text-dark font-medium' : 'text-text-muted group-hover:text-text-dark'}`}>
                                    {option.label}
                                </span>
                            </label>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const FilterSidebar = ({ filters, onFilterChange, onPriceChange, priceRange, availableFilters }) => {
    // Ensure all filter arrays exist to prevent mapping errors
    const filterOptions = {
        brands: availableFilters?.brands || [],
        categories: availableFilters?.categories || [],
        colors: availableFilters?.colors || [],
        storages: availableFilters?.storages || [],
        regions: availableFilters?.regions || [],
    };

    // Format options for display
    const formatOptions = (values) => {
        return values.map(value => ({
            value: value.toLowerCase(),
            label: value.charAt(0).toUpperCase() + value.slice(1),
        }));
    };

    const brandOptions = formatOptions(filterOptions.brands);
    const colorOptions = formatOptions(filterOptions.colors);
    const regionOptions = formatOptions(filterOptions.regions);
    const storageOptions = filterOptions.storages.map(value => ({
        value: value.toLowerCase(),
        label: value.toUpperCase(),
    }));

    const minPrice = availableFilters?.priceRange?.min || 0;
    const maxPrice = availableFilters?.priceRange?.max || 10000;

    return (
        <aside className="w-full lg:w-[280px] bg-bg-light rounded-xl p-6 h-fit sticky top-24 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Filters</h3>
            </div>

            <FilterSection
                title="Region"
                type="region"
                options={regionOptions}
                selected={filters.region}
                onChange={onFilterChange}
                defaultOpen={true}
            />

            <FilterSection
                title="Brand"
                type="brand"
                options={brandOptions}
                selected={filters.brand}
                onChange={onFilterChange}
                defaultOpen={true}
            />

            <FilterSection
                title="Color"
                type="color"
                options={colorOptions}
                selected={filters.color}
                onChange={onFilterChange}
                defaultOpen={true}
            />

            <FilterSection
                title="Storage"
                type="storage"
                options={storageOptions}
                selected={filters.storage}
                onChange={onFilterChange}
                defaultOpen={false}
            />

            {/* Price Slider */}
            <div className="py-6 border-t border-border mt-2">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-medium text-sm">Price Range</h4>
                </div>

                <div className="px-2">
                    <DualRangeSlider
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange || { min: minPrice, max: maxPrice }}
                        onChange={onPriceChange}
                    />
                </div>

                <div className="flex items-center justify-between mt-6 text-sm font-medium text-text-dark bg-white p-3 rounded-lg border border-border">
                    <span>€{priceRange?.min || minPrice}</span>
                    <span className="text-text-muted font-normal">to</span>
                    <span>€{priceRange?.max || maxPrice}</span>
                </div>
            </div>
        </aside>
    );
};

export default FilterSidebar;
