import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});
