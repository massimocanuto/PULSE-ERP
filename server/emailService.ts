import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

const ARUBA_EMAIL = process.env.ARUBA_EMAIL_ADDRESS;
const ARUBA_PASSWORD = process.env.ARUBA_EMAIL_PASSWORD;

interface EmailCache {
  emails: EmailMessage[];
  timestamp: number;
}

const emailCache = new Map<string, EmailCache>();
const CACHE_TTL = 30 * 1000; // 30 seconds

const smtpTransporter = nodemailer.createTransport({
  host: 'smtps.aruba.it',
  port: 465,
  secure: true,
  auth: {
    user: ARUBA_EMAIL,
    pass: ARUBA_PASSWORD,
  },
});



export interface EmailMessage {
  id: string; // Internal ID or Message-ID
  uid: number; // IMAP UID
  fromAddress: string;
  fromName: string;
  toAddress: string;
  subject: string;
  preview: string;
  body: string;
  unread: boolean;
  starred: boolean;
  receivedAt: Date;
  hasAttachments: boolean;
  attachmentCount: number;
}



export async function fetchEmailsFromFolderWithConfig(
  credentials: UserEmailCredentials,
  folderPath: string,
  limit: number = 20,
  skipCache: boolean = false
): Promise<EmailMessage[]> {
  // ... (keep existing cache logic if needed, or remove if unused)

  return new Promise((resolve, reject) => {
    const emails: EmailMessage[] = [];

    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox(folderPath, true, (err, box) => {
        if (err) {
          console.error(`[IMAP] Error opening folder ${folderPath}:`, err);
          imap.end();
          return resolve([]);
        }

        if (!box || box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }

        const fetchCount = Math.min(limit, box.messages.total);
        const start = Math.max(1, box.messages.total - fetchCount + 1);
        const range = `${start}:${box.messages.total}`;

        const f = imap.seq.fetch(range, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg, seqno) => {
          let buffer = '';
          let isUnread = true;
          let isStarred = false;
          let uid = 0;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            uid = attrs.uid;
            if (attrs.flags) {
              isUnread = !attrs.flags.includes('\\Seen');
              isStarred = attrs.flags.includes('\\Flagged');
            }
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              // ... (parsing logic)
              const fromAddress = parsed.from?.value?.[0]?.address || '';
              const fromName = parsed.from?.value?.[0]?.name || fromAddress.split('@')[0];
              const toAddress = parsed.to
                ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) || ''
                : '';

              emails.push({
                id: parsed.messageId || `msg-${uid}-${Date.now()}`,
                uid: uid,
                fromAddress,
                fromName,
                toAddress,
                subject: parsed.subject || '(Nessun oggetto)',
                preview: (parsed.text || '').substring(0, 150),
                body: parsed.html || parsed.textAsHtml || parsed.text || '',
                unread: isUnread,
                starred: isStarred,
                receivedAt: parsed.date || new Date(),
                hasAttachments: (parsed.attachments?.length || 0) > 0,
                attachmentCount: parsed.attachments?.length || 0,
              });
            } catch (parseErr) {
              console.error('Error parsing email:', parseErr);
            }
          });
        });

        // ... (error and end handlers)
        f.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          resolve(emails);
        });

        f.once('end', () => {
          setTimeout(() => {
            imap.end();
            emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
            resolve(emails);
          }, 1000);
        });
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.connect();
  });
}

