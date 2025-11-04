import jsPDF from 'jspdf';

const defaultBrandColor = '#7C3AED';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 124, g: 58, b: 237 };
};

const drawHeader = (doc, brandColor, planYear) => {
  const rgb = hexToRgb(brandColor);
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Goals Performance Report', 14, 20);
  doc.setFontSize(11);
  doc.text(`Plan Year ${planYear}`, doc.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(10);
};

const addPriorityGoals = (doc, priorityGoals, startY) => {
  let cursorY = startY;
  doc.setFontSize(12);
  doc.text('Priority Goals', 14, cursorY);
  cursorY += 8;
  doc.setFontSize(10);

  priorityGoals.forEach((goal) => {
    doc.setFont(undefined, 'bold');
    doc.text(goal.title, 14, cursorY);
    cursorY += 5;
    doc.setFont(undefined, 'normal');
    doc.text(`Status: ${goal.status}  •  Progress: ${goal.progress}%`, 14, cursorY);
    cursorY += 5;
    const summary = goal.targetUnit === 'USD'
      ? `${goal.currentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} of ${goal.targetValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}`
      : `${goal.currentValue} of ${goal.targetValue} ${goal.targetUnit}`;
    doc.text(`Current vs Target: ${summary}`, 14, cursorY);
    cursorY += 5;
    const wrappedNextStep = doc.splitTextToSize(`Next Step: ${goal.nextStep}`, 180);
    doc.text(wrappedNextStep, 14, cursorY);
    cursorY += wrappedNextStep.length * 5 + 4;

    if (cursorY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      cursorY = 20;
    }
  });

  return cursorY;
};

const addActivityDrivers = (doc, activityGoals, startY) => {
  let cursorY = startY;
  doc.setFontSize(12);
  doc.text('Activity Drivers', 14, cursorY);
  cursorY += 8;
  doc.setFontSize(10);

  activityGoals.forEach((goal) => {
    doc.setFont(undefined, 'bold');
    doc.text(goal.title, 14, cursorY);
    cursorY += 5;
    doc.setFont(undefined, 'normal');
    doc.text(`Progress: ${goal.progress}%`, 14, cursorY);
    cursorY += 5;
    doc.text(`Current vs Target: ${goal.currentValue} of ${goal.targetValue}`, 14, cursorY);
    cursorY += 8;

    if (cursorY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      cursorY = 20;
    }
  });

  return cursorY;
};

const addAllGoalsSummary = (doc, allGoals, startY) => {
  let cursorY = startY;
  doc.setFontSize(12);
  doc.text('All Goals Snapshot', 14, cursorY);
  cursorY += 8;
  doc.setFontSize(10);

  allGoals.forEach((goal) => {
    const goalLines = doc.splitTextToSize(
      `${goal.title} (${goal.category || 'uncategorized'}) — ${goal.currentValue}/${goal.targetValue} ${goal.targetUnit || ''} [${goal.status}]`,
      180
    );
    doc.text(goalLines, 14, cursorY);
    cursorY += goalLines.length * 5 + 3;

    if (cursorY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      cursorY = 20;
    }
  });
};

export const generateGoalsReportPdf = ({
  summaryData,
  priorityGoals,
  activityGoals,
  allGoals,
  planYear,
  brandColor,
}) => {
  const doc = new jsPDF();
  const headerColor = brandColor || defaultBrandColor;
  drawHeader(doc, headerColor, planYear);

  doc.setFontSize(12);
  doc.text('Performance Overview', 14, 40);
  doc.setFontSize(10);
  const overviewLines = [
    `Overall Progress: ${summaryData.overallProgress}%`,
    `YTD GCI: ${summaryData.currentGci} of ${summaryData.annualGciTarget}`,
    `Quarterly Progress: ${summaryData.quarterlyProgress}% (${summaryData.currentQuarter})`,
    `Projected Year-End Pace: ${summaryData.projectedPace}%`,
  ];
  overviewLines.forEach((line, index) => doc.text(line, 14, 50 + index * 6));

  let cursorY = 80;
  cursorY = addPriorityGoals(doc, priorityGoals, cursorY);
  cursorY += 6;
  cursorY = addActivityDrivers(doc, activityGoals, cursorY);
  cursorY += 6;
  addAllGoalsSummary(doc, allGoals, cursorY);

  const dateSuffix = new Date().toISOString().split('T')[0];
  doc.save(`goals_report_${dateSuffix}.pdf`);
};
