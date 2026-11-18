import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Ionicons from './Icon';

export default function InstallPromptBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const ua = window.navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone =
      window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

    if (isIOS && !isStandalone) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Install as iPhone App</Text>
        <Text style={styles.subtitle}>
          Tap Share (↑) below → "Add to Home Screen" for full-screen app!
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setVisible(false)}
        style={styles.closeBtn}
        accessibilityLabel="Dismiss install tip"
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: '#6B52E8',
    borderTopWidth: 1.5,
    borderBottomWidth: 3.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomColor: '#4A32C2',
    gap: 10,
    shadowColor: '#4A32C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textWrap: {
    flex: 1
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1
  },
  closeBtn: {
    padding: 4
  }
});