export async function fetchNewEmails(
  credentials: UserEmailCredentials,
  folderPath: string,
  minUid: number
): Promise<EmailMessage[]> {
  return new Promise((resolve, reject) => {
    const emails: EmailMessage[] = [];

    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox(folderPath, true, (err, box) => {
        if (err) {
          imap.end();
          return resolve([]);
        }

        imap.search([['UID', `${minUid + 1}:*`]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve([]);
          }

          const f = imap.fetch(results, {
            bodies: '',
            struct: true,
          });

          f.on('message', (msg) => {
            let buffer = '';
            let isUnread = true;
            let isStarred = false;
            let uid = 0;

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
              if (attrs.flags) {
                isUnread = !attrs.flags.includes('\\Seen');
                isStarred = attrs.flags.includes('\\Flagged');
              }
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                const fromAddress = parsed.from?.value?.[0]?.address || '';
                const fromName = parsed.from?.value?.[0]?.name || fromAddress.split('@')[0];
                const toAddress = parsed.to
                  ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) || ''
                  : '';

                emails.push({
                  id: parsed.messageId || `msg-${uid}-${Date.now()}`,
                  uid: uid,
                  fromAddress,
                  fromName,
                  toAddress,
                  subject: parsed.subject || '(Nessun oggetto)',
                  preview: (parsed.text || '').substring(0, 150),
                  body: parsed.html || parsed.textAsHtml || parsed.text || '',
                  unread: isUnread,
                  starred: isStarred,
                  receivedAt: parsed.date || new Date(),
                  hasAttachments: (parsed.attachments?.length || 0) > 0,
                  attachmentCount: parsed.attachments?.length || 0,
                });
              } catch (e) {
                console.error(e);
              }
            });
          });

          f.once('error', (err) => {
            imap.end();
            resolve(emails);
          });

          f.once('end', () => {
            setTimeout(() => {
              imap.end();
              // Sort by UID ascending (oldest to newest) or receivedAt
              emails.sort((a, b) => a.uid - b.uid);
              resolve(emails);
            }, 1000);
          });
        });
      });
    });

    imap.once('error', (err) => {
      resolve([]);
    });

    imap.connect();
  });
}



