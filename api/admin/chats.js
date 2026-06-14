import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const adminPassword = req.headers["x-admin-password"];

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  // GET chats
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("bot_messages")
      .select("chat_id, chat_title, chat_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    const chatsMap = new Map();

    for (const msg of data) {
      if (!chatsMap.has(msg.chat_id)) {
        chatsMap.set(msg.chat_id, msg);
      }
    }

    return res.status(200).json({
      chats: Array.from(chatsMap.values())
    });
  }

  // DELETE chat
  if (req.method === "DELETE") {
    const deletePassword = req.headers["x-delete-password"];

    if (deletePassword !== process.env.DELETE_PASSWORD) {
      return res.status(403).json({
        error: "Wrong delete password"
      });
    }

    const chatId = req.query.chat_id;

    if (!chatId) {
      return res.status(400).json({
        error: "chat_id required"
      });
    }

    const { error } = await supabase
      .from("bot_messages")
      .delete()
      .eq("chat_id", String(chatId));

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true
    });
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
