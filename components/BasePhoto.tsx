import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function BasePhoto() {
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        loadBasePhoto();
    }, []);

    const loadBasePhoto = async () => {
        try {
            const storedImage = await AsyncStorage.getItem('base_photo_uri');
            if (storedImage) {
                setImage(storedImage);
            }
        } catch (e) {
            console.error('Failed to load base photo', e);
        }
    };

    const saveBasePhoto = async (uri: string) => {
        try {
            await AsyncStorage.setItem('base_photo_uri', uri);
            setImage(uri);
        } catch (e) {
            console.error('Failed to save base photo', e);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        }); // Fixed: Using ImagePicker.MediaTypeOptions.Images

        if (!result.canceled) {
            saveBasePhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled) {
            saveBasePhoto(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Your Base Photo</Text>
            <View style={styles.imageContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>No photo selected</Text>
                    </View>
                )}
            </View>
            <View style={styles.buttonRow}>
                <Button title="Pick from Gallery" onPress={pickImage} />
                <Button title="Take Photo" onPress={takePhoto} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    imageContainer: {
        width: 200,
        height: 266, // 3:4 aspect ratio
        backgroundColor: '#eee',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#888',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
});
