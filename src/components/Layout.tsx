import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Heart, Gift, BookHeart } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col font-sans bg-love-50 selection:bg-love-200 selection:text-love-900">
            {/* Background Decor - Animated Orbs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-love-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-love-100/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

            {/* Additional texture or noise could be added here for more richness, skipping for now */}

            {/* Main Content Area - with smooth fade in */}
            <main className="flex-1 w-full max-w-md mx-auto p-5 z-10 pb-28 animate-in fade-in duration-500">
                <Outlet />
            </main>

            {/* Bottom Navigation Dock */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[90%] z-50">
                <div className="glass-panel px-6 py-3 flex justify-between items-center shadow-love-200/20 shadow-2xl border-white/50">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${isActive ? 'text-love-500 bg-white/50 shadow-sm' : 'text-gray-400 hover:text-love-400'}`}
                    >
                        {({ isActive }) => (
                            <>
                                <BookHeart size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[10px] font-bold mt-1">日记</span>
                                {isActive && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 bg-love-500 rounded-full" />}
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        to="/rewards"
                        className={({ isActive }) => `relative -mt-8 mx-2 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-love-400 to-love-500 text-white shadow-lg shadow-love-300/50 transition-transform duration-300 ${isActive ? 'scale-110 ring-4 ring-white/30' : 'hover:-translate-y-1'}`}
                    >
                        {() => (
                            <>
                                <Heart size={32} fill="white" className="animate-pulse" />
                                <span className="text-[10px] font-bold mt-0.5 opacity-90">小红花</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        to="/gifts"
                        className={({ isActive }) => `relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${isActive ? 'text-love-500 bg-white/50 shadow-sm' : 'text-gray-400 hover:text-love-400'}`}
                    >
                        {({ isActive }) => (
                            <>
                                <Gift size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[10px] font-bold mt-1">礼物</span>
                                {isActive && <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 bg-love-500 rounded-full" />}
                            </>
                        )}
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default Layout;
