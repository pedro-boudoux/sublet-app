/**
 * Tag Pairs for Matching System
 * 
 * Each tag has a "looking" version (for users seeking a place)
 * and an "offering" version (for listings/landlords).
 * 
 * These pairs help match compatible users with listings.
 */

export interface TagPair {
    looking: string;
    offering: string;
    category: 'lifestyle' | 'pets' | 'schedule' | 'environment' | 'occupant';
}

export const TAG_PAIRS: TagPair[] = [
    // Lifestyle
    { looking: 'Non-Smoker', offering: 'Smoke-Free', category: 'lifestyle' },
    { looking: 'Very Clean', offering: 'Very Clean', category: 'lifestyle' },
    { looking: 'Social Drinker', offering: 'Social Atmosphere', category: 'lifestyle' },

    // Pets
    { looking: 'Dog Lover', offering: 'Dog Friendly', category: 'pets' },
    { looking: 'Cat Lover', offering: 'Cat Friendly', category: 'pets' },
    { looking: 'Pet Friendly', offering: 'Pet Friendly', category: 'pets' },

    // Schedule
    { looking: 'Early Bird', offering: 'Quiet Mornings', category: 'schedule' },
    { looking: 'Night Owl', offering: 'Flexible Hours', category: 'schedule' },
    { looking: 'Works from Home', offering: 'Work-Friendly Space', category: 'schedule' },

    // Environment
    { looking: 'Quiet', offering: 'Quiet Environment', category: 'environment' },
    { looking: 'Social', offering: 'Social Building', category: 'environment' },

    // Occupant type
    { looking: 'Student', offering: 'Student Friendly', category: 'occupant' },
    { looking: 'Professional', offering: 'Professional Preferred', category: 'occupant' },
];

// Tags for users who are LOOKING for a place
export const LOOKING_TAGS = TAG_PAIRS.map(pair => pair.looking);

// Tags for listings that are OFFERING a place
export const OFFERING_TAGS = TAG_PAIRS.map(pair => pair.offering);

// Get the offering equivalent of a looking tag
export function getOfferingTag(lookingTag: string): string | undefined {
    const pair = TAG_PAIRS.find(p => p.looking === lookingTag);
    return pair?.offering;
}

// Get the looking equivalent of an offering tag
export function getLookingTag(offeringTag: string): string | undefined {
    const pair = TAG_PAIRS.find(p => p.offering === offeringTag);
    return pair?.looking;
}

// Check if a looking tag matches an offering tag
export function tagsMatch(lookingTag: string, offeringTag: string): boolean {
    const pair = TAG_PAIRS.find(p => p.looking === lookingTag);
    return pair?.offering === offeringTag;
}

// Get tags by category
export function getLookingTagsByCategory(category: TagPair['category']): string[] {
    return TAG_PAIRS.filter(p => p.category === category).map(p => p.looking);
}

export function getOfferingTagsByCategory(category: TagPair['category']): string[] {
    return TAG_PAIRS.filter(p => p.category === category).map(p => p.offering);
}

// Type exports
export type LookingTag = typeof LOOKING_TAGS[number];
export type OfferingTag = typeof OFFERING_TAGS[number];
