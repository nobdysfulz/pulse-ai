
const toNumber = (value, fallback = 0) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureRate = (value, fallback = 0.01) => {
  const num = toNumber(value, fallback);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }
  if (num <= 0) return fallback;
  if (num > 1 && num <= 100) {
    return num / 100;
  }
  return Math.min(0.99, Math.max(0.01, num));
};

const defaultConversionRates = {
  buyer: {
    conversationToAppointment: 0.25,
    appointmentToAgreement: 0.4,
    agreementToContract: 0.8,
    contractToClose: 0.85,
  },
  listing: {
    conversationToAppointment: 0.3,
    appointmentToAgreement: 0.6,
    agreementToContract: 0.9,
    contractToClose: 0.95,
  },
};

const toAnnualAmount = (amount, frequency) => {
  const value = toNumber(amount);
  if (!value) return 0;
  return frequency === 'monthly' ? value * 12 : value;
};

export const initializeExpenseCategories = (categories) => {
  return categories.reduce((acc, category) => {
    acc[category.key] = category.defaultItems?.map((item, index) => ({
      id: `${category.key}-${index}`,
      name: item,
      amount: '',
      frequency: 'monthly',
    })) || [];
    return acc;
  }, {});
};

export const sumExpenseCategory = (items = []) => {
  return items.reduce((total, item) => {
    return total + toAnnualAmount(item.amount, item.frequency);
  }, 0);
};

export const calculateFinancialSummary = (planData) => {
  const personalTotal = Object.values(planData.personalExpenses || {}).reduce(
    (sum, category) => sum + sumExpenseCategory(category),
    0,
  );

  const businessTotal = Object.values(planData.businessExpenses || {}).reduce(
    (sum, category) => sum + sumExpenseCategory(category),
    0,
  );

  const netIncomeGoal = Math.max(0, toNumber(planData.netIncomeGoal));
  const taxRateDecimal = Math.min(0.99, Math.max(0, toNumber(planData.taxRate) / 100));
  const grossIncome = taxRateDecimal >= 0.99 ? netIncomeGoal : netIncomeGoal / (1 - taxRateDecimal);
  const taxAmount = Math.max(0, grossIncome - netIncomeGoal);
  const totalExpenses = personalTotal + businessTotal;
  const gciRequired = grossIncome + totalExpenses;

  return {
    personalExpenses: personalTotal,
    businessExpenses: businessTotal,
    totalExpenses,
    taxAmount,
    grossIncome,
    gciRequired,
    netIncomeGoal,
    taxRateDecimal,
  };
};

export const calculateDealStructure = (planData, financialSummary) => {
  const avgSalePrice = Math.max(0, toNumber(planData.avgSalePrice, 0));
  const commissionRate = Math.max(0, toNumber(planData.commissionRate, 0)) / 100;
  const incomeSplit = Math.max(0, Math.min(1, toNumber(planData.incomeSplit, 0) / 100));
  const buyerSplit = Math.max(0, Math.min(1, toNumber(planData.buyerSellerSplit, 60) / 100));
  const sellerSplit = 1 - buyerSplit;

  const teamSplitBuyers = Math.max(0, Math.min(1, toNumber(planData.teamSplitBuyers, 0) / 100));
  const teamSplitSellers = Math.max(0, Math.min(1, toNumber(planData.teamSplitSellers, 0) / 100));

  const grossCommission = avgSalePrice * commissionRate;
  const baseNet = grossCommission * incomeSplit;
  const buyerNet = baseNet * (1 - teamSplitBuyers);
  const sellerNet = baseNet * (1 - teamSplitSellers);
  const estimatedNetCommissionPerDeal = buyerNet * buyerSplit + sellerNet * sellerSplit;

  const gciRequired = financialSummary.gciRequired;
  const totalDealsNeeded = estimatedNetCommissionPerDeal > 0
    ? Math.max(1, Math.ceil(gciRequired / estimatedNetCommissionPerDeal))
    : 0;
  const buyerTransactions = totalDealsNeeded > 0 ? Math.max(0, Math.ceil(totalDealsNeeded * buyerSplit)) : 0;
  const listingTransactions = totalDealsNeeded > 0 ? Math.max(0, Math.ceil(totalDealsNeeded * sellerSplit)) : 0;
  const totalSalesVolume = totalDealsNeeded * avgSalePrice;

  return {
    avgSalePrice,
    commissionRate,
    incomeSplit,
    buyerSplit,
    sellerSplit,
    grossCommission,
    estimatedNetCommissionPerDeal,
    totalDealsNeeded,
    buyerTransactions,
    listingTransactions,
    totalSalesVolume,
  };
};

