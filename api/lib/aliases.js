import { supabase } from "./supabase.js";

export async function getDisplayName(userId, fallbackName) {
  const { data } = await supabase
    .from("user_aliases")
    .select("nickname")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.nickname || fallbackName || "User";
}

export async function getGroupSettings(chatId) {
  const { data } = await supabase
    .from("group_settings")
    .select("vault_enabled, ai_enabled")
    .eq("chat_id", String(chatId))
    .maybeSingle();

  return {
    vault_enabled: data?.vault_enabled ?? true,
    ai_enabled: data?.ai_enabled ?? true,
  };
}

export async function updateGroupSettings(chatId, settings) {
  const { error } = await supabase
    .from("group_settings")
    .upsert({
      chat_id: String(chatId),
      ...settings,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}
