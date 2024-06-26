import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { AddressInfo } from 'net';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import sentToOpenAi from './labelandreply';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Google OAuth2 
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  'http://localhost:3000/google/callback'
);

//Microsoft Graph
const msalConfig = {
  auth: {
      clientId: process.env.MS_CLIENT_ID!,
      authority: 'https://login.microsoftonline.com/consumers',
    clientSecret: process.env.MS_CLIENT_SECRET!,
  },
};
const msalClient = new ConfidentialClientApplication(msalConfig);


const readGmailInbox = async () => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const app = express();

  app.get('/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      const response = await gmail.users.messages.list({ userId: 'me' });

      const messages = response.data.messages;
      let gmailEmails = [];

      for (const message of messages || []) { // Ensure messages is not null or undefined
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const emailContent = parseEmail(messageResponse.data);
        gmailEmails.push(emailContent.body);
      }

      // console.log('Gmail Emails:', gmailEmails);
      const regex = /<[^>]*>/g;
      const plainText = gmailEmails[0].replace(regex, '').trim();
      console.log("Parsed html text",plainText);
      // Process Gmail emails as needed

      res.send('Authentication successful! You can close this window.');
      rl.close();
    } catch (err) {
      console.error('Error retrieving Gmail messages:', err);
      res.status(500).send('Error retrieving Gmail messages');
    }
  });

  const server = app.listen(3000, () => {
    const address = server.address() as AddressInfo;
    console.log(`Server running at http://localhost:${address.port}`);
  });
};

// Function to authenticate and read Outlook inbox
const readOutlookInbox = async () => {
  const authUrl = await msalClient.getAuthCodeUrl({
    scopes: ['Mail.Read'],
    redirectUri: 'http://localhost:3000/outlook/callback',
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const app = express();

  app.get('/outlook/callback', async (req: Request, res: Response) => {
    try {
      const tokenResponse = await msalClient.acquireTokenByCode({
        code: req.query.code as string,
        scopes: ['Mail.Read'],
        redirectUri: 'http://localhost:3000/outlook/callback',
      });

      const client = Client.init({
        authProvider: (done) => {
          done(null, tokenResponse.accessToken);
        },
      });

      const messages = await client.api('/me/mailFolders/inbox/messages').get();
      let outlookEmails = messages.value.map((message: any) => ({
        subject: message.subject,
        from: message.from.emailAddress.address,
        body: message.body.content,
      }));
      let objectLength = Object.keys(outlookEmails).length;
      console.log('length of the email', objectLength);
      console.log(typeof (outlookEmails[0].body))
      const regex = /<[^>]*>/g;
      const plainText = outlookEmails[0].body.replace(regex, '').trim();
      console.log("Parsed html text",plainText);
      
      // Process Outlook emails as needed

      res.send('Authentication successful! You can close this window.');
      rl.close();
    } catch (err) {
      console.error('Error retrieving Outlook messages:', err);
      res.status(500).send('Error retrieving Outlook messages');
    }
  });

  const server = app.listen(3000, () => {
    const address = server.address() as AddressInfo;
    console.log(`Server running at http://localhost:${address.port}`);
  });
};

// Function to parse email message content
const parseEmail = (message: any) => {
  const email = {
    id: message.id,
    threadId: message.threadId,
    subject: '',
    from: '',
    to: '',
    date: '',
    body: '',
  };

  const headers = message.payload.headers;
  for (const header of headers) {
    if (header.name === 'Subject') {
      email.subject = header.value;
    }
    if (header.name === 'From') {
      email.from = header.value;
    }
    if (header.name === 'To') {
      email.to = header.value;
    }
    if (header.name === 'Date') {
      email.date = header.value;
    }
  }

  const bodyParts = message.payload.parts;
  if (bodyParts) {
    bodyParts.forEach((part: any) => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        email.body = decodeBase64Url(part.body.data);
      }
    });
  } else if (message.payload.body && message.payload.body.size > 0) {
    email.body = decodeBase64Url(message.payload.body.data);
  }

  return email;
};


const decodeBase64Url = (base64UrlString: string) => {
  const buff = Buffer.from(base64UrlString, 'base64');
  return buff.toString('utf-8');
};

const main = async () => {
  // await sentToOpenAi("This is the message");
  await readGmailInbox();
  // await readOutlookInbox();
};

main().catch(console.error);
