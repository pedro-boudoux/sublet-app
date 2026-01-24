import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Chip } from '../components/ui/Chip';
import { Card, CardContent } from '../components/ui/Card';
import { useAuthContext } from '../components/auth';
import { useStore } from '../stores/useStore';
import { createUser, type CreateUserRequest, ApiError } from '../lib/api';
import { LOOKING_TAGS } from '../constants/tagPairs';
import { cn } from '../lib/utils';

const modeOptions = [
  { value: 'looking', label: 'Looking for Place' },
  { value: 'offering', label: 'Offering Place' },
];

// Steps for onboarding
type Step = 'mode' | 'basics' | 'bio' | 'lifestyle' | 'complete';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { authUser } = useAuthContext();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);

  // Form state
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<'looking' | 'offering'>(user?.mode || 'looking');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [location, setLocation] = useState(user?.searchLocation || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.lifestyleTags || []);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNext = () => {
    const steps: Step[] = ['mode', 'basics', 'bio', 'lifestyle', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['mode', 'basics', 'bio', 'lifestyle', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // Ensure we have auth user info
      if (!authUser) {
        toast.error('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      // Generate username from full name
      const username = fullName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36);

      // Get email from Azure identity, fall back to generated email
      const email = authUser.userDetails || `${username}@subletconnect.app`;

      // Create user via API
      const userData: CreateUserRequest = {
        identityId: authUser.userId,  // Link to Azure identity
        username,
        email,
        fullName,
        age: parseInt(age) || 25,
        searchLocation: location,
        mode,
        profilePicture,
        bio,
        lifestyleTags: selectedTags,
      };

      const createdUser = await createUser(userData);

      // Store user in state
      setUser(createdUser);
      setIsOnboarded(true);

      toast.success('Profile created successfully!');
      navigate('/');

    } catch (error) {
      console.error('Failed to create user:', error);

      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'mode':
        return true;
      case 'basics':
        return fullName.trim() && age && location.trim();
      case 'bio':
        return true; // Bio is optional
      case 'lifestyle':
        return true; // Tags are optional
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f1a23' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex gap-1.5">
          {['mode', 'basics', 'bio', 'lifestyle'].map((s) => (
            <div
              key={s}
              className={cn(
                'w-8 h-1 rounded-full transition-colors',
                step === s || ['mode', 'basics', 'bio', 'lifestyle'].indexOf(step) > ['mode', 'basics', 'bio', 'lifestyle'].indexOf(s)
                  ? 'bg-primary'
                  : 'bg-white/20'
              )}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-32">
        {/* Step: Mode Selection */}
        {step === 'mode' && (
          <div className="flex flex-col gap-6 pt-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">What are you looking for?</h1>
              <p className="text-slate-400">This helps us show you the right matches</p>
            </div>

            <Toggle
              options={modeOptions}
              value={mode}
              onChange={(v) => setMode(v as 'looking' | 'offering')}
            />

            <Card variant="acrylic" className="mt-4">
              <CardContent>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {mode === 'looking'
                    ? "You'll see people offering sublets and can swipe to show interest. They'll review your profile if interested."
                    : "You'll see people looking for sublets and can swipe to show interest. They'll see your profile if you match."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Basic Info */}
        {step === 'basics' && (
          <div className="flex flex-col gap-6 pt-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h1>
              <p className="text-slate-400">Basic info for your profile</p>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center">
              <button
                className="relative h-28 w-28 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors overflow-hidden"
                onClick={() => {
                  // For demo, use a placeholder
                  setProfilePicture('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face');
                }}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-white/40" />
                )}
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jensen Huang"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  min="18"
                  max="99"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Oshawa, ON"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Bio */}
        {step === 'bio' && (
          <div className="flex flex-col gap-6 pt-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Write a short bio</h1>
              <p className="text-slate-400">Help others get to know you</p>
            </div>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Software engineer moving to SF for a 3-month contract. I'm clean, quiet, and love to cook on weekends. Looking for a spot near transit with good natural light."
              rows={6}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
            />

            <p className="text-slate-500 text-sm text-center">
              {bio.length}/300 characters
            </p>
          </div>
        )}

        {/* Step: Lifestyle Tags */}
        {step === 'lifestyle' && (
          <div className="flex flex-col gap-6 pt-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Lifestyle & Habits</h1>
              <p className="text-slate-400">Select what describes you best</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {LOOKING_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="flex flex-col items-center gap-6 pt-16">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-10 w-10 text-primary" />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">You're all set!</h1>
              <p className="text-slate-400">Your profile is ready. Start swiping to find your perfect match.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f1a23] via-[#0f1a23] to-transparent">
        {step === 'complete' ? (
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Profile...</span>
              </>
            ) : (
              'Start Swiping'
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!canProceed()}
            onClick={handleNext}
          >
            <span>Continue</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
