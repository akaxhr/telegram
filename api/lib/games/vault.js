import { supabase } from "../supabase.js";

// modes of difficulty

const DIFFICULTIES = {
  easy: {
    name: "🟢 EASY VAULT",
    length: 6,
    reward: 300,
    missCost: 10,
  },
  normal: {
    name: "🔵 NORMAL VAULT",
    length: 8,
    reward: 600,
    missCost: 10,
  },
  legendary: {
    name: "🟣 LEGENDARY VAULT",
    length: 16,
    reward: 1500,
    missCost: 15,
  },
  ultra: {
    name: "🔥 ULTRA VAULT",
    length: 20,
    reward: 2500,
    missCost: 20,
  },
};

function getDifficulty(mode = "normal") {
  return DIFFICULTIES[mode] || DIFFICULTIES.normal;
}

// code generating

function randomCode(length) {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }

  return code;
}

function revealCode(secret, positions) {
  return secret
    .split("")
    .map((digit, index) => positions.includes(index) ? digit : "_")
    .join(" ");
}

function getStreakPercent(streak) {
  if (streak >= 5) return 40;
  if (streak === 4) return 30;
  if (streak === 3) return 20;
  if (streak === 2) return 10;
  return 0;
}

function getWinBadge(wins) {
  if (wins >= 100) return "🌌 Vault Legend";
  if (wins >= 75) return "👑 Vault Sovereign";
  if (wins >= 50) return "🎯 Mastermind";
  if (wins >= 25) return "⚙️ Elite Decoder";
  if (wins >= 10) return "🧠 Cipher Hunter";
  if (wins >= 1) return "🔓 Codebreaker";
  return "";
}

function getCoinBadge(coins) {
  if (coins >= 100000) return "🌟 Wealth Emperor";
  if (coins >= 50000) return "👑 Magnate";
  if (coins >= 25000) return "💎 Tycoon";
  if (coins >= 10000) return "🏦 Financier";
  if (coins >= 5000) return "💰 Collector";
  if (coins >= 1000) return "💵 Investor";
  return "";
}

async function getOrCreatePlayer(userId, username) {
  const { data } = await supabase
    .from("vault_players")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) return data;

  const { data: created } = await supabase
    .from("vault_players")
    .insert({
      user_id: userId,
      username,
      coins: 100
    })
    .select("*")
    .single();

  return created;
}

export async function startVault(chatId, mode = "normal") {
  const difficulty = getDifficulty(mode);
  const { data: existing } = await supabase
    .from("vault_games")
    .select("*")
    .eq("chat_id", String(chatId))
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return "⚠️ A vault is already active in this group.\n\nUse a 6-digit code to attempt breach.";
  }

  const secret = randomCode(difficulty.length);

  await supabase.from("vault_games").insert({
    chat_id: String(chatId),
    secret_code: secret,
    difficulty: mode,
    attempts_left: 30,
    wrong_attempts: 0,
    revealed_positions: [],
    is_active: true
  });

  return `🔐 VAULT PROTOCOL INITIATED

A classified digital vault has appeared.

CODE FORMAT
● ${difficulty.length} Digits
● 000000 - 999999

VAULT REWARD
💰 ${difficulty.reward} Coins

BREACH LIMIT
❤️ 30 Attempts

BREACH COST
💸 -${difficulty.missCost} Coins per failed attempt

Current Code Status:
${"_ ".repeat(difficulty.length).trim()}

First operative to breach the vault claims the reward.

Enter a ${difficulty.length}-digit code...`;
}

