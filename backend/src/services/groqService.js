

export async function suggestSteps(title, description = '', category = '') {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const prompt = `Objectif : "${title}"${description ? ` - Description : ${description}` : ''}${category ? ` - Catégorie : ${category}` : ''}.
Décompose cet objectif en 5 à 7 étapes concrètes, réalisables et progressives.
Réponds UNIQUEMENT en JSON avec ce format exact :
{
  "steps": [
    { "title": "Titre de l'étape 1" },
    { "title": "Titre de l'étape 2" }
  ]
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu es un assistant qui aide à découper des objectifs personnels en étapes concrètes.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);

  return parsed.steps || [];
}