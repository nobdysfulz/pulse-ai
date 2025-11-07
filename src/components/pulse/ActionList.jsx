import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { startOfDay, isToday } from 'date-fns';

const ActionItem = ({ task, onToggle }) => (
  <div className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${task.status === 'completed' ? 'bg-green-50' : 'bg-white hover:bg-slate-50'}`}>
    <Checkbox
      id={`task-${task.id}`}
      checked={task.status === 'completed'}
      onCheckedChange={(checked) => onToggle(task, checked)}
      className="mt-1 w-5 h-5 data-[state=checked]:bg-green-500 border-slate-300"
    />
    <div className="flex-1">
      <label htmlFor={`task-${task.id}`} className={`font-semibold text-slate-800 cursor-pointer ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </label>
      <p className="text-sm text-slate-500">{task.description}</p>
    </div>
    {task.actionType && (
      <Badge variant="outline" className="bg-slate-100 text-gray-500 px-2.5 py-0.5 text-xs font-medium inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-white-300 hidden md:inline-flex">
        {task.category?.replace(/_/g, ' ') || task.actionType.replace(/_/g, ' ')}
      </Badge>
    )}
  </div>
);

export default function ActionList({ allActions, todayFormatted, onToggle }) {
  const [activeTab, setActiveTab] = useState("due_today");

  const { dueToday, completed, overdue } = useMemo(() => {
    const todayStart = startOfDay(new Date());

    const todayActions = (allActions || []).filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate === todayFormatted && task.status !== 'completed';
    });

    const overdueActions = (allActions || []).filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate < todayFormatted && task.status !== 'completed';
    });

    const completedActions = (allActions || []).filter((task) => task.status === 'completed').sort((a, b) => {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    return {
      dueToday: todayActions,
      completed: completedActions,
      overdue: overdueActions
    };
  }, [allActions, todayFormatted]);

  const tabs = [
    { value: 'due_today', label: 'Due Today', data: dueToday, count: dueToday.length },
    { value: 'completed', label: 'Completed', data: completed, count: completed.length },
    { value: 'overdue', label: 'Overdue', data: overdue, count: overdue.length }
  ];

  return (
    <Card className="p-6 shadow-sm h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted text-muted-foreground pr-1 pl-1 h-10 items-center justify-center rounded-md grid w-full grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex gap-2 text-xs md:text-sm">
              <span className="text-xs truncate">{tab.label}</span>
              {tab.count > 0 && <Badge className="bg-pink-600 hidden md:inline-flex">{tab.count > 99 ? '99+' : tab.count}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3 max-h-[80vh] overflow-y-auto pr-2">
            {tab.data.length > 0 ? (
              tab.data.map((task) => <ActionItem key={task.id} task={task} onToggle={onToggle} />)
            ) : (
              <p className="text-slate-500 py-16 text-xs text-center">No tasks in this category.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}