export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  try {
    await smtpTransporter.sendMail({
      from: ARUBA_EMAIL,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export interface TaskForReminder {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  assignedTo?: string;
  assignedEmail?: string;
}

export async function sendTaskReminderEmail(
  recipientEmail: string,
  recipientName: string,
  tasks: TaskForReminder[]
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  if (tasks.length === 0) {
    console.log('No tasks to remind');
    return true;
  }

  const taskListHtml = tasks.map(task => {
    const dueText = task.dueDate || 'Nessuna scadenza';
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${task.title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${dueText}</td>
      </tr>
    `;
  }).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f, #2c5282); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #1e3a5f; color: white; padding: 12px; text-align: left; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📋 PULSE ERP</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Promemoria Attività</p>
        </div>
        <div class="content">
          <p>Ciao <strong>${recipientName}</strong>,</p>
          <p>Ecco le tue attività in scadenza nei prossimi giorni:</p>
          
          <table>
            <thead>
              <tr>
                <th>Attività</th>
                <th style="text-align: center;">Scadenza</th>
              </tr>
            </thead>
            <tbody>
              ${taskListHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">Accedi a PULSE ERP per gestire le tue attività.</p>
        </div>
        <div class="footer">
          <p>Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `📋 Promemoria: ${tasks.length} attività in scadenza`;

  return sendEmail(recipientEmail, subject, htmlBody);
}

export async function sendWeeklyReportEmail(
  recipientEmail: string,
  recipientName: string,
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    projectsCount: number;
  }
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f, #2c5282); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 32px; font-weight: bold; color: #1e3a5f; }
        .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
        .progress-bar { background: #e5e5e5; border-radius: 10px; height: 20px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: linear-gradient(90deg, #22c55e, #16a34a); height: 100%; border-radius: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📊 Report Settimanale</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">PULSE ERP</p>
        </div>
        <div class="content">
          <p>Ciao <strong>${recipientName}</strong>,</p>
          <p>Ecco il riepilogo della tua settimana:</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${stats.completedTasks}</div>
              <div class="stat-label">Completate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.pendingTasks}</div>
              <div class="stat-label">In Corso</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: ${stats.overdueTasks > 0 ? '#ef4444' : '#22c55e'};">${stats.overdueTasks}</div>
              <div class="stat-label">Scadute</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.projectsCount}</div>
              <div class="stat-label">Progetti</div>
            </div>
          </div>

          <h3>Tasso di Completamento</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionRate}%;"></div>
          </div>
          <p style="text-align: center; font-size: 18px; font-weight: bold;">${completionRate}%</p>
          
          <p style="margin-top: 20px;">Continua così! Accedi a PULSE ERP per vedere i dettagli.</p>
        </div>
        <div class="footer">
          <p>Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `📊 Report Settimanale: ${completionRate}% completato`;

  return sendEmail(recipientEmail, subject, htmlBody);
}

export async function fetchEmails(limit: number = 20): Promise<EmailMessage[]> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return [];
  }

  return new Promise((resolve, reject) => {
    const emails: EmailMessage[] = [];

    const imap = new Imap({
      user: ARUBA_EMAIL,
      password: ARUBA_PASSWORD,
      host: 'imaps.aruba.it',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          resolve([]);
          return;
        }

        const total = box.messages.total;
        if (total === 0) {
          imap.end();
          resolve([]);
          return;
        }

        const start = Math.max(1, total - limit + 1);
        const fetchRange = `${start}:${total}`;

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg, seqno) => {
          let emailBuffer = '';
          let uid = 0;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              emailBuffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            uid = attrs.uid;
            const isUnread = !attrs.flags.includes('\\Seen');
            const isStarred = attrs.flags.includes('\\Flagged');

            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(emailBuffer);

                const fromAddress = parsed.from?.value[0]?.address || '';
                const fromName = parsed.from?.value[0]?.name || fromAddress.split('@')[0] || 'Unknown';
                const toAddress = parsed.to ?
                  (Array.isArray(parsed.to) ? parsed.to[0]?.value[0]?.address : parsed.to.value[0]?.address) || ''
                  : '';

                const htmlContent = typeof parsed.html === 'string' ? parsed.html : '';
                const bodyText = parsed.text || htmlContent.replace(/<[^>]*>/g, '') || '';
                const preview = bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : '');

                emails.push({
                  id: `aruba-${seqno}-${Date.now()}`,
                  uid,
                  fromAddress,
                  fromName,
                  toAddress,
                  subject: parsed.subject || '(Nessun oggetto)',
                  preview,
                  body: parsed.html || parsed.text || '',
                  unread: isUnread,
                  starred: isStarred,
                  receivedAt: parsed.date || new Date(),
                  hasAttachments: (parsed.attachments?.length || 0) > 0,
                  attachmentCount: parsed.attachments?.length || 0,
                });
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
              }
            });
          });
        });

        f.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          resolve(emails);
        });

        f.once('end', () => {
          setTimeout(() => {
            imap.end();
            emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
            resolve(emails);
          }, 1000);
        });
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.once('end', () => {
      console.log('IMAP connection ended');
    });

    imap.connect();
  });
}

export function isEmailConfigured(): boolean {
  return !!(ARUBA_EMAIL && ARUBA_PASSWORD);
}

export interface EmailFolder {
  name: string;
  path: string;
  delimiter: string;
  flags: string[];
  children?: EmailFolder[];
}

export async function fetchEmailFolders(): Promise<EmailFolder[]> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return [];
  }

  return new Promise((resolve, reject) => {
    const folders: EmailFolder[] = [];

    const imap = new Imap({
      user: ARUBA_EMAIL,
      password: ARUBA_PASSWORD,
      host: 'imaps.aruba.it',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('Error getting mailboxes:', err);
          imap.end();
          resolve([]);
          return;
        }

        const parseBoxes = (boxObj: any, parentPath = ''): EmailFolder[] => {
          const result: EmailFolder[] = [];
          for (const [name, box] of Object.entries(boxObj)) {
            const boxData = box as any;
            const path = parentPath ? `${parentPath}${boxData.delimiter}${name}` : name;
            const folder: EmailFolder = {
              name,
              path,
              delimiter: boxData.delimiter || '/',
              flags: boxData.attribs || [],
              children: boxData.children ? parseBoxes(boxData.children, path) : undefined,
            };
            result.push(folder);
          }
          return result;
        };

        const parsedFolders = parseBoxes(boxes);
        imap.end();
        resolve(parsedFolders);
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.connect();
  });
}

export async function fetchEmailsFromFolder(folderPath: string, limit: number = 20): Promise<EmailMessage[]> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return [];
  }

  return new Promise((resolve, reject) => {
    const emails: EmailMessage[] = [];

    const imap = new Imap({
      user: ARUBA_EMAIL,
      password: ARUBA_PASSWORD,
      host: 'imaps.aruba.it',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox(folderPath, true, (err, box) => {
        if (err) {
          console.error('Error opening folder:', folderPath, err);
          imap.end();
          resolve([]);
          return;
        }

        const total = box.messages.total;
        if (total === 0) {
          imap.end();
          resolve([]);
          return;
        }

        const start = Math.max(1, total - limit + 1);
        const fetchRange = `${start}:${total}`;

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg, seqno) => {
          let emailBuffer = '';
          let uid = 0;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              emailBuffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            uid = attrs.uid;
            const isUnread = !attrs.flags.includes('\\Seen');
            const isStarred = attrs.flags.includes('\\Flagged');

            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(emailBuffer);

                const fromAddress = parsed.from?.value[0]?.address || '';
                const fromName = parsed.from?.value[0]?.name || fromAddress.split('@')[0] || 'Unknown';
                const toAddress = parsed.to ?
                  (Array.isArray(parsed.to) ? parsed.to[0]?.value[0]?.address : parsed.to.value[0]?.address) || ''
                  : '';

                const htmlContent = typeof parsed.html === 'string' ? parsed.html : '';
                const bodyText = parsed.text || htmlContent.replace(/<[^>]*>/g, '') || '';
                const preview = bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : '');

                emails.push({
                  id: `aruba-${folderPath}-${seqno}-${Date.now()}`,
                  uid,
                  fromAddress,
                  fromName,
                  toAddress,
                  subject: parsed.subject || '(Nessun oggetto)',
                  preview,
                  body: parsed.html || parsed.text || '',
                  unread: isUnread,
                  starred: isStarred,
                  receivedAt: parsed.date || new Date(),
                  hasAttachments: (parsed.attachments?.length || 0) > 0,
                  attachmentCount: parsed.attachments?.length || 0,
                });
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
              }
            });
          });
        });

        f.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          resolve(emails);
        });

        f.once('end', () => {
          setTimeout(() => {
            imap.end();
            emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
            resolve(emails);
          }, 1000);
        });
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.connect();
  });
}

// =====================
// DYNAMIC EMAIL FUNCTIONS (for user-specific email configs)
// =====================

export interface UserEmailCredentials {
  emailAddress: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  displayName?: string;
}

export async function sendEmailWithConfig(
  credentials: UserEmailCredentials,
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: credentials.smtpHost,
      port: credentials.smtpPort,
      secure: credentials.smtpSecure,
      auth: {
        user: credentials.emailAddress,
        pass: credentials.password,
      },
    });

    await transporter.sendMail({
      from: credentials.displayName
        ? `"${credentials.displayName}" <${credentials.emailAddress}>`
        : credentials.emailAddress,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent to ${to} using user config`);
    return true;
  } catch (error) {
    console.error('Error sending email with user config:', error);
    return false;
  }
}

export async function fetchEmailsWithConfig(
  credentials: UserEmailCredentials,
  limit: number = 20
): Promise<EmailMessage[]> {
  return new Promise((resolve, reject) => {
    const emails: EmailMessage[] = [];

    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          return resolve([]);
        }

        if (!box || box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }

        const fetchCount = Math.min(limit, box.messages.total);
        const start = Math.max(1, box.messages.total - fetchCount + 1);
        const range = `${start}:${box.messages.total}`;

        const f = imap.fetch(range, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg) => {
          let buffer = '';
          let isUnread = true;
          let isStarred = false;
          let uid = 0;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('attributes', (attrs) => {
            uid = attrs.uid;
            if (attrs.flags) {
              isUnread = !attrs.flags.includes('\\Seen');
              isStarred = attrs.flags.includes('\\Flagged');
            }
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              const fromAddress = parsed.from?.value?.[0]?.address || '';
              const fromName = parsed.from?.value?.[0]?.name || fromAddress.split('@')[0];
              const toAddress = parsed.to
                ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) || ''
                : '';

              emails.push({
                id: parsed.messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                uid,
                fromAddress,
                fromName,
                toAddress,
                subject: parsed.subject || '(Nessun oggetto)',
                preview: (parsed.text || '').substring(0, 150),
                body: parsed.html || parsed.textAsHtml || parsed.text || '',
                unread: isUnread,
                starred: isStarred,
                receivedAt: parsed.date || new Date(),
                hasAttachments: (parsed.attachments?.length || 0) > 0,
                attachmentCount: parsed.attachments?.length || 0,
              });
            } catch (parseErr) {
              console.error('Error parsing email:', parseErr);
            }
          });
        });

        f.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          resolve(emails);
        });

        f.once('end', () => {
          setTimeout(() => {
            imap.end();
            emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
            resolve(emails);
          }, 1000);
        });
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.connect();
  });
}

