import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';

export const ErrorBanner = ({ title = "Something went wrong", message, onRetry }) => (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="mt-2">
      <p className="text-sm mb-3">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

export const EmptyState = ({ 
  title = "No data found", 
  message = "Get started by adding your first item",
  action,
  actionLabel = "Get Started",
  icon: Icon = AlertCircle
}) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{message}</p>
    {action && (
      <Button onClick={action}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export const InlineError = ({ message, className }) => (
  <div className={`flex items-center gap-2 text-red-600 text-sm ${className || ''}`}>
    <AlertCircle className="w-4 h-4" />
    <span>{message}</span>
  </div>
);
