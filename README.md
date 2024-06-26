# Email Inbox Scraper and Auto-reply with OpenAI Integration

This project integrates TypeScript with OAuth 2.0 for Gmail and Microsoft Outlook to extract the latest inbox messages, generate a reply using OpenAI's Davinci engine, and assign labels using the OpenAI API.

## Features

- Configured Gmail OAuth 2.0 and Microsoft OAuth for extracting emails.
- Implemented OAuth flow to receive authorization codes and tokens via a local server.
- Utilized Microsoft Graph API to fetch emails from Outlook accounts.
- Integrated OpenAI's Davinci engine to generate email replies.
- Automated labeling of emails based on content analysis using OpenAI.

## Technologies Used

- TypeScript
- Node.js
- Express.js (for local server handling OAuth callbacks)
- Gmail API
- Microsoft Graph API
- OpenAI API (Davinci engine)

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your/repository.git
   cd repository
2. **Install Dependencies**
   ```bash
   npm install
3. **Run the application**
   ```bash
   npx ts-node reademai.ts
