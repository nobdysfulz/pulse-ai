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
  }
];