export async function handleVaultGuess(chatId, userId, username, guess) {
  const { data: game } = await supabase
    .from("vault_games")
    .select("*")
    .eq("chat_id", String(chatId))
    .eq("is_active", true)
    .maybeSingle();

  if (!game) return null;

const codeLength = game.secret_code.length;
const guessRegex = new RegExp(`^\\d{${codeLength}}$`);
if (!guessRegex.test(guess)) return null;

  const player = await getOrCreatePlayer(userId, username);

  if (guess === game.secret_code) {
    const newStreak = player.current_streak + 1;
    const bestStreak = Math.max(player.best_streak || 0, newStreak);
    const streakPercent = getStreakPercent(newStreak);
    const streakCoins = Math.floor(BASE_REWARD * streakPercent / 100);
    const totalEarned = BASE_REWARD + streakCoins;
    const newCoins = player.coins + totalEarned;
    const newWins = player.wins + 1;

    await supabase
      .from("vault_players")
      .update({
        username,
        coins: newCoins,
        wins: newWins,
        current_streak: newStreak,
        best_streak: bestStreak
      })
      .eq("user_id", userId);

    await supabase
      .from("vault_games")
      .update({ is_active: false })
      .eq("id", game.id);

    const badges = [
      getWinBadge(newWins),
      getCoinBadge(newCoins),
      game.wrong_attempts < 5 ? "🍀 Lucky Hacker" : "",
      game.wrong_attempts < 3 ? "⚡ Phantom Cracker" : ""
    ].filter(Boolean).join(" ");

    return `🎉 VAULT BREACHED

${username} cracked the vault code: ${game.secret_code}

💰 Winning Coins: +${BASE_REWARD}
${streakCoins > 0 ? `🔥 Streak Bonus: +${streakCoins} (${streakPercent}%)\n` : ""}🏦 Total Earned: +${totalEarned}

🔥 Current Streak: ${newStreak}
💼 Total Coins: ${newCoins}

🏅 Badges:
${badges || "🔓 Codebreaker"}`;
  }

  const newAttemptsLeft = game.attempts_left - 1;
  const newWrongAttempts = game.wrong_attempts + 1;
  const newCoins = Math.max(0, player.coins - MISS_COST);

  await supabase
    .from("vault_players")
    .update({
      username,
      coins: newCoins,
      current_streak: 0
    })
    .eq("user_id", userId);

  let revealed = game.revealed_positions || [];

  if (newWrongAttempts % 5 === 0 && revealed.length < codeLength - 1) {
    const hidden = Array.from({ length: codeLength }, (_, i) => i)
  .filter(i => !revealed.includes(i));
    const pos = hidden[Math.floor(Math.random() * hidden.length)];
    revealed.push(pos);
  }

  await supabase
    .from("vault_games")
    .update({
      attempts_left: newAttemptsLeft,
      wrong_attempts: newWrongAttempts,
      revealed_positions: revealed
    })
    .eq("id", game.id);

  if (newAttemptsLeft <= 0) {
    await supabase
      .from("vault_games")
      .update({ is_active: false })
      .eq("id", game.id);

    return `💀 VAULT LOCKDOWN

All attempts have been exhausted.

The hidden code was: ${game.secret_code}

The vault has vanished into the shadows.`;
  }

  const status = revealCode(game.secret_code, revealed);

  const clueText =
    newWrongAttempts % 5 === 0
      ? `\n📡 Intelligence Fragment Recovered\nCode Status:\n${status}\n`
      : `\nCode Status:\n${status}\n`;

  return `❌ ACCESS DENIED

${username} dropped 💸 10 coins into the vault drain.

${clueText}
❤️ Attempts Left: ${newAttemptsLeft}
💼 ${username}'s Coins: ${newCoins}`;
}

export async function vaultLeaderboard() {
  const { data } = await supabase
    .from("vault_players")
    .select("*")
    .order("coins", { ascending: false })
    .limit(10);

  if (!data?.length) return "🏆 No vault hunters yet.";

  return `🏆 GLOBAL VAULT RANKINGS\n\n` + data.map((p, i) => {
    const title = i === 0 ? "👑 Richest Operative" : "";
    const badges = [getWinBadge(p.wins), getCoinBadge(p.coins)].filter(Boolean).join(" ");
    return `#${i + 1} ${p.username || "Unknown"} ${title}
${badges}
💰 ${p.coins} Coins | 🔓 ${p.wins} Breaches`;
  }).join("\n\n");
}
