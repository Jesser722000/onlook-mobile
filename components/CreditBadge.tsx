import { useAuth } from '@/context/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const CreditBadge = () => {
    const { credits, loading } = useAuth();

    if (loading) return null;

    return (
        <View style={styles.container}>
            <Ionicons name="sparkles" size={12} color="#FFD700" />
            <Text style={styles.text}>{credits} Credits</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginTop: 8,
    },
    text: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
