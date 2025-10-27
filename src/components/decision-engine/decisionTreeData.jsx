export const decisionTrees = {
  // --- LEADS CATEGORY (7 scenarios) ---
  cold_internet_lead: {
    id: "cold_internet_lead",
    category: "leads",
    title: "Cold Internet Lead",
    description: "Lead from website, Zillow, or online advertising",
    initialNode: "opt_in_source",
    nodes: {
      opt_in_source: {
        question: "How did they opt in?",
        context: "Understanding the source helps determine their intent level.",
        type: "single_select",
        options: [
          { id: "website", label: "Your Website", description: "Direct inquiry from your site", next: "first_contact" },
          { id: "zillow", label: "Zillow/Portal", description: "Third-party platform lead", next: "first_contact" },
          { id: "facebook", label: "Facebook/Social Ad", description: "Social media advertising", next: "first_contact" }
        ]
      },
      first_contact: {
        question: "Have you made first contact?",
        type: "binary",
        options: [
          { id: "yes", label: "Yes, I've reached out", next: "engagement_check" },
          { id: "no", label: "No, not yet", next: "initial_outreach" }
        ]
      },
      engagement_check: {
        question: "How did they respond to your outreach?",
        type: "single_select",
        options: [
          { id: "responsive", label: "Engaged and responsive", next: "next_step_planning" },
          { id: "minimal", label: "Minimal response (e.g., 'thanks')", next: "re_engagement" },
          { id: "none", label: "No response yet", next: "follow_up_strategy" }
        ]
      },
    },
    outcomes: {
      initial_outreach: {
        primary: {
          title: "Send personalized introduction within 5 minutes",
          description: "Speed is critical. Craft a welcome message referencing their specific inquiry and offer immediate, exclusive value.",
          script: "Hi [Name], I saw you were looking at homes in [Area]. I specialize in that neighborhood and actually have 3 new listings coming this week that match what you're searching for. Would you like me to send you the details before they go live to the public?",
          timeline: "Within 5 minutes of lead notification",
        },
        alternatives: [
          { type: "soft", title: "Send automated welcome with market report", description: "Use your drip system to send neighborhood market data.", script: "Welcome! Here's your custom market report for [Area]. I'll be sending you new listings as they become available." },
          { type: "assertive", title: "Call directly with specific value offer", description: "Pick up the phone and offer exclusive preview access.", script: "Hi [Name], this is [Agent] calling about your home search in [Area]. I have a property coming on the market tomorrow that matches exactly what you're looking for. Do you have 2 minutes for me to tell you about it?" }
        ]
      },
      next_step_planning: {
          primary: {
              title: "Schedule a Buyer Consultation",
              description: "Move the conversation offline to build rapport and formalize the relationship. Position this as a strategy session, not a sales call.",
              script: "That's great to hear! To make sure we're finding the best possible homes for you, I'd love to schedule a quick 15-minute call to go over your goals and create a custom home search plan. How does [Day] at [Time] work for you?",
              timeline: "Within 24 hours of positive response",
          },
          alternatives: [
              { type: "soft", title: "Offer a Custom Property List", description: "Send a curated list of on and off-market properties.", script: "Perfect. Based on our chat, I'm putting together a custom list of properties for you, including some that aren't available to the public yet. I'll have that over to you this afternoon." },
              { type: "assertive", title: "Suggest a Property Tour", description: "If they are highly engaged, propose seeing a specific property.", script: "Since you're ready to start looking, there's a great property at [Address] that I think you'll love. I can get us in to see it tomorrow at 5pm. Does that work?" },
          ]
      },
      re_engagement: {
        primary: {
          title: "Send a 'Pattern Interrupt' message",
          description: "Break their expectation with something unexpected but valuable.",
          script: "Hey [Name], I know you're probably getting a ton of messages from agents right now. Instead of adding to the noise, I wanted to ask: what's the one thing about buying a home that's stressing you out the most right now?",
          timeline: "2-3 days after minimal response"
        },
        alternatives: [
          { type: "soft", title: "Share relevant market insight", description: "Send something helpful without asking for anything.", script: "Thought you'd find this interesting - [Area] just saw its biggest price jump in 6 months. Here's what's driving it..." },
          { type: "assertive", title: "Direct question about timeline", description: "Ask straight up about their buying timeline.", script: "Quick question - are you actively looking to buy in the next 30-60 days, or more of a 'someday when the right thing comes along' timeline? Just want to make sure I'm sending you the right info." }
        ]
      },
      follow_up_strategy: {
        primary: {
          title: "Send a voice message with local insight",
          description: "Record a 30-second voice message about something specific to their area of interest.",
          script: "Hey [Name], it's [Agent]. I was just driving through [Neighborhood] and noticed something you'd want to know about the market there. Give me a call when you get a chance and I'll fill you in.",
          timeline: "3-5 days after initial contact"
        },
        alternatives: [
          { type: "soft", title: "Send helpful buying guide", description: "Provide educational content without pressure.", script: "No pressure at all, but I put together this buyer's guide for [Area] that covers everything from schools to commute times. Thought it might be helpful for your search." },
          { type: "assertive", title: "Call with urgency message", description: "Phone call about time-sensitive market opportunity.", script: "Hi [Name], I have 30 seconds to tell you about something happening in [Area] that could save you $15,000 if you're still looking. Can I call you real quick?" }
        ]
      }
    }
  },

  warm_referral_lead: {
    id: "warm_referral_lead",
    category: "leads",
    title: "Warm Referral Lead",
    description: "Lead referred by a past client or contact",
    initialNode: "referral_source",
    nodes: {
      referral_source: {
        question: "Who referred them to you?",
        type: "single_select",
        options: [
          { id: "past_client", label: "Past Client", description: "Previous buyer/seller", next: "referral_details" },
          { id: "professional", label: "Industry Professional", description: "Lender, contractor, etc.", next: "referral_details" },
          { id: "personal", label: "Personal Contact", description: "Friend, family, neighbor", next: "referral_details" }
        ]
      },
      referral_details: {
        question: "How much do they know about you?",
        type: "single_select",
        options: [
          { id: "detailed", label: "Detailed recommendation", next: "warm_approach" },
          { id: "basic", label: "Basic referral mention", next: "introduction_needed" },
          { id: "unknown", label: "Just given your contact", next: "cold_warm_hybrid" }
        ]
      }
    },
    outcomes: {
      warm_approach: {
        primary: {
          title: "Leverage the warm introduction immediately",
          description: "Reference the referrer specifically and build on established trust.",
          script: "Hi [Name], [Referrer] told me you're looking for a home in [Area] and spoke very highly of you! They mentioned you're hoping to find something in the next few months. I helped [Referrer] find their dream home last year, and I'd love to do the same for you. When would be a good time for a quick 15-minute call to discuss your goals?",
          timeline: "Same day as referral"
        },
        alternatives: [
          { type: "soft", title: "Send a warm introduction email", description: "Professional but friendly email leveraging the connection.", script: "Hello [Name], I hope this message finds you well. [Referrer] highly recommended I reach out to you regarding your home search in [Area]. I had the pleasure of helping [Referrer] with their real estate needs, and they felt we'd be a great fit for working together." }
        ]
      },
      introduction_needed: {
        primary: {
          title: "Warm introduction with credentials",
          description: "Introduce yourself while leveraging the referral connection.",
          script: "Hi [Name], [Referrer] suggested I reach out to you about your interest in [Area]. I'm [Agent Name], and I've been helping families in this area for [X] years. [Referrer] mentioned you might be looking to buy/sell soon - I'd love to share some insights about the current market. Would you have 10 minutes for a quick call this week?",
          timeline: "Within 24 hours"
        },
        alternatives: [
          { type: "assertive", title: "Call with specific market insight", description: "Lead with value about their area of interest.", script: "Hi [Name], this is [Agent] - [Referrer] gave me your number. I just wanted to quickly share something happening in [Area] that could impact your home search. Do you have 2 minutes?" }
        ]
      },
      cold_warm_hybrid: {
        primary: {
          title: "Acknowledge the referral but build from scratch",
          description: "Treat as semi-cold lead but mention the referral source.",
          script: "Hi [Name], [Referrer] gave me your contact information and mentioned you might be interested in real estate in [Area]. I don't want to assume they told you much about me, so let me briefly introduce myself. I'm [Agent], and I specialize in helping people in [Area]. What questions do you have about the current market?",
          timeline: "Within 48 hours"
        },
        alternatives: [
          { type: "soft", title: "Educational approach with referral mention", description: "Provide value first, mention referral second.", script: "Hi [Name], I hope you don't mind me reaching out. [Referrer] thought you might find this market report for [Area] helpful for your home search. No strings attached - just wanted to share some insights that might be useful." }
        ]
      }
    }
  },

  open_house_lead: {
    id: "open_house_lead",
    category: "leads",
    title: "Open House Lead",
    description: "Someone who attended your open house",
    initialNode: "engagement_level",
    nodes: {
      engagement_level: {
        question: "How engaged were they at the open house?",
        type: "single_select",
        options: [
          { id: "highly_engaged", label: "Asked lots of questions, stayed long", next: "immediate_follow_up" },
          { id: "moderately_engaged", label: "Looked around, some questions", next: "standard_follow_up" },
          { id: "minimal_engagement", label: "Quick walk-through, minimal interaction", next: "nurture_approach" }
        ]
      }
    },
    outcomes: {
      immediate_follow_up: {
        primary: {
          title: "Follow up within 2 hours with specific property discussion",
          description: "Strike while the iron is hot - reference specific conversations from the open house.",
          script: "Hi [Name], it was great meeting you at the open house today! I could tell you really connected with the kitchen layout and the master suite. Based on our conversation about your timeline and preferences, I have 2 other properties I think you'd love to see. Are you available for a quick showing this week?",
          timeline: "Within 2 hours of open house"
        },
        alternatives: [
          { type: "assertive", title: "Call immediately with urgency", description: "If they showed high interest, create urgency.", script: "Hi [Name], I wanted to call while today's visit was still fresh. I could see how much you loved the house, and I just heard there might be another offer coming in soon. If you're seriously interested, we should probably discuss next steps tonight." }
        ]
      },
      standard_follow_up: {
        primary: {
          title: "Send personalized follow-up within 24 hours",
          description: "Reference what they looked at and provide additional value.",
          script: "Hi [Name], thank you for stopping by the open house yesterday. I noticed you spent time looking at [specific area]. I wanted to send you the floor plan and some additional photos, plus information about the neighborhood amenities. Are you still actively looking in this area?",
          timeline: "Next day"
        },
        alternatives: [
          { type: "soft", title: "Email with comparable properties", description: "Send similar listings to gauge continued interest.", script: "Hello [Name], it was nice meeting you at the open house. I thought you might be interested in seeing these similar properties that just came on the market in the same area." }
        ]
      },
      nurture_approach: {
        primary: {
          title: "Add to nurture sequence with market updates",
          description: "They may not be ready now, but stay top of mind.",
          script: "Hi [Name], thanks for visiting the open house. I understand you're in the early stages of your search. I'd be happy to keep you updated on new listings in the area as they come available. Would you like me to add you to my VIP buyer list?",
          timeline: "Within 3 days"
        },
        alternatives: [
          { type: "soft", title: "Monthly market report", description: "Low-pressure, high-value content approach.", script: "Hello [Name], nice meeting you at the open house. I send out a monthly market report for this area that many people find helpful. Would you like me to include you?" }
        ]
      }
    }
  },

  expired_listing_lead: {
    id: "expired_listing_lead",
    category: "leads",
    title: "Expired Listing Lead",
    description: "Homeowner whose listing recently expired",
    initialNode: "expiration_timeline",
    nodes: {
      expiration_timeline: {
        question: "When did their listing expire?",
        type: "single_select",
        options: [
          { id: "just_expired", label: "Within the last week", next: "immediate_approach" },
          { id: "recent_expired", label: "1-4 weeks ago", next: "strategic_approach" },
          { id: "old_expired", label: "Over a month ago", next: "research_approach" }
        ]
      }
    },
    outcomes: {
      immediate_approach: {
        primary: {
          title: "Direct but empathetic outreach",
          description: "Address their recent disappointment with solutions.",
          script: "Hi [Name], I noticed your home at [Address] recently came off the market. I know that can be frustrating after having it listed. I've helped several homeowners in similar situations successfully sell their homes by addressing the specific reasons properties don't sell the first time. Would you be open to a 15-minute conversation about what went wrong and how to fix it?",
          timeline: "3-7 days after expiration"
        },
        alternatives: [
          { type: "assertive", title: "Market analysis offer", description: "Lead with data and analysis.", script: "Hi [Name], I've been tracking your listing at [Address] and have some insights about why it may not have sold. I'd like to provide you with a fresh market analysis that shows exactly what needs to change. Are you available for a brief meeting this week?" }
        ]
      },
      strategic_approach: {
        primary: {
          title: "Problem-solution positioning",
          description: "Position yourself as the solution to their previous agent's failures.",
          script: "Hi [Name], I see your home at [Address] was on the market recently. After analyzing the listing and recent sales in your area, I have some specific ideas about why it didn't sell and how to fix those issues. Many homeowners in your situation have successfully sold with the right strategy adjustments. Could we set up a brief consultation?",
          timeline: "When you identify them"
        },
        alternatives: [
          { type: "soft", title: "Educational approach", description: "Provide value before asking for appointment.", script: "Hello [Name], I specialize in helping homeowners who've had unsuccessful listing experiences. I've put together a guide on the 5 most common reasons homes don't sell and how to fix them. Would you like me to send it over?" }
        ]
      },
      research_approach: {
        primary: {
          title: "Consultative market assessment",
          description: "Find out their current situation and motivation.",
          script: "Hi [Name], I noticed your home at [Address] was on the market earlier this year. I'm curious - are you still looking to sell, or have your plans changed? The market has shifted since then, and there might be new opportunities worth discussing.",
          timeline: "When you identify them"
        },
        alternatives: [
          { type: "soft", title: "Market update approach", description: "Share current market conditions.", script: "Hello [Name], I wanted to reach out because the market conditions have changed significantly since your home was listed. If you're still considering selling, the current environment might be much more favorable." }
        ]
      }
    }
  },

  fsbo_lead: {
    id: "fsbo_lead",
    category: "leads",
    title: "FSBO (For Sale By Owner)",
    description: "Homeowner trying to sell without an agent",
    initialNode: "listing_duration",
    nodes: {
      listing_duration: {
        question: "How long have they been trying to sell?",
        type: "single_select",
        options: [
          { id: "new_fsbo", label: "Less than 2 weeks", next: "education_approach" },
          { id: "struggling_fsbo", label: "2-8 weeks", next: "assistance_approach" },
          { id: "frustrated_fsbo", label: "Over 2 months", next: "rescue_approach" }
        ]
      }
    },
    outcomes: {
      education_approach: {
        primary: {
          title: "Offer helpful resources without pressure",
          description: "Build relationship by providing value during their attempt.",
          script: "Hi [Name], I noticed you're selling your home at [Address] yourself. That takes a lot of courage! I know the process can be overwhelming with all the paperwork and legal requirements. I've put together a guide that covers the key things to watch out for when selling FSBO. Would you like me to send it over? No strings attached - I just like to help homeowners in our community.",
          timeline: "Early in their process"
        },
        alternatives: [
          { type: "soft", title: "Market insight sharing", description: "Share relevant market data.", script: "Hello [Name], I see you're selling your beautiful home on [Street]. I wanted to share some recent sales data from your neighborhood that might be helpful for your pricing strategy. Would you like me to email it over?" }
        ]
      },
      assistance_approach: {
        primary: {
          title: "Offer limited assistance services",
          description: "Help them succeed while positioning yourself for future business.",
          script: "Hi [Name], how's the sale of your home at [Address] going? I know selling FSBO can be challenging, especially with all the paperwork and showings. I offer some limited consulting services for FSBO sellers - things like contract review, pricing analysis, or negotiation assistance. No commitment to list with me, just help when you need it. Interested in learning more?",
          timeline: "After they've had some experience"
        },
        alternatives: [
          { type: "assertive", title: "Results-focused conversation", description: "Address likely frustrations directly.", script: "Hi [Name], I've been watching your listing at [Address]. How many showings have you had? I work with a lot of sellers in your area and might have some insights on how to generate more interest. Would you be open to a quick 10-minute call?" }
        ]
      },
      rescue_approach: {
        primary: {
          title: "Position as the solution to their frustration",
          description: "Address their likely exhaustion and offer relief.",
          script: "Hi [Name], I see you've been working hard to sell your home at [Address] for a few months now. I imagine you're probably feeling pretty exhausted with all the showings, phone calls, and paperwork. I specialize in helping homeowners who've tried the FSBO route get their homes sold quickly and at top dollar. Would you be interested in hearing how I could take this burden off your shoulders?",
          timeline: "After extended FSBO period"
        },
        alternatives: [
          { type: "assertive", title: "Direct buyout offer", description: "If appropriate, offer to buy or find investor.", script: "Hi [Name], I noticed your home has been on the market for quite a while. If you need to sell quickly, I work with several investors who might be interested in making a cash offer. Would you like me to have one of them take a look?" }
        ]
      }
    }
  },

  social_media_lead: {
    id: "social_media_lead",
    category: "leads",
    title: "Social Media Lead",
    description: "Lead generated from social media platforms",
    initialNode: "platform_source",
    nodes: {
      platform_source: {
        question: "Which platform did they come from?",
        type: "single_select",
        options: [
          { id: "facebook", label: "Facebook", next: "engagement_type" },
          { id: "instagram", label: "Instagram", next: "engagement_type" },
          { id: "linkedin", label: "LinkedIn", next: "professional_approach" },
          { id: "tiktok", label: "TikTok", next: "casual_approach" }
        ]
      },
      engagement_type: {
        question: "How did they engage?",
        type: "single_select",
        options: [
          { id: "dm", label: "Direct message", next: "direct_response" },
          { id: "comment", label: "Commented on post", next: "public_to_private" },
          { id: "form", label: "Filled out lead form", next: "form_follow_up" }
        ]
      }
    },
    outcomes: {
      direct_response: {
        primary: {
          title: "Mirror their communication style",
          description: "Match their energy and communication preference.",
          script: "Hey [Name]! Thanks for reaching out about [property/topic]. I saw you're interested in [Area] - that's one of my favorite neighborhoods to work in! What specifically are you looking for? Happy to help! 🏠",
          timeline: "Within 1 hour"
        },
        alternatives: [
          { type: "professional", title: "Transition to professional discussion", description: "Elevate the conversation while staying friendly.", script: "Hi [Name], thank you for your message! I'd love to help you with your real estate needs in [Area]. Would you prefer to continue our conversation here, or would a quick phone call be more convenient?" }
        ]
      },
      public_to_private: {
        primary: {
          title: "Move conversation to private channel",
          description: "Thank publicly, then connect privately.",
          script: "Thanks for your comment, [Name]! I'll send you a DM with more details about [topic]. Looking forward to helping you out! 👍",
          timeline: "Within 30 minutes"
        },
        alternatives: [
          { type: "assertive", title: "Phone number request", description: "If urgent, ask for phone contact.", script: "Great question, [Name]! There's quite a bit to cover on this topic. Would you mind if I gave you a quick call? Might be easier than typing everything out! 📞" }
        ]
      },
      form_follow_up: {
        primary: {
          title: "Personal video response",
          description: "Stand out with a personalized video message.",
          script: "Hi [Name], I got your info from [platform/post] and wanted to personally thank you for your interest in [Area]. I actually recorded a quick video with some insights about the current market there. Check your email in a few minutes!",
          timeline: "Same day"
        },
        alternatives: [
          { type: "traditional", title: "Phone call with social reference", description: "Call but reference the social media connection.", script: "Hi [Name], this is [Agent] calling about your interest in [Area] from my [platform] post. I wanted to reach out personally to see how I can help with your real estate needs." }
        ]
      },
      professional_approach: {
        primary: {
          title: "Professional networking approach",
          description: "LinkedIn requires more formal communication.",
          script: "Hello [Name], thank you for connecting with me on LinkedIn. I see you're interested in real estate opportunities in [Area]. I'd be happy to provide you with some market insights and discuss how I might be able to assist with your real estate goals. Would you be available for a brief call this week?",
          timeline: "Within 24 hours"
        },
        alternatives: [
          { type: "content", title: "Share valuable content first", description: "Provide value before asking for meeting.", script: "Hello [Name], I noticed your interest in [Area] real estate. I recently published a market analysis for that area that you might find valuable. I'd be happy to share it with you, and if you have questions, I'm here to help." }
        ]
      },
      casual_approach: {
        primary: {
          title: "Match TikTok's casual, authentic tone",
          description: "Stay authentic to the platform's culture.",
          script: "Hey [Name]! Saw you're interested in homes in [Area] from my TikTok! That area is actually 🔥 right now. Want to chat about what you're looking for? I can probably help you out! Message me back! ✨",
          timeline: "Immediately"
        },
        alternatives: [
          { type: "video", title: "TikTok video response", description: "Respond with a personalized TikTok video.", script: "Create a short, personalized video response addressing their specific interest and offering to help." }
        ]
      }
    }
  },

  sphere_contact: {
    id: "sphere_contact",
    category: "leads",
    title: "Sphere of Influence Contact",
    description: "Someone from your personal/professional network",
    initialNode: "relationship_type",
    nodes: {
      relationship_type: {
        question: "What's your relationship with them?",
        type: "single_select",
        options: [
          { id: "close_friend", label: "Close friend or family", next: "personal_approach" },
          { id: "acquaintance", label: "Acquaintance or neighbor", next: "friendly_approach" },
          { id: "professional", label: "Professional contact", next: "business_approach" }
        ]
      }
    },
    outcomes: {
      personal_approach: {
        primary: {
          title: "Direct, personal conversation",
          description: "Leverage your existing relationship authentically.",
          script: "Hey [Name]! I heard through the grapevine that you might be thinking about buying/selling. You know I'm in real estate now, and I'd love to help you out if you're interested. Want to grab coffee and chat about what you're looking for?",
          timeline: "As soon as you hear about their need"
        },
        alternatives: [
          { type: "casual", title: "Text message approach", description: "Start with casual text conversation.", script: "Hey! Heard you might be looking at houses! Hit me up if you want to chat about the market - would love to help! 😊" }
        ]
      },
      friendly_approach: {
        primary: {
          title: "Warm but professional outreach",
          description: "Strike balance between personal connection and professionalism.",
          script: "Hi [Name], I hope you're doing well! I heard you might be considering a move. As you may know, I'm working in real estate now and would love to help if you're looking to buy or sell. No pressure at all - just wanted you to know I'm here if you have any questions about the market.",
          timeline: "When you learn of their interest"
        },
        alternatives: [
          { type: "value", title: "Market update approach", description: "Provide value first, then offer help.", script: "Hi [Name]! Hope you're well. I know you live in [Area], and there have been some interesting changes in the market there lately. Thought you might find this info useful. Let me know if you ever want to chat about real estate!" }
        ]
      },
      business_approach: {
        primary: {
          title: "Professional but warm outreach",
          description: "Maintain professional relationship while offering personal service.",
          script: "Hello [Name], I hope business is going well for you. I wanted to reach out because I heard you might be in the market for a new home. As you know, I'm now working in real estate, and I'd be honored to help a fellow professional with such an important decision. Would you have time for a brief call to discuss your needs?",
          timeline: "Within a few days of learning their need"
        },
        alternatives: [
          { type: "referral", title: "Referral relationship building", description: "Position for mutual referrals.", script: "Hello [Name], I wanted to reconnect and let you know I'm now working in real estate. I know we both work with a lot of people who might need real estate services, and I'd love to explore how we might be able to help each other's clients." }
        ]
      }
    }
  },

  // --- BUYERS CATEGORY (5 scenarios) ---
  indecisive_buyer: {
    id: "indecisive_buyer",
    category: "buyers",
    title: "Indecisive Buyer",
    description: "Buyer who can't make a decision or keeps changing their mind",
    initialNode: "reason_for_indecision",
    nodes: {
        reason_for_indecision: {
            question: "What's the primary reason for their indecision?",
            context: "Diagnosing the root cause is key to helping them move forward.",
            type: "single_select",
            options: [
                { id: "fear", label: "Fear of Overpaying / Market Changes", description: "They're worried about financial risk.", next: "address_fear" },
                { id: "perfectionism", label: "Waiting for the 'Perfect' Home", description: "They have an unrealistic checklist.", next: "manage_expectations" },
                { id: "overwhelm", label: "Overwhelmed by Choices", description: "Too many options are causing analysis paralysis.", next: "simplify_choices" }
            ]
        }
    },
    outcomes: {
        address_fear: {
            primary: {
                title: "Conduct a 'Data Deep Dive' Session",
                description: "Present hyper-local market data (comps, appreciation rates, inventory trends) to replace their fear with confidence.",
                script: "I understand the concern about the market. Let's schedule a 20-minute session to go over the hard data for the specific neighborhoods you like. We'll look at what homes have sold for recently and what the trend looks like, so you can make a decision based on facts, not headlines. How does tomorrow work?",
                timeline: "Schedule within 48 hours"
            },
            alternatives: [
                { type: "soft", title: "Introduce a Trusted Lender", description: "Have a mortgage professional walk them through their financial options and long-term investment benefits.", script: "I'd love for you to chat with my lender, [Lender Name]. They are fantastic at breaking down the numbers and showing the long-term financial picture of a home purchase. No pressure at all, just information." },
                { type: "assertive", title: "Write a 'Safe' Offer", description: "Suggest writing an offer with strong contingency clauses (inspection, appraisal) to give them a safety net.", script: "Let's find a home you're 90% sure on and write an offer with full inspection and appraisal contingencies. This gives you a 'test drive' period to get comfortable without any risk. If you change your mind, we walk away." }
            ]
        },
        manage_expectations: {
            primary: {
                title: "Implement a 'Top 3 Must-Haves' Framework",
                description: "Help them reset their expectations by focusing on their core, non-negotiable needs versus their 'nice-to-haves'.",
                script: "It's easy to get lost searching for a 'perfect' home that might not exist. Let's try this: what are the absolute top 3 things a home MUST have for you to be happy? We'll focus exclusively on finding those, and treat everything else as a bonus. What are your non-negotiables?",
                timeline: "During your next conversation"
            },
             alternatives: [
                { type: "soft", title: "Revisit Previously Seen Homes", description: "Ask them to rank the top 3 homes they've already seen. This helps them realize what they truly valued.", script: "Of all the homes we've seen, which 3 were your favorite and why? Sometimes looking back helps clarify what's most important moving forward." },
                { type: "assertive", title: "Show a 'Compromise' Property", description: "Intentionally show them a great home that is missing one of their 'nice-to-have' features to test its importance.", script: "I found a home that has your top 3 must-haves, but it doesn't have the [Minor Feature]. I'd like you to see it to help us clarify how important that feature truly is." }
            ]
        },
        simplify_choices: {
            primary: {
                title: "Limit Showings to Top 2 Properties",
                description: "Reduce analysis paralysis by presenting only the best two options that meet their core criteria at any given time.",
                script: "I've done the pre-screening for you. Based on everything you've told me, there are two homes that stand out from the rest. Let's focus on seeing just these two tomorrow. It will be much easier to compare and make a clear decision.",
                timeline: "For the next round of showings"
            },
            alternatives: [
                { type: "soft", title: "Create a Pro/Con List Together", description: "Physically (or digitally) create a pros and cons list for their top 2-3 choices to visualize the decision.", script: "Let's take your top two homes and do a quick pros and cons list for each. Seeing it on paper can make the right choice surprisingly clear." },
                { type: "assertive", title: "Set a Decision Deadline", description: "Create friendly urgency by setting a time-bound goal for making a choice on the current options.", script: "The market is moving, and these are great options. Let's plan to make a decision on one of these two homes by Friday. This will help us focus and avoid losing out." }
            ]
        }
    }
  },

  low_ball_buyer: {
    id: "low_ball_buyer",
    category: "buyers",
    title: "Low-Ball Offer Buyer",
    description: "Buyer who consistently makes unrealistically low offers",
    initialNode: "offer_pattern",
    nodes: {
      offer_pattern: {
        question: "What's their pattern with offers?",
        type: "single_select",
        options: [
          { id: "first_time", label: "First low offer", next: "education_approach" },
          { id: "multiple_low", label: "Pattern of low offers", next: "reset_expectations" },
          { id: "unrealistic", label: "Extremely unrealistic offers", next: "qualification_check" }
        ]
      }
    },
    outcomes: {
      education_approach: {
        primary: {
          title: "Market Education Session",
          description: "Help them understand current market conditions and realistic pricing.",
          script: "I can see you're trying to get a great deal, which is smart! Let me show you some recent sales data so we can craft offers that sellers will actually consider. In this market, properties at [Price Range] typically sell for about X% of asking price. Let's look at what successful offers look like so we can get you a home.",
          timeline: "Before next offer"
        },
        alternatives: [
          { type: "collaborative", title: "Joint Strategy Session", description: "Work together to find their 'sweet spot' price.", script: "Let's work backwards from what you can afford and what sellers are accepting to find that sweet spot where we can get your offer accepted. What's the maximum you're actually comfortable paying?" }
        ]
      },
      reset_expectations: {
        primary: {
          title: "Direct Conversation About Market Reality",
          description: "Address the pattern directly and reset expectations.",
          script: "I've noticed we've made several offers that haven't been accepted. I want to make sure we're using your time effectively. In today's market, offers need to be within X% of asking price to be considered. Are you prepared to offer in that range, or should we look at properties in a different price category?",
          timeline: "After 2-3 rejected offers"
        },
        alternatives: [
          { type: "assertive", title: "Market Tier Adjustment", description: "Suggest looking at lower-priced properties.", script: "Based on your offer amounts, it seems like your comfort zone is around $X. Let me show you some great properties in that actual price range where your offers would be competitive." }
        ]
      },
      qualification_check: {
        primary: {
          title: "Re-qualify Budget and Motivation",
          description: "Determine if they're serious buyers or just testing the market.",
          script: "I want to make sure I'm serving you well. Your recent offers suggest you're hoping to find a property significantly below market value. Are you working with a specific budget constraint I should know about, or are you testing to see if you can find a distressed seller? Either way is fine - I just want to adjust our search strategy accordingly.",
          timeline: "Before continuing relationship"
        },
        alternatives: [
          { type: "direct", title: "Investor Strategy Discussion", description: "If they might be investors, discuss wholesale/distressed property strategy.", script: "It seems like you might be looking for investment opportunities or distressed properties. I work with some investors and can help you find those types of deals, but they require a different search strategy. Is that what you're looking for?" }
        ]
      }
    }
  },

  financing_issues_buyer: {
    id: "financing_issues_buyer",
    category: "buyers",
    title: "Financing Issues Buyer",
    description: "Buyer with credit, income, or other financing challenges",
    initialNode: "issue_type",
    nodes: {
      issue_type: {
        question: "What type of financing issue do they have?",
        type: "single_select",
        options: [
          { id: "credit_score", label: "Low credit score", next: "credit_improvement" },
          { id: "income_verification", label: "Income documentation issues", next: "income_solutions" },
          { id: "down_payment", label: "Insufficient down payment", next: "down_payment_options" },
          { id: "debt_to_income", label: "High debt-to-income ratio", next: "debt_management" }
        ]
      }
    },
    outcomes: {
      credit_improvement: {
        primary: {
          title: "Connect with Credit Repair Specialist",
          description: "Help them improve their credit while maintaining the relationship.",
          script: "I want to make sure you're in the best position to buy when you're ready. I work with an excellent credit specialist who has helped many of my clients improve their scores by 50-100 points in 3-6 months. Would you like me to introduce you? We can also start looking at homes now so you know what to aim for.",
          timeline: "Immediately"
        },
        alternatives: [
          { type: "alternative", title: "Explore Non-Traditional Financing", description: "Look into FHA, VA, or other programs.", script: "There might be some financing programs that could work with your current credit situation. Let me connect you with a lender who specializes in creative financing solutions." }
        ]
      },
      income_solutions: {
        primary: {
          title: "Lender Consultation for Documentation",
          description: "Connect them with a lender experienced in complex income situations.",
          script: "Income documentation can be tricky, especially if you're self-employed or have multiple income sources. I work with lenders who specialize in these situations and can often find solutions. Let me set up a consultation where they can review your specific situation and explain your options.",
          timeline: "Within 48 hours"
        },
        alternatives: [
          { type: "preparation", title: "Documentation Preparation Strategy", description: "Help them organize their financial documents.", script: "Let's work on getting all your documentation organized and see what options we have. I can provide you with a checklist of everything lenders typically need for your situation." }
        ]
      },
      down_payment_options: {
        primary: {
          title: "Down Payment Assistance Program Education",
          description: "Explore all available down payment assistance options.",
          script: "There are actually several programs that can help with down payments - some you might not know about. Let me connect you with a lender who knows all the local and national programs. Many of my buyers are surprised by what's available. In the meantime, we can still look at homes in your price range.",
          timeline: "Same day"
        },
        alternatives: [
          { type: "family", title: "Family Gift Documentation", description: "If family help is possible, explain the process.", script: "If family members are able to help with down payment, there are specific ways to document gift funds that lenders require. I can walk you through that process." }
        ]
      },
      debt_management: {
        primary: {
          title: "Debt Reduction Strategy Session",
          description: "Help them understand how to improve their debt-to-income ratio.",
          script: "Your debt-to-income ratio is a bit high for conventional financing, but there are strategies to address this. Some involve paying down specific debts, others involve restructuring. I work with a financial advisor who specializes in helping people prepare for home purchases. Would you like an introduction?",
          timeline: "Within a week"
        },
        alternatives: [
          { type: "timeline", title: "Extended Timeline Planning", description: "Create a plan for becoming mortgage-ready.", script: "Let's create a timeline for getting you mortgage-ready. We can work backwards from when you want to buy to create a plan for improving your debt-to-income ratio." }
        ]
      }
    }
  },

  first_time_buyer: {
    id: "first_time_buyer",
    category: "buyers",
    title: "First-Time Home Buyer",
    description: "Buyer purchasing their first home",
    initialNode: "knowledge_level",
    nodes: {
      knowledge_level: {
        question: "How much do they know about the home buying process?",
        type: "single_select",
        options: [
          { id: "complete_beginner", label: "Complete beginner", next: "education_intensive" },
          { id: "some_research", label: "Done some research", next: "guided_process" },
          { id: "well_researched", label: "Well-researched but no experience", next: "experience_focused" }
        ]
      }
    },
    outcomes: {
      education_intensive: {
        primary: {
          title: "First-Time Buyer Workshop",
          description: "Provide comprehensive education about the entire process.",
          script: "Buying your first home is exciting! There's quite a bit to learn, but I'll guide you through every step. I'd like to start with a first-time buyer consultation where we'll cover the entire process, timeline, and what to expect. This way you'll feel confident and informed throughout your journey. When works best for you?",
          timeline: "Before starting home search"
        },
        alternatives: [
          { type: "resource", title: "First-Time Buyer Resource Package", description: "Provide comprehensive written materials.", script: "I've put together a complete first-time buyer guide that covers everything from pre-approval to closing. Let me send that over, and then we can schedule a call to go through any questions you have." }
        ]
      },
      guided_process: {
        primary: {
          title: "Structured Step-by-Step Guidance",
          description: "Acknowledge their research and provide structured guidance.",
          script: "I can tell you've done your homework, which is great! Now let's turn that research into action. I like to work with first-time buyers using a step-by-step approach so nothing gets missed. Step one is getting pre-approved - do you have a lender you're working with, or would you like me to recommend one of my trusted partners?",
          timeline: "Next meeting"
        },
        alternatives: [
          { type: "validation", title: "Research Validation Session", description: "Review and validate their research.", script: "Since you've been researching, let's review what you've learned and make sure you have accurate information. Sometimes online information can be outdated or not specific to our local market." }
        ]
      },
      experience_focused: {
        primary: {
          title: "Focus on Practical Experience",
          description: "Leverage their research and focus on real-world application.",
          script: "I love that you've done so much research! Now let's put that knowledge into practice. The difference between reading about home buying and actually doing it is where I really add value. Let's start by looking at a few properties so you can experience what to look for and how to evaluate homes in person.",
          timeline: "Schedule showings soon"
        },
        alternatives: [
          { type: "mentorship", title: "Mentorship Approach", description: "Position as mentor for the practical aspects.", script: "You clearly understand the process well. My role will be to mentor you through the actual experience - helping you recognize value, navigate negotiations, and avoid first-time buyer mistakes that research can't prepare you for." }
        ]
      }
    }
  },

  investor_buyer: {
    id: "investor_buyer",
    category: "buyers",
    title: "Real Estate Investor Buyer",
    description: "Buyer looking for investment properties",
    initialNode: "investor_type",
    nodes: {
      investor_type: {
        question: "What type of investor are they?",
        type: "single_select",
        options: [
          { id: "fix_flip", label: "Fix and flip investor", next: "flip_strategy" },
          { id: "rental", label: "Rental property investor", next: "rental_strategy" },
          { id: "wholesale", label: "Wholesaler", next: "wholesale_strategy" },
          { id: "new_investor", label: "New to investing", next: "education_approach" }
        ]
      }
    },
    outcomes: {
      flip_strategy: {
        primary: {
          title: "Focus on Distressed Properties and ARV",
          description: "Help them find properties with flip potential and calculate ARV accurately.",
          script: "Great! I work with several successful flippers in the area. For flip properties, we need to focus on distressed properties, accurate ARV calculations, and renovation costs. I have access to off-market properties and can help you run numbers quickly. What's your typical profit margin target, and what areas are you focusing on?",
          timeline: "Ongoing relationship"
        },
        alternatives: [
          { type: "network", title: "Contractor Network Introduction", description: "Connect them with reliable contractors.", script: "Since you're flipping, having reliable contractors is crucial. I work with several flippers and can introduce you to contractors who are fast, reliable, and reasonably priced. This can make or break your margins." }
        ]
      },
      rental_strategy: {
        primary: {
          title: "Cash Flow Analysis Focus",
          description: "Help them analyze properties for rental income potential.",
          script: "Perfect! For rental properties, it's all about the numbers - cash flow, cap rates, and rental market analysis. I can help you identify properties in areas with strong rental demand and run cash flow projections. What's your target cash flow per property, and are you looking for single-family or multi-family?",
          timeline: "Ongoing relationship"
        },
        alternatives: [
          { type: "market", title: "Rental Market Analysis", description: "Provide detailed rental market data.", script: "Let me prepare a rental market analysis for the areas you're considering. I can show you average rents, vacancy rates, and tenant demand patterns to help you make informed decisions." }
        ]
      },
      wholesale_strategy: {
        primary: {
          title: "Off-Market Deal Pipeline",
          description: "Focus on finding distressed properties for wholesale deals.",
          script: "Wholesaling requires finding motivated sellers and distressed properties quickly. I can help you identify these opportunities, and I also work with several investors who might be interested in your contracts. Are you looking for a specific price range or property type?",
          timeline: "Immediate and ongoing"
        },
        alternatives: [
          { type: "buyer_list", title: "Investor Buyer Network", description: "Connect them with other investors who buy wholesale deals.", script: "I work with several investors who regularly buy wholesale contracts. I can introduce you to them so you have buyers lined up for your deals." }
        ]
      },
      education_approach: {
        primary: {
          title: "Investment Education and Strategy Development",
          description: "Help them develop their investment strategy and knowledge.",
          script: "Real estate investing can be very profitable, but it's important to have a clear strategy. There are many different approaches - rental properties, flips, wholesaling, etc. Each has different requirements and profit potential. Let's start by understanding your goals, budget, and risk tolerance, then develop a strategy that fits your situation.",
          timeline: "Education phase before buying"
        },
        alternatives: [
          { type: "mentorship", title: "Investor Mentorship Program", description: "Offer ongoing education and guidance.", script: "I work with several successful investors and have learned a lot about what works and what doesn't. I'd be happy to mentor you through your first few deals to help you avoid common mistakes." }
        ]
      }
    }
  },

  // --- SELLERS CATEGORY (6 scenarios) ---
  overpriced_listing: {
    id: "overpriced_listing",
    category: "sellers",
    title: "Overpriced Listing",
    description: "Listing that's priced above market value",
    initialNode: "time_on_market",
    nodes: {
      time_on_market: {
        question: "How long has it been on the market?",
        type: "single_select",
        options: [
          { id: "new_listing", label: "Less than 2 weeks", next: "early_intervention" },
          { id: "stale_listing", label: "2-8 weeks", next: "price_adjustment_discussion" },
          { id: "expired_risk", label: "Over 8 weeks", next: "urgent_action_needed" }
        ]
      }
    },
    outcomes: {
      early_intervention: {
        primary: {
          title: "Proactive Market Feedback Review",
          description: "Address pricing before it becomes a bigger problem.",
          script: "I wanted to check in on how the listing is going. I've been tracking the activity, and I think we should review the market feedback and showing activity. Sometimes the market tells us things we need to hear. Can we schedule a brief meeting to go over the data and see if any adjustments might help us get better results?",
          timeline: "After 10-14 days"
        },
        alternatives: [
          { type: "data", title: "Market Data Presentation", description: "Show current market data and comparable sales.", script: "I've prepared an updated market analysis with the most recent sales in your area. The market has shifted slightly since we listed, and I want to make sure our pricing is still competitive." }
        ]
      },
      price_adjustment_discussion: {
        primary: {
          title: "Direct Pricing Conversation",
          description: "Address the pricing issue directly with market evidence.",
          script: "After [X] weeks on the market with limited activity, it's clear the market is telling us something about our price. I've analyzed the showing feedback and recent sales, and I believe we need to discuss a price adjustment. The longer we wait, the more we risk the listing becoming stale. Let's review the options together.",
          timeline: "Immediately"
        },
        alternatives: [
          { type: "marketing", title: "Enhanced Marketing Push", description: "Try enhanced marketing before price reduction.", script: "Before we adjust price, let's try one more aggressive marketing push. I have some ideas for increased exposure that might bring in more buyers at our current price." }
        ]
      },
      urgent_action_needed: {
        primary: {
          title: "Urgent Strategy Reset",
          description: "Address the risk of expiration and market stigma.",
          script: "We're at a critical point where the listing risks becoming stigmatized as a problem property. After [X] weeks with minimal activity, we need to make a significant change immediately. Based on current market conditions and comparable sales, I recommend we reduce the price to $[X] to generate immediate interest and multiple showings. What are your thoughts?",
          timeline: "Emergency meeting"
        },
        alternatives: [
          { type: "withdrawal", title: "Consider Temporary Withdrawal", description: "Suggest taking property off market to reset.", script: "One option is to temporarily withdraw the listing, make some improvements or staging changes, and re-list at a corrected price in a few weeks. This can help reset market perception." }
        ]
      }
    }
  },

  urgent_seller: {
    id: "urgent_seller",
    category: "sellers",
    title: "Urgent Time Frame Seller",
    description: "Seller who needs to sell quickly due to circumstances",
    initialNode: "urgency_reason",
    nodes: {
      urgency_reason: {
        question: "Why do they need to sell quickly?",
        type: "single_select",
        options: [
          { id: "job_relocation", label: "Job relocation", next: "relocation_strategy" },
          { id: "financial_distress", label: "Financial difficulties", next: "financial_assistance" },
          { id: "life_change", label: "Divorce, death, or major life change", next: "sensitive_handling" },
          { id: "already_bought", label: "Already bought another home", next: "carrying_cost_strategy" }
        ]
      }
    },
    outcomes: {
      relocation_strategy: {
        primary: {
          title: "Corporate Relocation Services",
          description: "Provide expedited services and corporate relocation support.",
          script: "I understand the pressure of a job relocation timeline. I work with several corporate relocation companies and have a proven system for quick sales. We'll need to price aggressively for immediate market response, use professional photography and staging, and I'll provide daily updates on activity. I can also help coordinate with your relocation benefits if your company provides them.",
          timeline: "Immediate action plan"
        },
        alternatives: [
          { type: "rental", title: "Rental Option Consideration", description: "Discuss renting the property if sale timeline is too tight.", script: "If we can't get the home sold in your timeframe, I also work with property managers who could help you rent it out temporarily while we continue marketing for sale." }
        ]
      },
      financial_assistance: {
        primary: {
          title: "Financial Hardship Consultation",
          description: "Explore all options including short sale if necessary.",
          script: "I understand this is a difficult situation. Let's first determine if we can sell the home for enough to cover your mortgage and costs. If not, there are other options like short sales that I can help you navigate. Either way, we need to move quickly and I'll work with you to explore every possible solution.",
          timeline: "Immediate consultation"
        },
        alternatives: [
          { type: "investor", title: "Cash Investor Network", description: "Connect with investors for quick cash offers.", script: "I work with several investors who can make cash offers and close quickly. The offers might be below market value, but they can close in 7-14 days if that helps your situation." }
        ]
      },
      sensitive_handling: {
        primary: {
          title: "Compassionate Full-Service Support",
          description: "Handle all details with sensitivity and care.",
          script: "I know this is an incredibly difficult time for you. I want you to know that I'll handle every detail of the sale so you can focus on what's important. I'll manage all showings, coordinate with your attorney if needed, and keep you informed without overwhelming you. My goal is to make this as easy as possible for you during this challenging time.",
          timeline: "Ongoing support"
        },
        alternatives: [
          { type: "estate", title: "Estate Sale Coordination", description: "Help coordinate estate sales and property clearing if needed.", script: "I work with estate sale companies and cleanout services if you need help preparing the property. I can coordinate all of that for you." }
        ]
      },
      carrying_cost_strategy: {
        primary: {
          title: "Aggressive Pricing and Marketing",
          description: "Price to sell quickly to minimize carrying costs.",
          script: "Carrying two mortgages is expensive. We need to price this home to sell within 30 days to minimize your carrying costs. Based on recent sales, I recommend pricing at $[X], which should generate immediate interest and potentially multiple offers. The slightly lower price will save you money compared to months of carrying costs.",
          timeline: "Immediate aggressive marketing"
        },
        alternatives: [
          { type: "bridge", title: "Bridge Loan Consultation", description: "Discuss bridge financing options.", script: "Have you considered a bridge loan to help with the temporary financial burden? I can connect you with lenders who specialize in these situations." }
        ]
      }
    }
  },

  unrealistic_seller: {
    id: "unrealistic_seller",
    category: "sellers",
    title: "Unrealistic Expectations Seller",
    description: "Seller with unrealistic expectations about price, timeline, or process",
    initialNode: "expectation_type",
    nodes: {
      expectation_type: {
        question: "What expectations are unrealistic?",
        type: "single_select",
        options: [
          { id: "price_too_high", label: "Price expectations too high", next: "price_reality" },
          { id: "timeline_too_fast", label: "Timeline expectations too fast", next: "timeline_education" },
          { id: "condition_issues", label: "Won't address condition issues", next: "condition_discussion" },
          { id: "market_conditions", label: "Doesn't understand market conditions", next: "market_education" }
        ]
      }
    },
    outcomes: {
      price_reality: {
        primary: {
          title: "Comprehensive Market Analysis Presentation",
          description: "Use data to reset price expectations professionally.",
          script: "I want to make sure we're positioning your home for success. I've prepared a detailed analysis of recent sales, current competition, and market trends. Let's review this data together so we can set a price that attracts buyers and gets you the best possible result. The numbers tell a clear story about where the market is right now.",
          timeline: "Next meeting"
        },
        alternatives: [
          { type: "test", title: "Trial Period Pricing", description: "Suggest starting at their price for limited time.", script: "If you feel strongly about the price, we can try it for 2 weeks and see what the market response tells us. But I want us to agree upfront on adjustments based on the feedback we receive." }
        ]
      },
      timeline_education: {
        primary: {
          title: "Market Timeline Reality Check",
          description: "Educate about realistic timeline expectations.",
          script: "I understand you'd like to sell quickly. In our current market, the average time from listing to closing is [X] days. This includes time for marketing, negotiations, inspections, and financing. I'll do everything possible to expedite the process, but it's important to plan for realistic timelines to avoid unnecessary stress.",
          timeline: "Before listing"
        },
        alternatives: [
          { type: "expedite", title: "Expedited Service Options", description: "Offer premium services to speed up process.", script: "If timeline is critical, I offer expedited services including professional photography within 24 hours, aggressive marketing, and daily follow-up. These services can help, but we still need to work within market realities." }
        ]
      },
      condition_discussion: {
        primary: {
          title: "Cost-Benefit Analysis of Repairs",
          description: "Show how addressing condition issues affects final proceeds.",
          script: "I understand you don't want to put money into repairs. Let me show you how condition issues typically affect offers and final proceeds. Often, the cost of repairs is less than the discount buyers demand for problems. Let's look at the numbers together to see what makes the most financial sense.",
          timeline: "Before listing"
        },
        alternatives: [
          { type: "as_is", title: "As-Is Marketing Strategy", description: "Market property as-is with proper pricing.", script: "If you prefer to sell as-is, that's fine. We'll need to price accordingly and market it to investors and buyers who are comfortable with projects. This approach can work, but affects our pricing strategy." }
        ]
      },
      market_education: {
        primary: {
          title: "Current Market Conditions Workshop",
          description: "Educate about current market realities.",
          script: "The real estate market has changed significantly over the past year. Let me walk you through the current conditions, how they affect buyers and sellers, and what this means for our strategy. Understanding these changes will help us make the best decisions for your situation.",
          timeline: "Educational session"
        },
        alternatives: [
          { type: "comparison", title: "Then vs. Now Market Comparison", description: "Compare current market to previous experiences.", script: "I know the market was different when you bought or when your friend sold last year. Let me show you specifically how conditions have changed and what that means for your sale." }
        ]
      }
    }
  },

  inherited_property_seller: {
    id: "inherited_property_seller",
    category: "sellers",
    title: "Inherited Property Seller",
    description: "Seller who inherited property and needs to sell",
    initialNode: "property_knowledge",
    nodes: {
      property_knowledge: {
        question: "How familiar are they with the property?",
        type: "single_select",
        options: [
          { id: "very_familiar", label: "Lived there or very familiar", next: "standard_sale" },
          { id: "somewhat_familiar", label: "Visited occasionally", next: "property_assessment" },
          { id: "unfamiliar", label: "Haven't been there in years", next: "comprehensive_evaluation" }
        ]
      }
    },
    outcomes: {
      standard_sale: {
        primary: {
          title: "Streamlined Inherited Property Process",
          description: "Handle legal requirements while expediting the sale.",
          script: "Since you're familiar with the property, we can move forward efficiently. I'll help you navigate the legal requirements for inherited property sales, including any probate considerations. I work with estate attorneys and can coordinate with them if needed. Let's start with a market analysis and discuss your timeline and goals.",
          timeline: "After legal clearance"
        },
        alternatives: [
          { type: "estate_sale", title: "Coordinate Estate Sale", description: "Help organize estate sale for contents.", script: "If you need to handle the contents of the home, I work with estate sale companies who can help clear and sell items before we list the property." }
        ]
      },
      property_assessment: {
        primary: {
          title: "Comprehensive Property Review",
          description: "Assess property condition and prepare for sale.",
          script: "Let's schedule a thorough walkthrough of the property together. I'll help you assess the condition, identify any issues that need addressing, and determine the best strategy for preparing it for sale. Inherited properties often need some work, and I can recommend reliable contractors if needed.",
          timeline: "Comprehensive walkthrough"
        },
        alternatives: [
          { type: "as_is", title: "As-Is Sale Evaluation", description: "Consider selling without improvements.", script: "If you prefer not to invest in improvements, we can evaluate selling as-is. This affects pricing but eliminates the time and expense of repairs." }
        ]
      },
      comprehensive_evaluation: {
        primary: {
          title: "Full Property Discovery and Planning",
          description: "Complete assessment and strategic planning.",
          script: "Since you haven't been to the property recently, we need to start with a complete assessment. I'll meet you there and we'll go through everything - condition, contents, needed repairs, and legal requirements. I'll also bring contractors if we find issues that need immediate attention. This will help us create a complete plan for getting the property ready and sold.",
          timeline: "Comprehensive site visit"
        },
        alternatives: [
          { type: "management", title: "Full-Service Property Management", description: "Handle all aspects of preparation.", script: "I can manage the entire process for you - from property assessment to coordinating repairs, cleanouts, and staging. This is especially helpful when you live far away or can't be involved in day-to-day management." }
        ]
      }
    }
  },

  divorce_seller: {
    id: "divorce_seller",
    category: "sellers",
    title: "Divorce/Separation Seller",
    description: "Property sale due to divorce or separation",
    initialNode: "cooperation_level",
    nodes: {
      cooperation_level: {
        question: "How cooperative are the parties?",
        type: "single_select",
        options: [
          { id: "amicable", label: "Amicable divorce", next: "standard_process" },
          { id: "some_tension", label: "Some tension but workable", next: "careful_coordination" },
          { id: "high_conflict", label: "High conflict situation", next: "structured_communication" }
        ]
      }
    },
    outcomes: {
      standard_process: {
        primary: {
          title: "Efficient Cooperative Sale Process",
          description: "Streamline the process while maintaining neutrality.",
          script: "I appreciate that you're both committed to handling this cooperatively. I'll work with both of you as neutral parties to get the best possible outcome for the sale. I'll keep communication clear and transparent, provide regular updates to both parties, and coordinate showings in a way that works for everyone's schedule.",
          timeline: "Standard timeline"
        },
        alternatives: [
          { type: "mediation", title: "Professional Mediation Support", description: "Offer mediation services if needed.", script: "Even in amicable situations, having a neutral professional coordinate can be helpful. I'm experienced in divorce sales and can serve as a neutral coordinator for all sale-related decisions." }
        ]
      },
      careful_coordination: {
        primary: {
          title: "Diplomatic Communication Management",
          description: "Manage communications carefully to avoid conflicts.",
          script: "I understand this is a sensitive situation. I'll handle all communications diplomatically and keep both parties informed separately if that works better. My goal is to minimize stress and get the home sold efficiently. I'll coordinate showings, handle negotiations, and manage all the details while keeping both of you updated on progress.",
          timeline: "Extended timeline may be needed"
        },
        alternatives: [
          { type: "separate", title: "Separate Communication Channels", description: "Maintain separate communication with each party.", script: "If it would be easier, I can communicate with each of you separately and coordinate between you. This sometimes helps reduce tension and keeps the focus on the sale." }
        ]
      },
      structured_communication: {
        primary: {
          title: "Formal Process Management",
          description: "Implement structured, documented communication process.",
          script: "Given the complexity of the situation, I recommend we establish a formal communication process. All decisions will be documented, communications will go through me as a neutral party, and we'll follow a structured approach for showings, offers, and negotiations. This helps protect everyone and keeps the process moving forward professionally.",
          timeline: "Potentially extended timeline"
        },
        alternatives: [
          { type: "legal", title: "Attorney Coordination", description: "Work closely with divorce attorneys.", script: "I'll coordinate closely with both attorneys to ensure all sale decisions align with the divorce proceedings and court requirements. This helps avoid delays and complications." }
        ]
      }
    }
  },

  downsizing_seller: {
    id: "downsizing_seller",
    category: "sellers",
    title: "Downsizing Seller",
    description: "Seller looking to downsize to smaller property",
    initialNode: "motivation",
    nodes: {
      motivation: {
        question: "What's driving their decision to downsize?",
        type: "single_select",
        options: [
          { id: "empty_nest", label: "Empty nesters", next: "lifestyle_focused" },
          { id: "financial", label: "Financial reasons", next: "financial_optimization" },
          { id: "maintenance", label: "Tired of maintenance", next: "convenience_focused" },
          { id: "health", label: "Health/mobility concerns", next: "accessibility_focused" }
        ]
      }
    },
    outcomes: {
      lifestyle_focused: {
        primary: {
          title: "Lifestyle Transition Planning",
          description: "Help them transition to their next life phase.",
          script: "This is an exciting transition! Let's create a plan that maximizes the value of your current home while finding you the perfect smaller space for this next chapter. I can help coordinate the timing so you're not rushed, and I work with several downsizing specialists who can help with the logistics of moving to a smaller space.",
          timeline: "Flexible timing"
        },
        alternatives: [
          { type: "coordination", title: "Buy/Sell Coordination", description: "Coordinate both transactions if they're buying.", script: "If you're planning to buy another home, I can help coordinate both transactions to minimize the stress and timing challenges. We have several strategies to make this work smoothly." }
        ]
      },
      financial_optimization: {
        primary: {
          title: "Financial Benefit Maximization",
          description: "Focus on maximizing financial benefits of downsizing.",
          script: "Downsizing can significantly improve your financial situation. Let's analyze the numbers - what you can expect from your current home sale, reduced housing costs, and the overall financial impact. I can also help you find properties that give you the best value in a smaller space, maximizing your financial benefit.",
          timeline: "Market timing consideration"
        },
        alternatives: [
          { type: "investment", title: "Investment Property Consideration", description: "Discuss keeping current home as rental.", script: "Have you considered keeping your current home as a rental property? With the equity you have, it might generate good income while you move to a smaller property." }
        ]
      },
      convenience_focused: {
        primary: {
          title: "Low-Maintenance Living Solutions",
          description: "Focus on finding low-maintenance alternatives.",
          script: "I completely understand wanting to reduce the burden of maintenance. Let's find you a home that gives you the lifestyle you want with minimal upkeep. I know the best low-maintenance communities and newer properties in the area. We'll also make sure to get your current home sold with minimal hassle for you.",
          timeline: "Priority on convenience"
        },
        alternatives: [
          { type: "community", title: "Community Living Options", description: "Explore active adult communities.", script: "Have you considered active adult communities? Many offer maintenance-free living with great amenities. I can show you several options that might be perfect for your lifestyle." }
        ]
      },
      accessibility_focused: {
        primary: {
          title: "Accessibility and Safety Planning",
          description: "Focus on finding suitable, accessible housing.",
          script: "Your comfort and safety are the top priorities. Let's find you a home that better meets your current needs - whether that's single-level living, accessibility features, or proximity to healthcare and services. I work with specialists who understand these requirements and can help us find the perfect fit.",
          timeline: "Health needs priority"
        },
        alternatives: [
          { type: "modification", title: "Current Home Modification", description: "Consider modifying current home instead.", script: "Before we sell, have you considered modifications to your current home? Sometimes accessibility improvements can be more cost-effective than moving. I can connect you with specialists who can evaluate this option." }
        ]
      }
    }
  },

  // --- PAST CLIENTS CATEGORY (4 scenarios) ---
  referral_request: {
    id: "referral_request",
    category: "past_clients",
    title: "Past Client Referral Request",
    description: "Past client has someone they want to refer to you",
    initialNode: "referral_relationship",
    nodes: {
      referral_relationship: {
        question: "What's the relationship between your past client and the referral?",
        type: "single_select",
        options: [
          { id: "family", label: "Family member", next: "family_referral" },
          { id: "friend", label: "Close friend", next: "friend_referral" },
          { id: "coworker", label: "Coworker or business associate", next: "professional_referral" },
          { id: "acquaintance", label: "Acquaintance or neighbor", next: "casual_referral" }
        ]
      }
    },
    outcomes: {
      family_referral: {
        primary: {
          title: "VIP Family Member Treatment",
          description: "Treat as VIP referral with extra attention to service.",
          script: "Thank you so much for referring [Family Member Name]! I'm honored that you trust me to help your family. I'll take excellent care of them, just as I did for you. I'll make sure to give them the same level of service and attention, and I'll keep you updated on how things are going (with their permission, of course).",
          timeline: "Immediate response"
        },
        alternatives: [
          { type: "gift", title: "Referral Appreciation Gift", description: "Send special thank you gift.", script: "I'd like to send a small thank you gift for the referral. Family referrals are the highest compliment, and I want to make sure you know how much I appreciate your trust." }
        ]
      },
      friend_referral: {
        primary: {
          title: "Close Friend Special Attention",
          description: "Provide exceptional service befitting a close friend referral.",
          script: "I'm so grateful that you referred your close friend [Name] to me! That means the world to me. I'll make sure they receive the same great service you did, and I'll treat them like family. Thank you for trusting me with someone so important to you.",
          timeline: "Same day response"
        },
        alternatives: [
          { type: "joint", title: "Joint Consultation Offer", description: "Offer to meet with both parties together initially.", script: "If it would be helpful, I'm happy to meet with both of you together initially so you can be there for any questions they might have." }
        ]
      },
      professional_referral: {
        primary: {
          title: "Professional Network Expansion",
          description: "Treat as opportunity to expand professional network.",
          script: "Thank you for the referral! I appreciate you thinking of me for your colleague's real estate needs. I'll make sure they receive excellent service and represent you well. Professional referrals are so valuable, and I want to make sure this reflects positively on our relationship.",
          timeline: "Professional response timing"
        },
        alternatives: [
          { type: "network", title: "Mutual Professional Benefit", description: "Explore mutual referral opportunities.", script: "I'd love to find ways to refer business back to you as well. If you ever have clients who need real estate services, I'm always here to help." }
        ]
      },
      casual_referral: {
        primary: {
          title: "Appreciation and Quality Service",
          description: "Show appreciation and deliver quality service to build reputation.",
          script: "Thank you for referring [Name] to me! I really appreciate you thinking of me when the topic of real estate came up. I'll make sure they receive great service and that this reflects well on your recommendation.",
          timeline: "Prompt response"
        },
        alternatives: [
          { type: "follow_up", title: "Referral Source Follow-up", description: "Follow up with past client on referral outcome.", script: "I'll make sure to let you know how things go (with their permission). Thank you again for thinking of me!" }
        ]
      }
    }
  },

  repeat_client: {
    id: "repeat_client",
    category: "past_clients",
    title: "Past Client Returning",
    description: "Past client coming back for another transaction",
    initialNode: "return_reason",
    nodes: {
      return_reason: {
        question: "Why are they making another move?",
        type: "single_select",
        options: [
          { id: "upsizing", label: "Upsizing/growing family", next: "growth_move" },
          { id: "downsizing", label: "Downsizing/empty nest", next: "downsizing_move" },
          { id: "relocation", label: "Job relocation", next: "relocation_move" },
          { id: "investment", label: "Investment property", next: "investment_move" }
        ]
      }
    },
    outcomes: {
      growth_move: {
        primary: {
          title: "Celebrate Their Success and Growth",
          description: "Acknowledge their growth and provide upgraded service.",
          script: "Congratulations on your growing family! It's so wonderful to see how much has changed since we worked together. I'm excited to help you find the perfect home for this next chapter. Since I know your preferences and how you like to work, we can make this process even smoother than last time.",
          timeline: "Celebratory approach"
        },
        alternatives: [
          { type: "referral", title: "Leverage Growth Network", description: "Use their expanded network for referrals.", script: "I bet you know a lot more people now who might need real estate help. I'd love to help your friends and family the same way I'm helping you." }
        ]
      },
      downsizing_move: {
        primary: {
          title: "Transition Support and Understanding",
          description: "Support them through this life transition.",
          script: "I know downsizing can be emotional - leaving a home with so many memories. I'm here to help make this transition as smooth as possible. We'll find you something perfect for this next phase of life, and I'll handle all the details so you can focus on what's important.",
          timeline: "Supportive approach"
        },
        alternatives: [
          { type: "coordination", title: "Full Transition Coordination", description: "Offer to coordinate both buy and sell sides.", script: "I can coordinate both selling your current home and finding your new one, timing everything perfectly so you're not stressed about logistics." }
        ]
      },
      relocation_move: {
        primary: {
          title: "Relocation Expertise and Support",
          description: "Provide relocation-specific services and support.",
          script: "Another relocation! I'll help make this move as smooth as the last one. I have great connections in [New Area] and can help you understand the new market. I'll also make sure we get your current home sold quickly and efficiently. Relocations are my specialty now!",
          timeline: "Urgency-aware approach"
        },
        alternatives: [
          { type: "network", title: "Destination Area Agent Network", description: "Connect with agent in destination area.", script: "I have trusted agent partners in [New Area] who I can connect you with. They'll take great care of you there, just like I do here." }
        ]
      },
      investment_move: {
        primary: {
          title: "Investment Strategy Partnership",
          description: "Position as their real estate investment partner.",
          script: "I love that you're expanding into investment properties! I work with several successful investors now and have learned a lot about what makes properties good investments. Let's talk about your strategy and goals, and I'll help you find properties that fit your investment criteria.",
          timeline: "Strategic planning approach"
        },
        alternatives: [
          { type: "education", title: "Investment Education and Support", description: "Provide investment-focused education and analysis.", script: "Investment properties require different analysis than personal homes. I can help you evaluate cash flow potential, rental markets, and ROI to make sure you're making smart investment decisions." }
        ]
      }
    }
  },

  anniversary_client: {
    id: "anniversary_client",
    category: "past_clients",
    title: "Transaction Anniversary Follow-Up",
    description: "Following up on anniversary of past transaction",
    initialNode: "anniversary_type",
    nodes: {
      anniversary_type: {
        question: "What type of anniversary follow-up?",
        type: "single_select",
        options: [
          { id: "one_year", label: "One year anniversary", next: "first_anniversary" },
          { id: "multi_year", label: "Multi-year anniversary", next: "ongoing_relationship" },
          { id: "major_milestone", label: "5, 10+ year milestone", next: "milestone_celebration" }
        ]
      }
    },
    outcomes: {
      first_anniversary: {
        primary: {
          title: "First Year Check-In and Celebration",
          description: "Celebrate their first year and check on satisfaction.",
          script: "Happy one-year anniversary in your home! I can't believe it's been a whole year already. How are you enjoying the house? I hope this first year has been everything you hoped for. I'd love to hear how things have been going and if you need any recommendations for contractors, services, or anything else.",
          timeline: "On or near anniversary date"
        },
        alternatives: [
          { type: "gift", title: "Anniversary Gift Delivery", description: "Send anniversary gift to commemorate the milestone.", script: "I'd love to send a small anniversary gift to commemorate your first year. You were such wonderful clients to work with!" }
        ]
      },
      ongoing_relationship: {
        primary: {
          title: "Relationship Maintenance and Value",
          description: "Maintain relationship and provide ongoing value.",
          script: "Hope you're still loving your home! Time flies - I can't believe it's been [X] years since we worked together. I wanted to check in and see how you're doing. I have some updated market information about your neighborhood that you might find interesting. How have you been?",
          timeline: "Annual or bi-annual"
        },
        alternatives: [
          { type: "market", title: "Market Update and Home Value", description: "Provide current market analysis and home value update.", script: "I thought you'd be interested to know that your home has appreciated approximately [X]% since you bought it. The market in your area has been really strong!" }
        ]
      },
      milestone_celebration: {
        primary: {
          title: "Major Milestone Celebration",
          description: "Celebrate major milestone and strengthen long-term relationship.",
          script: "I can't believe it's been [X] years since we worked together! What an incredible milestone. I hope you've created so many wonderful memories in your home over the years. I was just thinking about our time working together and wanted to reach out to say hello and see how you're doing.",
          timeline: "Major milestone recognition"
        },
        alternatives: [
          { type: "nostalgia", title: "Memory Lane Conversation", description: "Share memories from the original transaction.", script: "I was just looking at some old photos from when we were house hunting, and it brought back such great memories! Remember how excited you were when you first saw the kitchen?" }
        ]
      }
    }
  },

  market_update_client: {
    id: "market_update_client",
    category: "past_clients",
    title: "Market Update to Past Client",
    description: "Sharing market updates with past clients",
    initialNode: "update_type",
    nodes: {
      update_type: {
        question: "What type of market update are you sharing?",
        type: "single_select",
        options: [
          { id: "neighborhood", label: "Neighborhood-specific update", next: "neighborhood_focus" },
          { id: "general_market", label: "General market trends", next: "market_trends" },
          { id: "home_value", label: "Their home value update", next: "value_update" },
          { id: "investment_opportunity", label: "Investment opportunity", next: "opportunity_sharing" }
        ]
      }
    },
    outcomes: {
      neighborhood_focus: {
        primary: {
          title: "Hyperlocal Neighborhood Intelligence",
          description: "Provide specific insights about their immediate area.",
          script: "I thought you'd find this interesting - there have been some notable changes in your neighborhood lately. [Specific neighborhood update]. This is great news for property values in your area. I know you're not planning to sell, but it's always nice to know your investment is doing well!",
          timeline: "When significant neighborhood changes occur"
        },
        alternatives: [
          { type: "amenities", title: "Neighborhood Amenity Updates", description: "Share information about new amenities or developments.", script: "Have you heard about the new [amenity/development] coming to your area? I thought you'd be interested since it's likely to be a great addition to the neighborhood." }
        ]
      },
      market_trends: {
        primary: {
          title: "Educational Market Trend Sharing",
          description: "Share broader market trends that might interest them.",
          script: "I wanted to share some interesting market trends I'm seeing that you might find fascinating. [Market trend information]. It's always interesting to see how the broader market affects our local area. Hope you're doing well!",
          timeline: "Quarterly or significant market shifts"
        },
        alternatives: [
          { type: "prediction", title: "Market Prediction and Analysis", description: "Share your professional predictions about market direction.", script: "Based on what I'm seeing, I think the market is heading toward [prediction]. Thought you'd be interested in my take on where things are going." }
        ]
      },
      value_update: {
        primary: {
          title: "Personal Home Value Update",
          description: "Share specific information about their home's current value.",
          script: "I ran some numbers on your home's current value and thought you'd be interested to know it's estimated at around $[X] - that's approximately [X]% appreciation since you bought it! Your home has been a great investment. Hope you're enjoying it as much as ever!",
          timeline: "Annual or major market shifts"
        },
        alternatives: [
          { type: "comparison", title: "Market Comparison Analysis", description: "Compare their home's performance to market averages.", script: "Your home has actually outperformed the market average - it's appreciated [X]% while the general market is up [Y]%. You chose a great property!" }
        ]
      },
      opportunity_sharing: {
        primary: {
          title: "Investment Opportunity Alert",
          description: "Share potential investment opportunities.",
          script: "I came across an interesting investment opportunity and remembered that you mentioned being interested in real estate investing. [Opportunity details]. No pressure at all, but I thought it might be worth discussing if you're still interested in expanding your portfolio.",
          timeline: "When opportunities arise"
        },
        alternatives: [
          { type: "education", title: "Investment Market Education", description: "Share information about investment market conditions.", script: "The investment property market has been really interesting lately. Thought you might find this analysis helpful if you're still considering adding to your portfolio." }
        ]
      }
    }
  },

  // --- VENDORS CATEGORY (2 scenarios) ---
  contractor_relationship: {
    id: "contractor_relationship",
    category: "vendors",
    title: "Contractor/Service Provider",
    description: "Managing relationship with contractors and service providers",
    initialNode: "relationship_stage",
    nodes: {
      relationship_stage: {
        question: "What stage is this contractor relationship?",
        type: "single_select",
        options: [
          { id: "new_contractor", label: "New contractor I'm considering", next: "vetting_process" },
          { id: "established_partner", label: "Established trusted partner", next: "partnership_management" },
          { id: "performance_issues", label: "Having performance issues", next: "performance_management" }
        ]
      }
    },
    outcomes: {
      vetting_process: {
        primary: {
          title: "Comprehensive Contractor Vetting",
          description: "Establish thorough vetting process before adding to preferred list.",
          script: "I'm always looking for quality contractors to serve my clients better. Before I can refer you to my clients, I need to make sure you meet my standards. This includes references from recent clients, proof of insurance, licensing verification, and ideally working together on a smaller project first. Can we set up a time to discuss your services and my requirements?",
          timeline: "Before any client referrals"
        },
        alternatives: [
          { type: "trial", title: "Trial Project Opportunity", description: "Offer small trial project to test quality.", script: "I have a small project coming up that might be a good way for us to work together and see how we collaborate. If it goes well, I'd love to add you to my preferred contractor list." }
        ]
      },
      partnership_management: {
        primary: {
          title: "Strategic Partnership Development",
          description: "Strengthen existing partnership for mutual benefit.",
          script: "I really value our working relationship and the quality work you do for my clients. I'd love to discuss how we can work together even more effectively. Are there ways I can send you more referrals? Any feedback on how our collaboration could be improved?",
          timeline: "Regular partnership reviews"
        },
        alternatives: [
          { type: "expansion", title: "Service Expansion Discussion", description: "Explore expanding services or referral relationship.", script: "I've been getting requests for [additional services]. Is that something you do, or do you have trusted partners you work with that I could add to my network?" }
        ]
      },
      performance_management: {
        primary: {
          title: "Direct Performance Conversation",
          description: "Address performance issues professionally but firmly.",
          script: "I need to discuss some concerns about recent work quality/timing with my clients. My reputation depends on the contractors I refer, so I need to make sure we're aligned on expectations. Can we talk about what happened and how we can prevent issues going forward?",
          timeline: "Immediately after issues arise"
        },
        alternatives: [
          { type: "probation", title: "Probationary Period", description: "Establish probationary period with clear expectations.", script: "I'm going to need to see consistent improvement before I can continue regular referrals. Let's establish clear expectations and a timeline for improvement." }
        ]
      }
    }
  },

  lender_partnership: {
    id: "lender_partnership",
    category: "vendors",
    title: "Lender Partnership",
    description: "Managing relationships with mortgage lenders",
    initialNode: "partnership_type",
    nodes: {
      partnership_type: {
        question: "What type of lender relationship issue?",
        type: "single_select",
        options: [
          { id: "new_lender", label: "Evaluating new lender partner", next: "lender_evaluation" },
          { id: "referral_discussion", label: "Discussing referral partnership", next: "referral_partnership" },
          { id: "client_issues", label: "Client having issues with lender", next: "client_advocacy" }
        ]
      }
    },
    outcomes: {
      lender_evaluation: {
        primary: {
          title: "Comprehensive Lender Partnership Assessment",
          description: "Evaluate new lender for client referrals based on service standards.",
          script: "I'm always looking for quality lenders who provide excellent service to my clients. Before I can refer clients to you, I need to understand your process, turnaround times, communication style, and how you handle challenges. Can we discuss your typical timeline from application to closing and your approach to client communication?",
          timeline: "Before any client referrals"
        },
        alternatives: [
          { type: "trial", title: "Trial Client Referral", description: "Start with one trial client to evaluate service.", script: "I'd like to start with referring one client to see how we work together. This helps me understand your service level before making you a preferred partner." }
        ]
      },
      referral_partnership: {
        primary: {
          title: "Mutual Referral Partnership Discussion",
          description: "Establish clear expectations for mutual referral relationship.",
          script: "I think we could have a great partnership referring clients to each other. Let me explain how I work with my preferred lenders and what I expect in terms of communication, timeline, and client service. I'd also love to hear about how you typically work with agent partners and what you need from me to serve our mutual clients best.",
          timeline: "Partnership establishment"
        },
        alternatives: [
          { type: "exclusive", title: "Preferred Partner Status Discussion", description: "Discuss potential for preferred or exclusive partnership.", script: "Based on your service level, I'm considering making you one of my preferred lenders. This would mean more consistent referrals, but I'd need certain guarantees about service standards and communication." }
        ]
      },
      client_advocacy: {
        primary: {
          title: "Client Advocacy and Issue Resolution",
          description: "Advocate for client while maintaining professional lender relationship.",
          script: "I need to discuss some concerns my client has about [specific issue]. My client's success is my top priority, so I need to understand what happened and how we can resolve this quickly. How can we get this back on track and prevent similar issues in the future?",
          timeline: "Immediately when issues arise"
        },
        alternatives: [
          { type: "escalation", title: "Escalation to Management", description: "Escalate to lender management if needed.", script: "If we can't resolve this quickly, I may need to escalate to your manager. I value our partnership, but my client's transaction is at risk and that's not acceptable." }
        ]
      }
    }
  },

  // --- TEAM CATEGORY (3 scenarios) ---
  underperforming_team_member: {
    id: "underperforming_team_member",
    category: "team",
    title: "Underperforming Team Member",
    description: "Team member not meeting performance expectations",
    initialNode: "performance_issue_type",
    nodes: {
      performance_issue_type: {
        question: "What type of performance issue?",
        type: "single_select",
        options: [
          { id: "productivity", label: "Low productivity/activity", next: "productivity_intervention" },
          { id: "skills", label: "Skills or knowledge gaps", next: "skills_development" },
          { id: "attitude", label: "Attitude or professionalism issues", next: "behavioral_correction" },
          { id: "results", label: "Poor results despite effort", next: "results_analysis" }
        ]
      }
    },
    outcomes: {
      productivity_intervention: {
        primary: {
          title: "Activity and Accountability Review",
          description: "Review activity levels and establish clear accountability measures.",
          script: "I wanted to sit down and review your activity levels and results. Looking at the numbers, I'm concerned about [specific metrics]. Let's talk about what's happening and create a plan to get you back on track. What obstacles are you facing, and how can I help you succeed?",
          timeline: "Immediate intervention"
        },
        alternatives: [
          { type: "support", title: "Additional Support and Resources", description: "Provide additional training, tools, or support.", script: "I want to make sure you have everything you need to succeed. Let's look at what additional support, training, or resources might help you increase your productivity." }
        ]
      },
      skills_development: {
        primary: {
          title: "Targeted Skills Training Plan",
          description: "Identify specific skill gaps and create development plan.",
          script: "I've noticed some areas where additional training could really help your performance. This isn't a criticism - it's about helping you develop the skills to be more successful. Let's identify the specific areas where you'd like to improve and create a development plan together.",
          timeline: "Development planning session"
        },
        alternatives: [
          { type: "mentorship", title: "Mentorship Pairing", description: "Pair with experienced team member for mentoring.", script: "I'd like to pair you with [experienced team member] for some additional mentoring and hands-on training. They excel in the areas where you're developing and can provide great guidance." }
        ]
      },
      behavioral_correction: {
        primary: {
          title: "Professional Standards Discussion",
          description: "Address behavioral issues directly and establish clear expectations.",
          script: "I need to address some concerns about [specific behavioral issue]. This behavior doesn't align with our team standards and could impact our reputation and client relationships. Let's discuss what's happening and establish clear expectations going forward.",
          timeline: "Immediate correction"
        },
        alternatives: [
          { type: "formal", title: "Formal Performance Improvement Plan", description: "Implement formal PIP with clear metrics and timeline.", script: "I'm implementing a formal performance improvement plan with specific behavioral expectations and timeline. We'll meet weekly to review progress, and improvement is required within [timeframe]." }
        ]
      },
      results_analysis: {
        primary: {
          title: "Comprehensive Results Review",
          description: "Analyze why effort isn't translating to results.",
          script: "I can see you're working hard, but the results aren't matching your effort. Let's analyze what's happening - are you focusing on the right activities? Do we need to adjust your approach or strategy? I want to help you work smarter, not just harder.",
          timeline: "Strategy review session"
        },
        alternatives: [
          { type: "role_fit", title: "Role Fit Assessment", description: "Evaluate if current role is the right fit.", script: "Sometimes good people are in the wrong role. Let's honestly assess whether your current position plays to your strengths, or if there might be a better fit within our organization." }
        ]
      }
    }
  },

  team_conflict_resolution: {
    id: "team_conflict_resolution",
    category: "team",
    title: "Team Conflict Resolution",
    description: "Resolving conflicts between team members",
    initialNode: "conflict_type",
    nodes: {
      conflict_type: {
        question: "What type of conflict needs resolution?",
        type: "single_select",
        options: [
          { id: "personality", label: "Personality clash", next: "personality_mediation" },
          { id: "work_style", label: "Different work styles", next: "work_style_alignment" },
          { id: "territory_clients", label: "Territory or client disputes", next: "boundary_clarification" },
          { id: "communication", label: "Communication breakdown", next: "communication_repair" }
        ]
      }
    },
    outcomes: {
      personality_mediation: {
        primary: {
          title: "Structured Mediation Session",
          description: "Facilitate professional mediation to address personality conflicts.",
          script: "I can see there's tension between you two that's affecting the team. We need to address this professionally. I'm scheduling a mediation session where we'll discuss the issues openly and establish ground rules for working together effectively, even if you don't particularly like each other personally.",
          timeline: "Immediate mediation"
        },
        alternatives: [
          { type: "separation", title: "Role Separation Strategy", description: "Minimize interaction by adjusting roles or responsibilities.", script: "If mediation doesn't work, we may need to restructure your roles to minimize interaction while maintaining team effectiveness." }
        ]
      },
      work_style_alignment: {
        primary: {
          title: "Work Style Compatibility Planning",
          description: "Help team members understand and accommodate different work styles.",
          script: "You both have valuable but different work styles. Let's discuss how these differences can be complementary rather than conflicting. We'll establish clear expectations about collaboration and communication that work for both styles.",
          timeline: "Team alignment session"
        },
        alternatives: [
          { type: "strengths", title: "Strengths-Based Role Definition", description: "Redefine roles based on individual strengths.", script: "Let's restructure your collaboration to play to each person's strengths. This way your different work styles become advantages rather than sources of friction." }
        ]
      },
      boundary_clarification: {
        primary: {
          title: "Clear Boundary and Territory Definition",
          description: "Establish clear, documented boundaries to prevent future disputes.",
          script: "We need to establish crystal-clear boundaries about territories, clients, and responsibilities. I'm creating a written agreement that defines exactly who handles what, when, and how disputes will be resolved in the future. This protects everyone and prevents future conflicts.",
          timeline: "Immediate boundary setting"
        },
        alternatives: [
          { type: "rotation", title: "Rotation or Sharing System", description: "Implement fair rotation or sharing system for contested areas.", script: "Instead of fixed territories, let's implement a fair rotation system for [contested area] so everyone has equal opportunity." }
        ]
      },
      communication_repair: {
        primary: {
          title: "Communication Protocol Establishment",
          description: "Rebuild communication with structured protocols and expectations.",
          script: "The communication breakdown between you is affecting the entire team. We're implementing structured communication protocols - regular check-ins, clear documentation, and defined escalation procedures. We'll also work on rebuilding trust through consistent, professional interaction.",
          timeline: "Communication protocol implementation"
        },
        alternatives: [
          { type: "training", title: "Team Communication Training", description: "Provide communication skills training for the team.", script: "I'm bringing in a communication specialist to work with our team on professional communication skills and conflict resolution techniques." }
        ]
      }
    }
  },

  team_member_development: {
    id: "team_member_development",
    category: "team",
    title: "Team Member Development",
    description: "Developing and growing team members",
    initialNode: "development_focus",
    nodes: {
      development_focus: {
        question: "What area of development are you focusing on?",
        type: "single_select",
        options: [
          { id: "new_agent", label: "New agent training", next: "new_agent_onboarding" },
          { id: "skill_advancement", label: "Skills advancement for experienced agent", next: "advanced_training" },
          { id: "leadership_prep", label: "Preparing for leadership role", next: "leadership_development" },
          { id: "specialization", label: "Developing specialization", next: "specialization_training" }
        ]
      }
    },
    outcomes: {
      new_agent_onboarding: {
        primary: {
          title: "Comprehensive New Agent Development Program",
          description: "Structured onboarding and development plan for new team members.",
          script: "Welcome to the team! I'm excited to help you build a successful real estate career. I've developed a comprehensive training program that will take you from new agent to productive team member. We'll cover scripts, systems, lead generation, and client management. Your success is my success, so I'm invested in your development.",
          timeline: "90-day intensive program"
        },
        alternatives: [
          { type: "mentorship", title: "Experienced Agent Mentorship", description: "Pair new agent with experienced mentor.", script: "I'm pairing you with [experienced agent] who will be your mentor for the first 90 days. They'll help you with day-to-day questions and provide hands-on guidance as you start working with clients." }
        ]
      },
      advanced_training: {
        primary: {
          title: "Advanced Skills Development Plan",
          description: "Help experienced agents develop advanced skills and increase production.",
          script: "You've mastered the basics, and now it's time to take your skills to the next level. Let's identify the advanced skills that will increase your production and income - whether that's luxury market expertise, investment property knowledge, or advanced negotiation techniques. What areas interest you most?",
          timeline: "Ongoing development plan"
        },
        alternatives: [
          { type: "certification", title: "Professional Certification Support", description: "Support pursuit of professional certifications and designations.", script: "I encourage you to pursue [specific certification]. I'll support your education financially and give you opportunities to use those skills with appropriate clients." }
        ]
      },
      leadership_development: {
        primary: {
          title: "Leadership Track Development",
          description: "Prepare high-performing agent for leadership responsibilities.",
          script: "I see leadership potential in you and want to help develop those skills. I'm creating opportunities for you to mentor newer agents, lead team meetings, and take on special projects. This will prepare you for potential leadership roles within our organization.",
          timeline: "Leadership development track"
        },
        alternatives: [
          { type: "succession", title: "Succession Planning Discussion", description: "Discuss long-term succession planning opportunities.", script: "Let's talk about your long-term career goals and how they might align with growth opportunities in our organization. I'm always thinking about succession planning and developing future leaders." }
        ]
      },
      specialization_training: {
        primary: {
          title: "Market Specialization Development",
          description: "Help agent develop expertise in specific market niche.",
          script: "Specialization can significantly increase your income and differentiate you from other agents. Based on your interests and our market needs, I think you'd excel in [specialization area]. I'll provide additional training, marketing support, and qualified leads in this niche to help you establish expertise.",
          timeline: "Specialization development plan"
        },
        alternatives: [
          { type: "partnership", title: "Specialized Partnership Development", description: "Create partnerships to support specialization.", script: "To support your specialization in [area], I'm connecting you with [relevant professionals/vendors] who can provide additional expertise and referral opportunities." }
        ]
      }
    }
  }
};