import Anthropic from '@anthropic-ai/sdk';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const getRecommendations = asyncHandler(async (req, res) => {
  // Ensure user is a volunteer
  if (req.user.role !== 'volunteer') {
    throw new ApiError(403, 'Only volunteers can get event recommendations');
  }

  // 1. Fetch volunteer's skills and interests
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

  // 2. Fetch available events
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

  // 3. Prompt Claude for recommendations
  const prompt = `
You are an intelligent volunteer coordinator. Your task is to match a volunteer with the most suitable upcoming events based on their skills and interests.

Volunteer Profile:
- Skills: ${skills.join(', ') || 'None specified'}
- Interests: ${interests.join(', ') || 'None specified'}

Available Events:
${JSON.stringify(events, null, 2)}

Please select the top 3 most relevant events for this volunteer.
Rank them from most suitable to least.
Provide your response in raw JSON format matching this exact schema, without any markdown formatting or extra text:
{
  "recommendations": [
    {
      "eventId": "uuid-here",
      "title": "Event Title",
      "matchScore": 95,
      "reason": "Why this is a good match"
    }
  ],
  "explanation": "A short overall encouraging message explaining the matching logic."
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      temperature: 0.2,
      system:
        'You are an expert matchmaking system for volunteers. Always respond in valid JSON format only.',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].text;

    // Parse the JSON out of the response (stripping any accidental markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    res.json(parsedResponse);
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new ApiError(500, 'Failed to generate AI recommendations');
  }
});
