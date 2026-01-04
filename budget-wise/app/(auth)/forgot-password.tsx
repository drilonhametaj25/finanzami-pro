import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Inserisci la tua email');
      return false;
    }
    if (!email.includes('@')) {
      setLocalError('Email non valida');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    clearError();
    setLocalError(null);

    if (!validateForm()) return;

    const { error: resetError } = await resetPassword(email.trim());

    if (!resetError) {
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
                  name="email-check"
                  size={72}
                  color="#FFFFFF"
                />
              </View>
              <Text variant="headlineMedium" style={styles.successTitle}>
                Email inviata!
              </Text>
              <Text variant="bodyLarge" style={styles.successText}>
                Controlla la tua casella di posta per il link di reset della password.
              </Text>

              <View style={styles.successButtonContainer}>
                <Button
                  mode="contained"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.successButton}
                  contentStyle={styles.buttonContent}
                  buttonColor="#FFFFFF"
                  textColor={brandColors.primary}
                  icon="arrow-left"
                >
                  Torna al login
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
                name="lock-reset"
                size={40}
                color="#FFFFFF"
              />
            </View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Recupera password
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Ti invieremo un link per reimpostare la password
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
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
              Inserisci l'email associata al tuo account per ricevere le istruzioni di reset.
            </Text>
          </View>

          {/* Form */}
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
              error={!!displayError}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            {displayError && (
              <HelperText type="error" visible={!!displayError} style={styles.errorText}>
                {displayError}
              </HelperText>
            )}

            {/* Gradient Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleResetPassword}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.gradientButtonPressable,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                ]}
              >
                <LinearGradient
                  colors={isLoading ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <Text variant="titleMedium" style={styles.buttonText}>
                      Invio in corso...
                    </Text>
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="email-fast-outline"
                        size={20}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                      />
                      <Text variant="titleMedium" style={styles.buttonText}>
                        Invia link di reset
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Back to Login */}
          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <Button
                mode="text"
                icon="arrow-left"
                textColor={brandColors.primary}
                labelStyle={styles.backButtonLabel}
              >
                Torna al login
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
    paddingBottom: 50,
  },
  headerSafeArea: {
    paddingTop: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
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
    height: 35,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    right: -50,
    height: 70,
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
  },
  formSection: {
    flex: 1,
    marginTop: -25,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  },
  gradientButtonPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backButtonLabel: {
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
