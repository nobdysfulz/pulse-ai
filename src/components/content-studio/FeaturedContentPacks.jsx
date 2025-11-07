import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Lock } from 'lucide-react';
import { FeaturedContentPack } from '@/api/entities';
import { toast } from 'sonner';
import { UserContext } from '@/components/context/UserContext';
import { Badge } from '@/components/ui/badge';
import InsufficientCreditsModal from '../credits/InsufficientCreditsModal';

export default function FeaturedContentPacks() {
  const { user } = useContext(UserContext);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isSubscriber = user?.subscriptionTier === 'Subscriber' || user?.subscriptionTier === 'Admin';

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const data = await FeaturedContentPack.filter({ isActive: true }, 'sortOrder');
      setPacks(data);
    } catch (error) {
      console.error('Failed to load featured packs:', error);
      toast.error("Could not load content packs.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (pack) => {
    if (pack.isPremium && !isSubscriber) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Get URL from contentItems array
    const url = pack.contentItems?.[0]?.url;
    if (!url) {
      toast.error("No download link available for this pack");
      return;
    }
    
    window.open(url, '_blank');
    toast.success(`Opening ${pack.title}...`);
  };

  return (
    <>
      <Card className="bg-white border-0">
        <CardContent className="space-y-4 pt-6">
          {loading ? (
            <p className="text-center text-[#475569] py-8">Loading packs...</p>
          ) : packs.length === 0 ? (
            <p className="text-[#64748B] py-8 text-xs text-center">No packs available</p>
          ) : (
            packs.map((pack) => {
              const isLocked = pack.isPremium && !isSubscriber;
              const contentType = pack.contentItems?.[0]?.type || 'link';
              const Icon = contentType === 'link' ? ExternalLink : Download;

              return (
                <div
                  key={pack.id}
                  onClick={() => handleClick(pack)}
                  className="p-4 rounded-lg border border-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#F8FAFC] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#1E293B] text-sm font-medium">{pack.title}</h4>
                        {pack.isPremium && <Badge className="bg-[#7C3AED] text-white">Premium</Badge>}
                      </div>
                      <p className="text-[#475569] mt-1 text-xs">{pack.description}</p>
                      {(pack.socialNetworks || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {pack.socialNetworks.map((net) => (
                            <Badge key={net} variant="secondary">{net}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      className="flex-shrink-0"
                      size="icon"
                      disabled={isLocked && contentType === 'file'}
                    >
                      {isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      <InsufficientCreditsModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}