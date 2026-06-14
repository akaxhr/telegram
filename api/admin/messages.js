import { supabase } from "../lib/supabase.js";
import { sendTelegram } from "../lib/telegram.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET messages
  if (req.method === "GET") {
    const chatId = req.query.chat_id;
    const search = req.query.search || "";

    let query = supabase
      .from("bot_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(5005);

    if (search) {
      query = query.or(
        `message_text.ilike.%${search}%,username.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ messages: data });
  }

  // SEND message
  if (req.method === "POST") {
    if (req.body.reply_password !== process.env.REPLY_PASSWORD) {
      return res.status(403).json({ error: "Wrong reply password" });
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

  return res.status(405).json({ error: "Method not allowed" });
}
