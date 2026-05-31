import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../supabase';

export default function Gate00_Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- SUPABASE AUTHENTICATION ---
// --- SUPABASE AUTHENTICATION ---
  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("System Error", "Credentials required.");
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setIsLoading(false);
      return Alert.alert("Access Denied", authError.message);
    }

    if (authData.user) {
      // 1. Check if the Vault already has a profile for this user
      const { data: campaignData, error: campaignError } = await supabase
        .from('user_campaigns')
        .select('id')
        .eq('user_id', authData.user.id)
        .limit(1);

      setIsLoading(false);

      // 2. Route intelligently
      if (campaignData && campaignData.length > 0) {
        console.log("[System] Returning player detected. Bypassing Awakening.");
        navigation.replace('MainTabs');
      } else {
        console.log("[System] New player detected. Initiating Awakening Protocol.");
        navigation.replace('Gate00_Awakening');
      }
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("System Error", "Credentials required.");
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    setIsLoading(false);
    
    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      Alert.alert("Identity Forged", "Check your email for the verification link (if required by your Supabase settings), or proceed to Login.");
      // Auto-route if Supabase allows auto-login on signup
      if (data.session) navigation.replace('Gate00_Awakening');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Background Ambience */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.gridOverlay} />
      </View>

      <View style={styles.content}>
        
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.headerBlock}
        >
          <Text style={styles.systemSub}>SYSTEM INITIALIZATION</Text>
          <Text style={styles.systemTitle}>USER AUTHENTICATION</Text>
          <Text style={styles.systemLore}>Lock your identity into the Vault to synchronize your psychological profile.</Text>
        </MotiView>

        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 300 }}
          style={styles.formContainer}
        >
          <Text style={styles.inputLabel}>PLAYER IDENTIFIER (EMAIL)</Text>
          <TextInput 
            style={styles.input}
            placeholder="hunter@guild.com"
            placeholderTextColor="#333"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>SECURITY KEY (PASSWORD)</Text>
          <TextInput 
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#333"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {isLoading ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
                <Text style={styles.primaryBtnText}>BREACH PROTOCOL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleSignUp}>
                <Text style={styles.secondaryBtnText}>FORGE IDENTITY</Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020202' },
  gridOverlay: { flex: 1, opacity: 0.05 }, // Removed the invalid backgroundImage property
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  
  headerBlock: { marginBottom: 50 },
  systemSub: { color: '#666', fontSize: 10, letterSpacing: 4, marginBottom: 8 },
  systemTitle: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  systemLore: { color: '#555', fontSize: 12, lineHeight: 20 },

  formContainer: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1a1a1a', padding: 24, borderRadius: 4 },
  
  inputLabel: { color: '#666', fontSize: 9, letterSpacing: 3, marginBottom: 8 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: '#222', color: '#fff', fontSize: 14, padding: 16, marginBottom: 24, borderRadius: 2 },
  
  actionRow: { marginTop: 10, gap: 16 },
  primaryBtn: { backgroundColor: '#ffffff', paddingVertical: 18, alignItems: 'center', borderRadius: 2 },
  primaryBtnText: { color: '#000000', fontSize: 12, fontWeight: 'bold', letterSpacing: 3 },
  
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingVertical: 18, alignItems: 'center', borderRadius: 2 },
  secondaryBtnText: { color: '#aaaaaa', fontSize: 11, letterSpacing: 2 }
});