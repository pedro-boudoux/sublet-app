import { Header } from '../components/layout/Header';

export function DiscoverPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      
      {/* Card Stack Area - Placeholder */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center text-white/60">
          <p className="text-lg font-medium mb-2">Discovery Feed</p>
          <p className="text-sm">Card swiping will be implemented in Phase 3</p>
        </div>
      </div>
    </div>
  );
}
