// Fonction serverless Vercel qui parse une instruction en JSON via Gemini.
// La clé GEMINI_API_KEY est stockée dans les variables d'environnement de Vercel,
// JAMAIS dans le code public.

const SYSTEM_PROMPT = `Tu interprètes des instructions en français pour modifier un calendrier 2026 (mai à décembre).

Catégories :
1. Événements ponctuels affichés en badges :
   - "fac" (cours, topo, GEAPT, exams) → "red"
   - "important" (finales sportives, concerts, dates clés) → "blue"
2. Vacances personnelles : période avec fond rouge pâle + intitulé.
3. Date de fin des stages (3 médecins terminent à cette date).
4. Vacances des maîtres de stage : Le Bris (mer), Montalvo (jeu), Andro (ven).

Tu réponds UNIQUEMENT en JSON valide, sans markdown ni préambule :
{ "actions": [...], "feedback": "résumé court fr" }

Types d'actions :
- {"type":"add_event","date":"YYYY-MM-DD","label":"texte","color":"red"|"blue"}
- {"type":"remove_event","date":"YYYY-MM-DD"}
- {"type":"remove_event_by_label","label":"texte"}
- {"type":"add_vacation","start":"YYYY-MM-DD","end":"YYYY-MM-DD","label":"texte","include_weekend":true}
- {"type":"remove_vacation_by_label","label":"texte"}
- {"type":"set_stage_end","date":"YYYY-MM-DD"}
- {"type":"add_stage_vacation","doctor":"Le Bris"|"Montalvo"|"Andro","start":"YYYY-MM-DD","end":"YYYY-MM-DD"}
- {"type":"clear_stage_vacations","doctor":"Le Bris"|"Montalvo"|"Andro"}

Année par défaut : 2026. "vacs"/"vacances" → vacation (include_weekend=true).
Si rien à faire ou ambigu, retourne {"actions":[], "feedback":"..."}.

Exemples :
"fac le 18/06 : GEAPT" → {"actions":[{"type":"add_event","date":"2026-06-18","label":"GEAPT","color":"red"}],"feedback":"GEAPT ajouté le 18/06."}
"vacs 12/12 : Anyma" → {"actions":[{"type":"add_vacation","start":"2026-12-12","end":"2026-12-12","label":"Anyma","include_weekend":true}],"feedback":"Anyma ajouté."}
"important : Finale LDC 30 mai" → {"actions":[{"type":"add_event","date":"2026-05-30","label":"Finale LDC","color":"blue"}],"feedback":"Finale LDC ajoutée."}
"enlève GEAPT" → {"actions":[{"type":"remove_event_by_label","label":"GEAPT"}],"feedback":"GEAPT supprimé."}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Clé API manquante. Configure la variable GEMINI_API_KEY dans Vercel.",
    });
  }

  const { instruction } = req.body || {};
  if (!instruction || typeof instruction !== 'string') {
    return res.status(400).json({ error: 'Instruction manquante.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: instruction }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: `Gemini ${r.status}: ${errTxt}` });
    }

    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: 'Réponse IA invalide', raw: cleaned });
    }

    if (!parsed.actions) parsed.actions = [];
    if (!parsed.feedback) parsed.feedback = 'Mis à jour.';

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
