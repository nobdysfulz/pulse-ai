import React from 'react';
import { ArrowRight } from 'lucide-react';

const OpenNowButton = () =>
<div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full group-hover:bg-slate-800 transition-colors">
        Open Now
        <ArrowRight className="w-4 h-4 text-purple-400" />
    </div>;


export default function QuickLinks() {
  return (
    <a
      href="https://pwru.app/login"
      target="_blank"
      rel="noopener noreferrer"
      className="relative block p-8 rounded-2xl bg-gradient-to-br from-indigo-100/70 to-fuchsia-100/70 h-full flex flex-col justify-end group transition-all duration-300 shadow-s">

            <h3 className="text-3xl text-2xl font-medium leading-tight">Access our
Training
Center</h3>
            <div className="mt-6">
                <OpenNowButton />
            </div>
        </a>);

}