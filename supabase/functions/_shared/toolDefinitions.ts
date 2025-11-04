// Tool definitions for AI agents in OpenAI function calling format

export const novaTools = [
  {
    type: 'function',
    function: {
      name: 'sendGoogleEmail',
      description: 'Send an email via Gmail to specified recipient(s)',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body content (can include HTML)' },
          cc: { type: 'string', description: 'CC email addresses (comma-separated)' },
          bcc: { type: 'string', description: 'BCC email addresses (comma-separated)' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sendOutlookEmail',
      description: 'Send an email via Outlook/Microsoft 365 to specified recipient(s)',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body content (can include HTML)' },
          cc: { type: 'string', description: 'CC email addresses (comma-separated)' },
          bcc: { type: 'string', description: 'BCC email addresses (comma-separated)' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scheduleGoogleCalendarEvent',
      description: 'Schedule a meeting or event in Google Calendar',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Event description' },
          startTime: { type: 'string', description: 'Start time in ISO format (e.g., 2024-01-15T14:00:00-08:00)' },
          endTime: { type: 'string', description: 'End time in ISO format' },
          attendees: { type: 'string', description: 'Attendee email addresses (comma-separated)' },
          location: { type: 'string', description: 'Event location' }
        },
        required: ['title', 'startTime', 'endTime']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'findAvailableTimeSlots',
      description: 'Find available time slots by checking calendar free/busy status',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date/time in ISO format' },
          endDate: { type: 'string', description: 'End date/time in ISO format' },
          duration: { type: 'number', description: 'Meeting duration in minutes (default: 60)' },
          attendees: { type: 'string', description: 'Attendee emails to check availability (comma-separated)' }
        },
        required: ['startDate', 'endDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGoogleDriveFolder',
      description: 'Create a new folder in Google Drive',
      parameters: {
        type: 'object',
        properties: {
          folderName: { type: 'string', description: 'Name of the folder to create' },
          parentFolderId: { type: 'string', description: 'Parent folder ID (optional, defaults to root)' }
        },
        required: ['folderName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGoogleDoc',
      description: 'Create a new Google Document with optional content',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Initial document content (optional)' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGoogleSheet',
      description: 'Create a new Google Spreadsheet with optional data',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Spreadsheet title' },
          headers: { type: 'array', description: 'Column headers (optional)' },
          data: { type: 'array', description: 'Initial data rows (optional)' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'researchAndSummarize',
      description: 'Research a topic using web search and provide a summary',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query or topic to research' },
          focus: { type: 'string', description: 'Specific aspect to focus on' }
        },
        required: ['query']
      }
    }
  }
];

export const siriusTools = [
  {
    type: 'function',
    function: {
      name: 'publishFacebookPost',
      description: 'Publish a post to Facebook Page',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Post content/message' },
          link: { type: 'string', description: 'Optional link to include' },
          imageUrl: { type: 'string', description: 'Optional image URL' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'publishInstagramPost',
      description: 'Publish a post to Instagram Business account',
      parameters: {
        type: 'object',
        properties: {
          caption: { type: 'string', description: 'Post caption' },
          imageUrl: { type: 'string', description: 'Image URL (required for Instagram)' }
        },
        required: ['caption', 'imageUrl']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'publishLinkedInPost',
      description: 'Publish a post to LinkedIn profile',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Post content/message' },
          imageUrl: { type: 'string', description: 'Optional image URL' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getFacebookPageInsights',
      description: 'Get analytics and insights for Facebook Page',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Time period: "week", "month", or "day"', enum: ['day', 'week', 'month'] },
          metrics: { type: 'string', description: 'Specific metrics to retrieve (optional)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getInstagramInsights',
      description: 'Get analytics and insights for Instagram Business account',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Time period: "week", "month", or "day"', enum: ['day', 'week', 'month'] },
          metrics: { type: 'string', description: 'Specific metrics to retrieve (optional)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generateImage',
      description: 'Generate an AI image for social media or marketing',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed description of the image to generate' },
          style: { type: 'string', description: 'Image style (e.g., "professional", "modern", "artistic")' }
        },
        required: ['prompt']
      }
    }
  }
];

export const vegaTools = [
  {
    type: 'function',
    function: {
      name: 'createTransaction',
      description: 'Create a new real estate transaction record',
      parameters: {
        type: 'object',
        properties: {
          propertyAddress: { type: 'string', description: 'Property address' },
          transactionType: { type: 'string', description: 'Transaction type', enum: ['buyer', 'seller', 'dual', 'lease'] },
          clientName: { type: 'string', description: 'Client name' },
          expectedCloseDate: { type: 'string', description: 'Expected closing date (YYYY-MM-DD)' },
          commissionAmount: { type: 'number', description: 'Expected commission amount' }
        },
        required: ['propertyAddress', 'transactionType', 'clientName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getTransactions',
      description: 'Retrieve all active transactions for the user',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status', enum: ['pending', 'active', 'closed', 'cancelled'] },
          limit: { type: 'number', description: 'Maximum number of transactions to return' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateTransaction',
      description: 'Update an existing transaction',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'Transaction ID' },
          status: { type: 'string', description: 'New status' },
          expectedCloseDate: { type: 'string', description: 'Updated close date' },
          notes: { type: 'string', description: 'Additional notes' }
        },
        required: ['transactionId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createLoftyTask',
      description: 'Create a task in Lofty CRM',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description' },
          dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
          contactId: { type: 'string', description: 'Associated contact ID' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createFollowUpBossTask',
      description: 'Create a task in Follow Up Boss',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description' },
          dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
          personId: { type: 'string', description: 'Associated person ID' }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createSkySlopeTransaction',
      description: 'Create a transaction in SkySlope',
      parameters: {
        type: 'object',
        properties: {
          propertyAddress: { type: 'string', description: 'Property address' },
          transactionType: { type: 'string', description: 'Transaction type' },
          clientName: { type: 'string', description: 'Client name' },
          expectedCloseDate: { type: 'string', description: 'Expected close date (YYYY-MM-DD)' }
        },
        required: ['propertyAddress', 'transactionType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'uploadSkySlopeDocument',
      description: 'Upload a document to a SkySlope transaction',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'SkySlope transaction ID' },
          documentUrl: { type: 'string', description: 'URL of the document to upload' },
          documentName: { type: 'string', description: 'Document name' },
          documentType: { type: 'string', description: 'Document type' }
        },
        required: ['transactionId', 'documentUrl']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSkySlopeTransactionDetails',
      description: 'Get details of a SkySlope transaction',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'SkySlope transaction ID' }
        },
        required: ['transactionId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateSkySlopeTransaction',
      description: 'Update a SkySlope transaction',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'SkySlope transaction ID' },
          updates: { type: 'object', description: 'Fields to update' }
        },
        required: ['transactionId', 'updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listSkySlopeTransactions',
      description: 'List all SkySlope transactions',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status' },
          limit: { type: 'number', description: 'Maximum number to return' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSkySlopeChecklistItems',
      description: 'Get checklist items for a SkySlope transaction',
      parameters: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', description: 'SkySlope transaction ID' }
        },
        required: ['transactionId']
      }
    }
  }
];
