import { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getLocations } from '../../lib/api';

// Fallback locations when API is unavailable
const FALLBACK_LOCATIONS = [
    'New York, Ny',
    'Brooklyn, Ny',
    'Guelph, On',
    'Toronto, On',
    'Los Angeles, Ca',
    'San Francisco, Ca',
];

interface LocationDropdownProps {
    value: string;
    onChange: (location: string) => void;
}

export function LocationDropdown({ value, onChange }: LocationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [locations, setLocations] = useState<string[]>(FALLBACK_LOCATIONS);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch locations on mount
    useEffect(() => {
        async function fetchLocations() {
            setIsLoading(true);
            try {
                const response = await getLocations();
                if (response.locations && response.locations.length > 0) {
                    setLocations(response.locations);
                }
            } catch (err) {
                console.error('Failed to fetch locations, using fallback:', err);
                // Keep fallback locations
            } finally {
                setIsLoading(false);
            }
        }

        fetchLocations();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (location: string) => {
        onChange(location);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            <Button
                variant="glass"
                size="sm"
                className="h-9 px-4 rounded-full gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-sm font-semibold text-white/90">
                    {value || 'Select Location'}
                </span>
                <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-h-72 overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="sticky top-0 px-4 py-3 border-b border-white/10 bg-gray-900/95 backdrop-blur-xl rounded-t-2xl">
                        <div className="flex items-center gap-2 text-white/70">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">Select Location</span>
                        </div>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                    )}

                    {/* Location list */}
                    {!isLoading && (
                        <div className="py-2">
                            {/* All Locations option */}
                            <button
                                onClick={() => handleSelect('')}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${!value ? 'text-primary' : 'text-white/80'
                                    }`}
                            >
                                <span>All Locations</span>
                                {!value && <Check className="h-4 w-4" />}
                            </button>

                            {locations.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-white/50">
                                    No locations found
                                </div>
                            ) : (
                                locations.map((location) => (
                                    <button
                                        key={location}
                                        onClick={() => handleSelect(location)}
                                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${value === location ? 'text-primary' : 'text-white/80'
                                            }`}
                                    >
                                        <span>{location}</span>
                                        {value === location && <Check className="h-4 w-4" />}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
