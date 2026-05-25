import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useAuth } from '../AuthContext';
import BrandLogo from '../components/BrandLogo';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export default function LoginScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!username.trim() || !password) { setError('아이디와 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError(e?.response?.data?.detail || '로그인에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <BrandLogo size={64} />
            <Text style={styles.brand}>BabyAutoLog</Text>
            <Text style={styles.tagline}>우리 아기 기록, 한 장으로 끝.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={C.inkMute}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={C.inkMute}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.forestInk} size="small" />
                : <Text style={styles.btnText}>로그인</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkWrap}
            hitSlop={12}
          >
            <Text style={styles.link}>계정이 없으신가요? <Text style={styles.linkBold}>회원가입</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  brand: {
    fontSize: 26, fontWeight: '700', fontStyle: 'italic',
    fontFamily: SERIF, color: C.ink, marginTop: 16,
  },
  tagline: { fontSize: 13, color: C.inkSoft, fontWeight: '500', marginTop: 6 },

  form: { marginBottom: 24 },
  label: {
    fontSize: 11, color: C.inkSoft, fontWeight: '800',
    letterSpacing: 0.4, marginBottom: 6, marginTop: 16,
  },
  input: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, color: C.ink,
  },
  error: { fontSize: 12, color: C.roseInk, marginTop: 10, fontWeight: '600' },
  btn: {
    backgroundColor: C.forest, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  btnText: { color: C.forestInk, fontWeight: '800', fontSize: 15 },

  linkWrap: { alignItems: 'center' },
  link: { fontSize: 13, color: C.inkSoft },
  linkBold: { fontWeight: '800', color: C.ink },
});
