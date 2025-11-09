import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, PlusCircle } from 'lucide-react';
import { calculateFinancialSummary, sumExpenseCategory } from './calculations';

export const PERSONAL_EXPENSE_CATEGORIES = [
  {
    key: 'housingUtilities',
    label: 'Housing & Utilities',
    defaultItems: ['Mortgage/Rent', 'Utilities: Electricity', 'Utilities: Gas', 'Internet', 'Mobile Phone', 'Water'],
  },
  {
    key: 'transportation',
    label: 'Transportation',
    defaultItems: ['Car Payment', 'Car Gas/Electricity', 'Car Insurance', 'Car Maintenance'],
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Entertainment',
    defaultItems: ['Streaming Apps', 'Food / Entertainment', 'Travel', 'Shopping & Clothing'],
  },
  {
    key: 'healthcare',
    label: 'Healthcare & Insurance',
    defaultItems: ['Health Insurance'],
  },
  {
    key: 'familyFinancial',
    label: 'Family & Financial',
    defaultItems: ['Child Care', 'Savings', 'Credit Cards'],
  },
  {
    key: 'other',
    label: 'Other',
    defaultItems: ['Other 1', 'Other 2', 'Other 3', 'Other 4', 'Other 5'],
  },
];

export const BUSINESS_EXPENSE_CATEGORIES = [
  {
    key: 'professionalFees',
    label: 'Professional Fees & Dues',
    defaultItems: ['Association Dues/Fees', 'RPAC Contributions', 'MLS Fees', 'MLS Application', 'License Renewals / Applications'],
  },
  {
    key: 'officeInsurance',
    label: 'Office & Insurance',
    defaultItems: ['Office Desk Fees', 'E&O Insurance', 'Additional Brokerage Fees', 'Keycard & Lockbox'],
  },
  {
    key: 'professionalDevelopment',
    label: 'Professional Development',
    defaultItems: ['CE Credits / Certifications', 'Coaching / Training Fees'],
  },
  {
    key: 'marketingOperations',
    label: 'Marketing & Operations',
    defaultItems: ['Marketing & Advertising', 'Printing & Signage', 'Mail & Postage', 'Client Gifts / Events'],
  },
  {
    key: 'technologyStaffing',
    label: 'Technology & Staffing',
    defaultItems: ['Software Subscriptions', 'Payroll / Employees'],
  },
  {
    key: 'other',
    label: 'Other',
    defaultItems: ['Other'],
  },
];

const frequencyOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
];

