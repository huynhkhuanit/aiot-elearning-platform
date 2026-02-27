const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expand source extensions for compatibility with Tamagui, Zeego, etc.
if (!config.resolver.sourceExts.includes("cjs")) {
    config.resolver.sourceExts.push("cjs");
}
if (!config.resolver.sourceExts.includes("mjs")) {
    config.resolver.sourceExts.push("mjs");
}

module.exports = config;
