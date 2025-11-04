
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Gift, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Referral } from '@/api/entities';
import { format } from 'date-fns';

export default function ReferralTab({ user }) {
  const [referrals, setReferrals] = useState([]);
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  // Generate referral link with correct signup URL
  const referralLink = `https://pulse.pwru.app/?ref=${user?.id}`;

  const loadReferralData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const referralData = await Referral.filter({ referrerId: user.id }, '-referralDate');
      setReferrals(Array.isArray(referralData) ? referralData : []);

      const totalCredits = (referralData || []).reduce((sum, ref) => sum + (ref.creditsAwarded || 0), 0);
      setTotalCreditsEarned(totalCredits);
    } catch (error) {
      console.error("Failed to load referral data:", error);
      setReferrals([]);
      setTotalCreditsEarned(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Referral link copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const shareOnSocial = (platform) => {
    const message = encodeURIComponent("Join me on PWRU - the ultimate real estate coaching platform! Use my referral link to get started:");
    const url = encodeURIComponent(referralLink);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${message}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-slate-900 mb-2 text-xl font-semibold">Share & Earn Credits</h2>
        <p className="text-slate-600">Share your link with others and earn 5 credits for each sign-up</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-slate-900">{referrals.length}</div>
            <div className="text-sm text-slate-600">Successful Referrals</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-slate-900">{totalCreditsEarned}</div>
            <div className="text-sm text-slate-600">Credits Earned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <ExternalLink className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-slate-900">5</div>
            <div className="text-sm text-slate-600">Credits Per Referral</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-xl font-medium leading-none tracking-tight">Your Share Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1" />

            <Button
              onClick={() => copyToClipboard(referralLink)}
              variant="outline">

              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Share your referral link and earn 5 credits when someone signs up using your link. 
              Credits are awarded automatically when the new user completes registration.
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareOnSocial('twitter')}>

                Share on Twitter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareOnSocial('facebook')}>

                Share on Facebook
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => shareOnSocial('linkedin')}>

                Share on LinkedIn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-lg font-medium leading-none tracking-tight">Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ?
          <div className="text-center py-4">Loading...</div> :
          referrals.length > 0 ?
          <div className="space-y-3">
              {referrals.map((referral) =>
            <div key={referral.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">
                      {referral.referredUserEmail}
                    </div>
                    <div className="text-sm text-slate-600">
                      Referred on {format(new Date(referral.referralDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      +{referral.creditsAwarded} credits
                    </Badge>
                    <Badge
                  className={
                  referral.status === 'completed' ?
                  'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                  }>

                      {referral.status}
                    </Badge>
                  </div>
                </div>
            )}
            </div> :

          <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No referrals yet</h3>
              <p className="text-slate-600 mb-4">Start sharing your referral link to earn credits!</p>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}