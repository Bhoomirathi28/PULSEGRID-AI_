export async function callNemotronJSON<T>(
  system: string,
  user: string
): Promise<T> {
  const key = process.env.NEBIUS_API_KEY;
  const base = process.env.NEBIUS_BASE_URL;
  const model = process.env.NEBIUS_MODEL;
  if (!key || !base || !model) {
    throw new Error("Missing NEBIUS_API_KEY / NEBIUS_BASE_URL / NEBIUS_MODEL");
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Nebius error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  let text: string = data.choices?.[0]?.message?.content ?? "";
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  text = text.replace(/```json|```/g, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model returned no JSON");

  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new Error("Model returned malformed JSON");
  }
}