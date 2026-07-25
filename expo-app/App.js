import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { WebView } from 'react-native-webview';

/**
 * Expo demo shell for ZOOX FUTURE SF.
 *
 * The Phaser game stays a Vite/HTML5 app. Expo wraps it in a landscape
 * WebView so you can demo from Expo Go on a phone.
 *
 * Set EXPO_PUBLIC_GAME_URL to your Vite LAN URL, for example:
 *   EXPO_PUBLIC_GAME_URL=http://192.168.1.20:5173
 */
const LIVE_URL = (process.env.EXPO_PUBLIC_GAME_URL || '').trim();

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      } catch (err) {
        console.warn('Orientation lock failed', err);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const source = useMemo(() => {
    if (!LIVE_URL) return null;
    return { uri: LIVE_URL };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#00f0ff" size="large" />
        <Text style={styles.bootText}>Locking landscape…</Text>
      </View>
    );
  }

  if (!source) {
    return (
      <SafeAreaView style={styles.boot}>
        <Text style={styles.title}>ZOOX FUTURE SF</Text>
        <Text style={styles.help}>
          Expo is ready. Point it at the Vite Phaser server to demo.
        </Text>
        <Text style={styles.help}>1. From repo root: npm run dev</Text>
        <Text style={styles.help}>
          2. Copy expo-app/.env.example → expo-app/.env and set your LAN IP
        </Text>
        <Text style={styles.code}>EXPO_PUBLIC_GAME_URL=http://YOUR_LAN_IP:5173</Text>
        <Text style={styles.help}>3. From repo root: npm run expo</Text>
        <Text style={styles.help}>4. Open in Expo Go (phone on same Wi‑Fi)</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ExpoStatusBar hidden />
      <StatusBar hidden />
      <WebView
        source={source}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsLinkPreview={false}
        onError={(event) => {
          setError(event.nativeEvent?.description || 'WebView failed to load');
        }}
        onHttpError={(event) => {
          setError(`HTTP ${event.nativeEvent.statusCode} loading game`);
        }}
      />
      {error ? (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {Platform.OS === 'web' ? (
        <View style={styles.webHint} pointerEvents="none">
          <Text style={styles.webHintText}>Phaser ← {LIVE_URL}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050816',
  },
  webview: {
    flex: 1,
    backgroundColor: '#050816',
  },
  boot: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  bootText: {
    color: '#00f0ff',
    marginTop: 12,
  },
  title: {
    color: '#00f0ff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  help: {
    color: '#d7e7ff',
    textAlign: 'center',
    lineHeight: 22,
  },
  code: {
    color: '#ffd84d',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    marginVertical: 8,
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255, 43, 214, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#050816',
    textAlign: 'center',
    fontWeight: '700',
  },
  webHint: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  webHintText: {
    color: '#9bb4d8',
    fontSize: 12,
  },
});
