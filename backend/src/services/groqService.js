const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function suggestSteps(title, description = '') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in environment variables');
  }

  const prompt = `
Tu es un assistant de productivité. Propose 3 à 5 étapes concrètes et actionnables pour atteindre cet objectif.
Réponds UNIQUEMENT sous forme de tableau JSON de chaînes de caractères, sans texte autour.

Objectif : ${title}
${description ? `Description : ${description}` : ''}

Exemple de réponse attendue :
["Étape 1", "Étape 2", "Étape 3"]
`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'Tu réponds uniquement en JSON array de strings.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Groq API error:', error);
    throw new Error('Groq API request failed');
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Nettoie la réponse pour extraire le JSON
  const jsonMatch = content.match(/\[.*\]/s);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Groq');
  }

  return JSON.parse(jsonMatch[0]);
}