export async function fetchEmailFoldersWithConfig(
  credentials: UserEmailCredentials
): Promise<EmailFolder[]> {
  return new Promise((resolve, reject) => {
    const folders: EmailFolder[] = [];

    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('Error getting folders:', err);
          imap.end();
          return resolve([]);
        }

        const processBoxes = (boxes: any, prefix = ''): EmailFolder[] => {
          const result: EmailFolder[] = [];
          for (const [name, box] of Object.entries(boxes as Record<string, any>)) {
            const path = prefix ? `${prefix}${box.delimiter}${name}` : name;
            const folder: EmailFolder = {
              name,
              path,
              delimiter: box.delimiter,
              flags: box.attribs || [],
            };
            if (box.children && Object.keys(box.children).length > 0) {
              folder.children = processBoxes(box.children, path);
            }
            result.push(folder);
          }
          return result;
        };

        const processedFolders = processBoxes(boxes);
        imap.end();
        resolve(processedFolders);
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      resolve([]);
    });

    imap.connect();
  });
}



// Test email connection with user credentials
export async function testEmailConnection(
  credentials: UserEmailCredentials
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    });

    const timeout = setTimeout(() => {
      try { imap.end(); } catch { }
      resolve({ success: false, error: "Timeout di connessione - verifica le impostazioni del server" });
    }, 15000);

    imap.once('ready', () => {
      clearTimeout(timeout);
      imap.end();
      resolve({ success: true });
    });

    imap.once('error', (err: any) => {
      clearTimeout(timeout);
      try { imap.end(); } catch { }

      let errorMessage = "Errore di connessione sconosciuto";

      if (err.textCode === 'AUTHENTICATIONFAILED') {
        errorMessage = "Autenticazione fallita - verifica email e password";
      } else if (err.code === 'ENOTFOUND') {
        errorMessage = "Server non trovato - verifica l'host IMAP";
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = "Connessione rifiutata - verifica porta e SSL/TLS";
      } else if (err.code === 'ETIMEDOUT') {
        errorMessage = "Timeout di connessione - verifica le impostazioni";
      } else if (err.message) {
        errorMessage = err.message;
      }

      resolve({ success: false, error: errorMessage });
    });

    try {
      imap.connect();
    } catch (err: any) {
      clearTimeout(timeout);
      resolve({ success: false, error: err.message || "Errore di connessione" });
    }
  });
}

