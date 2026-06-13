import { supabase } from "./supabase.js";

export async function saveMessage(data) {
  const { error } = await supabase.from("bot_messages").insert(data);

  if (error) {
    console.error("Save message error:", error.message);
  }
}
