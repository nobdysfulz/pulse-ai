
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, User, HelpCircle, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const IconLink = ({ href, page, external, icon: Icon, title }) => {
  const content =
  <div className="flex flex-col items-center gap-1.5 text-center group">
            <div className="bg-purple-900 w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-indigo-700">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-neutral-950 text-xs font-semibold">{title}</p>
        </div>;


  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return <Link to={createPageUrl(page)}>{content}</Link>;
};

const OpenNowButton = () =>
<div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full group-hover:bg-slate-800 transition-colors">
        Open Now
        <ArrowRight className="w-4 h-4 text-purple-400" />
    </div>;


const ActionCard = ({ href, title }) =>
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer" className="bg-gradient-to-br pt-24 pr-4 pb-4 pl-4 relative block rounded-2xl from-indigo-100/70 to-fuchsia-100/70 flex justify-between items-end group transition-all duration-300 shadow-s">


        <p className="text-2xl text-lg font-semibold">{title}</p>
        <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
        </div>
    </a>;


export default function QuickActions() {
  const iconLinks = [
  { title: 'My Profile', icon: User, page: 'Settings?tab=profile', external: false },
  { title: 'Help Center', icon: HelpCircle, href: 'https://help.powerunitcoaching.com', external: true },
  { title: 'My Market', icon: MapPin, page: 'Market', external: false },
  { title: 'Updates', icon: Info, href: 'https://pwru.app/news', external: true }];


  return (
    <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-around items-center bg-transparent py-2">
                {iconLinks.map((link) => <IconLink key={link.title} {...link} />)}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <ActionCard href="https://pwru.app/events" title="Events" />
                <ActionCard href="https://pwru.app/discounts" title="Resources" />
            </div>

            <a
        href="https://pwru.app/login"
        target="_blank"
        rel="noopener noreferrer"
        className="relative block p-6 rounded-2xl bg-gradient-to-br from-indigo-100/70 to-fuchsia-100/70 flex flex-col justify-end group transition-all duration-300 shadow-s flex-grow">

                <h3 className="text-2xl text-xl font-semibold leading-tight">View our Upcoming
Live Trainings & Masterminds
        </h3>
                <div className="mt-4">
                    <OpenNowButton />
                </div>
            </a>
        </div>);

}
