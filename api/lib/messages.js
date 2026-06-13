import { supabase } from "./supabase.js";

export async function saveMessage(data) {
  await supabase.from("bot_messages").insert(data);
}
