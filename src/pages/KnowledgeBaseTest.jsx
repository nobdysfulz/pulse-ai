
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { airtableIntegration } from '@/api/functions';
import { InvokeLLM } from '@/api/integrations';
import AirtableSetup from '../components/airtable/AirtableSetup';

export default function KnowledgeBaseTestPage() {
  const [isSetup, setIsSetup] = useState(false);
  const [knowledgeBaseConfig, setKnowledgeBaseConfig] = useState(null);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const handleSetupComplete = (config) => {
    setKnowledgeBaseConfig(config);
    setIsSetup(true);
    toast.success('Knowledge base setup complete!');
  };

  const searchKnowledgeBase = async () => {
    if (!query.trim() || !knowledgeBaseConfig) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setAiResponse('');
    
    try {
      const response = await airtableIntegration({
        action: 'search',
        tableName: knowledgeBaseConfig.tableName,
        query: query.trim()
      });
      
      if (response.data.records) {
        setSearchResults(response.data.records);
        toast.success(`Found ${response.data.totalFound} matching records`);
      } else {
        toast.info('No matching records found');
      }
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const generateAIResponse = async () => {
    if (!query.trim() || searchResults.length === 0) return;
    
    setIsGeneratingResponse(true);
    
    try {
      // Prepare context from search results
      const context = searchResults.map((record, index) => {
        const recordText = Object.entries(record)
          .filter(([key]) => key !== 'id')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        return `Record ${index + 1}:\n${recordText}`;
      }).join('\n\n');

      const prompt = `You are a real estate business coach specializing in the PULSE Method framework. A user has asked: "${query}"

Based on the following knowledge base content, provide a helpful, specific answer:

${context}

Instructions:
- Answer the user's question using the provided knowledge base content
- Stay within the scope of real estate business coaching and the PULSE Method
- If the knowledge base doesn't contain relevant information, say so
- Be conversational and helpful
- Keep your response under 200 words

Answer:`;

      const response = await InvokeLLM({ prompt });
      setAiResponse(response);
    } catch (error) {
      toast.error('Failed to generate AI response');
      console.error('AI response error:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  if (!isSetup) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Knowledge Base Test</h1>
          <p className="text-slate-600">Set up and test your Airtable knowledge base integration</p>
        </div>
        <AirtableSetup onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Knowledge Base Test</h1>
        <p className="text-slate-600">Test your knowledge base search and AI integration</p>
        <Badge className="mt-2 bg-green-100 text-green-800">
          <Database className="w-3 h-3 mr-1" />
          Connected to: {knowledgeBaseConfig?.tableName}
        </Badge>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Ask a question or search for content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchKnowledgeBase()}
              className="flex-1"
            />
            <Button onClick={searchKnowledgeBase} disabled={isSearching || !query.trim()}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-slate-500">
            Try searching for terms like "PULSE Method", "lead generation", "follow up", etc.
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Search Results ({searchResults.length})</CardTitle>
              <Button onClick={generateAIResponse} disabled={isGeneratingResponse} size="sm">
                {isGeneratingResponse ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI Answer
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.map((record, index) => (
              <Card key={record.id} className="p-4 border-l-4 border-l-purple-500">
                <Badge variant="outline" className="mb-2">Result {index + 1}</Badge>
                <div className="space-y-2">
                  {Object.entries(record).filter(([key]) => key !== 'id').map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-slate-700">{key}:</span>
                      <span className="ml-2 text-slate-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Response */}
      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-Generated Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-slate-800 whitespace-pre-wrap">{aiResponse}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
