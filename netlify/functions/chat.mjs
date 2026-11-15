
export default async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Metodă neacceptată." }),
      { status: 405, headers }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Lipsește cheia OpenAI." }),
      { status: 503, headers }
    );
  }

  try {
    const body = await req.json();
    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    const avatar = body.avatar || {};
    const name = String(avatar.name || "Maya").slice(0, 40);
    const personality = String(
      avatar.personality || "Prietenos și sociabil"
    ).slice(0, 200);

    if (!message || message.length > 4000) {
      return new Response(
        JSON.stringify({ error: "Mesaj invalid." }),
        { status: 400, headers }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          instructions: `Ești ${name}, un personaj virtual fictiv AVATARA. Personalitate: ${personality}. Răspunde natural, în limba utilizatorului. Nu pretinde că ești o persoană reală.`,
          input: message,
          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Eroare la serviciul AI." }),
        { status: 502, headers }
      );
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Eroare internă." }),
      { status: 500, headers }
    );
  }
};

