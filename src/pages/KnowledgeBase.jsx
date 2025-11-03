import React from 'react';

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <iframe
        src="https://help.powerunitcoaching.com/"
        title="Knowledge Base"
        className="w-full h-full border-0"
        // The sandbox attribute enhances security by restricting iframe capabilities.
        // Note: allow-same-origin removed for security - external site should not need same-origin access
        sandbox="allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}