import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { styles } from "../../src/view/catalogStyles";
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { supabase } from '../model/supabase';

export const AuthModal = ({ visible, onClose, themeObject, onAuthSuccess }) => {
  const { tLang } = useLanguageSelector();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('email'); 
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setEmail('');
    setOtpCode('');
    setStep('email');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendCode = async () => {
    if (!email.includes('@')) {
        Alert.alert(tLang('common.error'), tLang('auth.invalidEmail'));
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
        Alert.alert(tLang('common.error'), error.message);
    } else {
        setStep('code');
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) {
      Alert.alert(tLang('common.error'), tLang('auth.invalidCode'));
    } else {
      onAuthSuccess(session.user);
      handleClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: themeObject.colors.background }]}>
          
          <Ionicons 
            name={step === 'email' ? "mail-outline" : "key-outline"} 
            size={50} 
            color={themeObject.colors.primary} 
            style={styles.warningIcon} 
          />

          <Text style={[styles.confirmTitle, { color: themeObject.colors.text }]}>
            {step === 'email' ? tLang('auth.loginTitle') : tLang('auth.verifyTitle')}
          </Text>
          
          <Text style={[styles.confirmText, { color: themeObject.colors.secondaryText || "#666666" }]}>
            {step === 'email' 
              ? tLang('auth.emailDescription') 
              : tLang('auth.codeDescription', { email: email.trim() })}
          </Text>

          <View style={{ width: '100%', marginBottom: 20 }}>
            {step === 'email' ? (
              <TextInput
                style={[
                    styles.input,
                    { 
                        color: themeObject.colors.text, 
                        borderBottomWidth: 1, 
                        borderBottomColor: themeObject.colors.primary,
                        padding: 10,
                        fontSize: 16
                    }
                ]}
                placeholder="example@mail.com"
                placeholderTextColor={themeObject.colors.secondaryText || "#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            ) : (
              <TextInput
                style={[
                    styles.input,
                    { 
                        color: themeObject.colors.text, 
                        borderBottomWidth: 1, 
                        borderBottomColor: themeObject.colors.primary,
                        padding: 10,
                        fontSize: 24,
                        textAlign: 'center',
                        letterSpacing: 5
                    }
                ]}
                placeholder="000000"
                placeholderTextColor={themeObject.colors.secondaryText || "#999"}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                textContentType="oneTimeCode" 
                autoFocus={true} 
              />
            )}
          </View>

          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelConfirmButton, { backgroundColor: themeObject.colors.surface, borderColor: themeObject.colors.primary, borderWidth: 1 }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.cancelConfirmText, { color: themeObject.colors.primary }]}>
                {tLang('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton, 
                { backgroundColor: themeObject.colors.primary, marginLeft: 10 }
              ]}
              onPress={step === 'email' ? handleSendCode : handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.deleteConfirmText, { color: '#fff' }]}>
                  {step === 'email' ? tLang('auth.getCode') : tLang('auth.login')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};