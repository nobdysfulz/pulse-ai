import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
};

export const MobileRestrictionMessage = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-4 text-center">
        <Smartphone className="w-16 h-16 text-slate-500 mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Feature Not Available on Mobile</h2>
        <p className="text-slate-600 max-w-md">
            The Role-Play Simulator requires a larger screen for the best experience. Please switch to a desktop or tablet to access this feature.
        </p>
    </div>
);