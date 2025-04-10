// Project: Kenya-Focused Micro-Agent for YouTube + X Content Generation

// Backend: Node.js + Express Server (Starter)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Simple trend scraping from Trends24 Kenya page
async function getTrendingTopics() {
  const url = 'https://trends24.in/kenya/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const topics = [];

  $('ol.trend-card__list li').each((i, el) => {
    const topic = $(el).text().trim();
    if (topic) topics.push(topic);
  });

  return topics.slice(0, 10); // Return top 10
}

// Content Generator using OpenAI
async function generateContent(topic, tone = "Informative") {
  const prompt = `Generate a YouTube video title and a short script (hook, intro, body, outro) about the topic: "${topic}".
Tone: ${tone}. Then generate 3 tweet variations in the same tone.`;

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.data.choices[0].message.content;
}

// API Routes
app.get('/api/trends', async (req, res) => {
  try {
    const topics = await getTrendingTopics();
    res.json({ topics });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching trends');
  }
});

app.post('/api/generate', async (req, res) => {
  const { topic, tone } = req.body;
  try {
    const content = await generateContent(topic, tone);
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating content');
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
