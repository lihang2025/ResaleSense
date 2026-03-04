// resalesense-frontend/src/pages/MapPage/parts/PropertyFilters.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Check, ChevronDown, SlidersHorizontal, ListFilter } from 'lucide-react';
import './PropertyFilters.css';

// Type for filter data
interface FilterData {
    stats: any;
    towns: string[];
    flats: string[];
    models: string[];
}

// 'sliders' or 'inputs'
type FilterViewMode = 'sliders' | 'inputs';

interface MapFilterControlsProps {
    onFilterChange: (filters: any) => void;
    isLoading: boolean;
    propertyCount: number;
    viewMode: FilterViewMode;
    onToggleViewMode: () => void;
    style?: React.CSSProperties;
    initialValues?: any;
    initialData?: FilterData;
    onDataLoaded?: (data: FilterData) => void;
}

const PropertyFilters: React.FC<MapFilterControlsProps> = ({
    onFilterChange,
    isLoading,
    // propertyCount, // (prop not used)
    viewMode,
    onToggleViewMode,
    initialValues = {},
    initialData,
    onDataLoaded,
    style
}) => {
    // --- State for options ---
    const [townOptions, setTownOptions] = useState<string[]>(initialData?.towns || []);
    const [flatTypeOptions, setFlatTypeOptions] = useState<string[]>(initialData?.flats || []);
    const [flatModelOptions, setFlatModelOptions] = useState<string[]>(initialData?.models || []);
    const [propertyStats, setPropertyStats] = useState<any>(initialData?.stats || null);

    // --- State for filter values ---
    const [town, setTown] = useState('');
    const [flatType, setFlatType] = useState('');
    const [flatModel, setFlatModel] = useState('');
    const [minLease, setMinLease] = useState('');
    const [storeyRange, setStoreyRange] = useState('');
    
    // Slider states
    const [priceSlider, setPriceSlider] = useState<[number, number]>([0, 2000000]);
    const [areaSlider, setAreaSlider] = useState<[number, number]>([20, 200]);
    const [storeySlider, setStoreySlider] = useState<[number, number]>([1, 50]);
    
    // Text input states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minArea, setMinArea] = useState('');
    const [maxArea, setMaxArea] = useState('');
    
    const hasInitializedFromProps = useRef(false);
    const storeyOptions = ["01-09", "10-19", "20-29", "30-39", "40-49", "50+"];

    // Effect to fetch options and set initial state
    useEffect(() => {
        const setupFilters = async () => {
            let stats = propertyStats;
            let towns = townOptions;
            let flats = flatTypeOptions;
            let models = flatModelOptions;

            if (!initialData) {
                try {
                    const response = await fetch('http://localhost:4000/api/properties/distinct-options');
                    if (!response.ok) throw new Error("Failed to fetch filter options");
                    const data = await response.json();
                    towns = data.towns || []; flats = data.flatTypes || []; models = data.flatModels || [];
                    setTownOptions(towns); setFlatTypeOptions(flats); setFlatModelOptions(models);
                    if (data.stats) { stats = data.stats; setPropertyStats(stats); }
                    if (onDataLoaded) { onDataLoaded({ stats, towns, flats, models }); }
                } catch (err: any) { console.error("Failed to fetch filter options:", err); }
            }

            if (!hasInitializedFromProps.current && (stats || initialData)) {
                // Use API stats as default, but let initialValues override
                const defaultPrice = (stats) ? [stats.price_min, stats.price_max] : [0, 2000000];
                const defaultArea = (stats) ? [stats.area_min, stats.area_max] : [20, 200];
                
                setTown(initialValues?.town || '');
                setFlatType(initialValues?.flat_type || '');
                setFlatModel(initialValues?.flat_model || '');
                setMinLease(initialValues?.min_lease || '');
                
                const { storey_min, storey_max } = initialValues;
                let initialStoreyString = '';
                if (storey_min && !storey_max && storey_min === 50) {
                    initialStoreyString = "50+";
                } else if (storey_min && storey_max) {
                    const minStr = String(storey_min).padStart(2, '0');
                    const maxStr = String(storey_max).padStart(2, '0');
                    const foundRange = storeyOptions.find(opt => opt === `${minStr}-${maxStr}`);
                    if (foundRange) initialStoreyString = foundRange;
                }
                setStoreyRange(initialStoreyString);
                
                // Set slider values (critical)
                setPriceSlider(initialValues?.priceRange || defaultPrice);
                setAreaSlider(initialValues?.areaRange || defaultArea);
                setStoreySlider(initialValues?.storeyRangeSliders || [1, 50]);
                
                // Set text input values
                setMinPrice(initialValues?.price_min || '');
                setMaxPrice(initialValues?.price_max || '');
                setMinArea(initialValues?.area_min || '');
                setMaxArea(initialValues?.area_max || '');
                
                hasInitializedFromProps.current = true;
            }
        };
        setupFilters();
    }, [initialValues, initialData, onDataLoaded, propertyStats, storeyOptions]);

    // Helper to parse storey range string
    const parseStoreyRange = (range: string) => {
        if (!range) return { min: undefined, max: undefined };
        if (range === "50+") return { storey_min: 50, storey_max: undefined };
        const parts = range.split('-').map(v => parseInt(v.trim(), 10));
        return { storey_min: parts[0] || undefined, storey_max: parts[1] || undefined };
    };

    // Get all filter values
    const getAllFilters = () => {
        const filters: { [key: string]: any } = {};
        
        // Add common filters
        if (town) filters.town = town;
        if (flatType) filters.flat_type = flatType;
        if (flatModel) filters.flat_model = flatModel;
        if (minLease) filters.min_lease = minLease;

        // Add view-specific filters
        if (viewMode === 'sliders') {
            if (propertyStats) {
                if (priceSlider[0] > propertyStats.price_min) filters.price_min = priceSlider[0];
                if (priceSlider[1] < propertyStats.price_max) filters.price_max = priceSlider[1];
                if (areaSlider[0] > propertyStats.area_min) filters.area_min = areaSlider[0];
                if (areaSlider[1] < propertyStats.area_max) filters.area_max = areaSlider[1];
            }
            if (storeySlider[0] > 1) filters.storey_min = storeySlider[0];
            if (storeySlider[1] < 50) filters.storey_max = storeySlider[1];

            // --- THIS IS THE FIX ---
            // Also save the slider arrays themselves for session storage
            filters.priceRange = priceSlider;
            filters.areaRange = areaSlider;
            filters.storeyRangeSliders = storeySlider;
            // --- END FIX ---

        } else {
            if (minPrice) filters.price_min = minPrice;
            if (maxPrice) filters.price_max = maxPrice;
            if (minArea) filters.area_min = minArea;
            if (maxArea) filters.area_max = maxArea;
            const storey = parseStoreyRange(storeyRange);
            if (storey.storey_min) filters.storey_min = storey.storey_min;
            if (storey.storey_max) filters.storey_max = storey.storey_max;
        }
        return filters;
    };

    const handleApplyFilters = () => {
        onFilterChange(getAllFilters());
    };

    const handleClearFilters = () => {
        setTown(''); setFlatType(''); setFlatModel(''); setMinLease(''); setStoreyRange('');
        setMinPrice(''); setMaxPrice(''); setMinArea(''); setMaxArea('');
        if (propertyStats) {
            setPriceSlider([propertyStats.price_min, propertyStats.price_max]);
            setAreaSlider([propertyStats.area_min, propertyStats.area_max]);
        } else {
             setPriceSlider([0, 2000000]); setAreaSlider([20, 200]);
        }
        setStoreySlider([1, 50]);
        onFilterChange({});
    };

    if (!propertyStats) {
        return <div className="property-filters-container card" style={style}>Loading filters...</div>;
    }

    const minPriceSlider = propertyStats?.price_min || 0;
    const maxPriceSlider = propertyStats?.price_max || 2000000;
    const minAreaSlider = propertyStats?.area_min || 20;
    const maxAreaSlider = propertyStats?.area_max || 200;

    return (
        <div className="property-filters-container" style={style}>
            
            <div className="filters-header">
                <h3 className="filters-title">
                    {viewMode === 'sliders' ? 'Filter by Range' : 'Advanced Filters'}
                </h3>
                <button
                    className="button-secondary filters-toggle-button"
                    onClick={onToggleViewMode}
                >
                    {viewMode === 'sliders' ? <ListFilter size={16} /> : <SlidersHorizontal size={16} />}
                    <span>{viewMode === 'sliders' ? 'Use Inputs' : 'Use Sliders'}</span>
                </button>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <Label.Root className="form-label">Town</Label.Root>
                <Select.Root value={town} onValueChange={setTown}>
                    <Select.Trigger className="select-trigger">
                        <Select.Value placeholder="All Towns" />
                        <Select.Icon><ChevronDown size={18} /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content className="select-content">
                            <Select.Viewport>
                                {townOptions.map(opt => (
                                    <Select.Item className="select-item" key={opt} value={opt}>
                                        <Select.ItemText>{opt}</Select.ItemText>
                                        <Select.ItemIndicator className="select-item-indicator"> <Check size={16} /> </Select.ItemIndicator>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>

            {viewMode === 'sliders' ? (
                <div className="slider-filters-panel">
                    <div className="form-group">
                        <Label.Root className="form-label" htmlFor="price-slider">
                            Price Range: ${priceSlider[0].toLocaleString()} - ${priceSlider[1].toLocaleString()}
                        </Label.Root>
                        <Slider.Root id="price-slider" className="slider-root"
                            value={priceSlider} onValueChange={(v) => setPriceSlider(v as [number, number])}
                            min={minPriceSlider} max={maxPriceSlider} step={10000} minStepsBetweenThumbs={1}
                        >
                            <Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track>
                            <Slider.Thumb className="slider-thumb" />
                            <Slider.Thumb className="slider-thumb" />
                        </Slider.Root>
                    </div>
                    <div className="form-group">
                        <Label.Root className="form-label" htmlFor="area-slider">
                            Floor Area (sqm): {areaSlider[0]} - {areaSlider[1]}
                        </Label.Root>
                        <Slider.Root id="area-slider" className="slider-root"
                            value={areaSlider} onValueChange={(v) => setAreaSlider(v as [number, number])}
                            min={minAreaSlider} max={maxAreaSlider} step={5} minStepsBetweenThumbs={1}
                        >
                            <Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track>
                            <Slider.Thumb className="slider-thumb" />
                            <Slider.Thumb className="slider-thumb" />
                        </Slider.Root>
                    </div>
                    <div className="form-group">
                        <Label.Root className="form-label" htmlFor="storey-slider">
                            Storey Range: {storeySlider[0]} - {storeySlider[1]}
                        </Label.Root>
                        <Slider.Root id="storey-slider" className="slider-root"
                            value={storeySlider} onValueChange={(v) => setStoreySlider(v as [number, number])}
                            min={1} max={50} step={1} minStepsBetweenThumbs={1}
                        >
                            <Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track>
                            <Slider.Thumb className="slider-thumb" />
                            <Slider.Thumb className="slider-thumb" />
                        </Slider.Root>
                    </div>
                </div>
            ) : (
                <div className="advanced-filters-panel" style={{padding: 0, border: 'none', boxShadow: 'none', marginTop: 0}}>
                    <div className="filter-row">
                        <div className="form-group">
                            <Label.Root className="form-label">Flat Type</Label.Root>
                            <Select.Root value={flatType} onValueChange={setFlatType}>
                                <Select.Trigger className="select-trigger">
                                    <Select.Value placeholder="All Types" />
                                    <Select.Icon><ChevronDown size={18} /></Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content className="select-content">
                                        <Select.Viewport>
                                            {flatTypeOptions.map(opt => (<Select.Item className="select-item" key={opt} value={opt}><Select.ItemText>{opt}</Select.ItemText><Select.ItemIndicator className="select-item-indicator"> <Check size={16} /> </Select.ItemIndicator></Select.Item>))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        </div>
                        <div className="form-group">
                            <Label.Root className="form-label">Storey Range</Label.Root>
                            <Select.Root value={storeyRange} onValueChange={setStoreyRange}>
                                <Select.Trigger className="select-trigger">
                                    <Select.Value placeholder="All Storeys" />
                                    <Select.Icon><ChevronDown size={18} /></Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content className="select-content">
                                        <Select.Viewport>
                                            {storeyOptions.map(opt => (<Select.Item className="select-item" key={opt} value={opt}><Select.ItemText>{opt}</Select.ItemText><Select.ItemIndicator className="select-item-indicator"> <Check size={16} /> </Select.ItemIndicator></Select.Item>))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        </div>
                    </div>
                    <div className="filter-row">
                        <div className="form-group"><Label.Root className="form-label">Min Price ($)</Label.Root><input type="number" placeholder="e.g. 300000" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field" /></div>
                        <div className="form-group"><Label.Root className="form-label">Max Price ($)</Label.Root><input type="number" placeholder="e.g. 800000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field" /></div>
                    </div>
                    <div className="filter-row">
                        <div className="form-group"><Label.Root className="form-label">Min Area (sqm)</Label.Root><input type="number" placeholder="e.g. 60" value={minArea} onChange={e => setMinArea(e.target.value)} className="input-field" /></div>
                        <div className="form-group"><Label.Root className="form-label">Max Area (sqm)</Label.Root><input type="number" placeholder="e.g. 150" value={maxArea} onChange={e => setMaxArea(e.target.value)} className="input-field" /></div>
                    </div>
                    <div className="filter-row">
                        <div className="form-group">
                            <Label.Root className="form-label">Flat Model</Label.Root>
                            <Select.Root value={flatModel} onValueChange={setFlatModel}>
                                <Select.Trigger className="select-trigger">
                                    <Select.Value placeholder="All Models" />
                                    <Select.Icon><ChevronDown size={18} /></Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content className="select-content">
                                        <Select.Viewport>
                                            {flatModelOptions.map(opt => (<Select.Item className="select-item" key={opt} value={opt}><Select.ItemText>{opt}</Select.ItemText><Select.ItemIndicator className="select-item-indicator"> <Check size={16} /> </Select.ItemIndicator></Select.Item>))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        </div>
                        <div className="form-group">
                            <Label.Root className="form-label">Min Lease (years)</Label.Root>
                            <input type="number" placeholder="e.g. 60" value={minLease} onChange={e => setMinLease(e.target.value)} className="input-field" />
                        </div>
                    </div>
                </div>
            )}

            <div className="filters-main-buttons">
                <button onClick={handleClearFilters} disabled={isLoading} className="button-destructive">
                    Clear All
                </button>
                <button onClick={handleApplyFilters} disabled={isLoading} className="button">
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </div>
    );
};

export default PropertyFilters;