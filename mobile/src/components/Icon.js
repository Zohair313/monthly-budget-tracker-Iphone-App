import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Comprehensive glyph fallback map in case vector font is pending or offline
const FALLBACK_GLYPHS = {
  // Navigation & Tabs
  'home': '🏠',
  'home-outline': '🏠',
  'grid': '▦',
  'grid-outline': '▦',
  'bar-chart': '📊',
  'bar-chart-outline': '📊',
  'pie-chart': '🥧',
  'pie-chart-outline': '🥧',
  'settings': '⚙',
  'settings-outline': '⚙',
  'document-text': '📄',
  'document-text-outline': '📄',
  
  // Controls & Chevrons
  'chevron-back': '‹',
  'chevron-forward': '›',
  'chevron-down': '⌄',
  'chevron-up': '⌃',
  'close': '✕',
  'close-circle': '✕',
  
  // Actions
  'add': '+',
  'add-circle': '+',
  'add-circle-outline': '+',
  'pencil': '✎',
  'pencil-sharp': '✎',
  'trash-outline': '🗑',
  'checkmark': '✓',
  'checkmark-circle': '✓',
  'search': '🔍',
  'search-outline': '🔍',
  
  // Finance & Badges
  'wallet': '💳',
  'wallet-outline': '💳',
  'receipt': '🧾',
  'receipt-outline': '🧾',
  'arrow-down-circle': '↓',
  'arrow-down-circle-outline': '↓',
  'arrow-up-circle': '↑',
  'arrow-up-circle-outline': '↑',
  'trending-up': '↗',
  'trending-down': '↘',
  'pricetag': '🏷',
  'pricetag-outline': '🏷',
  
  // Theme & Status
  'sunny': '☀',
  'sunny-outline': '☀',
  'moon': '☾',
  'moon-outline': '☾',
  'warning': '⚠',
  'alert-circle': '⚠',
  'alert-circle-outline': '⚠',
  'information-circle': 'ⓘ',
  'information-circle-outline': 'ⓘ',
  'cloud-offline-outline': '⚡',
  
  // Categories
  'fast-food': '🍕',
  'fast-food-outline': '🍕',
  'restaurant': '🍲',
  'restaurant-outline': '🍲',
  'car-sport': '🚗',
  'car-outline': '🚗',
  'flash': '⚡',
  'flash-outline': '⚡',
  'bag-handle': '🛍',
  'bag-handle-outline': '🛍',
  'game-controller': '🎮',
  'film-outline': '🎬',
  'medkit': '🩺',
  'medkit-outline': '🩺',
  'cube': '📦',
  'cube-outline': '📦'
};

export default function Icon({ name, size = 18, color = '#FFFFFF', style }) {
  // 1. Try rendering with native @expo/vector-icons Ionicons
  try {
    return <Ionicons name={name} size={size} color={color} style={style} />;
  } catch (err) {
    // 2. Guaranteed fallback with beautiful Unicode/emoji glyphs (Never a blank dot)
    const glyph = FALLBACK_GLYPHS[name] || '✦';
    return (
      <View style={[styles.wrap, { width: size, height: size }, style]}>
        <Text style={[styles.glyph, { fontSize: size * 0.85, color, lineHeight: size }]}>
          {glyph}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  glyph: {
    textAlign: 'center'
  }
});
