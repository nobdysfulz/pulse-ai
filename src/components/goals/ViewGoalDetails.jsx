
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  BarChart3, 
  History, 
  Settings, 
  TrendingUp,
  Calendar,
  Clock,
  Award
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function ViewGoalDetails({ isOpen, onClose, goal }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!goal) return null;

  const formatPercentage = (value) => {
    const num = value || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  const calculateExpectedProgress = () => {
    const now = new Date();
    const start = new Date(goal.created_date || new Date());
    const end = new Date(goal.deadline);
    const totalDays = differenceInDays(end, start);
    const daysPassed = differenceInDays(now, start);
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  };

  const expectedProgress = calculateExpectedProgress();
  const daysRemaining = differenceInDays(new Date(goal.deadline), new Date());
  const progressVelocity = goal.progressPercentage / Math.max(1, differenceInDays(new Date(), new Date(goal.created_date || new Date())));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            {goal.title}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Progress History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Goal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-xl font-bold">{formatPercentage(goal.progressPercentage)}</span>
                    </div>
                    <Progress 
                      value={goal.progressPercentage || 0} 
                      indicatorClassName="bg-gradient-to-r from-green-400 to-green-600"
                      className="h-3" 
                    />
                    <div className="flex justify-between text-sm text-slate-600 mt-1">
                      <span>{goal.currentValue || 0} / {goal.targetValue} {goal.targetUnit}</span>
                      <span>Target: {goal.targetValue} {goal.targetUnit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{daysRemaining}</div>
                      <div className="text-xs text-blue-600">Days Remaining</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{Math.round(progressVelocity * 100)}%</div>
                      <div className="text-xs text-green-600">Daily Velocity</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Category</span>
                      <Badge variant="outline" className="capitalize">
                        {goal.category?.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <Badge className={`capitalize ${
                        goal.trend === 'ahead' ? 'bg-green-100 text-green-800' :
                        goal.trend === 'on-track' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {goal.trend?.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Deadline</span>
                      <span className="text-sm font-medium">
                        {format(new Date(goal.deadline), 'PPP')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Expected Progress</span>
                        <span>{formatPercentage(expectedProgress)}</span>
                      </div>
                      <Progress 
                        value={expectedProgress} 
                        indicatorClassName="bg-gradient-to-r from-green-400 to-green-600"
                        className="h-2 bg-slate-200" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Actual Progress</span>
                        <span>{formatPercentage(goal.progressPercentage)}</span>
                      </div>
                      <Progress 
                        value={goal.progressPercentage || 0} 
                        indicatorClassName="bg-gradient-to-r from-green-400 to-green-600"
                        className="h-2" 
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      {(goal.progressPercentage || 0) >= expectedProgress ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="font-medium text-sm">
                        {(goal.progressPercentage || 0) >= expectedProgress ? 'Ahead of Schedule' : 'Behind Schedule'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      You are {formatPercentage(Math.abs((goal.progressPercentage || 0) - expectedProgress))}
                      {(goal.progressPercentage || 0) >= expectedProgress ? ' ahead' : ' behind'} your expected progress.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Completion Probability</span>
                      <span className="text-sm font-medium">{formatPercentage(goal.confidenceLevel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Progress Velocity</span>
                      <span className="text-sm font-medium">{progressVelocity.toFixed(2)}%/day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {goal.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{goal.description}</p>
                </CardContent>
              </Card>
            )}

            {goal.milestones && goal.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {goal.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          milestone.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{milestone.title}</span>
                          {milestone.completed && (
                            <Award className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {milestone.value} {goal.targetUnit}
                          {milestone.completedDate && (
                            <span className="ml-2">
                              • Completed {format(new Date(milestone.completedDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Progress Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No progress updates recorded yet.</p>
                    <p className="text-sm">Updates will appear here as you track your progress.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Analytics will be available once you have more progress data.</p>
                  <p className="text-sm">Continue tracking your progress to see trends and insights.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Goal Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Goal editing functionality coming soon.</p>
                  <p className="text-sm">You'll be able to modify targets, deadlines, and other settings here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