const ExpenseRow = ({ expense, onChange, onRemove }) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 bg-white/40 rounded-lg border border-slate-200 p-3">
      <div className="flex-1 space-y-1">
        <Label className="text-xs uppercase tracking-wide text-slate-500">Name</Label>
        <Input
          value={expense.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Expense name"
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs uppercase tracking-wide text-slate-500">Amount</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={expense.amount || ''}
          onChange={(e) => onChange('amount', e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs uppercase tracking-wide text-slate-500">Frequency</Label>
        <Select value={expense.frequency} onValueChange={(value) => onChange('frequency', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="self-start rounded-lg border border-transparent p-2 text-slate-500 transition-colors hover:border-red-200 hover:text-red-600"
        aria-label="Remove expense"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const ExpenseCategory = ({
  type,
  category,
  expenses,
  onAdd,
  onChange,
  onRemove,
}) => {
  const annualTotal = sumExpenseCategory(expenses);

  return (
    <AccordionItem value={`${type}-${category.key}`}>
      <AccordionTrigger className="text-left text-base font-semibold text-slate-800">
        <div className="flex w-full items-center justify-between">
          <span>{category.label}</span>
          <span className="text-sm font-medium text-slate-500">
            ${annualTotal.toLocaleString()} / yr
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {(expenses || []).map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onChange={(field, value) => onChange(expense.id, field, value)}
              onRemove={() => onRemove(expense.id)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={onAdd}
          >
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default function Step2Financial({ planData, setPlanData }) {
  const [openAccordions, setOpenAccordions] = React.useState(() => [
    ...PERSONAL_EXPENSE_CATEGORIES.map((c) => `personal-${c.key}`),
    ...BUSINESS_EXPENSE_CATEGORIES.map((c) => `business-${c.key}`)
  ]);

  const financialSummary = useMemo(() => calculateFinancialSummary(planData), [
    planData.personalExpenses,
    planData.businessExpenses,
    planData.netIncomeGoal,
    planData.taxRate,
  ]);

  const handleAddExpense = (type, categoryKey) => {
    setPlanData((prev) => {
      const nextExpenses = { ...(prev[`${type}Expenses`] || {}) };
      const categoryExpenses = [...(nextExpenses[categoryKey] || [])];
      categoryExpenses.push({
        id: `${categoryKey}-${Date.now()}`,
        name: '',
        amount: '',
        frequency: 'monthly',
      });
      nextExpenses[categoryKey] = categoryExpenses;
      return { ...prev, [`${type}Expenses`]: nextExpenses };
    });
  };

  const handleChangeExpense = (type, categoryKey, expenseId, field, value) => {
    setPlanData((prev) => {
      const nextExpenses = { ...(prev[`${type}Expenses`] || {}) };
      const categoryExpenses = nextExpenses[categoryKey] || [];
      const updated = categoryExpenses.map((expense) =>
        expense.id === expenseId ? { ...expense, [field]: value } : expense,
      );
      nextExpenses[categoryKey] = updated;
      return { ...prev, [`${type}Expenses`]: nextExpenses };
    });
  };

  const handleRemoveExpense = (type, categoryKey, expenseId) => {
    setPlanData((prev) => {
      const nextExpenses = { ...(prev[`${type}Expenses`] || {}) };
      nextExpenses[categoryKey] = (nextExpenses[categoryKey] || []).filter((expense) => expense.id !== expenseId);
      return { ...prev, [`${type}Expenses`]: nextExpenses };
    });
  };

  const handleTaxRateChange = (value) => {
    setPlanData((prev) => ({ ...prev, taxRate: Array.isArray(value) ? value[0] : value }));
  };

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Financial Planning</h2>
        <p className="text-sm text-slate-500">
          Estimate your annual personal and business expenses so we can calculate the income you need to support your lifestyle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Personal Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions}>
              {PERSONAL_EXPENSE_CATEGORIES.map((category) => (
                <ExpenseCategory
                  key={category.key}
                  type="personal"
                  category={category}
                  expenses={(planData.personalExpenses || {})[category.key] || []}
                  onAdd={() => handleAddExpense('personal', category.key)}
                  onChange={(expenseId, field, value) =>
                    handleChangeExpense('personal', category.key, expenseId, field, value)
                  }
                  onRemove={(expenseId) => handleRemoveExpense('personal', category.key, expenseId)}
                />
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Business Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions}>
              {BUSINESS_EXPENSE_CATEGORIES.map((category) => (
                <ExpenseCategory
                  key={category.key}
                  type="business"
                  category={category}
                  expenses={(planData.businessExpenses || {})[category.key] || []}
                  onAdd={() => handleAddExpense('business', category.key)}
                  onChange={(expenseId, field, value) =>
                    handleChangeExpense('business', category.key, expenseId, field, value)
                  }
                  onRemove={(expenseId) => handleRemoveExpense('business', category.key, expenseId)}
                />
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Personal Expenses</p>
              <p className="text-2xl font-bold text-slate-900">${financialSummary.personalExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Business Expenses</p>
              <p className="text-2xl font-bold text-slate-900">${financialSummary.businessExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Annual Expenses</p>
              <p className="text-2xl font-bold text-violet-700">${financialSummary.totalExpenses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Estimated Tax Rate</p>
                <p className="text-xs text-slate-500">Adjust your expected effective tax rate.</p>
              </div>
              <span className="text-lg font-semibold text-violet-700">{Math.round(planData.taxRate)}%</span>
            </div>
            <Slider
              value={[Number(planData.taxRate) || 0]}
              min={0}
              max={60}
              step={1}
              onValueChange={handleTaxRateChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">Taxes to Reserve</p>
                <p className="text-lg font-semibold text-slate-900">${Math.round(financialSummary.taxAmount).toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-violet-700">Gross Income Needed</p>
                <p className="text-lg font-semibold text-violet-900">${Math.round(financialSummary.grossIncome).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