const reverseEngineerFunnel = (closingsNeeded, rates) => {
  const contractRate = ensureRate(rates.contractToClose, defaultConversionRates.buyer.contractToClose);
  const agreementRate = ensureRate(rates.agreementToContract, defaultConversionRates.buyer.agreementToContract);
  const appointmentRate = ensureRate(rates.appointmentToAgreement, defaultConversionRates.buyer.appointmentToAgreement);
  const conversationRate = ensureRate(rates.conversationToAppointment, defaultConversionRates.buyer.conversationToAppointment);

  const contractsNeeded = Math.max(0, Math.ceil(closingsNeeded / contractRate));
  const agreementsNeeded = Math.max(0, Math.ceil(contractsNeeded / agreementRate));
  const appointmentsNeeded = Math.max(0, Math.ceil(agreementsNeeded / appointmentRate));
  const conversationsNeeded = Math.max(0, Math.ceil(appointmentsNeeded / conversationRate));

  return {
    conversations: conversationsNeeded,
    appointments: appointmentsNeeded,
    agreements: agreementsNeeded,
    contracts: contractsNeeded,
    closings: closingsNeeded,
  };
};

export const calculateActivityTargets = (dealStructure, planData) => {
  const buyerRates = planData.conversionRates?.buyer || defaultConversionRates.buyer;
  const listingRates = planData.conversionRates?.listing || defaultConversionRates.listing;

  const buyerFunnel = reverseEngineerFunnel(dealStructure.buyerTransactions, buyerRates);
  const listingFunnel = reverseEngineerFunnel(dealStructure.listingTransactions, listingRates);

  const totals = {
    conversations: buyerFunnel.conversations + listingFunnel.conversations,
    appointments: buyerFunnel.appointments + listingFunnel.appointments,
    agreements: buyerFunnel.agreements + listingFunnel.agreements,
    contracts: buyerFunnel.contracts + listingFunnel.contracts,
    closings: buyerFunnel.closings + listingFunnel.closings,
  };

  const monthly = {
    conversations: Math.ceil(totals.conversations / 12),
    appointments: Math.ceil(totals.appointments / 12),
    agreements: Math.ceil(totals.agreements / 12),
    contracts: Math.ceil(totals.contracts / 12),
    closings: Math.ceil(totals.closings / 12),
  };

  return {
    buyer: buyerFunnel,
    listing: listingFunnel,
    totals,
    monthly,
  };
};

export const calculatePlanTargets = (planData) => {
  const financialSummary = calculateFinancialSummary(planData);
  const dealStructure = calculateDealStructure(planData, financialSummary);
  const activityTargets = calculateActivityTargets(dealStructure, planData);

  return {
    financialSummary,
    dealStructure,
    activityTargets,
    gciRequired: financialSummary.gciRequired,
    totalDealsNeeded: dealStructure.totalDealsNeeded,
    buyerDeals: dealStructure.buyerTransactions,
    listingDeals: dealStructure.listingTransactions,
    totalSalesVolume: dealStructure.totalSalesVolume,
    totalConversations: activityTargets.totals.conversations,
    totalAppointments: activityTargets.totals.appointments,
    totalAgreements: activityTargets.totals.agreements,
    totalContracts: activityTargets.totals.contracts,
    totalClosings: activityTargets.totals.closings,
    monthlyBreakdown: activityTargets.monthly,
  };
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
};

export const clampRate = (value) => {
  const num = toNumber(value, 0);
  if (num > 1) return Math.min(99, Math.max(1, num));
  return Math.min(0.99, Math.max(0.01, num));
};

export const updateConversionRate = (existingRates = defaultConversionRates, path, newValue) => {
  const [side, metric] = path.split('.');
  const updatedValue = clampRate(newValue);

  return {
    ...existingRates,
    [side]: {
      ...existingRates[side],
      [metric]: updatedValue > 1 ? updatedValue / 100 : updatedValue,
    },
  };
};

export const getDefaultConversionRates = () => defaultConversionRates;
