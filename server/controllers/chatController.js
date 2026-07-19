const pool = require('../config/db');
const { generateChatResponse } = require('../utils/openaiHelper');

// Get or Create a chat session
const getOrCreateSession = async (req, res) => {
  const { userId } = req.user;

  try {
    // Look for an active session
    let result = await pool.query(
      "SELECT id FROM chat_sessions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    let sessionId;
    if (result.rows.length > 0) {
      sessionId = result.rows[0].id;
    } else {
      // Create a new session
      const insertResult = await pool.query(
        "INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id",
        [userId]
      );
      sessionId = insertResult.rows[0].id;
    }

    // Fetch message history
    const messagesResult = await pool.query(
      "SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );

    res.status(200).json({ sessionId, messages: messagesResult.rows });
  } catch (err) {
    console.error('[getOrCreateSession] Error:', err);
    res.status(500).json({ error: 'Failed to manage chat session' });
  }
};

// Handle sending a message
const sendMessage = async (req, res) => {
  const { userId } = req.user;
  const { sessionId, content } = req.body;

  if (!sessionId || !content) {
    return res.status(400).json({ error: 'Missing sessionId or content' });
  }

  try {
    // 1. Save user message to DB
    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)",
      [sessionId, content]
    );

    // 2. Fetch history for context
    const historyResult = await pool.query(
      "SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );
    
    // Format for OpenAI
    const messages = historyResult.rows.map(m => ({
      role: m.role,
      content: m.content
    }));

    // 3. Call OpenAI chat helper
    const aiResponse = await generateChatResponse(messages);

    // 3b. Server-side safety net: never trust readyToPlan blindly.
    // originCity is mandatory for flight search — if the model ever slips
    // and marks readyToPlan true without it, force it back to false here
    // rather than letting a plan through with no way to search flights.
    const originCity = aiResponse.extractedPreferences?.originCity;
    if (aiResponse.readyToPlan && (!originCity || !originCity.trim())) {
      console.warn('[sendMessage] readyToPlan was true but originCity missing — overriding to false.');
      aiResponse.readyToPlan = false;
      if (!aiResponse.message || !aiResponse.message.toLowerCase().includes('flying from')) {
        aiResponse.message += ' Also, which city will you be flying from? I need this to find your flights.';
      }
    }

    // 4. Save AI reply message to DB
    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'assistant', $2)",
      [sessionId, aiResponse.message]
    );

    // 5. If AI is ready to plan, we construct the plan and save it to the DB as a Trip
    if (aiResponse.readyToPlan && aiResponse.plan && aiResponse.plan.destinations) {
      const plan = aiResponse.plan;
      const tripTitle = `${plan.startCity || 'NZ'} Trip`;

      // Save trip logic similar to tripController
      const client = await pool.connect();
      let tripId = null;
      
      try {
        await client.query('BEGIN');

        const tripQuery = `
          INSERT INTO trips (user_id, title, summary, start_city, travelers, days, budget_level, suggestions, origin_city, depart_date, return_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id;
        `;
        const tripValues = [
          userId,
          tripTitle,
          plan.summary,
          plan.startCity,
          plan.travelers || 1,
          plan.days || 1,
          plan.budgetLevel,
          JSON.stringify(plan.suggestions || []),
          originCity || null,
          aiResponse.extractedPreferences?.departDate || null,
          aiResponse.extractedPreferences?.returnDate || null,
        ];
        
        const tripRes = await client.query(tripQuery, tripValues);
        tripId = tripRes.rows[0].id;

        const destQuery = `
          INSERT INTO destinations (trip_id, destination_id, name, country, lat, lng, emoji, highlights, bookme_deals, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `;

        for (let i = 0; i < plan.destinations.length; i++) {
          const dest = plan.destinations[i];
          const destValues = [
            tripId,
            dest.id,
            dest.name,
            dest.country,
            dest.lat,
            dest.lng,
            dest.emoji,
            JSON.stringify(dest.highlights || []),
            JSON.stringify(dest.bookmeDeals || []), // Can trigger scraper async later or rely on frontend refetch
            i
          ];
          await client.query(destQuery, destValues);
        }

        // Close the session
        await client.query("UPDATE chat_sessions SET status = 'completed' WHERE id = $1", [sessionId]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[chatController - trip save] Transaction error:', err);
      } finally {
        client.release();
      }

      if (tripId) {
        return res.status(200).json({
          message: aiResponse.message,
          extractedPreferences: aiResponse.extractedPreferences,
          readyToPlan: true,
          plan: aiResponse.plan,
          tripGenerated: true,
          tripId
        });
      }
    }

    // Return standard response
    return res.status(200).json({
      message: aiResponse.message,
      extractedPreferences: aiResponse.extractedPreferences,
      readyToPlan: aiResponse.readyToPlan,
      plan: aiResponse.readyToPlan ? aiResponse.plan : null,
      tripGenerated: false
    });
    
  } catch (err) {
    console.error('[sendMessage] Error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

module.exports = {
  getOrCreateSession,
  sendMessage
};
