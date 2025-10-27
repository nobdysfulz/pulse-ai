
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

const BlogCard = ({ post }) =>
<a href={post.link} target="_blank" rel="noopener noreferrer" className="block group">
        <Card className="shadow-sm rounded-xl overflow-hidden bg-white h-full flex flex-col">
            <div className="overflow-hidden">
                 <img src={post.image || 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?w=800&q=80'} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <CardContent className="p-4 flex flex-col flex-grow">
                 <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 flex-grow">
                    {post.title}
                </h4>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                    <span className="text-purple-900 font-semibold group-hover:underline">Read More →</span>
                </div>
            </CardContent>
        </Card>
    </a>;


export default function BlogSection({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-s">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Latest Blog Articles</h2>
                <a href="https://blog.powerunitcoaching.com" target="_blank" rel="noopener noreferrer" className="text-purple-900 text-sm font-semibold hover:underline">View More

        </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {posts.map((post) => <BlogCard key={post.id} post={post} />)}
            </div>
        </div>);

}
