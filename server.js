// server.js - Backend for Minecraft AI Assistant
// This connects your frontend to Claude AI

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Claude AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompt for Minecraft AI
const SYSTEM_PROMPT = `You are an expert Minecraft AI assistant with deep knowledge of:
- Minecraft mods (building, performance, utility, gameplay, graphics)
- Server setup and administration (Paper, Spigot, Forge, Fabric)
- Building techniques and creative tools
- Performance optimization
- Modpack creation and management
- Technical Minecraft concepts

When recommending mods:
1. Provide the mod name clearly
2. Include download sources (CurseForge, Modrinth, official sites)
3. Specify compatibility (Forge/Fabric, Minecraft versions)
4. Explain what makes each mod useful
5. Give installation tips when relevant

Format your responses with:
- Clear headings using **bold** for mod names
- Emojis for visual appeal (🏗️⚡🖥️💎🔧 etc)
- Bullet points for features
- Download links when possible
- Specific version compatibility info

Be helpful, detailed, and enthusiastic about Minecraft!
Always provide actionable information that users can immediately use.`;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minecraft AI Backend Running' });
});

// Main chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build conversation history for Claude
    const messages = [];
    
    // Add previous conversation history (last 10 messages to stay within limits)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    console.log(`[${new Date().toISOString()}] Processing: "${message}"`);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Latest Claude Sonnet
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    const aiResponse = response.content[0].text;

    console.log(`[${new Date().toISOString()}] Response generated (${aiResponse.length} chars)`);

    res.json({
      response: aiResponse,
      model: 'claude-sonnet-4-20250514',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again in a moment.'
      });
    }
    
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your configuration.'
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 Minecraft AI Backend Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🤖 Claude AI: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
  console.log('\nEndpoints:');
  console.log(`  GET  /health - Check server status`);
  console.log(`  POST /chat   - Send messages to AI\n`);
});

module.exports = app;
