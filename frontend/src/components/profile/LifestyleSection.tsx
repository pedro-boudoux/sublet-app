import { Brain, Cigarette, Wine, Sun, Moon, Dog, Cat, Sparkles, Leaf, Home, GraduationCap, Briefcase, Volume2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Chip } from '../ui/Chip';
import type { LucideIcon } from 'lucide-react';

// Map lifestyle tags to icons and colors
const lifestyleConfig: Record<string, { icon: LucideIcon; color: string }> = {
  'Non-Smoker': { icon: Cigarette, color: 'text-primary' },
  'Social Drinker': { icon: Wine, color: 'text-pink-400' },
  'Early Bird': { icon: Sun, color: 'text-amber-400' },
  'Night Owl': { icon: Moon, color: 'text-indigo-400' },
  'Pet Friendly': { icon: Dog, color: 'text-emerald-400' },
  'Dog Lover': { icon: Dog, color: 'text-emerald-400' },
  'Cat Lover': { icon: Cat, color: 'text-orange-400' },
  'Very Clean': { icon: Sparkles, color: 'text-cyan-400' },
  'Vegetarian': { icon: Leaf, color: 'text-green-400' },
  'Vegan': { icon: Leaf, color: 'text-green-500' },
  'Works from Home': { icon: Home, color: 'text-blue-400' },
  'Student': { icon: GraduationCap, color: 'text-purple-400' },
  'Professional': { icon: Briefcase, color: 'text-slate-400' },
  'Quiet': { icon: Volume2, color: 'text-teal-400' },
  'Social': { icon: Users, color: 'text-rose-400' },
};

interface LifestyleSectionProps {
  tags: string[];
}

export function LifestyleSection({ tags }: LifestyleSectionProps) {
  if (!tags || tags.length === 0) {
    return (
      <Card variant="acrylic">
        <CardContent>
          <CardHeader icon={<Brain className="h-5 w-5 text-primary" />}>
            Lifestyle & Habits
          </CardHeader>
          <p className="text-slate-400 text-sm">No lifestyle preferences added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="acrylic">
      <CardContent>
        <CardHeader icon={<Brain className="h-5 w-5 text-primary" />}>
          Lifestyle & Habits
        </CardHeader>
        
        <div className="flex flex-wrap gap-2.5 mt-2">
          {tags.map((tag) => {
            const config = lifestyleConfig[tag] || { icon: Sparkles, color: 'text-primary' };
            return (
              <Chip
                key={tag}
                icon={config.icon}
                iconColor={config.color}
              >
                {tag}
              </Chip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
