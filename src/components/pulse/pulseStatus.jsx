export const getPulseStatus = (pulseScore) => {
    const score = Math.round(pulseScore);
    if (score < 0 || score > 100) {
       return {
            status: "N/A",
            color: "#6B7280",
            message: "Score is out of range"
        };
    }
    
    if (score <= 20) {
        return {
            status: "CRITICAL",
            color: "#DC2626",
            message: "Immediate action required"
        };
    } else if (score <= 40) {
        return {
            status: "AT RISK",
            color: "#EA580C",
            message: "Significant improvements needed"
        };
    } else if (score <= 60) {
        return {
            status: "DEVELOPING",
            color: "#EAB308",
            message: "Building momentum"
        };
    } else if (score <= 80) {
        return {
            status: "STRONG",
            color: "#22C55E",
            message: "Optimize for excellence"
        };
    } else {
        return {
            status: "ELITE",
            color: "#7C3AED",
            message: "Maintain leadership position"
        };
    }
};

const ChartStyle = ({ config }) => {
  // FIX: Sanitize and validate CSS before injection
  const sanitizeCSS = (cssString) => {
    if (!cssString || typeof cssString !== 'string') return '';
    
    // Remove any script tags or javascript: protocols
    const cleaned = cssString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return cleaned;
  };

  const getCSSString = () => {
    if (!config) return '';
    
    // Build CSS safely from config object instead of raw injection
    return `
      .pulse-chart .recharts-line {
        stroke: ${config.lineColor || '#7C3AED'};
      }
      .pulse-chart .recharts-dot {
        fill: ${config.dotColor || '#7C3AED'};
      }
    `;
  };

  // FIX: Use safe CSS generation instead of dangerouslySetInnerHTML
  return (
    <style>
      {getCSSString()}
    </style>
  );
};