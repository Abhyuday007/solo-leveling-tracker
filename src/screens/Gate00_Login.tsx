import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabase';

export default function Gate00_Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign up a new player profile
  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('System Error', error.message);
    } else {
      Alert.alert('Verification Required', 'A secure link has been sent to your email. Verify your identity to breach the gates.');
    }
    setLoading(false);
  }

  // Authenticate existing player
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Authentication Failed', error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.systemVoice}>SYSTEM INITIALIZATION</Text>
        <Text style={styles.title}>PLAYER AUTHENTICATION</Text>
        <Text style={styles.subtitle}>Enter your credentials to synchronize with the Master Database.</Text>

        <TextInput
          style={styles.inputBox}
          placeholder="PLAYER EMAIL"
          placeholderTextColor="#4d4d4d"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputBox}
          placeholder="ACCESS CODE (PASSWORD)"
          placeholderTextColor="#4d4d4d"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={signUpWithEmail} disabled={loading}>
            <Text style={styles.btnSecondaryText}>REGISTER</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.btnPrimary} onPress={signInWithEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnPrimaryText}>SYNCHRONIZE</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
  },
  systemVoice: {
    color: '#aaaaaa',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    letterSpacing: 2,
    marginBottom: 16,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 40,
    letterSpacing: 1,
  },
  inputBox: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    color: '#ffffff',
    padding: 16,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});