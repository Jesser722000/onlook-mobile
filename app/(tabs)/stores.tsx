import { MOCK_PRODUCTS, Product } from '@/constants/mockData';
import { generateImage } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StoresScreen() {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [generatedMap, setGeneratedMap] = useState<Record<string, string>>({});

    const handleTryOn = async (product: Product) => {
        const basePhotoUri = await AsyncStorage.getItem('base_photo_uri');
        if (!basePhotoUri) {
            Alert.alert('No Base Photo', 'Go to the Home tab and set your base photo first.');
            return;
        }

        setLoadingMap(prev => ({ ...prev, [product.id]: true }));
        try {
            // Download remote image to cache for API (API expects URI or Base64 handled by service)
            // But our service `api.ts` expects an Expo FileSystem URI to convert to Base64.
            // We need to download the product image first if it's external URL.

            const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
            if (!cacheDir) throw new Error('No storage directory available');

            const fileUri = cacheDir + `product_${product.id}.jpg`;
            await FileSystem.downloadAsync(product.imageUrl, fileUri);

            const response = await generateImage(basePhotoUri, fileUri);

            if (response.success && response.imageUrl) {
                setGeneratedMap(prev => ({ ...prev, [product.id]: response.imageUrl! }));
                Alert.alert('Success', 'Try-on complete! See result on the card.');
            } else {
                Alert.alert('Failed', response.error || 'Generation failed');
            }

        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoadingMap(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isLoading = loadingMap[item.id];
        const resultImage = generatedMap[item.id];

        return (
            <View style={styles.card}>
                <Image source={{ uri: resultImage || item.imageUrl }} style={styles.image} />
                <View style={styles.info}>
                    <Text style={styles.storeName}>{item.store}</Text>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.price}>{item.price}</Text>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={() => handleTryOn(item)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>{resultImage ? "Try Again" : "Try On"}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Shop & Try On</Text>
            <FlatList
                data={MOCK_PRODUCTS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
    },
    list: {
        padding: 10,
    },
    card: {
        flex: 1,
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    info: {
        padding: 12,
    },
    storeName: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    price: {
        fontSize: 14,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A0C4FF',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
