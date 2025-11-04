
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../components/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import useCredits from '@/components/credits/useCredits';
import LoadingIndicator from '../components/ui/LoadingIndicator';

// --- RIGHT SIDEBAR COMPONENTS ---

// Sidebar for Searching All Scenarios
const ScenarioSearchSidebar = ({ scenarios, onStartScenario }) => {
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const filtered = scenarios.filter((s) =>
    (category === 'all' || s.category === category) && (
      difficulty === 'all' || s.difficultyLevel === difficulty)
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Filter</h4>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]">

            <option value="all">All Categories</option>
            <option value="price_objections">Price</option>
            <option value="timing_concerns">Timing</option>
            <option value="agent_selection">Agent</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]">

            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Results</h4>
        <div className="space-y-2">
          {filtered.map((s) =>
            <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <img src={s.avatarImageUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{s.name}</p>
                  <p className="text-xs text-[#64748B] capitalize">{s.difficultyLevel}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onStartScenario(s)}>
                <Play className="w-4 h-4 text-[#7C3AED]" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>);

};

// Sidebar for Viewing Session Results
const SessionResultsSidebar = ({ sessionLog, onDelete }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        // TODO: Implement role-play analysis and scenario loading
        setAnalysis(null);
        setScenario(null);
        setAudioUrl(null);
      } catch (error) {
        console.error("Error loading session details", error);
        toast.error("Failed to load session details.");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [sessionLog]);

  const transcript = sessionLog.rawTranscript ? JSON.parse(sessionLog.rawTranscript) : [];

  const downloadTranscript = () => {
    if (transcript.length === 0) {
      toast.error("No transcript available to download.");
      return;
    }

    let transcriptText = `Role-Play Session Transcript\n`;
    transcriptText += `Scenario: ${scenario?.name || 'Unknown'}\n`;
    transcriptText += `Date: ${sessionLog.startTime ? format(new Date(sessionLog.startTime), 'MMM d, yyyy h:mm a') : 'N/A'}\n\n`;
    transcriptText += `${'='.repeat(50)}\n\n`;

    transcript.forEach((turn) => {
      const speaker = turn.role === 'agent' ? 'Client' : 'You';
      transcriptText += `${speaker}: ${turn.message}\n\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleplay-transcript-${sessionLog.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transcript downloaded');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingIndicator size="sm" /></div>;
  }

  return (
    <div className="space-y-6">
      {scenario &&
        <div className="flex flex-col items-center text-center">
          <img src={scenario.avatarImageUrl} alt={scenario.name} className="w-20 h-20 rounded-full object-cover mb-3" />
          <h4 className="text-[#1E293B] text-base font-semibold">{scenario.name}</h4>
          <p className="text-[#64748B] text-xs">{format(new Date(sessionLog.startTime), "MMM d, yyyy 'at' h:mm a")}</p>
        </div>
      }

      {audioUrl &&
        <Card>
          <CardContent className="p-4">
            <h5 className="mb-2 text-sm font-semibold">Call Recording</h5>
            {audioLoading ? <LoadingIndicator size="sm" /> : <audio controls className="w-full h-10" src={audioUrl}></audio>}
          </CardContent>
        </Card>
      }

      {analysis &&
        <Card>
          <CardContent className="p-4 space-y-4">
            <h5 className="text-base font-bold">Performance Analysis</h5>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Overall Result</span>
              <Badge variant={analysis.overall_pass_fail === 'PASS' ? 'default' : 'destructive'} className={analysis.overall_pass_fail === 'PASS' ? 'bg-green-500' : 'bg-red-500'}>{analysis.overall_pass_fail}</Badge>
            </div>
            <div className="text-xs text-[#475569] space-y-3">
              <h6 className="text-[#1E293B] text-sm font-semibold">Criteria Evaluation</h6>
              <p className="bg-transparent text-gray-500 p-4 text-sm rounded-lg prose prose-sm border border-purple-200 max-w-none"><strong>Active Listening:</strong> {analysis.active_listening_feedback}</p>
              <p className="bg-transparent text-gray-500 p-4 text-sm rounded-lg prose prose-sm border border-purple-200 max-w-none"><strong>Validating Feelings:</strong> {analysis.validating_feelings_feedback}</p>
              <h6 className="text-[#1E293B] mt-2 text-sm font-semibold">Call Summary</h6>
              <p className="bg-transparent text-gray-500 p-4 text-sm rounded-lg prose prose-sm border border-purple-200 max-w-none">{analysis.call_summary}</p>
            </div>
          </CardContent>
        </Card>
      }

      {transcript.length > 0 &&
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-base font-semibold">Conversation Transcript</h5>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={downloadTranscript}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3 text-xs">
              {transcript.map((turn, idx) =>
                <div key={idx} className={`p-2 rounded-md ${turn.role === 'agent' ? 'bg-slate-100' : 'bg-blue-50'}`}>
                  <p className="font-bold">{turn.role === 'agent' ? 'Client' : 'You'}</p>
                  <p className="bg-transparent text-slate-950 p-4 text-base rounded-lg prose prose-sm border border-purple-200 max-w-none">{turn.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      }

      <Button variant="outline" className="w-full text-red-600 border-red-600 hover:bg-red-50" onClick={() => onDelete(sessionLog.id)}>
        Delete Session
      </Button>
    </div>);

};

// Sidebar for Viewing Scripts
const ScriptsSidebar = () => {
  const [scripts, setScripts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const fetchScripts = async () => {
      // TODO: Implement objection scripts loading
      setScripts([]);
    };
    fetchScripts();
  }, []);

  const filteredScripts = scripts.filter((script) => {
    const nameMatch = script.title.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = category === 'all' || script.category === category;
    return nameMatch && categoryMatch;
  });

  const categories = [...new Set(scripts.map((s) => s.category))];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]" />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]">
          <option value="all">All Categories</option>
          {categories.map((cat) =>
            <option key={cat} value={cat} className="capitalize">{cat.replace(/_/g, ' ')}</option>
          )}
        </select>
      </div>

      {filteredScripts.length > 0 ?
        <Accordion type="single" collapsible className="w-full">
          {filteredScripts.map((script) =>
            <AccordionItem value={script.id} key={script.id}>
              <AccordionTrigger className="text-sm">{script.title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">Situation:</p>
                  <p className="bg-transparent text-slate-950 p-4 text-sm rounded-lg prose prose-sm border border-purple-200 max-w-none">{script.situation}</p>
                  <p className="font-semibold mt-2">Response:</p>
                  <p className="text-sm font-mono whitespace-pre-wrap">{script.response}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion> :

        <p className="text-sm text-center text-slate-500">No scripts match your search.</p>
      }
    </div>);

};

// --- MAIN PAGE COMPONENT ---

export default function RolePlayPage() {
  const { user, loading: contextLoading } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);

  // Data States
  const [allScenarios, setAllScenarios] = useState([]);
  const [featuredScenarios, setFeaturedScenarios] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [userProgress, setUserProgress] = useState(null);

  // UI States
  const [activeTab, setActiveTab] = useState('search'); // search, results, scripts
  const [selectedSessionLog, setSelectedSessionLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  const navigate = useNavigate();
  const { deductCredits, hasSufficientCredits } = useCredits();

  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'results', label: 'Results' },
    { id: 'scripts', label: 'Script Stacks' }];


  useEffect(() => {
    if (!contextLoading && user) {
      loadPageData();
    }
  }, [contextLoading, user]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      // Load role-play scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('role_play_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (scenariosError) throw scenariosError;

      const scenarios = scenariosData || [];
      setAllScenarios(scenarios);
      setFeaturedScenarios(scenarios.filter(s => s.is_popular));

      // Load session logs
      const { data: logsData, error: logsError } = await supabase
        .from('role_play_session_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setSessionLogs(logsData || []);

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('role_play_user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const totalSessions = logsData?.length || 0;
      const totalTime = logsData?.reduce((sum, log) => sum + (log.session_duration_seconds || 0), 0) || 0;

      setUserProgress({ total_sessions: totalSessions, total_time: totalTime });
    } catch (error) {
      console.error('Error loading role-play data:', error);
      toast.error('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScenario = async (scenario) => {
    if (!user.phone) {
      toast.error("Please add your phone number in Settings > Profile to start a role-play call.");
      navigate(createPageUrl('Settings'));
      return;
    }

    const creditsCost = 10;
    if (!hasSufficientCredits(creditsCost)) {
      toast.error("Insufficient credits to start a session.");
      return;
    }

    setIsInitiating(true);
    try {
      await deductCredits(creditsCost, "Role-Play", `Initiated: ${scenario.name}`);
      // TODO: Implement ElevenLabs role-play session initiation
      toast.info("Role-play functionality coming soon!");
      loadPageData();
    } catch (err) {
      console.error("Error starting scenario:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleSessionLogClick = (log) => {
    setSelectedSessionLog(log);
    setActiveTab('results');
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session forever?')) return;
    try {
      // TODO: Implement session deletion
      toast.success("Session deleted.");
      setSelectedSessionLog(null);
      setActiveTab('search');
      loadPageData();
    } catch (error) {
      toast.error("Failed to delete session.");
      console.error("Deletion error:", error);
    }
  };

  const totalTimeMinutes = Math.round(sessionLogs.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60);
  const paginatedLogs = sessionLogs.slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage);
  const totalPages = Math.ceil(sessionLogs.length / sessionsPerPage);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      case 'expert': return 'bg-purple-700 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // --- RENDER FUNCTIONS ---

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
          <LoadingIndicator text="Loading Role-Play Scenarios..." size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[30px] font-semibold text-[#1E293B] mb-4">Scenarios</h1>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <p className="text-slate-950 text-xs">Total Sessions</p>
              <p className="text-[#1E293B] text-xl font-medium">{userProgress?.total_sessions || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <p className="text-slate-950 text-xs">Total Time</p>
              <p className="text-[#1E293B] text-xl font-medium">{totalTimeMinutes} Minutes</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[#1E293B] mb-4 text-base font-semibold">Featured Role-Plays</h2>
          <div className="flex overflow-x-auto gap-6 pb-4">
            {featuredScenarios.map((scenario) =>
              <Card key={scenario.id} className="bg-white border border-[#E2E8F0] flex-shrink-0">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <img src={scenario.avatarImageUrl} alt={scenario.name} className="w-16 h-16 rounded-full object-cover" />
                  </div>

                  <h3 className="text-[#1E293B] mb-1 text-base font-medium whitespace-nowrap">{scenario.name}</h3>
                  <p className="text-[#475569] mb-4 text-xs line-clamp-2 max-w-xs mx-auto">{scenario.description}</p>
                  <Button className="w-full" onClick={() => handleStartScenario(scenario)} disabled={isInitiating}>
                    {isInitiating ? <LoadingIndicator size="sm" /> : 'Start Call'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[#1E293B] mb-4 text-lg font-semibold">Scenario Log</h2>
          <div className="bg-white rounded-lg border border-[#E2E8F0]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Scenario</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Date</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Duration</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle [&:has([role=checkbox])]:pr-0">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const scenario = allScenarios.find((s) => s.id === log.scenarioId);
                  // Simplified result based on status. Could be enhanced with actual analysis result if available quickly.
                  const result = log.status === 'completed' ? 'P' : '-';
                  return (
                    <TableRow key={log.id} onClick={() => handleSessionLogClick(log)} className="cursor-pointer hover:bg-slate-50">
                      <TableCell className="font-medium">{scenario?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(log.startTime), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{log.durationSeconds || 0}s</TableCell>
                      <TableCell className={result === 'P' ? 'text-green-600' : 'text-slate-600'}>{result}</TableCell>
                    </TableRow>);

                })}
              </TableBody>
            </Table>
            {totalPages > 1 &&
              <div className="flex items-center justify-center gap-2 p-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft /></Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight /></Button>
              </div>
            }
          </div>
        </div>
      </div>);

  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'search':
        return <ScenarioSearchSidebar scenarios={allScenarios} onStartScenario={handleStartScenario} />;
      case 'results':
        if (selectedSessionLog) {
          return <SessionResultsSidebar sessionLog={selectedSessionLog} onDelete={handleDeleteSession} />;
        }
        return <p className="text-center text-sm text-slate-500">Select a session from the log to see results.</p>;
      case 'scripts':
        return <ScriptsSidebar />;
      default:
        return null;
    }
  };

  const getSidebarTitle = () => {
    const titles = {
      search: 'Search Scenarios',
      results: 'Session Results',
      scripts: 'Script Stacks'
    };
    return titles[activeTab];
  };

  return (
    <>
      <ContextualTopNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'results') setSelectedSessionLog(null);
        }} />


      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] p-8 text-xs flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>

        <ContextualSidebar title={getSidebarTitle()}>
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>
    </>);

}
