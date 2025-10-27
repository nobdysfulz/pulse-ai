export const getWelcomeEmailTemplate = (firstName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PWRU</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .content {
            background: white;
            padding: 40px 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
        }
        .feature {
            display: flex;
            align-items: flex-start;
            margin: 20px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .feature-icon {
            font-size: 24px;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to PWRU, ${firstName}!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Real Estate Success Platform</p>
    </div>
    
    <div class="content">
        <p>Congratulations! Your PWRU account is now fully set up and ready to help you achieve your real estate goals.</p>
        
        <h3 style="color: #6B46C1; margin-top: 30px;">What's Next:</h3>
        
        <div class="feature">
            <div class="feature-icon">🎭</div>
            <div>
                <strong>Try Role-Play Training</strong><br>
                Practice objection handling with AI clients to sharpen your skills
            </div>
        </div>
        
        <div class="feature">
            <div class="feature-icon">🎯</div>
            <div>
                <strong>Set Your Goals</strong><br>
                Define and track your performance targets with our goal planner
            </div>
        </div>
        
        <div class="feature">
            <div class="feature-icon">📊</div>
            <div>
                <strong>Explore Market Intelligence</strong><br>
                Get real-time insights about your territory and market conditions
            </div>
        </div>
        
        <div class="feature">
            <div class="feature-icon">🧠</div>
            <div>
                <strong>Use PULSE Intelligence</strong><br>
                Get AI-powered performance insights and daily action recommendations
            </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://app.pwru.com/dashboard" class="cta-button">Get Started Now</a>
        </div>
        
        <p>Need help getting started? Our team is here to support you every step of the way.</p>
        
        <p>We're excited to help you grow your real estate business!</p>
    </div>
    
    <div class="footer">
        <p><strong>The PWRU Team</strong></p>
        <p>Power Unit Real Estate Coaching<br>
        <a href="https://powerunitcoaching.com" style="color: #6B46C1;">powerunitcoaching.com</a></p>
    </div>
</body>
</html>
`;

export const getDailyReminderEmailTemplate = (firstName, actions) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Daily Action Plan</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
        }
        .action-item {
            padding: 15px;
            margin: 10px 0;
            background: #f8fafc;
            border-left: 4px solid #6B46C1;
            border-radius: 0 8px 8px 0;
        }
        .priority-high {
            border-left-color: #ef4444;
        }
        .priority-critical {
            border-left-color: #dc2626;
            background: #fef2f2;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Good Morning, ${firstName}! ☀️</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Daily Action Plan</p>
    </div>
    
    <div class="content">
        <p>Here are your priority actions for today:</p>
        
        ${actions.map(action => `
            <div class="action-item ${action.priority === 'high' ? 'priority-high' : ''} ${action.priority === 'critical' ? 'priority-critical' : ''}">
                <strong>${action.title}</strong>
                ${action.description ? `<br><span style="color: #6b7280; font-size: 14px;">${action.description}</span>` : ''}
                ${action.estimatedDuration ? `<br><span style="color: #6b7280; font-size: 12px;">⏱️ ${action.estimatedDuration} min</span>` : ''}
            </div>
        `).join('')}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.pwru.com/actions" class="cta-button">View All Actions</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
            You've got this! Every action brings you closer to your goals. 🎯
        </p>
    </div>
</body>
</html>
`;

export const getWeeklyReportEmailTemplate = (firstName, weeklyStats) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly Performance Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 12px 12px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 12px 12px;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 28px;
            font-weight: bold;
            color: #6B46C1;
            margin: 10px 0;
        }
        .progress-bar {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%);
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">📊 Weekly Report for ${firstName}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${weeklyStats.weekRange}</p>
    </div>
    
    <div class="content">
        <p>Here's how you performed this week:</p>
        
        <div class="stat-grid">
            <div class="stat-card">
                <div style="font-weight: 600; color: #6b7280;">Actions Completed</div>
                <div class="stat-number">${weeklyStats.actionsCompleted}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${weeklyStats.actionCompletionRate}%;"></div>
                </div>
                <div style="font-size: 12px; color: #6b7280;">${weeklyStats.actionCompletionRate}% completion rate</div>
            </div>
            
            <div class="stat-card">
                <div style="font-weight: 600; color: #6b7280;">Goal Progress</div>
                <div class="stat-number">${weeklyStats.goalProgress}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${weeklyStats.goalProgress}%;"></div>
                </div>
                <div style="font-size: 12px; color: #6b7280;">Average across all goals</div>
            </div>
            
            <div class="stat-card">
                <div style="font-weight: 600; color: #6b7280;">PULSE Score</div>
                <div class="stat-number">${weeklyStats.pulseScore}/100</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${weeklyStats.pulseScore}%;"></div>
                </div>
                <div style="font-size: 12px; color: #6b7280;">Overall performance</div>
            </div>
            
            <div class="stat-card">
                <div style="font-weight: 600; color: #6b7280;">Active Days</div>
                <div class="stat-number">${weeklyStats.activeDays}/7</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(weeklyStats.activeDays/7)*100}%;"></div>
                </div>
                <div style="font-size: 12px; color: #6b7280;">Days with activity</div>
            </div>
        </div>
        
        ${weeklyStats.achievements && weeklyStats.achievements.length > 0 ? `
            <h3 style="color: #6B46C1;">🏆 This Week's Achievements</h3>
            <ul>
                ${weeklyStats.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
            </ul>
        ` : ''}
        
        ${weeklyStats.recommendations && weeklyStats.recommendations.length > 0 ? `
            <h3 style="color: #6B46C1;">💡 Recommendations for Next Week</h3>
            <ul>
                ${weeklyStats.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.pwru.com/goals" style="display: inline-block; background: linear-gradient(135deg, #6B46C1 0%, #EC4899 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Detailed Analytics</a>
        </div>
        
        <p style="text-align: center; font-style: italic; color: #6b7280;">
            "Success is the sum of small efforts repeated day in and day out." - Robert Collier
        </p>
    </div>
</body>
</html>
`;