import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isCalendarConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export async function getCalendarList() {
  const calendar = await getUncachableGoogleCalendarClient();
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

export async function createCalendarEvent(
  calendarId: string,
  summary: string,
  description: string,
  startDate: string,
  endDate?: string
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const event = {
    summary,
    description,
    start: {
      date: startDate,
    },
    end: {
      date: endDate || startDate,
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

export async function getUpcomingEvents(calendarId: string = 'primary', maxResults: number = 10) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function getEventsInRange(
  calendarId: string = 'primary',
  startDate: string,
  endDate: string
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date(startDate).toISOString(),
    timeMax: new Date(endDate).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  return response.data.items || [];
}

export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  await calendar.events.delete({
    calendarId,
    eventId,
  });

  return true;
}

export async function syncTaskToCalendar(
  task: { id: string; title: string; description?: string; dueDate: string },
  calendarId: string = 'primary'
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  // Check if dueDate includes time (contains 'T')
  const hasTime = task.dueDate.includes('T');
  
  let startDateTime: { date?: string; dateTime?: string; timeZone?: string };
  let endDateTime: { date?: string; dateTime?: string; timeZone?: string };
  
  if (hasTime) {
    // Parse date with time - create proper ISO format with timezone
    const dateObj = new Date(task.dueDate);
    // Add 1 hour for end time
    const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
    
    startDateTime = {
      dateTime: dateObj.toISOString(),
      timeZone: 'Europe/Rome',
    };
    endDateTime = {
      dateTime: endDateObj.toISOString(),
      timeZone: 'Europe/Rome',
    };
  } else {
    // All-day event - use date format YYYY-MM-DD
    startDateTime = { date: task.dueDate };
    // For all-day events, end date should be the next day
    const nextDay = new Date(task.dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDate = nextDay.toISOString().split('T')[0];
    endDateTime = { date: endDate };
  }
  
  const event = {
    summary: `📋 ${task.title}`,
    description: task.description || `Task da PULSE ERP\nID: ${task.id}`,
    start: startDateTime,
    end: endDateTime,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

export async function syncProjectToCalendar(
  project: { id: string; title: string; description?: string; dueDate: string },
  calendarId: string = 'primary'
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  // Check if dueDate includes time (contains 'T')
  const hasTime = project.dueDate.includes('T');
  
  let startDateTime: { date?: string; dateTime?: string; timeZone?: string };
  let endDateTime: { date?: string; dateTime?: string; timeZone?: string };
  
  if (hasTime) {
    const dateObj = new Date(project.dueDate);
    const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
    
    startDateTime = {
      dateTime: dateObj.toISOString(),
      timeZone: 'Europe/Rome',
    };
    endDateTime = {
      dateTime: endDateObj.toISOString(),
      timeZone: 'Europe/Rome',
    };
  } else {
    startDateTime = { date: project.dueDate };
    const nextDay = new Date(project.dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDate = nextDay.toISOString().split('T')[0];
    endDateTime = { date: endDate };
  }
  
  const event = {
    summary: `🎯 Progetto: ${project.title}`,
    description: project.description || `Progetto da PULSE ERP\nID: ${project.id}`,
    start: startDateTime,
    end: endDateTime,
    colorId: '9',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 * 7 },
        { method: 'popup', minutes: 60 * 24 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}
