export function calculateConfidencePercentage(
    currentDate,
    goalDeadlineDate,
    goalTargetValue,
    goalCurrentProgress,
    goalCreationDate
) {
    // Validation: Invalid target
    if (goalTargetValue <= 0) {
        return 0; // Invalid goal
    }
    
    // Edge Case: Goal already achieved
    if (goalCurrentProgress >= goalTargetValue) {
        return 100;
    }
    
    // Calculate time metrics
    const totalDurationDays = Math.ceil((new Date(goalDeadlineDate) - new Date(goalCreationDate)) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((new Date(currentDate) - new Date(goalCreationDate)) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((new Date(goalDeadlineDate) - new Date(currentDate)) / (1000 * 60 * 60 * 24));
    
    // Edge Case: Deadline passed, goal not achieved
    if (daysRemaining <= 0) {
        return 0;
    }
    
    // Edge Case: Invalid duration
    if (totalDurationDays <= 0) {
        return 0;
    }
    
    // No progress scenarios
    if (goalCurrentProgress === 0) {
        // Goal just created (same day or next day)
        if (daysElapsed <= 1) {
            return 95; // High confidence, just started
        }
        
        // Early stage (less than 15% of time elapsed)
        const timeElapsedRatio = daysElapsed / totalDurationDays;
        if (timeElapsedRatio < 0.15) {
            return 85; // Still early, good confidence
        }
        
        // Significant time passed with no progress
        return 5; // Very low confidence
    }
    
    // Calculate current pace and projection
    if (daysElapsed <= 0) { // Safety check
        return 95;
    }
    
    const actualDailyPace = goalCurrentProgress / daysElapsed;
    const projectedTotalAchievement = actualDailyPace * totalDurationDays;
    
    // Calculate raw confidence percentage
    const rawConfidence = (projectedTotalAchievement / goalTargetValue) * 100;
    
    // Apply confidence adjustments
    const confidence = Math.min(100, Math.max(0, Math.round(rawConfidence)));
    
    return confidence;
}

export function calculateAverageConfidence(activeGoals) {
    if (!activeGoals || activeGoals.length === 0) {
        return 0;
    }
    
    const totalConfidence = activeGoals.reduce((sum, goal) => sum + (goal.confidenceLevel || 0), 0);
    return Math.round(totalConfidence / activeGoals.length);
}