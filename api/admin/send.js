import { sendTelegram } from "../lib/telegram.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { chat_id, text, reply_to_message_id } = req.body;

  if (!chat_id || !text) {
    return res.status(400).json({ error: "chat_id and text required" });
  }

  const result = await sendTelegram(
    chat_id,
    text,
    reply_to_message_id || null
  );

  return res.status(200).json({
    ok: true,
    telegram: result,
  });
}
