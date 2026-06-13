import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const chatId = req.query.chat_id;

  if (!chatId) {
    return res.status(400).json({ error: "chat_id required" });
  }

  const { data, error } = await supabase
    .from("bot_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ messages: data });
}
