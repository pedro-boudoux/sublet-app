import { useState } from 'react';
import { X, RotateCcw, Check, Home, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { useStore } from '../../stores/useStore';
import { TAG_PAIRS, type TagPair } from '../../constants/tagPairs';
import type { ListingType } from '../../lib/api';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_LABELS: Record<TagPair['category'], string> = {
    lifestyle: 'Lifestyle',
    pets: 'Pets',
    schedule: 'Schedule',
    environment: 'Environment',
    occupant: 'Occupant Type',
};

const CATEGORY_ORDER: TagPair['category'][] = ['lifestyle', 'pets', 'schedule', 'environment', 'occupant'];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
    { value: 'studio', label: 'Studio' },
    { value: '1br', label: '1 Bedroom' },
    { value: '2br', label: '2 Bedroom' },
    { value: 'room', label: 'Room' },
];

const GENDERS: { value: string; label: string }[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
];

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
    const user = useStore((state) => state.user);
    const selectedFilters = useStore((state) => state.selectedFilters);
    const toggleFilter = useStore((state) => state.toggleFilter);
    const selectedListingTypes = useStore((state) => state.selectedListingTypes);
    const toggleListingType = useStore((state) => state.toggleListingType);
    const selectedGenders = useStore((state) => state.selectedGenders);
    const toggleGender = useStore((state) => state.toggleGender);
    const clearFilters = useStore((state) => state.clearFilters);

    if (!isOpen) return null;

    // Get tags based on user mode
    // Looking users filter by offering tags (what listings have)
    // Offering users filter by looking tags (what users have)
    const isLooking = user?.mode === 'looking';

    // Group tags by category
    const tagsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
        const categoryTags = TAG_PAIRS.filter((p) => p.category === category).map((p) =>
            isLooking ? p.offering : p.looking
        );
        if (categoryTags.length > 0) {
            acc[category] = categoryTags;
        }
        return acc;
    }, {} as Record<string, string[]>);

    const handleApply = () => {
        onClose();
    };

    const hasFilters = selectedFilters.length > 0 || selectedListingTypes.length > 0 || selectedGenders.length > 0;
    const totalFilterCount = selectedFilters.length + selectedListingTypes.length + selectedGenders.length;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    <p className="text-sm text-white/50">
                        {isLooking
                            ? 'Filter listings by type and features'
                            : 'Filter users by traits you prefer'}
                    </p>

                    {/* Listing Type Filter - only for looking users */}
                    {isLooking && (
                        <div>
                            <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Listing Type
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {LISTING_TYPES.map(({ value, label }) => {
                                    const isSelected = selectedListingTypes.includes(value);
                                    return (
                                        <Chip
                                            key={value}
                                            selected={isSelected}
                                            onClick={() => toggleListingType(value)}
                                            className="cursor-pointer transition-all duration-200"
                                        >
                                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                                            {label}
                                        </Chip>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gender Filter - only for offering users */}
                    {!isLooking && (
                        <div>
                            <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Gender Preference
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {GENDERS.map(({ value, label }) => {
                                    const isSelected = selectedGenders.includes(value);
                                    return (
                                        <Chip
                                            key={value}
                                            selected={isSelected}
                                            onClick={() => toggleGender(value)}
                                            className="cursor-pointer transition-all duration-200"
                                        >
                                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                                            {label}
                                        </Chip>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tag Filters */}
                    {CATEGORY_ORDER.map((category) => {
                        const tags = tagsByCategory[category];
                        if (!tags || tags.length === 0) return null;

                        return (
                            <div key={category}>
                                <h3 className="text-sm font-medium text-white/70 mb-3">
                                    {CATEGORY_LABELS[category]}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => {
                                        const isSelected = selectedFilters.includes(tag);
                                        return (
                                            <Chip
                                                key={tag}
                                                selected={isSelected}
                                                onClick={() => toggleFilter(tag)}
                                                className="cursor-pointer transition-all duration-200"
                                            >
                                                {isSelected && <Check className="h-3 w-3 mr-1" />}
                                                {tag}
                                            </Chip>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 space-y-3">
                    {/* Filter Controls */}
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1"
                            onClick={clearFilters}
                            disabled={!hasFilters}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleApply}
                        >
                            Apply {hasFilters && `(${totalFilterCount})`}
                        </Button>
                    </div>

                    {/* Reset Swipes Section */}
                    <div className="pt-3 border-t border-white/10">
                        <ResetSwipesButton onClose={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Separate component for reset swipes to manage its own state
function ResetSwipesButton({ onClose }: { onClose: () => void }) {
    const user = useStore((state) => state.user);
    const [isResetting, setIsResetting] = useState(false);

    const handleResetSwipes = async () => {
        if (!user) return;

        // Simple confirmation
        if (!window.confirm('This will reset all your swipes and let you see all candidates again. Continue?')) {
            return;
        }

        setIsResetting(true);
        try {
            const { resetSwipes } = await import('../../lib/api');
            const result = await resetSwipes(user.id);
            toast.success(`Reset ${result.deletedCount} swipes. Refresh to see all candidates!`);
            onClose();
            // Trigger page reload to refresh candidates
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset swipes:', error);
            toast.error('Failed to reset swipes. Please try again.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <Button
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleResetSwipes}
            disabled={isResetting}
        >
            <Trash2 className="h-4 w-4 mr-2" />
            {isResetting ? 'Resetting...' : 'Reset All Swipes'}
        </Button>
    );
}
