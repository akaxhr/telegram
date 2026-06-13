import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ messages: data });
}
