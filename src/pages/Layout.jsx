import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import UserProvider from '../components/context/UserProvider';
import ReferralTracker from '../components/referrals/ReferralTracker';

const DesignSystemStyles = () => (
  <style jsx global>{`
    :root {
      /* Brand & Primary Colors */
      --primary: 94 83% 54%; /* #7C3AED */
      --primary-foreground: 0 0% 100%; /* #FFFFFF */
      --primary-hover: 94 65% 45%; /* #6D28D9 */
      --secondary: 240 5% 96%; /* #F1F5F9 */
      --secondary-foreground: 240 10% 3.9%; /* #09090B */

      /* Accent & Status Colors */
      --accent: 240 5% 96%;
      --accent-foreground: 240 10% 3.9%;
      --destructive: 0 84% 60%; /* #EF4444 */
      --destructive-foreground: 0 0% 100%;
      --success: 142 71% 45%; /* #22C55E */
      --warning: 48 96% 50%; /* #EAB308 */
      --info: 215 91% 57%; /* #3B82F6 */

      /* Text Colors */
      --text-title: 222 47% 11%; /* #1E293B */
      --text-body: 215 28% 44%; /* #475569 */
      --text-muted: 215 20% 65%; /* #94A3B8 */
      --text-link: 94 83% 54%;

      /* Background & Surface Colors */
      --background: 220 13% 97%; /* #F8FAFC */
      --foreground: 222 47% 11%;
      --surface: 0 0% 100%; /* #FFFFFF */
      
      /* Border & Ring Colors */
      --border: 214 32% 91%; /* #E2E8F0 */
      --ring: 240 5.9% 10%;

      /* Radii */
      --radius: 0.5rem; /* 8px */
    }

    .dark {
      /* Define dark mode colors here if needed in the future */
    }
  `}</style>
);


export default function Layout({ children, currentPageName }) {
    return (
        <UserProvider>
            <DesignSystemStyles />
            <AppLayout>
                {children}
                <ReferralTracker />
            </AppLayout>
        </UserProvider>
    );
}
