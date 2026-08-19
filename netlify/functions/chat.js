export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { system, messages } = JSON.parse(event.body);

    const contents = (messages || []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    }));

    const geminiBody = {
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    };

    const model = "gemini-2.5-flash";
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await upstream.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      "";

    return {
      statusCode: upstream.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: [{ type: "text", text }] }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "proxy_error", message: err.message }),
    };
  }
};
