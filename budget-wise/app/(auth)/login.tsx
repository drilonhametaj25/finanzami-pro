import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Inserisci la tua email');
      return false;
    }
    if (!email.includes('@')) {
      setLocalError('Email non valida');
      return false;
    }
    if (!password) {
      setLocalError('Inserisci la password');
      return false;
    }
    if (password.length < 6) {
      setLocalError('La password deve essere di almeno 6 caratteri');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    clearError();
    setLocalError(null);

    if (!validateForm()) return;

    const { error: signInError } = await signIn(email.trim(), password);

    if (!signInError) {
      router.replace('/(tabs)');
    }
  };

  const displayError = localError || error;

  return (
    <View style={styles.container}>
      {/* Gradient Header Background */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="wallet"
                size={40}
                color="#FFFFFF"
              />
            </View>
            <Text variant="headlineMedium" style={styles.brandTitle}>
              FinanzaMi.pro
            </Text>
            <Text variant="bodyMedium" style={styles.brandSubtitle}>
              La tua finanza personale, semplificata
            </Text>
          </View>
        </SafeAreaView>

        {/* Curved bottom edge */}
        <View style={styles.curveContainer}>
          <View style={[styles.curve, { backgroundColor: theme.colors.background }]} />
        </View>
      </LinearGradient>

      {/* Form Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.formSection, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text variant="headlineSmall" style={[styles.welcomeTitle, { color: theme.colors.onSurface }]}>
              Bentornato!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Accedi per continuare a gestire le tue finanze
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError(null);
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email-outline" />}
              error={!!displayError && !email}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError(null);
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!displayError && !password}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            {displayError && (
              <HelperText type="error" visible={!!displayError} style={styles.errorText}>
                {displayError}
              </HelperText>
            )}

            {/* Gradient Login Button */}
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Button
                  mode="text"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  textColor="#FFFFFF"
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Accedi
                </Button>
              </LinearGradient>
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <Button mode="text" style={styles.forgotPassword} textColor={brandColors.primary}>
                Password dimenticata?
              </Button>
            </Link>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
              oppure
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Non hai un account?
            </Text>
            <Link href="/(auth)/register" asChild>
              <Button mode="text" textColor={brandColors.primary} labelStyle={styles.registerLabel}>
                Registrati ora
              </Button>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    paddingBottom: 40,
  },
  headerSafeArea: {
    paddingTop: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  curveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    right: -50,
    height: 60,
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
  },
  formSection: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  errorText: {
    marginTop: -spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    borderRadius: borderRadius.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLabel: {
    fontWeight: '600',
  },
});
