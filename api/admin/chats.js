import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("bot_messages")
    .select("chat_id, chat_title, chat_type, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const chatsMap = new Map();

  for (const msg of data) {
    if (!chatsMap.has(msg.chat_id)) {
      chatsMap.set(msg.chat_id, msg);
    }
  }

  return res.status(200).json({
    chats: Array.from(chatsMap.values()),
  });
}
