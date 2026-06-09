// src/utils/sounds.js
export const playSound = (type, enabled = true) => {
  if (!enabled) return;
  console.log(`Play sound: ${type}`);
};