// Move email to a different folder
export async function moveEmailToFolder(
  credentials: UserEmailCredentials,
  emailUid: string,
  sourceFolder: string,
  targetFolder: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    });

    imap.once('ready', () => {
      imap.openBox(sourceFolder, false, (err, box) => {
        if (err) {
          imap.end();
          resolve({ success: false, error: `Impossibile aprire la cartella: ${err.message}` });
          return;
        }

        // Search for the email by Message-ID or sequence number
        imap.move(emailUid, targetFolder, (moveErr) => {
          imap.end();
          if (moveErr) {
            resolve({ success: false, error: `Impossibile spostare l'email: ${moveErr.message}` });
          } else {
            // Clear cache for both folders
            emailCache.delete(`${credentials.emailAddress}:${sourceFolder}`);
            emailCache.delete(`${credentials.emailAddress}:${targetFolder}`);
            resolve({ success: true });
          }
        });
      });
    });

    imap.once('error', (err: any) => {
      resolve({ success: false, error: err.message || "Errore di connessione" });
    });

    imap.connect();
  });
}

// Delete email (move to Trash)
export async function deleteEmail(
  credentials: UserEmailCredentials,
  emailUid: string,
  sourceFolder: string
): Promise<{ success: boolean; error?: string }> {
  return moveEmailToFolder(credentials, emailUid, sourceFolder, 'Trash');
}

// Archive email
export async function archiveEmail(
  credentials: UserEmailCredentials,
  emailUid: string,
  sourceFolder: string
): Promise<{ success: boolean; error?: string }> {
  return moveEmailToFolder(credentials, emailUid, sourceFolder, 'Archive');
}

// Permanently delete email (add \Deleted flag and expunge)
export async function permanentlyDeleteEmail(
  credentials: UserEmailCredentials,
  emailUid: string,
  folder: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    });

    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          imap.end();
          resolve({ success: false, error: `Impossibile aprire la cartella: ${err.message}` });
          return;
        }

        imap.addFlags(emailUid, '\\Deleted', (flagErr) => {
          if (flagErr) {
            imap.end();
            resolve({ success: false, error: `Impossibile eliminare: ${flagErr.message}` });
            return;
          }

          imap.expunge((expungeErr) => {
            imap.end();
            emailCache.delete(`${credentials.emailAddress}:${folder}`);
            if (expungeErr) {
              resolve({ success: false, error: `Errore durante l'eliminazione: ${expungeErr.message}` });
            } else {
              resolve({ success: true });
            }
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      resolve({ success: false, error: err.message || "Errore di connessione" });
    });

    imap.connect();
  });
}

