
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Zap, MessageSquare, RotateCw, CheckCircle, XCircle, Download } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const ScorecardMetric = ({ label, score, description }) => (
    <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-slate-800">{label}</h4>
            <span className="font-bold text-lg text-pink-600">{score}%</span>
        </div>
        <p className="text-sm text-slate-600">{description}</p>
    </div>
);

const rubricDescriptions = {
    active_listening: "Did you acknowledge the client's specific words or feelings?",
    empathy: "Did you validate the client's concern in a genuine way?",
    questioning: "Did you ask clarifying or guiding questions to uncover deeper issues?",
    positioning: "Did you effectively reframe the issue or present a value proposition?",
    clarity: "Was your response clear, concise, and professional?"
};

export default function SessionResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { results, scenario } = location.state || {};

    const onRestart = () => {
        navigate(createPageUrl('RolePlay'));
    };

    const analyses = useMemo(() => results?.transcript.map(t => t.analysis).filter(Boolean) || [], [results]);

    const aggregatedStrengths = useMemo(() => {
        const allStrengths = analyses.flatMap(a => a.strengths || []);
        return [...new Set(allStrengths)];
    }, [analyses]);

    const aggregatedImprovements = useMemo(() => {
        const allImprovements = analyses.flatMap(a => a.improvements || []);
        return [...new Set(allImprovements)];
    }, [analyses]);
    
    const aggregatedScorecard = useMemo(() => {
        const scorecard = {
            active_listening: [],
            empathy: [],
            questioning: [],
            positioning: [],
            clarity: []
        };
        analyses.forEach(a => {
            if(a.scorecard) {
                for (const key in scorecard) {
                    if(a.scorecard[key] !== undefined) scorecard[key].push(a.scorecard[key]);
                }
            }
        });

        const averages = {};
        for(const key in scorecard){
            const scores = scorecard[key];
            averages[key] = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
        }
        return averages;
    }, [analyses]);

    const handleDownload = () => {
        const transcriptText = results.transcript.map(entry => `${entry.speaker === 'AI' ? scenario.clientPersona || 'Client' : 'You'}: ${entry.text}`).join('\n\n');
        const blob = new Blob([transcriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scenario.name}-transcript.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!results || !scenario) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p>No session data found. Redirecting...</p>
                <Button onClick={onRestart} className="mt-4">Back to Skills</Button>
            </div>
        );
    }
    
    const isPassed = results.overallScore >= (scenario?.passingThreshold || 70);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div className="text-center">
                {isPassed ? (
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                <h1 className="text-3xl font-bold text-slate-800">
                    {isPassed ? "Congratulations, You Passed!" : "Good Effort, Keep Practicing!"}
                </h1>
                <p className="text-slate-600 mt-1">
                    You scored {results.overallScore}%, and you needed {scenario?.passingThreshold || 70}% to pass.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>AI Coaching Insights</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-green-600 mb-2">Strengths</h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {aggregatedStrengths.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-orange-600 mb-2">Areas for Improvement</h3>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                           {aggregatedImprovements.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Scorecard Rubric</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {Object.entries(aggregatedScorecard).map(([key, score]) => (
                       <ScorecardMetric 
                           key={key}
                           label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           score={score}
                           description={rubricDescriptions[key]}
                       />
                   ))}
                </CardContent>
            </Card>

            <div className="flex justify-center items-center gap-4">
                <Button onClick={onRestart}>
                    <RotateCw className="w-4 h-4 mr-2" /> Start New Session
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" /> Download Transcript
                </Button>
            </div>
        </div>
    );
}
