import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const personalExpenseFields = [
"Mortgage/Rent", "Car Payment", "Car Gas/Electricity", "Car Insurance", "Car Maintenance", "Utilities: Electricity", "Utilities: Gas", "Internet", "Mobile Phone", "Water", "Streaming Apps", "Food / Entertainment", "Travel", "Child Care", "Savings", "Health Insurance", "Credit Cards", "Shopping & Clothing", "Other 1", "Other 2", "Other 3", "Other 4", "Other 5"];


const businessExpenseFields = [
"Association Dues/Fees", "RPAC Contributions", "MLS Fees", "MLS Application", "Office Desk Fees", "License Renewals / Applications", "E&O Insurance", "CE Credits / Certifications", "Marketing & Advertising", "Keycard & Lockbox", "Additional Brokerage Fees", "Coaching / Training Fees", "Printing & Signage", "Mail & Postage", "Payroll / Employees", "Software Subscriptions", "Client Gifts / Events", "Other"];


const ExpenseInput = ({ name, value, frequency, onValueChange, onFrequencyChange }) =>
<div className="flex items-center gap-2">
        <Label className="w-1/2 text-sm">{name}</Label>
        <Input type="number" value={value} onChange={onValueChange} placeholder="0" className="bg-white text-[#1E293B] pt-2 pr-3 pb-2 pl-3 text-sm rounded-lg flex h-10 w-full border border-[#E2E8F0] placeholder:text-[#94A3B8] focus:outline-none focus:ring-0 focus:border-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F8FAFC] flex-1" />
        <Select value={frequency} onValueChange={onFrequencyChange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
        </Select>
    </div>;


export default function Step2Financial({ planData, setPlanData }) {
  const handleExpenseChange = (type, name, field, value) => {
    setPlanData((prev) => ({
      ...prev,
      [`${type}Expenses`]: {
        ...prev[`${type}Expenses`],
        [name]: {
          ...prev[`${type}Expenses`][name],
          [field]: value
        }
      }
    }));
  };

  const calculateTotal = (expenses) => {
    return Object.values(expenses).reduce((total, item) => {
      const amount = parseFloat(item?.amount) || 0;
      if (item?.frequency === 'monthly') {
        return total + amount * 12;
      }
      return total + amount;
    }, 0);
  };

  const totalPersonal = calculateTotal(planData.personalExpenses);
  const totalBusiness = calculateTotal(planData.businessExpenses);
  const taxReserve = (planData.netIncomeGoal + totalPersonal) / (1 - planData.taxRate / 100) - (planData.netIncomeGoal + totalPersonal);
  const totalIncomeNeeded = planData.netIncomeGoal + totalPersonal + totalBusiness + taxReserve;

  return (
    <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Financial Planning</h2>
                <p className="text-gray-500">Estimate your personal and business expenses for the year.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Expenses */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Expenses</h3>
                    <div className="space-y-3">
                        {personalExpenseFields.map((field) =>
            <ExpenseInput
              key={field}
              name={field}
              value={planData.personalExpenses[field]?.amount || ''}
              frequency={planData.personalExpenses[field]?.frequency || 'monthly'}
              onValueChange={(e) => handleExpenseChange('personal', field, 'amount', e.target.value)}
              onFrequencyChange={(val) => handleExpenseChange('personal', field, 'frequency', val)} />

            )}
                    </div>
                </div>

                {/* Business Expenses */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Expenses</h3>
                     <div className="space-y-3">
                        {businessExpenseFields.map((field) =>
            <ExpenseInput
              key={field}
              name={field}
              value={planData.businessExpenses[field]?.amount || ''}
              frequency={planData.businessExpenses[field]?.frequency || 'annually'}
              onValueChange={(e) => handleExpenseChange('business', field, 'amount', e.target.value)}
              onFrequencyChange={(val) => handleExpenseChange('business', field, 'frequency', val)} />

            )}
                    </div>
                </div>
            </div>
            
             {/* Totals and Tax Planning */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Total Annual Personal Expenses:</h3>
                    <p className="text-2xl font-bold">${totalPersonal.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Total Annual Business Expenses:</h3>
                    <p className="text-2xl font-bold">${totalBusiness.toLocaleString()}</p>
                </div>
            </div>

            <div className="lg:w-1/2 mx-auto pt-8">
                <h3 className="text-lg font-semibold text-center mb-4">Tax Planning</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="taxRate" className="w-1/2 text-sm">Estimated Tax Rate (%)</Label>
                        <Input
              id="taxRate"
              type="number"
              value={planData.taxRate}
              onChange={(e) => setPlanData({ ...planData, taxRate: parseFloat(e.target.value) || 0 })}
              className="flex-1" />

                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center space-y-4">
                        <div>
                            <p className="text-sm">Tax Reserve:</p>
                            <p className="font-bold text-lg">${Math.round(taxReserve).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-950 text-sm">Total Income Needed:</p>
                            <p className="text-violet-900 text-2xl font-bold">${Math.round(totalIncomeNeeded).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>);

}