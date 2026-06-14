import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const password = req.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const chatId = req.query.chat_id;

    const { data, error } = await supabase
      .from("group_settings")
      .select("*")
      .eq("chat_id", String(chatId))
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      vault_enabled: data?.vault_enabled ?? true,
      ai_enabled: data?.ai_enabled ?? true
    });
  }

  if (req.method === "POST") {
    if (req.body.settings_password !== process.env.SETTINGS_PASSWORD) {
  return res.status(403).json({ error: "Wrong settings password" });
}
    const {
      chat_id,
      vault_enabled,
      ai_enabled
    } = req.body;

    const { error } = await supabase
      .from("group_settings")
      .upsert({
        chat_id: String(chat_id),
        vault_enabled,
        ai_enabled,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
