import { supabase } from "../supabase.js";

function generateClues(secret) {
  const digits = secret.split("").map(Number);

  return [
    `Digit sum is ${digits.reduce((a, b) => a + b, 0)}`,
    `Contains ${digits.filter(d => d % 2 === 0).length} even digits`,
    `Contains ${digits.filter(d => d % 2 !== 0).length} odd digits`,
    `Highest digit is ${Math.max(...digits)}`,
    `Lowest digit is ${Math.min(...digits)}`,
    `First digit is ${digits[0] % 2 === 0 ? "even" : "odd"}`,
    `Last digit is ${digits.at(-1) % 2 === 0 ? "even" : "odd"}`
  ];
}

// modes of difficulty

const DIFFICULTIES = {
  easy: {
    name: "🟢 EASY VAULT",
    length: 6,
    attempts: 20,
    clueEvery: 4,
    reward: 300,
    missCost: 10,
  },
  normal: {
    name: "🔵 NORMAL VAULT",
    length: 8,
    attempts: 20,
    clueEvery: 3,
    reward: 500,
    missCost: 15,
  },
  legendary: {
    name: "🟣 LEGENDARY VAULT",
    length: 9,
    attempts: 20,
    clueEvery: 3,
    reward: 1000,
    missCost: 25,
  },
  ultra: {
    name: "🔥 ULTRA VAULT",
    length: 10,
    attempts: 20,
    clueEvery: 2,
    reward: 2500,
    missCost: 50,
  },
};
function getDifficulty(mode = "normal") {
  return DIFFICULTIES[mode] || DIFFICULTIES.normal;
}

function randomFailNarration() {
  const lines = [
    "🔐 Security layer held strong.",
    "🚫 Access sequence rejected.",
    "💀 The vault laughed at that attempt.",
    "🤖 Authentication failed.",
    "⚠️ Incorrect breach code detected.",
    "🧊 The vault stayed cold and silent.",
    "📛 Security firewall refused entry.",
    "😵 That code got swallowed by the vault."
  ];

  return lines[Math.floor(Math.random() * lines.length)];
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
   return `⚠️ A vault is already active in this group.

Use a ${existing.secret_code.length}-digit code to attempt breach.`;
  }

  const secret = randomCode(difficulty.length);

  await supabase.from("vault_games").insert({
    chat_id: String(chatId),
    secret_code: secret,
    difficulty: mode,
    used_clues: [],
    attempts_left: difficulty.attempts,
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
❤️ ${difficulty.attempts} Attempts

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
const difficulty = getDifficulty(game.difficulty || "normal");
const BASE_REWARD = difficulty.reward;
const MISS_COST = difficulty.missCost;

function getMatchStats(secret, guess) {
  let correctPosition = 0;
  let correctDigitWrongPlace = 0;

  const secretUsed = Array(secret.length).fill(false);
  const guessUsed = Array(guess.length).fill(false);

  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      correctPosition++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (guessUsed[i]) continue;

    for (let j = 0; j < secret.length; j++) {
      if (secretUsed[j]) continue;

      if (guess[i] === secret[j]) {
        correctDigitWrongPlace++;
        secretUsed[j] = true;
        guessUsed[i] = true;
        break;
      }
    }
  }

  const wrongDigits = secret.length - correctPosition - correctDigitWrongPlace;

  return {
    correctPosition,
    correctDigitWrongPlace,
    wrongDigits,
  };
}
  
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

 if (newWrongAttempts % difficulty.clueEvery === 0 && revealed.length < codeLength - 1) {
    const hidden = Array.from({ length: codeLength }, (_, i) => i)
  .filter(i => !revealed.includes(i));
    const pos = hidden[Math.floor(Math.random() * hidden.length)];
    revealed.push(pos);
  }

  

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

  const clues = generateClues(game.secret_code);
let usedClues = game.used_clues || [];
let selectedClue = "";

if (newWrongAttempts % difficulty.clueEvery === 0) {
  let availableClues = clues.filter(
    clue => !usedClues.includes(clue)
  );

  if (availableClues.length === 0) {
    availableClues = clues;
    usedClues = [];
  }

  selectedClue =
    availableClues[Math.floor(Math.random() * availableClues.length)];

  usedClues = [...usedClues, selectedClue];
}

await supabase
  .from("vault_games")
  .update({
    attempts_left: newAttemptsLeft,
    wrong_attempts: newWrongAttempts,
    revealed_positions: revealed,
    used_clues:
      newWrongAttempts % difficulty.clueEvery === 0
        ? [...usedClues, selectedClue]
        : usedClues
  })
    .eq("id", game.id);
  const status = revealCode(game.secret_code, revealed);
    
  const stats = getMatchStats(game.secret_code, guess);

 const clueText =
  newWrongAttempts % difficulty.clueEvery === 0
    ? `\n📡 Intelligence Report

• ${selectedClue}

Code Status:
${status}\n`
    : `\nCode Status:
${status}\n`;

 return `❌ ACCESS DENIED
${randomFailNarration()}

${username} dropped 💸 ${MISS_COST} coins into the vault drain.

🔍 Vault Scan:
🟩 Correct Position: ${stats.correctPosition}/${codeLength}
🟨 Correct Digit, Wrong Place: ${stats.correctDigitWrongPlace}
⬛ Not In Code: ${stats.wrongDigits}

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
    return `#${i + 1} ${title ? title + " — " : ""}${p.username || "Unknown"}
🏅 ${badges || "No badges yet"}
💰 ${p.coins} Coins
🔓 ${p.wins} Vault Breaches
🔥 Best Streak: ${p.best_streak || 0}`;
  }).join("\n\n");
}
