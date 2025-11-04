
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingUp, Home, DollarSign, Calendar, Send, Sparkles, Download, Printer, RefreshCw, AlertCircle, MessageSquare, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import LoadingIndicator from "../components/ui/LoadingIndicator";
import { InlineLoadingIndicator } from "../components/ui/LoadingIndicator";
import MarketConfigForm from '../components/market/MarketConfigForm';
import { UserMarketConfig } from '@/api/entities';


// --- NEW COMPONENT FOR FORMATTING JSON ANALYSIS ---
const FormattedAnalysis = ({ analysis }) => {
  if (!analysis) {
    return <p className="text-sm text-center text-gray-500">No analysis data available.</p>;
  }

  let parsedAnalysis;
  try {
    parsedAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
  } catch (error) {
    console.error("Failed to parse market analysis JSON:", error);
    return (
      <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
        <AlertCircle className="mx-auto h-6 w-6 mb-2" />
        <p className="text-sm font-semibold">Could not display analysis.</p>
        <p className="text-xs">The data format is invalid.</p>
      </div>);

  }

  const {
    summary,
    price_trends,
    market_velocity,
    inventory_analysis,
    sales_data,
    coaching_insights,
    talking_points
  } = parsedAnalysis;

  const renderMetric = (label, value, change) => {
    if (value === undefined || value === null) return null;
    return (
      <div className="py-2 border-b border-gray-200 last:border-b-0">
        <p className="text-gray-500 text-xs">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-base font-semibold text-gray-800">{value}</p>
          {change !== undefined && typeof change === 'number' &&
          <p className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </p>
          }
        </div>
      </div>);

  };

  return (
    <div className="space-y-4 text-sm">
      {summary &&
      <Card>
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4"><p className="text-gray-600">{summary}</p></CardContent>
        </Card>
      }

      <Card>
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-base">Key Metrics</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          {price_trends && renderMetric("Median Price", `$${price_trends.median_price_current?.toLocaleString()}`, price_trends.median_price_yoy_change)}
          {market_velocity && renderMetric("Days on Market", market_velocity.average_days_on_market, market_velocity.dom_yoy_change)}
          {inventory_analysis && renderMetric("Months of Supply", inventory_analysis.months_of_supply, inventory_analysis.inventory_yoy_change)}
          {sales_data && renderMetric("Homes Sold (Last Month)", sales_data.total_homes_sold, sales_data.closed_sales_yoy_change)}
        </CardContent>
      </Card>

      {coaching_insights && coaching_insights.length > 0 &&
      <Card>
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-base">Coaching Insights</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-3">
              {coaching_insights.map((insight, index) =>
            <li key={index} className="border-l-4 pl-3 py-1 text-xs" style={{ borderColor: insight.insight_type && (insight.insight_type.includes('Seller') ? '#3B82F6' : '#16A34A') }}>
                   <p className="text-gray-700 text-sm font-semibold">{insight.insight_type}</p>
                   <p className="text-gray-600 text-sm">{insight.description}</p>
                </li>
            )}
            </ul>
          </CardContent>
        </Card>
      }

      {talking_points &&
      <Card>
          <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-base">Talking Points</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {talking_points.for_sellers &&
          <div>
                <p className="text-gray-700 mb-1 text-sm font-semibold">For Sellers:</p>
                <div className="prose prose-sm max-w-none text-gray-600"><ReactMarkdown>{talking_points.for_sellers}</ReactMarkdown></div>
              </div>
          }
            {talking_points.for_buyers &&
          <div>
                <p className="font-semibold text-gray-700 mb-1">For Buyers:</p>
                <div className="prose prose-sm max-w-none text-gray-600"><ReactMarkdown>{talking_points.for_buyers}</ReactMarkdown></div>
              </div>
          }
          </CardContent>
        </Card>
      }
    </div>);

};


