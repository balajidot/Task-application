// 🔍 Diagnostic Tool: Find Allowed Models for your API Key
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel.' });
  }

  try {
    // Calling the exact API Google suggested in the error log
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ api_error: data });
    }

    // Filter to show only models that can generate text (generateContent)
    const validModels = data.models
      ? data.models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace('models/', ''))
      : data;

    return res.status(200).json({
      success: true,
      message: "இந்த API Key-க்கு கீழே உள்ள மாடல்கள் மட்டுமே வேலை செய்யும்:",
      allowed_models: validModels
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
