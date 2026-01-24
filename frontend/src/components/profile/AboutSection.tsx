import { User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface AboutSectionProps {
  bio: string;
}

export function AboutSection({ bio }: AboutSectionProps) {
  return (
    <Card variant="acrylic">
      <CardContent>
        <CardHeader icon={<User className="h-5 w-5 text-primary" />}>
          About Me
        </CardHeader>
        <p className="text-slate-300 text-[15px] leading-relaxed font-normal">
          {bio || 'No bio added yet.'}
        </p>
      </CardContent>
    </Card>
  );
}
