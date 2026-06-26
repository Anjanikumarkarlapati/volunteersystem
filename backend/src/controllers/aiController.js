import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Initialize Gemini with the API key from environment variables
// It will throw a clear error later if the key is missing when called
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'missing-key');

export const getRecommendations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'volunteer') {
    throw new ApiError(403, 'Only volunteers can get event recommendations');
  }

  const volunteerResult = await query(
    'SELECT skills, interests FROM volunteers WHERE user_id = $1',
    [req.user.id]
  );

  if (volunteerResult.rows.length === 0) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const volunteer = volunteerResult.rows[0];
  const skills = volunteer.skills || [];
  const interests = volunteer.interests || [];

  const eventsResult = await query(
    `SELECT id, title, description, category, required_skills, location, start_at 
     FROM events 
     WHERE status = 'published' 
     ORDER BY start_at ASC 
     LIMIT 20`
  );

  const events = eventsResult.rows;

  if (events.length === 0) {
    return res.json({
      recommendations: [],
      explanation: 'There are no active events available to recommend at the moment.',
    });
  }

  const prompt = `
You are an intelligent volunteer coordinator. Match a volunteer with suitable upcoming events.
Volunteer Profile:
- Skills: ${skills.join(', ') || 'None specified'}
- Interests: ${interests.join(', ') || 'None specified'}

Available Events:
${JSON.stringify(events, null, 2)}

Provide your response in raw JSON format matching this exact schema:
{
  "recommendations": [
    {
      "eventId": "uuid-here",
      "title": "Event Title",
      "matchScore": 95,
      "reason": "Why this is a good match"
    }
  ],
  "explanation": "A short encouraging message explaining the logic."
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'You are an expert matchmaking system for volunteers. Always respond in valid JSON format only.',
    });

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    // Parse the JSON out of the response (stripping any accidental markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    res.json(parsedResponse);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new ApiError(500, 'Failed to generate AI recommendations');
  }
});

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message, system } = req.body;
  if (!message) throw new ApiError(400, 'Message is required');

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: system || 'You are a helpful assistant for the VolunteerMS platform.',
    });

    const response = await model.generateContent(message);
    res.json({ reply: response.response.text() });
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    throw new ApiError(500, 'Failed to connect to the AI assistant');
  }
});

export const getPlatformAiSummary = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can generate platform summaries');
  }

  const [stats, topOrgs, topEvents] = await Promise.all([
    query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'volunteer') AS total_volunteers,
        (SELECT COUNT(*) FROM users WHERE role = 'organization') AS total_orgs,
        (SELECT COUNT(*) FROM events WHERE status = 'scheduled') AS active_events,
        (SELECT COALESCE(SUM(hours), 0) FROM attendance WHERE status = 'attended') AS total_hours
    `),
    query(`
      SELECT org.name, COUNT(e.id) as event_count
      FROM organizations org
      LEFT JOIN events e ON e.organization_id = org.id
      GROUP BY org.name
      ORDER BY event_count DESC
      LIMIT 3
    `),
    query(`
      SELECT title, start_at
      FROM events
      WHERE status = 'scheduled'
      ORDER BY start_at ASC
      LIMIT 3
    `),
  ]);

  const platformData = {
    statistics: stats.rows[0],
    top_organizations: topOrgs.rows,
    upcoming_events: topEvents.rows,
  };

  const prompt = `
You are an AI assistant for a Volunteer Management System. Generate a concise, intelligent summary of the current platform activity for the admin dashboard.

Here is the current platform data:
${JSON.stringify(platformData, null, 2)}

Instructions:
1. Write 2-3 short, engaging paragraphs.
2. Highlight key metrics (total volunteers, orgs, hours, etc.).
3. Mention top organizations or upcoming events to give it a dynamic feel.
4. Keep the tone professional, encouraging, and insightful.
5. Return ONLY the text summary, no JSON, no markdown blocks.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent(prompt);
    res.json({ summary: response.response.text().trim() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new ApiError(500, 'Failed to generate AI summary');
  }
});
