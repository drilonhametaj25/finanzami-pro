import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setLocalError('Inserisci il tuo nome');
      return false;
    }
    if (!email.trim()) {
      setLocalError('Inserisci la tua email');
      return false;
    }
    if (!email.includes('@')) {
      setLocalError('Email non valida');
      return false;
    }
    if (!password) {
      setLocalError('Inserisci una password');
      return false;
    }
    if (password.length < 6) {
      setLocalError('La password deve essere di almeno 6 caratteri');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Le password non corrispondono');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    clearError();
    setLocalError(null);

    if (!validateForm()) return;

    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());

    if (!signUpError) {
      setSuccess(true);
    }
  };

  const displayError = localError || error;

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.successGradient}
        >
          <SafeAreaView style={styles.successSafeArea}>
            <View style={styles.successContent}>
              <View style={styles.successIconContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={80}
                  color="#FFFFFF"
                />
              </View>
              <Text variant="headlineMedium" style={styles.successTitle}>
                Registrazione completata!
              </Text>
              <Text variant="bodyLarge" style={styles.successText}>
                Controlla la tua email per confermare l'account, poi potrai accedere.
              </Text>

              <View style={styles.successButtonContainer}>
                <Button
                  mode="contained"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.successButton}
                  contentStyle={styles.buttonContent}
                  buttonColor="#FFFFFF"
                  textColor={brandColors.primary}
                >
                  Vai al login
                </Button>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name="account-plus"
                size={36}
                color="#FFFFFF"
              />
            </View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Crea il tuo account
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Inizia a gestire il tuo budget oggi stesso
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
          {/* Register Form */}
          <View style={styles.form}>
            <TextInput
              label="Nome completo"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setLocalError(null);
              }}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

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
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            <TextInput
              label="Conferma password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setLocalError(null);
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-check-outline" />}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            {displayError && (
              <HelperText type="error" visible={!!displayError} style={styles.errorText}>
                {displayError}
              </HelperText>
            )}

            {/* Gradient Register Button */}
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Button
                  mode="text"
                  onPress={handleRegister}
                  loading={isLoading}
                  disabled={isLoading}
                  textColor="#FFFFFF"
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Registrati
                </Button>
              </LinearGradient>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="bodySmall" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
              oppure
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Hai gia un account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Button mode="text" textColor={brandColors.primary} labelStyle={styles.loginLabel}>
                Accedi
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
    paddingTop: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
  loginLabel: {
    fontWeight: '600',
  },
  // Success screen styles
  successGradient: {
    flex: 1,
  },
  successSafeArea: {
    flex: 1,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  successText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  successButtonContainer: {
    width: '100%',
  },
  successButton: {
    borderRadius: borderRadius.lg,
  },
});
