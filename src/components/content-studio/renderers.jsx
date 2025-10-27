
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// For MyMarketPack: "graphic"
export const ImageResult = ({ imageUrl }) => (
  <div className="aspect-square w-full rounded-lg overflow-hidden border-2 border-slate-100 shadow-inner">
    <img src={imageUrl} alt="Generated Marketing Graphic" className="w-full h-full object-cover" />
  </div>
);

// For MyMarketPack: "script"
export const ScriptResult = ({ script }) => (
  <div className="space-y-3 text-sm h-full max-h-[400px] overflow-y-auto pr-2">
    <h4 className="font-bold text-md text-slate-800">{script.video_title}</h4>
    <div className="space-y-2">
      <div>
        <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Hook</p>
        <p className="text-slate-700">{script.intro_hook}</p>
      </div>
      <div>
        <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Key Trend</p>
        <p className="text-slate-700">{script.key_trend}</p>
      </div>
      <div>
        <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider">What It Means</p>
        <p className="text-slate-700">{script.what_it_means}</p>
      </div>
      <div>
        <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Advice</p>
        <p className="text-slate-700">{script.actionable_advice}</p>
      </div>
      <div>
        <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Call to Action</p>
        <p className="text-slate-700">{script.call_to_action}</p>
      </div>
    </div>
  </div>
);

// For MyMarketPack: "blog"
export const BlogResult = ({ content }) => (
  <div className="prose prose-sm max-w-none text-slate-700 h-full max-h-[400px] overflow-y-auto pr-2">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);


// For Social Posts: "social_post"
export const SocialPostRenderer = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-slate-500">No social posts found in this content.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((post, index) => (
        <Card key={index} className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">{post.title || `Post ${index + 1}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{post.content || ''}</ReactMarkdown>
            </div>
            {post.hashtags && Array.isArray(post.hashtags) && (
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// For Video Scripts: "video_script"
export const VideoScriptRenderer = ({ data }) => {
  if (typeof data !== 'object' || !data || !Array.isArray(data.sections)) {
    return <p className="text-slate-500">Invalid video script format.</p>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{data.title || 'Video Script'}</h3>
      {data.description && <div className="prose prose-sm max-w-none"><ReactMarkdown>{data.description}</ReactMarkdown></div>}
      <Separator />
      {data.sections.map((section, index) => (
        <div key={index} className="p-4 border rounded-lg bg-slate-50">
          <h4 className="font-semibold text-md mb-2">{section.title} ({section.duration})</h4>
          <p className="text-sm text-slate-700 mt-1"><strong>Narration:</strong> {section.content}</p>
          <p className="text-sm text-purple-700 mt-1"><strong>Shot Suggestion:</strong> {section.shot_suggestion}</p>
        </div>
      ))}
    </div>
  );
};

// For Ad Campaigns: "ad_campaign"
export const AdCampaignRenderer = ({ data }) => {
  if (typeof data !== 'object' || !data) {
    return <p className="text-slate-500">Invalid ad campaign format.</p>;
  }
  
  return (
    <div className="space-y-6">
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>{data.name || 'Ad Campaign'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold mb-2">Targeting:</p>
          {data.targeting && Array.isArray(data.targeting) ? (
            <div className="flex flex-wrap gap-2">
              {data.targeting.map((target, i) => <Badge key={i} variant="secondary">{target}</Badge>)}
            </div>
          ) : <p className="text-sm text-slate-500">Not specified</p>}
        </CardContent>
      </Card>
      
      <h4 className="text-lg font-semibold">Ad Variations</h4>
      {data.variations && Array.isArray(data.variations) ? (
        data.variations.map((ad, index) => (
          <Card key={index}>
            <CardHeader>
                <CardTitle className="text-md">Ad {index + 1}: {ad.headline}</CardTitle>
                {ad.type && <p className="text-sm text-slate-500">{ad.type}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Body:</p>
                <div className="prose prose-sm max-w-none bg-slate-50 p-3 rounded-md">
                    <ReactMarkdown>{ad.body || ''}</ReactMarkdown>
                </div>
                <p><strong>Call to Action:</strong> {ad.cta || 'N/A'}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-slate-500">No ad variations found for this campaign.</p>
      )}

      {data.creative_suggestions && (
        <Card>
          <CardHeader><CardTitle className="text-md">Creative Suggestions</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {data.creative_suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// For Content Calendar: "content_calendar"
export const ContentCalendarRenderer = ({ data }) => {
  if (typeof data !== 'object' || !data || !Array.isArray(data.calendar)) {
    return <p className="text-slate-500">Invalid content calendar format.</p>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{data.theme || 'Content Calendar'}</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Day</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Topic</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Post Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.calendar.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.day}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{item.topic}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{item.post_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// For Market Report or any other text-based content
export const DefaultRenderer = ({ data }) => (
    <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</ReactMarkdown>
    </div>
);
