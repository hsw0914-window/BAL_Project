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

export default function RegisterScreen({ navigation }) {
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', name: '', email: '', nickname: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleRegister() {
    setError('');
    const { username, name, email, nickname, password, confirm } = form;
    if (!username || !name || !email || !nickname || !password) { setError('모든 항목을 입력해주세요.'); return; }
    if (username.length < 4) { setError('아이디는 4자 이상이어야 해요.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요.'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않아요.'); return; }
    setLoading(true);
    try {
      await register({ username: username.trim(), name: name.trim(), email: email.trim(), nickname: nickname.trim(), password });
    } catch (e) {
      setError(e?.response?.data?.detail || '회원가입에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'username', label: '아이디', placeholder: '4자 이상', autoCapitalize: 'none' },
    { key: 'name', label: '이름', placeholder: '홍길동' },
    { key: 'email', label: '이메일', placeholder: 'user@email.com', keyboardType: 'email-address', autoCapitalize: 'none' },
    { key: 'nickname', label: '닉네임', placeholder: '앱에서 사용할 이름' },
    { key: 'password', label: '비밀번호', placeholder: '6자 이상', secure: true },
    { key: 'confirm', label: '비밀번호 확인', placeholder: '다시 입력', secure: true },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <BrandLogo size={48} />
            <Text style={styles.brand}>회원가입</Text>
          </View>

          <View style={styles.form}>
            {fields.map((f) => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={(v) => update(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.inkMute}
                  secureTextEntry={f.secure}
                  autoCapitalize={f.autoCapitalize}
                  keyboardType={f.keyboardType}
                  autoCorrect={false}
                />
              </View>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.5 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.forestInk} size="small" />
                : <Text style={styles.btnText}>가입하기</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkWrap}
            hitSlop={12}
          >
            <Text style={styles.link}>이미 계정이 있으신가요? <Text style={styles.linkBold}>로그인</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 20 },
  brand: {
    fontSize: 20, fontWeight: '700', fontStyle: 'italic',
    fontFamily: SERIF, color: C.ink, marginTop: 12,
  },

  form: { marginBottom: 24 },
  label: {
    fontSize: 11, color: C.inkSoft, fontWeight: '800',
    letterSpacing: 0.4, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
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
