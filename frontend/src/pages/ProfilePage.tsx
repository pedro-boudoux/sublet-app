import { useState, useRef } from 'react';
import { ArrowLeft, Pencil, LogOut, Save, X, Loader2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Chip } from '../components/ui/Chip';
import { ProfileHeader, AboutSection, LifestyleSection, SocialSection } from '../components/profile';
import { useAuthContext } from '../components/auth';
import { useStore } from '../stores/useStore';
import { updateUser, uploadProfileImage, ApiError } from '../lib/api';
import { LOOKING_TAGS } from '../constants/tagPairs';

const modeOptions = [
  { value: 'looking', label: 'Looking for Place' },
  { value: 'offering', label: 'Offering Place' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editAge, setEditAge] = useState(user?.age?.toString() || '');
  const [editLocation, setEditLocation] = useState(user?.searchLocation || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editTags, setEditTags] = useState<string[]>(user?.lifestyleTags || []);
  const [editMode, setEditMode] = useState<'looking' | 'offering'>(user?.mode || 'looking');
  const [editProfilePicture, setEditProfilePicture] = useState(user?.profilePicture || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If no user, redirect to onboarding
  if (!user) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-white text-lg font-semibold tracking-wide">Profile</h2>
          <div className="w-10" />
        </div>

        {/* No Profile State */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center text-white/60">
            <p className="text-lg font-medium mb-2">No Profile Yet</p>
            <p className="text-sm">Create your profile to start swiping</p>
          </div>
          <Button onClick={() => navigate('/onboarding')}>
            Create Profile
          </Button>
        </div>
      </div>
    );
  }

  const startEditing = () => {
    setEditFullName(user.fullName);
    setEditAge(user.age?.toString() || '');
    setEditLocation(user.searchLocation);
    setEditBio(user.bio);
    setEditTags(user.lifestyleTags || []);
    setEditMode(user.mode);
    setEditProfilePicture(user.profilePicture || '');
    setIsEditing(true);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      // Upload to server
      const response = await uploadProfileImage({
        image: base64,
        mimeType: file.type,
        fileName: file.name,
      });

      setEditProfilePicture(response.url);
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const toggleTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updatedUser = await updateUser(user.id, {
        fullName: editFullName,
        age: parseInt(editAge) || user.age,
        searchLocation: editLocation,
        bio: editBio,
        lifestyleTags: editTags,
        mode: editMode,
        profilePicture: editProfilePicture,
      });

      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = async (newMode: string) => {
    if (isEditing) {
      setEditMode(newMode as 'looking' | 'offering');
    } else {
      // Direct mode change without edit mode
      try {
        const updatedUser = await updateUser(user.id, {
          mode: newMode as 'looking' | 'offering',
        });
        setUser(updatedUser);
        toast.success(`Mode changed to ${newMode === 'looking' ? 'Looking' : 'Offering'}`);
      } catch (error) {
        console.error('Failed to update mode:', error);
        toast.error('Failed to update mode');
      }
    }
  };

  const handleLogout = () => {
    clearUser();
    logout();  // This redirects to SWA logout endpoint
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(15, 26, 35, 0.3)' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-white text-lg font-semibold tracking-wide">Profile</h2>
        {isEditing ? (
          <Button variant="ghost" size="icon" className="text-red-400" onClick={cancelEditing}>
            <X className="h-6 w-6" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-primary" onClick={startEditing}>
            <Pencil className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex flex-col gap-6 px-4 pt-2 pb-8">
        {/* Profile Header */}
        {isEditing ? (
          <div className="flex flex-col items-center gap-4">
            {/* Avatar - clickable to upload */}
            <div
              className="relative h-24 w-24 rounded-full overflow-hidden bg-white/10 border-2 border-primary/50 cursor-pointer group"
              onClick={handleImageClick}
            >
              {isUploadingImage ? (
                <div className="w-full h-full flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : editProfilePicture ? (
                <img src={editProfilePicture} alt={editFullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-white/50">
                  {editFullName?.[0] || '?'}
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-xs text-white/50">Tap to change photo</p>

            {/* Editable Fields */}
            <div className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ProfileHeader
            profilePicture={user.profilePicture}
            fullName={user.fullName}
            age={user.age}
            location={user.searchLocation}
            isVerified={user.isVerified}
          />
        )}

        {/* Mode Toggle */}
        <Toggle
          options={modeOptions}
          value={isEditing ? editMode : user.mode}
          onChange={handleModeChange}
        />

        {/* About Me */}
        {isEditing ? (
          <div className="acrylic-panel rounded-xl p-4 space-y-2">
            <h3 className="text-white font-semibold">About Me</h3>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={4}
              placeholder="Write something about yourself..."
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        ) : (
          <AboutSection bio={user.bio} />
        )}

        {/* Lifestyle & Habits */}
        {isEditing ? (
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Lifestyle & Habits</h3>
            <div className="flex flex-wrap gap-2">
              {LOOKING_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={editTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <LifestyleSection tags={user.lifestyleTags} />
        )}

        {/* Social Verification (non-editable) */}
        {!isEditing && (
          <SocialSection
            isVerified={user.isVerified}
            socialLinks={undefined}
          />
        )}

        {/* Save / Logout Buttons */}
        {isEditing ? (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
            <div className="flex justify-center mt-2">
              <span className="text-xs text-white/40 font-mono select-all">
                User ID: {user.id}
              </span>
            </div>
          </>
        )}
      </div>
    </div >
  );
}
