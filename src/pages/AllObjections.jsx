
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Search, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { mockObjectionData } from '../components/roleplay/scriptData'; // Removed: Using ObjectionScript entity instead
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useCredits from '@/components/credits/useCredits';
import LockedFeature from '@/components/ui/LockedFeature';
import { ObjectionScript } from '@/api/entities'; // New: Import ObjectionScript entity
// import { scriptCategories } from '../components/roleplay/scriptData'; // Not directly used here, categories are derived from loaded scripts

const AllObjections = () => {
    const [objectionScripts, setObjectionScripts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const navigate = useNavigate();
    const { user } = useCredits();
    const isFreeTier = user?.subscriptionTier === 'Free';

    useEffect(() => {
        const loadScripts = async () => {
            try {
                // Fetch objection scripts where isActive is true, sorted by sortOrder
                const scripts = await ObjectionScript.filter({ isActive: true }, '-sortOrder');
                setObjectionScripts(scripts || []);
            } catch (error) {
                console.error("Failed to load objection scripts:", error);
            }
        };
        loadScripts();
    }, []); // Empty dependency array means this runs once on component mount

    const categories = useMemo(() =>
        // Extract unique categories from the loaded scripts
        ['all', ...new Set(objectionScripts.map(s => s.category))],
        [objectionScripts]
    );

    const difficulties = useMemo(() =>
        // Extract unique difficulties from the loaded scripts
        ['all', ...new Set(objectionScripts.map(o => o.difficulty))],
        [objectionScripts]
    );

    const filteredObjections = useMemo(() => {
        return objectionScripts.filter(script => {
            const searchMatch = searchTerm === '' ||
                script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                script.situation.toLowerCase().includes(searchTerm.toLowerCase()); // Search by title or situation
            const categoryMatch = categoryFilter === 'all' || script.category === categoryFilter;
            const difficultyMatch = difficultyFilter === 'all' || script.difficulty === difficultyFilter;
            return searchMatch && categoryMatch && difficultyMatch;
        });
    }, [objectionScripts, searchTerm, categoryFilter, difficultyFilter]);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(createPageUrl('RolePlay'))}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Simulator
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 text-center">Objections Library</h1>
                <div className="w-32"/>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <Input
                            placeholder="Search objections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                         />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        <SelectTrigger><SelectValue placeholder="All Difficulties" /></SelectTrigger>
                        <SelectContent>
                            {difficulties.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredObjections.map((objection) => {
                     // An objection is locked if the user is free tier AND the objection is NOT free
                     const isLocked = isFreeTier && !objection.isFree;
                     return (
                        <Card key={objection.id} className="relative overflow-hidden">
                            {isLocked && <LockedFeature featureName="this objection" />}
                            <Accordion type="single" collapsible className={`transition-opacity ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                                <AccordionItem value={`item-${objection.id}`} className="border-b-0">
                                    <AccordionTrigger className="p-4 font-semibold text-left hover:no-underline">
                                        <div className="flex items-center gap-4 w-full">
                                            <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            <span className="text-left flex-grow">{objection.title}</span> {/* Display title */}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-slate-600 mb-1">Situation</h4>
                                                <p className="text-slate-600">{objection.situation}</p> {/* Display situation */}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-pink-600 mb-1">Recommended Response</h4>
                                                <p className="text-slate-600 whitespace-pre-wrap font-mono text-sm">{objection.response}</p> {/* Display response */}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-purple-600 mb-1">Key Tips</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                                    {/* Map through tips array */}
                                                    {objection.tips.map((tip, index) =>
                                                        <li key={index}>{tip}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </Card>
                     )
                })}
            </div>
        </div>
    );
};

export default AllObjections;
