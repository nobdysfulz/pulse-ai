import React, { useState, useEffect } from 'react';
import { User, RolePlaySessionLog, RolePlayAnalysisReport, RolePlayScenario } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight, FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getSignedAudioUrl } from '@/api/functions';
import { createPageUrl } from '@/utils';

const KPICard = ({ title, value, subtitle, icon: Icon }) => (
  <Card className="bg-white shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-lg bg-slate-100">
          <Icon className="w-5 h-5 text-slate-900" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const TranscriptMessage = ({ turn }) => {
  const isAgent = turn.role === 'agent';
  const label = isAgent ? 'Client' : 'You';

  return (
    <div className={`flex gap-3 mb-4 ${isAgent ? 'bg-slate-50' : 'bg-blue-50'} p-3 rounded-lg`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-slate-900 text-sm font-medium">{label}</span>
          <span className="text-xs text-slate-500">
            {turn.time_in_call_secs ? `${Math.floor(turn.time_in_call_secs / 60)}:${(turn.time_in_call_secs % 60).toString().padStart(2, '0')}` : '0:00'}
          </span>
        </div>
        <p className="text-slate-900 text-xs">{turn.message || turn.original_message || 'No message content'}</p>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, description }) => (
  <div className="mb-4">
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    <p className="text-slate-500">{description}</p>
  </div>
);

export default function SessionResults() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState({});
  const [analyses, setAnalyses] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [parsedTranscript, setParsedTranscript] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const sessionsPerPage = 10;
  const [kpis, setKpis] = useState({
    totalSessions: 0,
    totalTime: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      // Parse the raw transcript
      if (selectedSession.rawTranscript) {
        try {
          const transcript = JSON.parse(selectedSession.rawTranscript);
          setParsedTranscript(Array.isArray(transcript) ? transcript : []);
        } catch (error) {
          console.error('Error parsing transcript:', error);
          setParsedTranscript([]);
        }
      } else {
        setParsedTranscript([]);
      }

      // Load audio if available
      if (selectedSession.recordingUrl) {
        loadAudioUrl(selectedSession.recordingUrl);
      } else {
        setAudioUrl(null);
      }
    }
  }, [selectedSession]);

  const loadAudioUrl = async (fileUri) => {
    setAudioLoading(true);
    setAudioUrl(null);
    try {
      const { data } = await getSignedAudioUrl({ file_uri: fileUri });
      if (data.signed_url) {
        setAudioUrl(data.signed_url);
      }
    } catch (error) {
      console.error('Error loading audio URL:', error);
      toast.error('Failed to load audio recording');
    } finally {
      setAudioLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Fetch all sessions for this user
      const userSessions = await RolePlaySessionLog.filter({
        userId: currentUser.id
      }, '-startTime');

      setSessions(userSessions);

      // Fetch all analysis reports
      const allAnalyses = await RolePlayAnalysisReport.filter({ userId: currentUser.id });
      const analysesMap = {};
      allAnalyses.forEach((analysis) => {
        analysesMap[analysis.sessionId] = analysis;
      });
      setAnalyses(analysesMap);

      // Fetch all scenarios
      const scenarioIds = [...new Set(userSessions.map((s) => s.scenarioId))];
      const scenariosMap = {};
      for (const scenarioId of scenarioIds) {
        try {
          const scenario = await RolePlayScenario.get(scenarioId);
          scenariosMap[scenarioId] = scenario;
        } catch (error) {
          console.error('Error fetching scenario:', scenarioId, error);
        }
      }
      setScenarios(scenariosMap);

      // Calculate KPIs
      const completedSessions = userSessions.filter((s) => s.status === 'completed');
      const totalTime = completedSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

      setKpis({
        totalSessions: completedSessions.length,
        totalTime: Math.round(totalTime / 60) // Convert to minutes
      });

      // Auto-select the most recent session
      if (userSessions.length > 0) {
        handleSessionClick(userSessions[0]);
      }

    } catch (error) {
      console.error('Error loading session data:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setSelectedAnalysis(analyses[session.id] || null);
    setSelectedScenario(scenarios[session.scenarioId] || null);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await RolePlaySessionLog.delete(selectedSession.id);

      // Also delete associated analysis if it exists
      if (selectedAnalysis) {
        await RolePlayAnalysisReport.delete(selectedAnalysis.id);
      }

      toast.success('Session deleted successfully');
      setSelectedSession(null);
      setSelectedAnalysis(null);
      setSelectedScenario(null);
      setParsedTranscript([]);
      loadData();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const downloadTranscript = () => {
    if (parsedTranscript.length === 0) {
      toast.error('No transcript available to download');
      return;
    }

    let transcriptText = `Role-Play Session Transcript\n`;
    transcriptText += `Scenario: ${selectedScenario?.name || 'Unknown'}\n`;
    transcriptText += `Date: ${selectedSession.startTime ? format(new Date(selectedSession.startTime), 'MMM d, yyyy h:mm a') : 'N/A'}\n`;
    transcriptText += `Duration: ${formatDuration(selectedSession.durationSeconds)}\n`;
    transcriptText += `\n${'='.repeat(50)}\n\n`;

    parsedTranscript.forEach((turn) => {
      const speaker = turn.role === 'agent' ? 'Client' : 'You';
      const timestamp = turn.time_in_call_secs ? `[${Math.floor(turn.time_in_call_secs / 60)}:${(turn.time_in_call_secs % 60).toString().padStart(2, '0')}]` : '[0:00]';
      const message = turn.message || turn.original_message || '';
      transcriptText += `${timestamp} ${speaker}: ${message}\n\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleplay-transcript-${selectedSession.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transcript downloaded');
  };

  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = sessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen">
        {/* Left Column - 60% */}
        <div className="w-[60%] p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-slate-900 text-xl font-medium">My Role-Play Progress</h1>
            <Button
              onClick={() => window.location.href = createPageUrl('RolePlay')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              New Session
            </Button>
          </div>

          {/* KPIs - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <KPICard
              title="Total Sessions"
              value={kpis.totalSessions}
              subtitle="Completed"
              icon={CheckCircle}
            />
            <KPICard
              title="Total Time"
              value={kpis.totalTime}
              subtitle="Minutes practiced"
              icon={Clock}
            />
          </div>

          {/* Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 text-base font-normal leading-none tracking-tight">Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>No sessions found.</p>
                  <p className="text-sm mt-2">Start your first role-play session to see results here!</p>
                </div>
              ) : (
                <div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-slate-900 font-medium text-xs">Date</TableHead>
                          <TableHead className="text-slate-900 font-medium text-xs">Scenario</TableHead>
                          <TableHead className="text-slate-900 font-medium text-xs">Duration</TableHead>
                          <TableHead className="text-slate-900 font-medium text-xs">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSessions.map((session) => {
                          const scenario = scenarios[session.scenarioId];
                          const analysis = analyses[session.id];

                          // Determine result display - treat UNKNOWN as FAIL
                          let resultDisplay = 'N/A';
                          let resultColor = 'text-slate-500';

                          if (analysis && analysis.overall_pass_fail) {
                            const status = analysis.overall_pass_fail.toUpperCase();
                            if (status === 'PASS') {
                              resultDisplay = 'Pass';
                              resultColor = 'text-green-600';
                            } else {
                              // FAIL or UNKNOWN both map to Fail
                              resultDisplay = 'Fail';
                              resultColor = 'text-red-600';
                            }
                          }

                          return (
                            <TableRow
                              key={session.id}
                              onClick={() => handleSessionClick(session)}
                              className={`cursor-pointer transition-colors ${
                                selectedSession?.id === session.id ? 'bg-purple-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <TableCell className="text-slate-900">
                                {session.startTime ? format(new Date(session.startTime), 'MMM-d') : 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium text-slate-900">
                                {scenario?.name || 'Unknown Scenario'}
                              </TableCell>
                              <TableCell className="text-slate-900">
                                {formatDuration(session.durationSeconds)}
                              </TableCell>
                              <TableCell>
                                <span className={`text-sm font-medium ${resultColor}`}>
                                  {resultDisplay}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 40% */}
        <div className="w-[40%] bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
          {selectedSession ? (
            <div className="p-6 flex-1 flex flex-col">
              {/* Session Header */}
              <div className="mb-6">
                {selectedScenario?.avatarImageUrl && (
                  <img
                    src={selectedScenario.avatarImageUrl}
                    alt="AI Client"
                    className="w-20 h-20 rounded-full mb-4 object-cover"
                  />
                )}
                <h2 className="text-slate-900 mb-2 text-base font-semibold">
                  {selectedScenario?.name || 'Session Details'}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {selectedSession.startTime ? format(new Date(selectedSession.startTime), 'MMM d, yyyy h:mm a') : 'N/A'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(selectedSession.durationSeconds)}
                  </div>
                </div>
              </div>

              {/* Audio Player */}
              {selectedSession.recordingUrl ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-slate-900 text-base font-normal tracking-tight flex items-center gap-2">
                      Call Recording
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audioLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        <span className="ml-2 text-sm text-slate-500">Loading audio...</span>
                      </div>
                    ) : audioUrl ? (
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <p className="text-center text-xs text-slate-500">Unable to load audio</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <p className="text-center text-xs">Recording not available</p>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Report */}
              {selectedAnalysis ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-slate-900 text-lg">Performance Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">Overall Result</span>
                        <Badge
                          variant={selectedAnalysis.overall_pass_fail === 'PASS' ? 'default' : 'destructive'}
                          className={
                            selectedAnalysis.overall_pass_fail === 'PASS'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }
                        >
                          {selectedAnalysis.overall_pass_fail === 'PASS' ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      {selectedAnalysis.overall_score > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Overall Score</span>
                          <span className="text-2xl font-bold text-slate-900">
                            {selectedAnalysis.overall_score}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Criteria Evaluation Section */}
                    {(selectedAnalysis.active_listening_feedback ||
                      selectedAnalysis.validating_feelings_feedback ||
                      selectedAnalysis.clarifying_questions_feedback ||
                      selectedAnalysis.restating_objections_feedback) && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Criteria Evaluation</h3>
                        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                          {selectedAnalysis.active_listening_feedback && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 mb-1">Active Listening</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {selectedAnalysis.active_listening_feedback}
                              </p>
                            </div>
                          )}
                          {selectedAnalysis.validating_feelings_feedback && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 mb-1">Validating Feelings</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {selectedAnalysis.validating_feelings_feedback}
                              </p>
                            </div>
                          )}
                          {selectedAnalysis.clarifying_questions_feedback && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 mb-1">Clarifying Questions</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {selectedAnalysis.clarifying_questions_feedback}
                              </p>
                            </div>
                          )}
                          {selectedAnalysis.restating_objections_feedback && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800 mb-1">Restating Objections</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {selectedAnalysis.restating_objections_feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.voice_sentiment && (
                      <div className="mb-6">
                        <p className="font-semibold text-slate-900 mb-2">Voice Sentiment</p>
                        <p className="text-slate-700 text-sm capitalize">{selectedAnalysis.voice_sentiment}</p>
                      </div>
                    )}

                    {selectedAnalysis.call_summary && (
                      <div>
                        <p className="font-semibold text-slate-900 mb-2">Call Summary</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{selectedAnalysis.call_summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-slate-900 text-base font-normal tracking-tight">
                      Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-xs text-slate-500">
                      Analysis is being processed. Please refresh in a moment.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Transcript */}
              <Card className="mb-6 flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-slate-900 text-base font-normal tracking-tight">
                    Conversation Transcript
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadTranscript}
                    disabled={parsedTranscript.length === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col">
                  {parsedTranscript.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto max-h-[400px]">
                      {parsedTranscript.map((turn, index) => (
                        <TranscriptMessage key={index} turn={turn} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Transcript not available</p>
                  )}
                </CardContent>
              </Card>

              {/* Delete Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleDeleteSession}
                  className="w-full bg-white text-red-600 border-red-600 hover:bg-red-50"
                >
                  Delete Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">No sessions available</p>
                <p className="text-sm mt-2">Complete a role-play session to view results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}