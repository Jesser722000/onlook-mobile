import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    console.log("📷 RENDER LOGIN SCREEN");
    const [loading, setLoading] = useState(false);

    async function signInWithGoogle() {
        console.log("🟢 Sign in button pressed!");
        setLoading(true);
        const redirectTo = makeRedirectUri();
        console.log("👉 URL:", redirectTo);

        try {
            await Clipboard.setStringAsync(redirectTo); // Auto-copy immediately
        } catch (e) {
            console.warn("Clipboard failed", e);
        }

        Alert.alert(
            "Supabase Log",
            `I've copied this URL to your clipboard:\n\n${redirectTo}\n\nPlease paste it into Supabase Redirect URLs.`,
            [
                {
                    text: "OK, I Pasted It",
                    onPress: async () => {
                        try {
                            const { data, error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo,
                                    skipBrowserRedirect: true,
                                },
                            });

                            if (data?.url) {
                                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
                                console.log("🌍 WebBrowser Result:", result);

                                if (result.type === 'success' && result.url) {
                                    // Manually extract tokens from the URL fragment
                                    // URL looks like: exp://...?access_token=...&refresh_token=...&...
                                    // or sometimes: exp://...#access_token=...

                                    const url = result.url;
                                    // Handle both query params (?) and hash fragments (#)
                                    const paramsString = url.includes('#') ? url.split('#')[1] : url.split('?')[1];

                                    if (paramsString) {
                                        const params = new URLSearchParams(paramsString);
                                        const access_token = params.get('access_token');
                                        const refresh_token = params.get('refresh_token');

                                        console.log("🔑 Extracted Tokens:", { access_token: !!access_token, refresh_token: !!refresh_token });

                                        if (access_token && refresh_token) {
                                            const { error } = await supabase.auth.setSession({
                                                access_token,
                                                refresh_token,
                                            });
                                            if (error) {
                                                console.error("❌ Set Session Error:", error);
                                                Alert.alert("Session Error", error.message);
                                            } else {
                                                console.log("✅ Session Set Successfully!");
                                                // Optional: Trigger a manual check or let AuthProvider listener handle it
                                            }
                                        } else {
                                            console.warn("⚠️ No tokens found in URL");
                                        }
                                    }
                                }
                            }
                            if (error) throw error;
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Login failed');
                        } finally {
                            setLoading(false);
                        }
                    }
                },
                {
                    text: "Copy & Cancel",
                    onPress: async () => {
                        await Clipboard.setStringAsync(redirectTo);
                        setLoading(false);
                    }
                }
            ]
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to OnLook</Text>
            <View style={styles.buttonContainer}>
                <Button
                    title="Sign in with Google"
                    onPress={signInWithGoogle}
                />
                <View style={{ marginTop: 20 }}>
                    <Button
                        title="Debug: Check Session"
                        color="red"
                        onPress={async () => {
                            const { data } = await supabase.auth.getSession();
                            console.log("🛠️ Manual Session Check:", data.session?.user?.email || "No Session");
                            Alert.alert("Session Status", data.session ? `Logged in individually as: ${data.session.user.email}` : "No Session Found");
                        }}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
    },
});
