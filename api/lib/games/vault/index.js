import { supabase } from "../../supabase.js";
import { VAULT_CONFIG } from "./config.js";
import { randomCode, revealCode, unlockRandomPosition } from "./code.js";
import {
  getStreakPercent,
  getWinBadge,
  getCoinBadge,
  getSpecialBadges,
} from "./badges.js";
import {
  formatVaultStart,
  formatAlreadyActive,
  formatWrongGuess,
  formatVaultWin,
  formatVaultLost,
  formatLeaderboard,
} from "./format.js";

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
      coins: VAULT_CONFIG.INITIAL_COINS,
    })
    .select("*")
    .single();

  return created;
}

export async function startVault(chatId) {
  const { data: existing } = await supabase
    .from("vault_games")
    .select("*")
    .eq("chat_id", String(chatId))
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return formatAlreadyActive();
  }

  await supabase.from("vault_games").insert({
    chat_id: String(chatId),
    secret_code: randomCode(),
    attempts_left: VAULT_CONFIG.MAX_ATTEMPTS,
    wrong_attempts: 0,
    revealed_positions: [],
    is_active: true,
  });

  return formatVaultStart();
}

export async function handleVaultGuess(chatId, userId, username, guess) {
  const { data: game } = await supabase
    .from("vault_games")
    .select("*")
    .eq("chat_id", String(chatId))
    .eq("is_active", true)
    .maybeSingle();

  if (!game) return null;
  if (!/^\d{6}$/.test(guess)) return null;

  const player = await getOrCreatePlayer(userId, username);

  if (guess === game.secret_code) {
    const attemptsUsed = VAULT_CONFIG.MAX_ATTEMPTS - game.attempts_left + 1;
    const newStreak = (player.current_streak || 0) + 1;
    const bestStreak = Math.max(player.best_streak || 0, newStreak);

    const streakPercent = getStreakPercent(newStreak);
    const streakCoins = Math.floor(
      (VAULT_CONFIG.BASE_REWARD * streakPercent) / 100
    );

    const totalEarned = VAULT_CONFIG.BASE_REWARD + streakCoins;
    const newCoins = (player.coins || 0) + totalEarned;
    const newWins = (player.wins || 0) + 1;

    await supabase
      .from("vault_players")
      .update({
        username,
        coins: newCoins,
        wins: newWins,
        current_streak: newStreak,
        best_streak: bestStreak,
      })
      .eq("user_id", userId);

    await supabase
      .from("vault_games")
      .update({ is_active: false })
      .eq("id", game.id);

    const badges = [
      getWinBadge(newWins),
      getCoinBadge(newCoins),
      ...getSpecialBadges(attemptsUsed),
    ].filter(Boolean);

    return formatVaultWin({
      username,
      code: game.secret_code,
      streakCoins,
      streakPercent,
      totalEarned,
      streak: newStreak,
      coins: newCoins,
      badges,
    });
  }

  const newAttemptsLeft = game.attempts_left - 1;
  const newWrongAttempts = game.wrong_attempts + 1;
  const newCoins = Math.max(0, (player.coins || 0) - VAULT_CONFIG.MISS_COST);

  await supabase
    .from("vault_players")
    .update({
      username,
      coins: newCoins,
      current_streak: 0,
    })
    .eq("user_id", userId);

  let revealed = game.revealed_positions || [];
  const clueUnlocked =
    newWrongAttempts % 5 === 0 &&
    revealed.length < VAULT_CONFIG.CODE_LENGTH - 1;

  if (clueUnlocked) {
    revealed = unlockRandomPosition(game.secret_code, revealed);
  }

  await supabase
    .from("vault_games")
    .update({
      attempts_left: newAttemptsLeft,
      wrong_attempts: newWrongAttempts,
      revealed_positions: revealed,
    })
    .eq("id", game.id);

  if (newAttemptsLeft <= 0) {
    await supabase
      .from("vault_games")
      .update({ is_active: false })
      .eq("id", game.id);

    return formatVaultLost(game.secret_code);
  }

  return formatWrongGuess({
    username,
    attemptsLeft: newAttemptsLeft,
    coins: newCoins,
    status: revealCode(game.secret_code, revealed),
    clueUnlocked,
  });
}

export async function vaultLeaderboard() {
  const { data } = await supabase
    .from("vault_players")
    .select("*")
    .order("coins", { ascending: false })
    .limit(10);

  const players =
    data?.map((p) => ({
      ...p,
      badges: [getWinBadge(p.wins), getCoinBadge(p.coins)],
    })) || [];

  return formatLeaderboard(players);
}
