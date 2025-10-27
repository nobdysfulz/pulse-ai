import React, { useState, useContext } from 'react';
import { UserContext } from '../../../context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function PhoneNumberSetup({ data, onNext, onBack }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [areaCode, setAreaCode] = useState(data.areaCode || '');
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(data.selectedNumber || null);

  const searchNumbers = async () => {
    if (!areaCode || areaCode.length !== 3) {
      toast.error('Please enter a valid 3-digit area code');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('getTwilioAvailableNumbers', {
        areaCode: areaCode
      });

      if (response.data && response.data.numbers) {
        setAvailableNumbers(response.data.numbers);
      } else {
        toast.error('No numbers found in this area code');
      }
    } catch (error) {
      console.error('Error searching numbers:', error);
      toast.error('Failed to search for numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNumber = (number) => {
    setSelectedNumber(number);
  };

  const handleContinue = async () => {
    if (!selectedNumber) {
      toast.error('Please select a phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('purchaseTwilioNumber', {
        phoneNumber: selectedNumber
      });

      if (response.data && response.data.success) {
        toast.success('Phone number purchased successfully!');
        onNext({ selectedNumber, phoneNumberSid: response.data.phoneNumberSid });
      } else {
        toast.error('Failed to purchase phone number');
      }
    } catch (error) {
      console.error('Error purchasing number:', error);
      toast.error('Failed to purchase phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
          Set Up Your Call Center Number
        </h2>
        <p className="text-[#64748B]">
          Choose a dedicated phone number for your AI calling agent
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] space-y-6 mb-8">
        <div>
          <Label htmlFor="areaCode">Search by Area Code</Label>
          <div className="flex gap-3 mt-2">
            <Input
              id="areaCode"
              placeholder="Enter 3-digit area code (e.g., 212)"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              maxLength={3}
            />
            <Button onClick={searchNumbers} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {availableNumbers.length > 0 && (
          <div>
            <Label>Available Numbers</Label>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {availableNumbers.map((number, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectNumber(number)}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    selectedNumber === number
                      ? 'border-[#7C3AED] bg-[#7C3AED]/5'
                      : 'border-[#E2E8F0] hover:border-[#7C3AED]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#7C3AED]" />
                    <span className="font-medium">{number}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedNumber || loading}
          size="lg"
          className="bg-gradient-to-r from-[#E4018B] to-[#7017C3] hover:opacity-90 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Continue
        </Button>
      </div>
    </div>
  );
}