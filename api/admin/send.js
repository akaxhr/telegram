import { supabase } from "../lib/supabase.js";
import { sendTelegram } from "../lib/telegram.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { chat_id, text } = req.body;

  if (!chat_id || !text) {
    return res.status(400).json({ error: "chat_id and text required" });
  }

  const { chat_id, text, reply_to_message_id } = req.body;
  const result = await sendTelegram(chat_id, text, reply_to_message_id);

  const result = await sendTelegram(chat_id, text);

  await supabase.from("bot_messages").insert({
    chat_id: String(chat_id),
    chat_title: "Admin Sent",
    user_id: "bot_admin",
    username: "Akash Panel",
    message_text: text,
    is_bot: true,
  });

  return res.status(200).json({
    ok: true,
    telegram: result,
  });
}
