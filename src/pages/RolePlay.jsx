import React, { useState, useEffect, useContext, useMemo } from 'react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, ChevronLeft, ChevronRight, Download, Printer, Eye, EyeOff, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

import { UserContext } from '../components/context/UserContext';
import ContextualTopNav from '../components/layout/ContextualTopNav';
import ContextualSidebar from '../components/layout/ContextualSidebar';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import useCredits from '@/components/credits/useCredits';
import { createPageUrl } from '@/utils';
import { supabase } from '@/integrations/supabase/client';
import { RolePlayScenario, RolePlaySessionLog, RolePlayAnalysisReport, ObjectionScript } from '@/api/entities';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0s';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const parseTranscript = (transcriptData) => {
  if (!transcriptData) return [];
  if (Array.isArray(transcriptData)) return transcriptData;
  if (typeof transcriptData === 'string') {
    try {
      const parsed = JSON.parse(transcriptData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse transcript string', error);
      return [];
    }
  }
  if (typeof transcriptData === 'object') {
    if (Array.isArray(transcriptData.turns)) return transcriptData.turns;
    if (Array.isArray(transcriptData.entries)) return transcriptData.entries;
    return [];
  }
  return [];
};

const normalizeAnalysis = (analysis) => {
  if (!analysis) return null;

  let metrics = analysis.metrics || {};
  if (typeof metrics === 'string') {
    try {
      metrics = JSON.parse(metrics);
    } catch (error) {
      console.warn('Unable to parse analysis metrics JSON', error);
      metrics = {};
    }
  }

  const criteriaSource =
    metrics.criteria_feedback ||
    metrics.criteriaFeedback ||
    metrics.criteria ||
    metrics.evaluations ||
    {};

  const statsSource =
    metrics.stats ||
    metrics.performance_stats ||
    metrics.performanceStats ||
    metrics.summary_stats ||
    {};

  const resolveFeedback = (keys, fallback) => {
    for (const key of keys) {
      if (criteriaSource && typeof criteriaSource === 'object') {
        if (criteriaSource[key]) return criteriaSource[key];
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        if (criteriaSource[camelKey]) return criteriaSource[camelKey];
      }
      if (metrics[key]) return metrics[key];
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (metrics[camelKey]) return metrics[camelKey];
    }
    return fallback;
  };

  const resolveStat = (keys) => {
    for (const key of keys) {
      if (statsSource && typeof statsSource === 'object') {
        if (statsSource[key] !== undefined) return statsSource[key];
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        if (statsSource[camelKey] !== undefined) return statsSource[camelKey];
      }
      if (metrics[key] !== undefined) return metrics[key];
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (metrics[camelKey] !== undefined) return metrics[camelKey];
    }
    return null;
  };

  const resolveSentiment = () => {
    const sentimentValue =
      resolveStat(['voice_sentiment', 'voiceSentiment', 'sentiment']) ||
      metrics.voice_sentiment ||
      metrics.voiceSentiment ||
      null;
    if (!sentimentValue) return null;
    if (typeof sentimentValue === 'string') return sentimentValue;
    if (sentimentValue.label) return sentimentValue.label;
    if (sentimentValue.summary) return sentimentValue.summary;
    try {
      return JSON.stringify(sentimentValue);
    } catch (error) {
      return null;
    }
  };

  const passingScore =
    metrics.passing_score ||
    metrics.passingScore ||
    metrics.threshold ||
    70;

  const overallScore =
    analysis.overallScore ??
    metrics.overall_score ??
    metrics.overallScore ??
    null;

  const derivedPassFail = (() => {
    const explicit =
      analysis.overallPassFail ||
      metrics.overall_pass_fail ||
      metrics.overallPassFail ||
      metrics.overall_result ||
      metrics.overallResult ||
      metrics.result;
    if (explicit) return String(explicit).toUpperCase();
    if (overallScore !== null && overallScore !== undefined) {
      return overallScore >= passingScore ? 'PASS' : 'FAIL';
    }
    return 'UNKNOWN';
  })();

  const callSummary =
    metrics.call_summary ||
    metrics.callSummary ||
    metrics.summary ||
    analysis.detailedFeedback ||
    '';

  const normalized = {
    ...analysis,
    metrics,
    overallPassFail: derivedPassFail,
    callSummary,
    criteriaFeedback: {
      activeListening: resolveFeedback(
        ['active_listening', 'activeListening'],
        'Feedback not available yet.'
      ),
      validatingFeelings: resolveFeedback(
        ['validating_feelings', 'validatingFeelings', 'empathy'],
        'Feedback not available yet.'
      ),
      clarifyingQuestions: resolveFeedback(
        ['clarifying_questions', 'clarifyingQuestions', 'questioning'],
        'Feedback not available yet.'
      ),
      restatingObjections: resolveFeedback(
        ['restating_objections', 'restatingObjections', 'positioning'],
        'Feedback not available yet.'
      )
    },
    stats: {
      objectionsGiven: resolveStat(['objections_given', 'objectionsGiven']),
      objectionsOvercome: resolveStat(['objections_overcome', 'objectionsOvercome']),
      voiceSentiment: resolveSentiment(),
      overallScore
    },
    recordingUrl:
      analysis.recordingUrl ||
      metrics.recording_url ||
      metrics.recordingUrl ||
      null
  };

  return normalized;
};
const ScenarioSearchSidebar = ({ scenarios, onStartScenario, isInitiating, activeScenarioId, getDifficultyColor }) => {
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const categories = useMemo(() => {
    const unique = new Set();
    scenarios.forEach((scenario) => {
      if (scenario.category) unique.add(scenario.category);
    });
    return Array.from(unique);
  }, [scenarios]);

  const difficulties = useMemo(() => {
    const unique = new Set();
    scenarios.forEach((scenario) => {
      if (scenario.difficultyLevel) unique.add(scenario.difficultyLevel);
    });
    return Array.from(unique);
  }, [scenarios]);

  const filtered = useMemo(() =>
    scenarios.filter((scenario) => {
      const categoryMatch = category === 'all' || scenario.category === category;
      const difficultyMatch = difficulty === 'all' || scenario.difficultyLevel === difficulty;
      return categoryMatch && difficultyMatch;
    }),
  [scenarios, category, difficulty]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Filter</h4>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]"
          >
            <option value="all">All Difficulties</option>
            {difficulties.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Results</h4>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-xs text-center text-[#64748B]">No scenarios match the selected filters.</p>
          )}
          {filtered.map((scenario) => (
            <div
              key={scenario.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={scenario.avatarImageUrl}
                  alt={scenario.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{scenario.name}</p>
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="capitalize">{scenario.category?.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getDifficultyColor(scenario.difficultyLevel)}`}>
                      {scenario.difficultyLevel?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8"
                onClick={() => onStartScenario(scenario)}
                disabled={isInitiating || !!activeScenarioId}
              >
                <Play className="w-4 h-4 text-[#7C3AED]" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const ActiveSessionSidebar = ({ scenario, onEndSession }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!scenario) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Unable to open print window. Please disable your pop-up blocker.');
      return;
    }

    const sections = [`<h2>${scenario.name}</h2>`,
      `<p><strong>Persona:</strong> ${scenario.clientPersona || 'Not specified'}</p>`,
      `<p><strong>Difficulty:</strong> ${scenario.difficultyLevel?.replace(/_/g, ' ') || 'Not specified'}</p>`,
      `<h3>Initial Context</h3><p>${(scenario.initialContext || '').replace(/\n/g, '<br />')}</p>`,
      `<h3>Learning Objectives</h3><ul>${
        (scenario.learningObjectives || []).length > 0
          ? scenario.learningObjectives.map((item) => `<li>${item}</li>`).join('')
          : '<li>Not specified</li>'
      }</ul>`,
      `<h3>Success Criteria</h3><ul>${
        (scenario.successCriteria || []).length > 0
          ? scenario.successCriteria.map((item) => `<li>${item}</li>`).join('')
          : '<li>Not specified</li>'
      }</ul>`,
      scenario.firstMessageOverride
        ? `<h3>Opening Line</h3><p>${scenario.firstMessageOverride}</p>`
        : ''
    ].join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${scenario.name} Script</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h2 { margin-bottom: 8px; }
            h3 { margin-top: 20px; margin-bottom: 8px; }
            ul { padding-left: 18px; }
            li { margin-bottom: 6px; }
          </style>
        </head>
        <body>${sections}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ unit: 'pt' });
      let y = 60;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(scenario.name, 40, y);
      y += 24;

      const addSection = (title, content) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title, 40, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(content, 520);
        lines.forEach((line) => {
          if (y > 750) {
            doc.addPage();
            y = 40;
          }
          doc.text(line, 40, y);
          y += 14;
        });
        y += 6;
      };

      addSection('Persona', scenario.clientPersona || 'Not specified');
      addSection('Difficulty', scenario.difficultyLevel?.replace(/_/g, ' ') || 'Not specified');
      addSection('Initial Context', scenario.initialContext || 'Not provided.');
      addSection(
        'Learning Objectives',
        (scenario.learningObjectives || []).length > 0
          ? scenario.learningObjectives.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
          : 'Not specified.'
      );
      addSection(
        'Success Criteria',
        (scenario.successCriteria || []).length > 0
          ? scenario.successCriteria.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
          : 'Not specified.'
      );
      if (scenario.firstMessageOverride) {
        addSection('Suggested Opening Line', scenario.firstMessageOverride);
      }

      const filename = `${scenario.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-script.pdf`;
      doc.save(filename);
      toast.success('Script downloaded');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Unable to download script. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <img
          src={scenario.avatarImageUrl}
          alt={scenario.name}
          className="w-20 h-20 rounded-full object-cover mb-3"
        />
        <h4 className="text-[#1E293B] text-base font-semibold">{scenario.name}</h4>
        <p className="text-[#64748B] text-xs capitalize">
          {scenario.category?.replace(/_/g, ' ')} • {scenario.difficultyLevel?.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
          <Download className="w-4 h-4 mr-2" /> {isDownloading ? 'Preparing…' : 'Download PDF'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsHidden((prev) => !prev)}>
          {isHidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
          {isHidden ? 'Show Script' : 'Hide Script'}
        </Button>
      </div>

      {!isHidden ? (
        <div className="space-y-4 text-sm text-[#1E293B]">
          <div>
            <h5 className="text-sm font-semibold mb-1">Initial Context</h5>
            <p className="bg-transparent text-gray-600 p-4 text-sm rounded-lg border border-purple-200 whitespace-pre-wrap">
              {scenario.initialContext || 'No script has been provided for this scenario yet.'}
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold mb-1">Learning Objectives</h5>
            {(scenario.learningObjectives || []).length > 0 ? (
              <ul className="space-y-2 list-disc pl-5 text-gray-600">
                {scenario.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No learning objectives provided.</p>
            )}
          </div>

          <div>
            <h5 className="text-sm font-semibold mb-1">Success Criteria</h5>
            {(scenario.successCriteria || []).length > 0 ? (
              <ul className="space-y-2 list-disc pl-5 text-gray-600">
                {scenario.successCriteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No success criteria provided.</p>
            )}
          </div>

          {scenario.firstMessageOverride && (
            <div>
              <h5 className="text-sm font-semibold mb-1">Suggested Opening Line</h5>
              <p className="bg-transparent text-gray-600 p-4 text-sm rounded-lg border border-purple-200 whitespace-pre-wrap">
                {scenario.firstMessageOverride}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#64748B]">Script hidden. Toggle "Show Script" to reveal it again.</p>
      )}

      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
        onClick={onEndSession}
      >
        <PhoneOff className="w-4 h-4 mr-2" /> End Session &amp; Return
      </Button>
    </div>
  );
};
const SessionResultsSidebar = ({ sessionLog, scenario, analysis, onDelete }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const transcript = useMemo(() => parseTranscript(sessionLog?.transcript), [sessionLog]);

  useEffect(() => {
    const recordingUrl = analysis?.recordingUrl || sessionLog?.recordingUrl;
    if (!recordingUrl) {
      setAudioUrl(null);
      setAudioLoading(false);
      return;
    }

    const loadAudio = async () => {
      try {
        setAudioLoading(true);
        const { data, error } = await supabase.functions.invoke('getSignedAudioUrl', {
          body: { file_uri: recordingUrl }
        });
        if (error) throw error;
        if (data?.signed_url) {
          setAudioUrl(data.signed_url);
        } else {
          setAudioUrl(null);
        }
      } catch (error) {
        console.error('Failed to load audio URL', error);
        toast.error('Unable to load call recording.');
        setAudioUrl(null);
      } finally {
        setAudioLoading(false);
      }
    };

    loadAudio();
  }, [analysis?.recordingUrl, sessionLog?.recordingUrl]);

  const downloadTranscript = () => {
    if (!transcript.length) {
      toast.error('No transcript available to download.');
      return;
    }

    const scenarioName = scenario?.name || 'Unknown Scenario';
    const sessionDate = sessionLog?.createdAt
      ? format(new Date(sessionLog.createdAt), 'MMM d, yyyy h:mm a')
      : 'N/A';

    let transcriptText = `Role-Play Session Transcript\n`;
    transcriptText += `Scenario: ${scenarioName}\n`;
    transcriptText += `Date: ${sessionDate}\n`;
    transcriptText += `Duration: ${formatDuration(sessionLog?.sessionDurationSeconds)}\n`;
    transcriptText += `\n${'='.repeat(50)}\n\n`;

    transcript.forEach((turn) => {
      const speaker = turn.role === 'agent' ? 'Client' : 'You';
      const message = turn.message || turn.original_message || '';
      transcriptText += `${speaker}: ${message}\n\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `roleplay-transcript-${sessionLog?.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toast.success('Transcript downloaded');
  };

  if (!sessionLog) {
    return <p className="text-sm text-center text-[#64748B]">Select a session to see the analysis.</p>;
  }

  return (
    <div className="space-y-6">
      {scenario && (
        <div className="flex flex-col items-center text-center">
          <img
            src={scenario.avatarImageUrl}
            alt={scenario.name}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
          <h4 className="text-[#1E293B] text-base font-semibold">{scenario.name}</h4>
          <p className="text-[#64748B] text-xs">
            {sessionLog.createdAt ? format(new Date(sessionLog.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown time'}
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-base font-semibold">Call Recording</h5>
            {analysis?.recordingUrl || sessionLog?.recordingUrl ? (
              <Badge variant="outline" className="text-xs">Available</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Not Available</Badge>
            )}
          </div>
          {audioLoading ? (
            <div className="flex justify-center items-center py-4">
              <LoadingIndicator size="sm" />
            </div>
          ) : audioUrl ? (
            <audio controls className="w-full h-10">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="text-xs text-[#64748B]">No recording is available for this session.</p>
          )}
        </CardContent>
      </Card>

      {analysis ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Overall Result</span>
              <Badge
                variant={analysis.overallPassFail === 'PASS' ? 'default' : 'destructive'}
                className={analysis.overallPassFail === 'PASS' ? 'bg-green-500' : 'bg-red-500'}
              >
                {analysis.overallPassFail}
              </Badge>
            </div>

            {analysis.stats.overallScore !== null && analysis.stats.overallScore !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Overall Score</span>
                <span className="text-[#1E293B] font-medium">{analysis.stats.overallScore}%</span>
              </div>
            )}

            <div className="space-y-3 text-xs text-[#475569]">
              <h6 className="text-[#1E293B] text-sm font-semibold">Criteria Evaluation</h6>
              <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100">
                <strong>Active Listening:</strong> {analysis.criteriaFeedback.activeListening}
              </p>
              <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100">
                <strong>Validating Feelings:</strong> {analysis.criteriaFeedback.validatingFeelings}
              </p>
              <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100">
                <strong>Clarifying Questions:</strong> {analysis.criteriaFeedback.clarifyingQuestions}
              </p>
              <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100">
                <strong>Restating Objections:</strong> {analysis.criteriaFeedback.restatingObjections}
              </p>

              {analysis.callSummary && (
                <>
                  <h6 className="text-[#1E293B] text-sm font-semibold">Call Summary</h6>
                  <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100">
                    {analysis.callSummary}
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[#64748B]">Objections Given</p>
                  <p className="text-[#1E293B] font-semibold text-lg">
                    {analysis.stats.objectionsGiven ?? '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[#64748B]">Objections Overcome</p>
                  <p className="text-[#1E293B] font-semibold text-lg">
                    {analysis.stats.objectionsOvercome ?? '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardContent className="p-3 text-center">
                  <p className="text-[#64748B]">Voice Sentiment</p>
                  <p className="text-[#1E293B] font-semibold">
                    {analysis.stats.voiceSentiment || 'Not available'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-[#64748B]">
            Analysis is still processing for this session. Please check back later.
          </CardContent>
        </Card>
      )}

      {transcript.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-base font-semibold">Conversation Transcript</h5>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={downloadTranscript}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3 text-xs">
              {transcript.map((turn, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${turn.role === 'agent' ? 'bg-slate-100' : 'bg-blue-50'}`}
                >
                  <p className="font-bold mb-1">{turn.role === 'agent' ? 'Client' : 'You'}</p>
                  <p className="text-slate-900 whitespace-pre-wrap">{turn.message || turn.original_message || ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => onDelete(sessionLog.id)}
      >
        Delete Session
      </Button>
    </div>
  );
};
const ScriptsSidebar = () => {
  const [scripts, setScripts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setLoading(true);
        const data = await ObjectionScript.filter({ isActive: true }, 'sort_order');
        setScripts(data);
      } catch (error) {
        console.error('Error loading objection scripts', error);
        toast.error('Failed to load objection handling scripts.');
        setScripts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set();
    scripts.forEach((script) => {
      if (script.category) unique.add(script.category);
    });
    return Array.from(unique);
  }, [scripts]);

  const filteredScripts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return scripts.filter((script) => {
      const matchesName = script.title?.toLowerCase().includes(term);
      const matchesCategory = category === 'all' || script.category === category;
      return matchesName && matchesCategory;
    });
  }, [scripts, searchTerm, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingIndicator size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white focus:ring-0 focus:outline-none focus:border-[#7C3AED] text-xs text-[#475569]"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="capitalize">
              {cat.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {filteredScripts.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {filteredScripts.map((script) => (
            <AccordionItem value={script.id} key={script.id}>
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex flex-col items-start">
                  <span>{script.title}</span>
                  <span className="text-[10px] text-[#64748B] capitalize">
                    {script.category?.replace(/_/g, ' ')} • {script.difficulty?.replace(/_/g, ' ')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-xs text-[#1E293B]">
                  <div>
                    <p className="font-semibold mb-1">Situation</p>
                    <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100 whitespace-pre-wrap">
                      {script.situation}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Recommended Response</p>
                    <p className="bg-transparent text-gray-600 p-3 rounded-lg border border-purple-100 whitespace-pre-wrap">
                      {script.response}
                    </p>
                  </div>
                  {(script.tips || []).length > 0 && (
                    <div>
                      <p className="font-semibold mb-1">Tips</p>
                      <ul className="space-y-1 list-disc pl-5 text-gray-600">
                        {script.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-sm text-center text-slate-500">No scripts match your search.</p>
      )}
    </div>
  );
};
export default function RolePlayPage() {
  const { user, loading: contextLoading } = useContext(UserContext);
  const { deductCredits, hasSufficientCredits } = useCredits();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);

  const [allScenarios, setAllScenarios] = useState([]);
  const [featuredScenarios, setFeaturedScenarios] = useState([]);
  const [scenarioMap, setScenarioMap] = useState({});
  const [sessionLogs, setSessionLogs] = useState([]);
  const [analysisReports, setAnalysisReports] = useState({});
  const [userProgress, setUserProgress] = useState({ totalSessions: 0, totalTimeSeconds: 0 });

  const [activeTab, setActiveTab] = useState('search');
  const [selectedSessionLog, setSelectedSessionLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSessionScenario, setActiveSessionScenario] = useState(null);

  const sessionsPerPage = 10;

  const tabs = useMemo(() => (
    [
      { id: 'search', label: 'Search' },
      { id: 'results', label: 'Results' },
      { id: 'scripts', label: 'Script Stacks' }
    ]
  ), []);

  useEffect(() => {
    if (!contextLoading && user) {
      loadPageData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, user]);

  const loadPageData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      console.log('Loading role play scenarios...');
      const [scenarios, logs, analysesRaw] = await Promise.all([
        RolePlayScenario.filter({ isActive: true }, 'name'),
        RolePlaySessionLog.filter({ userId: user.id }, '-created_at'),
        RolePlayAnalysisReport.filter({ userId: user.id }, '-created_at').catch((error) => {
          console.warn('Failed to load analysis reports', error);
          return [];
        })
      ]);

      console.log('Loaded scenarios:', scenarios.length, scenarios);

      const mappedScenarios = scenarios.map((scenario) => ({
        ...scenario,
        difficultyLevel: scenario.difficultyLevel || scenario.difficulty_level || 'beginner',
        avatarImageUrl: scenario.avatarImageUrl || 'https://i.pravatar.cc/150?img=56',
        category: scenario.category || 'general'
      }));

      const scenarioLookup = mappedScenarios.reduce((accumulator, scenario) => {
        accumulator[scenario.id] = scenario;
        return accumulator;
      }, {});

      const analysisMap = analysesRaw.reduce((accumulator, analysis) => {
        const normalized = normalizeAnalysis(analysis);
        if (analysis.sessionId) {
          accumulator[analysis.sessionId] = normalized;
        }
        return accumulator;
      }, {});

      const completedSessions = logs.filter((log) => log.status === 'completed').length;
      const totalTimeSeconds = logs.reduce((sum, log) => sum + (log.sessionDurationSeconds || 0), 0);

      setAllScenarios(mappedScenarios);
      setScenarioMap(scenarioLookup);
      setFeaturedScenarios(mappedScenarios.filter((scenario) => scenario.isPopular));
      setSessionLogs(logs);
      setAnalysisReports(analysisMap);
      setUserProgress({ totalSessions: completedSessions, totalTimeSeconds });
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading role-play data:', error);
      toast.error('Failed to load role-play data.');
    } finally {
      setLoading(false);
    }
  };
  const handleStartScenario = async (scenario) => {
    if (activeSessionScenario) {
      toast.info('Please end your current session before starting a new one.');
      return;
    }

    if (!user?.phone) {
      toast.error('Please add your phone number in Settings > Profile to start a role-play call.');
      navigate(createPageUrl('Settings'));
      return;
    }

    const creditsCost = 10;
    if (!hasSufficientCredits(creditsCost)) {
      toast.error('Insufficient credits. You need at least 10 credits to start a role-play session.');
      return;
    }

    setIsInitiating(true);
    try {
      const deductionSucceeded = await deductCredits(creditsCost, 'Role-Play', `Initiated: ${scenario.name}`);
      if (!deductionSucceeded) {
        setIsInitiating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('initiateRolePlayCall', {
        body: {
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          user_phone: user.phone,
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success === false) {
        throw new Error(data?.error || 'Failed to initiate role-play call.');
      }

      toast.success('Call initiated! Please answer your phone to begin.');
      setActiveSessionScenario(scenario);
    } catch (error) {
      console.error('Error starting scenario:', error);
      toast.error(error.message || 'Unable to start role-play session.');
      await loadPageData();
    } finally {
      setIsInitiating(false);
    }
  };

  const handleEndSession = () => {
    setActiveSessionScenario(null);
    toast.success('Session ended. Review your results once the analysis is ready.');
    loadPageData();
  };

  const handleSessionLogClick = (log) => {
    if (activeSessionScenario) {
      toast.info('Please end your current session first');
      return;
    }
    setSelectedSessionLog(log);
    setActiveTab('results');
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session forever?')) return;
    try {
      await RolePlaySessionLog.delete(sessionId);
      if (analysisReports[sessionId]?.id) {
        await RolePlayAnalysisReport.delete(analysisReports[sessionId].id);
      }
      toast.success('Session deleted.');
      setSelectedSessionLog(null);
      await loadPageData();
    } catch (error) {
      console.error('Deletion error:', error);
      toast.error('Failed to delete session.');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
        return 'bg-green-500 text-white';
      case 'intermediate':
        return 'bg-yellow-500 text-white';
      case 'advanced':
        return 'bg-red-500 text-white';
      case 'expert':
        return 'bg-purple-700 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const totalPages = Math.ceil(sessionLogs.length / sessionsPerPage) || 1;
  const paginatedLogs = sessionLogs.slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage);

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
          <LoadingIndicator text="Loading Role-Play Scenarios..." size="lg" />
        </div>
      );
    }

    const totalTimeMinutes = Math.round(userProgress.totalTimeSeconds / 60);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-[30px] font-semibold text-[#1E293B] mb-4">Scenarios</h1>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <p className="text-slate-950 text-xs">Total Sessions</p>
              <p className="text-[#1E293B] text-xl font-medium">{userProgress.totalSessions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
              <p className="text-slate-950 text-xs">Total Time</p>
              <p className="text-[#1E293B] text-xl font-medium">{totalTimeMinutes} Minutes</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[#1E293B] mb-4 text-base font-semibold">Featured Role-Plays</h2>
          {featuredScenarios.length === 0 ? (
            <p className="text-sm text-[#64748B]">No featured scenarios are available yet. Check back soon!</p>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4">
              {featuredScenarios.map((scenario) => (
                <Card key={scenario.id} className="bg-white border border-[#E2E8F0] flex-shrink-0">
                  <CardContent className="p-6 text-center w-64">
                    <div className="flex justify-center mb-3">
                      <img src={scenario.avatarImageUrl} alt={scenario.name} className="w-16 h-16 rounded-full object-cover" />
                    </div>

                    <h3 className="text-[#1E293B] mb-1 text-base font-medium whitespace-nowrap truncate">{scenario.name}</h3>
                    <p className="text-[#475569] mb-4 text-xs line-clamp-2 max-w-xs mx-auto">{scenario.description}</p>
                    <Button
                      className="w-full"
                      onClick={() => handleStartScenario(scenario)}
                      disabled={isInitiating || !!activeSessionScenario}
                    >
                      {isInitiating ? <LoadingIndicator size="sm" /> : 'Start Call'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[#1E293B] mb-4 text-lg font-semibold">Scenario Log</h2>
          <div className="bg-white rounded-lg border border-[#E2E8F0]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle">Scenario</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle">Date</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle">Duration</TableHead>
                  <TableHead className="bg-zinc-100 text-muted-foreground px-4 font-medium text-left h-12 align-middle">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-[#64748B] py-8">
                      You have not completed any role-play sessions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => {
                    const scenario = scenarioMap[log.scenarioId];
                    const analysis = analysisReports[log.id];
                    let resultSymbol = '-';
                    if (analysis) {
                      if (analysis.overallPassFail === 'PASS') resultSymbol = 'P';
                      else if (analysis.overallPassFail === 'FAIL') resultSymbol = 'F';
                      else resultSymbol = analysis.overallPassFail?.[0] || '-';
                    } else if (log.status !== 'completed') {
                      resultSymbol = '-';
                    }
                    return (
                      <TableRow
                        key={log.id}
                        onClick={() => handleSessionLogClick(log)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <TableCell className="font-medium">{scenario?.name || 'Unknown'}</TableCell>
                        <TableCell>{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>{formatDuration(log.sessionDurationSeconds)}</TableCell>
                        <TableCell className={resultSymbol === 'P' ? 'text-green-600' : resultSymbol === 'F' ? 'text-red-600' : 'text-slate-600'}>
                          {resultSymbol}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {sessionLogs.length > sessionsPerPage && (
              <div className="flex items-center justify-center gap-2 p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft />
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderSidebarContent = () => {
    if (activeSessionScenario) {
      return <ActiveSessionSidebar scenario={activeSessionScenario} onEndSession={handleEndSession} />;
    }

    switch (activeTab) {
      case 'search':
        return (
          <ScenarioSearchSidebar
            scenarios={allScenarios}
            onStartScenario={handleStartScenario}
            isInitiating={isInitiating}
            activeScenarioId={activeSessionScenario?.id || null}
            getDifficultyColor={getDifficultyColor}
          />
        );
      case 'results':
        if (selectedSessionLog) {
          return (
            <SessionResultsSidebar
              sessionLog={selectedSessionLog}
              scenario={scenarioMap[selectedSessionLog.scenarioId]}
              analysis={analysisReports[selectedSessionLog.id]}
              onDelete={handleDeleteSession}
            />
          );
        }
        return <p className="text-center text-sm text-slate-500">Select a session from the log to see results.</p>;
      case 'scripts':
        return <ScriptsSidebar />;
      default:
        return null;
    }
  };

  const getSidebarTitle = () => {
    if (activeSessionScenario) return 'Active Session Script';
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
          if (activeSessionScenario && tabId !== activeTab) {
            toast.info('Please end your current session first');
            return;
          }
          setActiveTab(tabId);
          if (tabId !== 'results') setSelectedSessionLog(null);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="bg-[#F8FAFC] p-8 text-xs flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>

        <ContextualSidebar title={getSidebarTitle()}>
          {renderSidebarContent()}
        </ContextualSidebar>
      </div>
    </>
  );
}