export default function MarketPage() {
  const { user, marketConfig, loading: contextLoading, refreshUserData } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('data');
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [marketError, setMarketError] = useState(null);
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const parsedAnalysis = useMemo(() => {
    if (!marketData?.rawResponse) return null;
    try {
      return JSON.parse(marketData.rawResponse);
    } catch (e) {
      console.error("Failed to parse market data response:", e);
      return null;
    }
  }, [marketData]);

  // Removed static chart data (priceData and activityData)

  const tabs = [
  { id: 'data', label: 'Data' },
  { id: 'insights', label: 'Insights' },
  { id: 'comparisons', label: 'Comparisons' },
  { id: 'settings', label: 'Settings' }];



  useEffect(() => {
    console.log('[Market Page] Context loading:', contextLoading);
    console.log('[Market Page] User:', user?.email);
    console.log('[Market Page] Market Config:', marketConfig);
    
    if (!contextLoading && user) {
      loadMarketData();
    }
  }, [contextLoading, user, marketConfig]);


  const loadMarketData = async () => {
    setLoading(true);
    setMarketError(null);
    try {
      const response = await supabase.functions.invoke('marketDataFetcher', { body: {} });
      if (response.data?.marketData) {
        const payload = response.data.marketData;
        setMarketData({
          ...payload,
          rawResponse: JSON.stringify(payload.rawData ?? {}),
        });
      } else {
        setMarketData(null);
      }

      if (response.data?.error) {
        setMarketError(response.data.error);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      setMarketError(error.message ?? 'Failed to load market data');
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const canGenerateReport = () => {
    if (!marketData) return true; // No previous report, allow generation
    
    const lastGeneratedDate = new Date(marketData.created_date);
    const now = new Date();
    const daysSinceLastGeneration = Math.floor((now - lastGeneratedDate) / (1000 * 60 * 60 * 24));

    // Admin: no restrictions
    if (user.subscriptionTier === 'Admin' || user.role === 'admin') {
      return true;
    }

    // Subscriber: 7 days
    if (user.subscriptionTier === 'Subscriber') {
      return daysSinceLastGeneration >= 7;
    }

    // Free: 30 days
    return daysSinceLastGeneration >= 30;
  };

  const getDaysUntilNextRefresh = () => {
    if (!marketData) return 0;
    
    const lastGeneratedDate = new Date(marketData.created_date);
    const now = new Date();
    const daysSinceLastGeneration = Math.floor((now - lastGeneratedDate) / (1000 * 60 * 60 * 24));

    if (user.subscriptionTier === 'Admin' || user.role === 'admin') return 0;
    if (user.subscriptionTier === 'Subscriber') return Math.max(0, 7 - daysSinceLastGeneration);
    return Math.max(0, 30 - daysSinceLastGeneration);
  };

  const handleGenerateReport = async () => {
    console.log('[Market Page] ========== GENERATE REPORT START ==========');
    console.log('[Market Page] User:', user);
    console.log('[Market Page] Market Config from Context:', marketConfig);
    
    // Use marketConfig from context
    let configToUse = marketConfig;
    
    if (!configToUse) {
      console.error('[Market Page] No market config found anywhere');
      toast.error("Please set your market territory in Settings first.");
      return;
    }

    if (!configToUse.primaryTerritory) {
      console.error('[Market Page] Market config exists but no primaryTerritory:', configToUse);
      toast.error("Please set your market territory in Settings first.");
      return;
    }

    if (!canGenerateReport()) {
      const daysLeft = getDaysUntilNextRefresh();
      const tierLimit = user.subscriptionTier === 'Subscriber' ? '7 days' : '30 days';
      toast.error(`You can refresh your market data every ${tierLimit}. Next refresh available in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`);
      return;
    }

    console.log('[Market Page] Generating report for:', configToUse.primaryTerritory);
    setGeneratingReport(true);
    
    try {
      const response = await supabase.functions.invoke('marketDataFetcher', { body: {} });
      if (response.data?.marketData) {
        const payload = response.data.marketData;
        setMarketData({
          ...payload,
          rawResponse: JSON.stringify(payload.rawData ?? {}),
        });
        toast.success('Market report refreshed');
      } else {
        toast.error('No market data returned');
      }

      if (response.data?.error) {
        setMarketError(response.data.error);
        toast.warning('Market data refreshed with warnings');
      }

    } catch (error) {
      console.error('[Market Page] Error generating market report:', error);
      toast.error(error.message || 'Failed to generate market report');
    } finally {
      setGeneratingReport(false);
      console.log('[Market Page] ========== GENERATE REPORT END ==========');
    }
  };

  const drawTable = (doc, startY, headers, data) => {
    let y = startY;
    const cellPadding = 3;
    const lineHeight = 8;
    const colWidths = [60, 60, 60];
    const margin = 14;

    // Draw header
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(71, 85, 105); // #475569
    doc.rect(margin, y, colWidths.reduce((a, b) => a + b), lineHeight, 'F');
    doc.setTextColor(255, 255, 255);
    headers.forEach((header, i) => {
      doc.text(header, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, y + lineHeight / 2, { verticalAlign: 'middle' });
    });
    y += lineHeight;

    // Draw body
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    data.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        doc.setFillColor(241, 245, 249); // #F1F5F9
        doc.rect(margin, y, colWidths.reduce((a, b) => a + b), lineHeight, 'F');
      }

      row.forEach((cell, i) => {
        doc.text(String(cell), margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, y + lineHeight / 2, { verticalAlign: 'middle' });
      });
      y += lineHeight;
    });

    return y;
  };

  const handleDownloadPDF = () => {
    if (!marketData?.rawResponse) {
      toast.info("No market data to download.");
      return;
    }

    try {
      const parsedAnalysis = JSON.parse(marketData.rawResponse);
      const doc = new jsPDF();
      let yOffset = 20;

      doc.setFontSize(20);
      doc.text(`Market Report for ${marketConfig?.primaryTerritory || 'Your Market'}`, 14, yOffset);
      yOffset += 15;

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, 14, yOffset);
      yOffset += 15;

      if (parsedAnalysis.summary) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("Summary", 14, yOffset);
        yOffset += 8;
        doc.setFontSize(10);
        doc.setTextColor(100);
        const summaryLines = doc.splitTextToSize(parsedAnalysis.summary, 180);
        doc.text(summaryLines, 14, yOffset);
        yOffset += summaryLines.length * 5 + 10;
      }

      const tableHeaders = ['Metric', 'Value', 'YoY Change'];
      const metricsData = [
      ['Median Price', `$${parsedAnalysis.price_trends?.median_price_current?.toLocaleString() || 'N/A'}`, `${parsedAnalysis.price_trends?.median_price_yoy_change || 'N/A'}%`],
      ['Days on Market', parsedAnalysis.market_velocity?.average_days_on_market || 'N/A', `${parsedAnalysis.market_velocity?.dom_yoy_change || 'N/A'}%`],
      ['Months of Supply', parsedAnalysis.inventory_analysis?.months_of_supply || 'N/A', `${parsedAnalysis.inventory_analysis?.inventory_yoy_change || 'N/A'}%`],
      ['Homes Sold (Last Month)', parsedAnalysis.sales_data?.total_homes_sold || 'N/A', `${parsedAnalysis.sales_data?.closed_sales_yoy_change || 'N/A'}%`]];


      yOffset = drawTable(doc, yOffset, tableHeaders, metricsData);
      yOffset += 15;

      if (parsedAnalysis.coaching_insights && parsedAnalysis.coaching_insights.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("Coaching Insights", 14, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.setTextColor(100);
        parsedAnalysis.coaching_insights.forEach((insight) => {
          doc.setFont(undefined, 'bold');
          doc.text(`• ${insight.insight_type}:`, 14, yOffset);
          yOffset += 5;
          doc.setFont(undefined, 'normal');
          const insightLines = doc.splitTextToSize(insight.description, 170);
          doc.text(insightLines, 20, yOffset);
          yOffset += insightLines.length * 5 + 5;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
        });
        yOffset += 15;
      }

      if (parsedAnalysis.talking_points) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("How to Talk About It", 14, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.setTextColor(100);

        if (parsedAnalysis.talking_points.for_sellers) {
          doc.setFont(undefined, 'bold');
          doc.text("For Sellers:", 14, yOffset);
          yOffset += 5;
          doc.setFont(undefined, 'normal');
          const sellerLines = doc.splitTextToSize(parsedAnalysis.talking_points.for_sellers, 170);
          doc.text(sellerLines, 20, yOffset);
          yOffset += sellerLines.length * 5 + 5;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
        }

        if (parsedAnalysis.talking_points.for_buyers) {
          doc.setFont(undefined, 'bold');
          doc.text("For Buyers:", 14, yOffset);
          yOffset += 5;
          doc.setFont(undefined, 'normal');
          const buyerLines = doc.splitTextToSize(parsedAnalysis.talking_points.for_buyers, 170);
          doc.text(buyerLines, 20, yOffset);
          yOffset += buyerLines.length * 5 + 5;
          if (yOffset > 270) {
            doc.addPage();
            yOffset = 20;
          }
        }
      }

      doc.save(`market_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Market report downloaded as PDF.");

    } catch (e) {
      console.error("PDF generation failed:", e);
      toast.error("Failed to generate PDF. Data may be corrupt.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = advisorQuery.trim();
    if (!messageText) return;

    const userMessage = { role: 'user', content: messageText };
    const updatedHistory = [...chatMessages, userMessage];

    setChatMessages(updatedHistory);
    setAdvisorQuery('');
    setSendingMessage(true);

    try {
      const { data: agentContext, error: contextError } = await supabase.functions.invoke('getAgentContext', { body: {} });
      if (contextError || agentContext?.error || !agentContext) {
        throw new Error(agentContext?.error || contextError?.message || 'Could not retrieve agent context.');
      }

      const { data, error } = await supabase.functions.invoke('copilotChat', {
        body: {
          userPrompt: messageText,
          conversationId,
          agentContext,
          conversationHistory: updatedHistory,
          currentTab: 'market'
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'The advisor failed to respond.');
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage = { role: 'assistant', content: data.response };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Market advisor error:', error);
      let fallbackMessage = "I apologize, but I'm having trouble responding right now. Please try again.";

      if (error.message?.toLowerCase().includes('context')) {
        fallbackMessage = 'Unable to load your market context. Please refresh and try again.';
      } else if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
        fallbackMessage = 'The advisor is busy right now. Please wait a moment and try again.';
      } else if (error.message?.toLowerCase().includes('lovable') || error.message?.toLowerCase().includes('auth')) {
        fallbackMessage = 'The advisor is unavailable due to a configuration issue. Please contact support.';
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: fallbackMessage }]);
      toast.error('Failed to get response from advisor');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateMarketConfig = async (updatedConfig) => {
    try {
      if (marketConfig?.id) {
        await UserMarketConfig.update(marketConfig.id, updatedConfig);
      } else {
        await UserMarketConfig.create({ ...updatedConfig, userId: user.id });
      }
      await refreshUserData();
      toast.success('Market configuration updated!');
    } catch (error) {
      console.error('Error updating market config:', error);
      toast.error('Failed to update market configuration');
    }
  };


  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingIndicator text="Loading market data..." size="lg" />
        </div>);
    }

    const daysUntilRefresh = getDaysUntilNextRefresh();
    const canRefresh = canGenerateReport();

    return (
      <div className="space-y-8" id="printable-market-area">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-[30px] font-semibold text-[#1E293B] mb-1">My Market</h1>
            <p className="text-base text-[#475569]">
              {marketConfig?.primaryTerritory || 'Set your market territory in settings'}
            </p>
            {marketError && (
              <div className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{marketError}</span>
              </div>
            )}
            {!canRefresh && daysUntilRefresh > 0 && (
              <p className="text-sm text-[#EF4444] mt-1">
                Next refresh available in {daysUntilRefresh} day{daysUntilRefresh !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || !canRefresh}
              className={`p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors ${!canRefresh ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={canRefresh ? "Refresh Market Data" : `Available in ${daysUntilRefresh} day${daysUntilRefresh !== 1 ? 's' : ''}`}
            >
              {generatingReport ? (
                <img
                  src="/images/icons/pulse-ai-icon.png"
                  alt="Loading"
                  className="w-5 h-5 animate-spin-slow object-contain"
                  style={{ animationDuration: '3s' }}
                />
              ) : (
                <RefreshCw className="w-5 h-5 text-[#475569]" />
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors"
              title="Print Page"
            >
              <Printer className="w-5 h-5 text-[#475569]" />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!marketData?.rawResponse}
              className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download PDF Report"
            >
              <Download className="w-5 h-5 text-[#475569]" />
            </button>
          </div>
        </div>

        {/* Market Stats Grid - Now 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-[#E2E8F0]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-[#64748B]" />
                <p className="text-slate-950 text-sm">Median Home Price</p>
              </div>
              <p className="text-[#1E293B] text-xl font-medium">
                {typeof parsedAnalysis?.price_trends?.median_price_current === 'number' ?
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parsedAnalysis.price_trends.median_price_current) :
                '---'}
              </p>
              {typeof parsedAnalysis?.price_trends?.median_price_yoy_change === 'number' &&
              <p className={`text-xs mt-2 ${parsedAnalysis.price_trends.median_price_yoy_change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {parsedAnalysis.price_trends.median_price_yoy_change >= 0 ? '+' : ''}{parsedAnalysis.price_trends.median_price_yoy_change.toFixed(1)}% from last year
                  </p>
              }
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E2E8F0]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#64748B]" />
                <p className="text-slate-950 text-sm">Days on Market</p>
              </div>
              <p className="text-[#1E293B] text-xl font-medium">
                {typeof parsedAnalysis?.market_velocity?.average_days_on_market === 'number' ? parsedAnalysis.market_velocity.average_days_on_market : '---'}
              </p>
              {typeof parsedAnalysis?.market_velocity?.dom_yoy_change === 'number' &&
              <p className={`text-xs mt-2 ${parsedAnalysis.market_velocity.dom_yoy_change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {parsedAnalysis.market_velocity.dom_yoy_change >= 0 ? '+' : ''}{parsedAnalysis.market_velocity.dom_yoy_change.toFixed(0)} days from last year
                </p>
              }
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E2E8F0]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#64748B]" />
                <p className="text-slate-950 text-sm">Inventory Supply</p>
              </div>
              <p className="text-[#1E293B] text-xl font-medium">
                {typeof parsedAnalysis?.inventory_analysis?.months_of_supply === 'number' ? `${parsedAnalysis.inventory_analysis.months_of_supply.toFixed(1)} months` : '---'}
              </p>
              {typeof parsedAnalysis?.inventory_analysis?.inventory_yoy_change === 'number' &&
              <p className={`text-xs mt-2 ${parsedAnalysis.inventory_analysis.inventory_yoy_change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {parsedAnalysis.inventory_analysis.inventory_yoy_change >= 0 ? '+' : ''}{parsedAnalysis.inventory_analysis.inventory_yoy_change.toFixed(1)} months from last year
                </p>
              }
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#64748B]" />
              <p className="text-slate-950 text-sm">Homes Sold</p>
            </div>
            <p className="text-[#1E293B] text-xl font-medium">
              {typeof parsedAnalysis?.sales_data?.total_homes_sold === 'number' ? parsedAnalysis.sales_data.total_homes_sold : '---'}
            </p>
            {typeof parsedAnalysis?.sales_data?.closed_sales_yoy_change === 'number' &&
            <p className={`text-xs mt-2 ${parsedAnalysis.sales_data.closed_sales_yoy_change >= 0 ? 'text-[#64748B]' : 'text-[#EF4444]'}`}>
                {parsedAnalysis.sales_data.closed_sales_yoy_change >= 0 ? '+' : ''}{parsedAnalysis.sales_data.closed_sales_yoy_change.toFixed(1)}% from last month
              </p>
            }
          </Card>
        </div>

        {/* How to talk about it section */}
        {parsedAnalysis?.talking_points &&
        <div className="space-y-6">
             <h2 className="text-xl font-semibold text-[#1E293B]">How to Talk About It</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="bg-[#ffffff] p-6 flex flex-col space-y-1.5">
                        <CardTitle className="text-lg">
                            <span>Talking to Sellers</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-[#ffffff] pt-0 p-6">
                        <div className="prose prose-sm max-w-none text-gray-600">
                            <ReactMarkdown>{parsedAnalysis.talking_points.for_sellers}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="bg-[#ffffff] p-6 flex flex-col space-y-1.5">
                        <CardTitle className="text-lg">
                            <span>Talking to Buyers</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-[#ffffff] pt-0 p-6">
                        <div className="prose prose-sm max-w-none text-gray-600">
                           <ReactMarkdown>{parsedAnalysis.talking_points.for_buyers}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
             </div>
          </div>
        }

        {/* Removed Charts Section */}
      </div>);
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'data':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/icons/pulse-ai-icon.png"
                alt="PULSE AI"
                className="w-6 h-6 object-contain"
              />
              <h4 className="text-lg font-semibold text-[#1E293B]">Ask Me About Your Market</h4>
            </div>

            <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
              {chatMessages.length === 0 ?
              <p className="text-sm text-[#64748B] text-center py-8">
                  I'm your AI Market Advisor. Ask me anything about your market data, trends, or insights.
                </p> :

              chatMessages.map((msg, idx) =>
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-[#7C3AED] text-white' : 'bg-white border border-[#E2E8F0] text-[#1E293B]'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
              )
              }

              {sendingMessage &&
              <div className="flex justify-start">
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-3">
                    <InlineLoadingIndicator text="Thinking..." />
                  </div>
                </div>
              }
            </div>

            <form onSubmit={handleSendMessage} className="relative">
              <Input
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                placeholder="Ask me anything about your business"
                className="w-full h-10 pr-12 bg-white border border-[#E2E8F0] rounded-md text-sm placeholder:text-[#94A3B8]"
                disabled={sendingMessage} />
              <button
                type="submit"
                className="absolute right-1 top-1 w-8 h-8 bg-[#7C3AED] hover:bg-[#6D28D9] rounded flex items-center justify-center disabled:opacity-50"
                disabled={sendingMessage || !advisorQuery.trim()}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">AI Market Analysis</h4>

            {marketData ?
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <FormattedAnalysis analysis={marketData.rawResponse} />
              </div> :

            <div className="space-y-4">
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <h5 className="text-sm font-semibold text-[#1E293B] mb-2">No Report Generated</h5>
                  <p className="text-xs text-[#475569]">
                    Click the "Refresh Market Data" button in the main view to generate your personalized AI market analysis.
                  </p>
                </div>
                <Button onClick={handleGenerateReport} disabled={generatingReport || !canGenerateReport()} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                  {generatingReport ? <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating... </> : 'Generate First Report'}
                </Button>
              </div>
            }
          </div>);

      case 'comparisons':
        return (
          <div className="space-y-6">
            <h4 className="text-base font-semibold text-[#1E293B]">Your Zip Code Comparisons</h4>

            {marketConfig?.zipCodes && marketConfig.zipCodes.length > 0 ?
            <div className="space-y-3">
                {marketConfig.zipCodes.map((zip) =>
              <div key={zip} className="bg-[#fffff] p-4 rounded-lg border border-[#E2E8F0]">
                    <p className="text-sm font-semibold text-[#1E293B] mb-2">ZIP {zip}</p>
                    <div className="text-xs text-[#64748B] space-y-1">
                      <p>Median Price: $750K</p>
                      <p>Days on Market: 28</p>
                      <p>Active Listings: 45</p>
                    </div>
                  </div>
              )}
              </div> :

            <p className="text-sm text-[#64748B] text-center py-8">
                Add ZIP codes in settings to see comparisons
              </p>
            }
          </div>);

      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Market Configuration</h3>
            <MarketConfigForm
              compact={true}
              onSaveComplete={() => setActiveTab('insights')} />
          </div>);

      default:
        return null;
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <LoadingIndicator text="Loading Dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow var(--animation-duration, 3s) linear infinite;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-market-area, #printable-market-area * {
            visibility: visible;
          }
          #printable-market-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab} />



      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] pt-6 pr-8 pb-8 pl-8 flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>

        <aside className="w-[420px] bg-white border-l border-[#E2E8F0] flex-shrink-0 flex flex-col no-print">
            <div className="bg-[#475569] pt-3 pr-6 pb-3 pl-6 border-b border-[#E2E8F0]">
                <h3 className="text-[#f0f0f0] text-sm font-medium">{getSidebarTitle(activeTab)}</h3>
            </div>
            <div className="pt-4 pr-6 pb-6 pl-6 flex-1 overflow-y-auto">
                {renderSidebarContent()}
            </div>
        </aside>
      </div>
    </>);

}

function getSidebarTitle(tabId) {
  const titles = {
    data: 'Market Advisor',
    insights: 'Market Insights',
    comparisons: 'Comparisons',
    settings: 'Settings'
  };
  return titles[tabId] || 'Details';
}