// Send payslip notification email
export async function sendCedolinoEmail(
  recipientEmail: string,
  recipientName: string,
  mese: number,
  anno: number,
  portalToken?: string
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  const MESI_NOMI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  const meseNome = MESI_NOMI[mese - 1] || mese.toString();

  const portalLink = portalToken
    ? `<p style="margin-top: 20px; text-align: center;">
        <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : ''}/portale-collaboratori?token=${portalToken}" 
           style="display: inline-block; background: linear-gradient(135deg, #14b8a6, #10b981); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Accedi al Portale per Scaricare
        </a>
       </p>`
    : '';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6, #10b981); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">💰 Nuovo Cedolino Disponibile</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">PULSE ERP - Portale Collaboratori</p>
        </div>
        <div class="content">
          <p>Ciao <strong>${recipientName}</strong>,</p>
          <p>Ti informiamo che è stato caricato il tuo cedolino relativo al periodo:</p>
          
          <div class="highlight">
            <h2 style="margin: 0; color: #14b8a6;">${meseNome} ${anno}</h2>
          </div>
          
          <p>Puoi visualizzare e scaricare il cedolino accedendo al Portale Collaboratori.</p>
          ${portalLink}
        </div>
        <div class="footer">
          <p>Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
          <p>Se hai domande, contatta l'ufficio risorse umane.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `💰 Cedolino ${meseNome} ${anno} disponibile`;

  return sendEmail(recipientEmail, subject, htmlBody);
}

// Clear email cache for a specific folder
export function clearEmailCache(emailAddress: string, folder?: string) {
  if (folder) {
    emailCache.delete(`${emailAddress}:${folder}`);
  } else {
    for (const key of emailCache.keys()) {
      if (key.startsWith(emailAddress + ':')) {
        emailCache.delete(key);
      }
    }
  }
}

// Mark email as read
export async function markEmailAsRead(
  credentials: EmailCredentials,
  folder: string,
  emailUid: number
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: credentials.emailAddress,
      password: credentials.password,
      host: credentials.imapHost,
      port: credentials.imapPort,
      tls: credentials.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once('ready', () => {
      imap.openBox(folder, false, (err) => {
        if (err) {
          imap.end();
          resolve({ success: false, error: `Impossibile aprire la cartella: ${err.message}` });
          return;
        }

        imap.addFlags(emailUid, '\\Seen', (flagErr) => {
          imap.end();
          if (flagErr) {
            resolve({ success: false, error: `Impossibile segnare come letta: ${flagErr.message}` });
          } else {
            emailCache.delete(`${credentials.emailAddress}:${folder}`);
            resolve({ success: true });
          }
        });
      });
    });

    imap.once('error', (err: any) => {
      resolve({ success: false, error: err.message || "Errore di connessione" });
    });

    imap.connect();
  });
}

