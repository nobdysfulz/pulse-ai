import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyAction } from '@/api/entities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TaskItem = ({ task, onToggle }) =>
<div className="bg-slate-50 p-3 flex items-center gap-4 rounded-lg shadow-s border border-slate-100">
        <Checkbox
    id={`task-${task.id}`}
    checked={task.status === 'completed'}
    onCheckedChange={(checked) => onToggle(task.id, checked)}
    className="peer bg-slate-50 peer shrink-0 border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-primary-foreground w-4 h-4 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />

        <div className="flex-1">
            <label htmlFor={`task-${task.id}`} className="font-medium text-slate-800 text-sm cursor-pointer flex items-center gap-2">
                {task.title}
                {task.category === 'lofty_sync' &&
      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Lofty
                    </Badge>
      }
            </label>
        </div>
    </div>;


export default function TodaysFocus({ actions, onToggleAction, onRefresh }) {
  const incompleteActions = actions.filter((a) => a.status !== 'completed').slice(0, 3);

  const handleToggle = async (actionId, isCompleted) => {
    try {
      const action = actions.find((a) => a.id === actionId);
      if (!action) return;

      // Update locally first
      await onToggleAction(actionId, isCompleted);

      // If task is from Lofty and being marked complete, sync back to Lofty
      if (isCompleted && action.loftyTaskId) {
        try {
          await supabase.functions.invoke('loftySync', {
            body: {
              action: 'markTaskComplete',
              data: { loftyTaskId: action.loftyTaskId }
            }
          });
        } catch (loftyError) {
          console.error("Failed to mark task complete in Lofty:", loftyError);
        }
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast.error("Failed to update task");
    }
  };

  return (
    <Card className="border text-card-foreground shadow-s rounded-2xl h-full p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Today's Focus</h3>
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                </Button>
            </div>
            <div className="space-y-3">
                {incompleteActions.length > 0 ?
        incompleteActions.map((task) =>
        <TaskItem key={task.id} task={task} onToggle={handleToggle} />
        ) :
        <p className="text-center text-slate-500 py-8">All tasks for today are complete. Great work!</p>
        }
            </div>
            <div className="text-center mt-6">
                 <Link to={createPageUrl('PulseIntelligence')}>
                    <span className="text-purple-900 text-sm font-semibold hover:underline">View All</span>
                </Link>
            </div>
        </Card>);

}