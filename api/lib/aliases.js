import { supabase } from "./supabase.js";

export async function getDisplayName(userId, fallbackName) {
  const { data } = await supabase
    .from("user_aliases")
    .select("nickname")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.nickname || fallbackName || "User";
}
