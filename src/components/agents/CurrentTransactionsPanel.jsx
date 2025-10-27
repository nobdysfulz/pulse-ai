import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Transaction } from '@/api/entities';
import { Loader2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function CurrentTransactionsPanel() {
  const { user } = useContext(UserContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const items = await Transaction.filter({
        userId: user.id,
        status: { $in: ['under_contract', 'pending'] }
      }, '-created_date');
      setTransactions(items || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] mb-1">Active Transactions</h3>
        <p className="text-xs text-[#64748B] mb-4">
          Your current deals in progress
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
          <p className="text-sm text-[#64748B]">No active transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-[#1E293B] mb-1">
                    {transaction.propertyAddress}
                  </h4>
                  <p className="text-xs text-[#64748B] mb-2">
                    {transaction.clientName}
                  </p>
                  {transaction.contractDate && (
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[#64748B]">Contract:</span>
                        <span className="text-[#475569] ml-1 font-medium">
                          {format(new Date(transaction.contractDate), 'MMM d')}
                        </span>
                      </div>
                      {transaction.closingDate && (
                        <div>
                          <span className="text-[#64748B]">Closing:</span>
                          <span className="text-[#475569] ml-1 font-medium">
                            {format(new Date(transaction.closingDate), 'MMM d')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}