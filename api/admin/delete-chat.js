import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const adminPassword = req.headers["x-admin-password"];

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const deletePassword = req.headers["x-delete-password"];

  if (deletePassword !== process.env.DELETE_PASSWORD) {
    return res.status(403).json({
      error: "Wrong delete password"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { chat_id } = req.body;

  if (!chat_id) {
    return res.status(400).json({
      error: "chat_id required"
    });
  }

  const { error } = await supabase
    .from("bot_messages")
    .delete()
    .eq("chat_id", String(chat_id));

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  return res.status(200).json({
    ok: true
  });
}
