import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ContentTopic } from '@/api/entities';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isToday, isTomorrow, isPast, isFuture, differenceInDays } from 'date-fns';

export default function ContentCalendarPreview() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTopics = async () => {
            try {
                const allTopics = await ContentTopic.filter({ isActive: true }, 'weekNumber');
                setTopics(allTopics || []);
            } catch (error) {
                console.error('Error loading content topics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTopics();
    }, []);

    const getDayLabel = (date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'EEEE'); // Day name (e.g., "Monday")
    };

    const getDayColor = (date) => {
        if (isPast(date) && !isToday(date)) return 'bg-blue-50 border-l-blue-400';
        if (isToday(date)) return 'bg-red-50 border-l-red-400';
        if (isTomorrow(date)) return 'bg-yellow-50 border-l-yellow-400';
        return 'bg-green-50 border-l-green-400';
    };

    const getTopicForDay = (date) => {
        // Get the current week number (1-52)
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const daysSinceStart = differenceInDays(date, startOfYear);
        const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

        // Find the topic for this week
        return topics.find(topic => topic.weekNumber === weekNumber);
    };

    // Generate dates for the next 7 days starting from today
    const calendarDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Loading calendar...</div>;
    }

    return (
        <div className="space-y-4">
            {calendarDays.map((date, index) => {
                const topic = getTopicForDay(date);
                const dayLabel = getDayLabel(date);
                const colorClass = getDayColor(date);

                return (
                    <div key={index}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">{dayLabel}</h4>
                        <Card className={`${colorClass} border-l-4`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Copy className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-600">
                                                Post: {topic ? topic.title : 'No content scheduled'}
                                            </span>
                                        </div>
                                        {topic && (
                                            <p className="text-xs text-gray-600">
                                                {topic.coreQuestion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}