// Send welcome email to new employee
export async function sendWelcomeEmail(
  recipientEmail: string,
  nome: string,
  cognome: string,
  ruolo?: string,
  reparto?: string,
  dataAssunzione?: string
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured for welcome email');
    return false;
  }

  const dataFormattata = dataAssunzione
    ? new Date(dataAssunzione).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'non specificata';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; }
        .welcome-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
        .info-grid { display: grid; gap: 15px; margin: 25px 0; }
        .info-item { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: 600; color: #111827; }
        .footer { background: #f9fafb; padding: 25px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Benvenuto nel Team!</h1>
          <p>Siamo felici di averti con noi</p>
        </div>
        <div class="content">
          <div class="welcome-box">
            <h2 style="margin: 0 0 10px 0; color: #059669;">Ciao ${nome}!</h2>
            <p style="margin: 0; color: #047857;">È un piacere darti il benvenuto nella nostra azienda.</p>
          </div>
          
          <p>Siamo entusiasti di averti come nuovo membro del nostro team. Ecco un riepilogo delle tue informazioni:</p>
          
          <div class="info-grid">
            ${ruolo ? `<div class="info-item"><div class="info-label">Ruolo</div><div class="info-value">${ruolo}</div></div>` : ''}
            ${reparto ? `<div class="info-item"><div class="info-label">Reparto</div><div class="info-value">${reparto}</div></div>` : ''}
            <div class="info-item"><div class="info-label">Data Inizio</div><div class="info-value">${dataFormattata}</div></div>
          </div>
          
          <p>Se hai domande o hai bisogno di assistenza, non esitare a contattare il tuo responsabile o l'ufficio risorse umane.</p>
          
          <p style="margin-top: 30px;">In bocca al lupo per questa nuova avventura!</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
          <p style="margin: 10px 0 0 0;">Gestione Risorse Umane</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `Benvenuto ${nome} ${cognome}! - Inizia la tua avventura con noi`;

  return sendEmail(recipientEmail, subject, htmlBody);
}

// Send probation period reminder email
export async function sendProbationReminderEmail(
  recipientEmail: string,
  nome: string,
  cognome: string,
  dataFinePeriodoProva: string,
  giorniMancanti: number
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  const dataFormattata = new Date(dataFinePeriodoProva).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const urgencyColor = giorniMancanti <= 7 ? '#dc2626' : giorniMancanti <= 15 ? '#f59e0b' : '#3b82f6';
  const urgencyText = giorniMancanti <= 7 ? 'URGENTE' : giorniMancanti <= 15 ? 'ATTENZIONE' : 'PROMEMORIA';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3a5f, #2c5282); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .alert-box { background: white; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 5px solid ${urgencyColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .days-counter { font-size: 48px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">PULSE ERP - HR</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Gestione Risorse Umane</p>
        </div>
        <div class="content">
          <span class="badge">${urgencyText}</span>
          
          <div class="alert-box">
            <h2 style="margin: 0 0 15px 0;">Scadenza Periodo di Prova</h2>
            <p>Il periodo di prova di <strong>${nome} ${cognome}</strong> sta per terminare.</p>
            
            <div class="days-counter">${giorniMancanti} giorni</div>
            <p style="text-align: center; color: #666;">alla scadenza del ${dataFormattata}</p>
          </div>
          
          <p>Si prega di valutare le prestazioni del collaboratore e prendere le decisioni necessarie entro la data indicata.</p>
          
          <p><strong>Azioni consigliate:</strong></p>
          <ul>
            <li>Effettuare una valutazione delle performance</li>
            <li>Programmare un colloquio di feedback</li>
            <li>Preparare la documentazione per la conferma o il mancato rinnovo</li>
          </ul>
        </div>
        <div class="footer">
          <p>Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `${urgencyText}: Periodo di prova ${nome} ${cognome} - ${giorniMancanti} giorni alla scadenza`;

  return sendEmail(recipientEmail, subject, htmlBody);
}

// Send birthday notification email
export async function sendBirthdayNotificationEmail(
  adminEmail: string,
  birthdayPeople: Array<{ nome: string; cognome: string; dataNascita: string; reparto?: string }>
): Promise<boolean> {
  if (!ARUBA_EMAIL || !ARUBA_PASSWORD) {
    console.error('Email credentials not configured');
    return false;
  }

  const listHtml = birthdayPeople.map(p => `
    <div style="background: white; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="font-size: 32px; margin-right: 15px;">&#127874;</div>
      <div>
        <div style="font-weight: bold; font-size: 16px;">${p.nome} ${p.cognome}</div>
        ${p.reparto ? `<div style="color: #6b7280; font-size: 14px;">${p.reparto}</div>` : ''}
      </div>
    </div>
  `).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 30px; text-align: center; }
        .content { background: #fdf2f8; padding: 30px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #fff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Compleanni di Oggi!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div class="content">
          <p>Oggi festeggiano il compleanno:</p>
          ${listHtml}
          <p style="margin-top: 20px; text-align: center; color: #be185d;">Non dimenticare di fare gli auguri!</p>
        </div>
        <div class="footer">
          <p>Questo messaggio è stato inviato automaticamente da PULSE ERP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const count = birthdayPeople.length;
  const subject = `${count} compleanno${count > 1 ? 'i' : ''} oggi - ${birthdayPeople.map(p => p.nome).join(', ')}`;

  return sendEmail(adminEmail, subject, htmlBody);
}
