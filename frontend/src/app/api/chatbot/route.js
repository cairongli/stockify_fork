import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not set.' }, { status: 500 });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: message } ] }
        ]
      }),
    });

    if (!geminiRes.ok) {
      const error = await geminiRes.json();
      console.error('Gemini API error:', error);
      return NextResponse.json({ error: error.error?.message || 'Gemini API error.' }, { status: 500 });
    }

    const data = await geminiRes.json();
    // Gemini's response structure
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unknown error.' }, { status: 500 });
  }
} 