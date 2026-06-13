export function revealCode(secret, positions = []) {
  return secret
    .split("")
    .map((digit, index) => positions.includes(index) ? digit : "_")
    .join(" ");
}

export function getRandomHiddenPosition(revealed = []) {
  const hidden = [0, 1, 2, 3, 4, 5].filter(i => !revealed.includes(i));
  if (!hidden.length) return null;
  return hidden[Math.floor(Math.random() * hidden.length)];
}
