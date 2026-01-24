import { Outlet } from 'react-router-dom';
import { BottomNav } from '../ui/BottomNav';

export function AppShell() {
  return (
    <div 
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0f1a23' }}
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Primary Glow */}
        <div 
          className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-70 mix-blend-screen animate-pulse-slow" 
          style={{ backgroundColor: 'rgba(0, 121, 214, 0.2)' }}
        />
        
        {/* Purple Accent */}
        <div className="absolute top-[40%] -left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] opacity-50 mix-blend-screen" />
        
        {/* Blue Accent */}
        <div className="absolute -bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-900/30 rounded-full blur-[80px] opacity-60" />
        
        {/* Grain Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      
      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-hidden pb-24">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
