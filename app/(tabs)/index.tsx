import BasePhoto from '@/components/BasePhoto';
import { CreditBadge } from '@/components/CreditBadge';
import { GenerationsGrid } from '@/components/GenerationsGrid';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { generateImage } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { session, refreshCredits } = useAuth();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const pickProductImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct enum usage
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProductImage(result.assets[0].uri);
      setGeneratedImage(null); // Reset previous result
    }
  };

  const handleGenerate = async () => {
    const basePhotoUri = await AsyncStorage.getItem('base_photo_uri');

    if (!basePhotoUri) {
      Alert.alert('Missing Info', 'Please select a Base Photo first.');
      return;
    }
    if (!productImage) {
      Alert.alert('Missing Info', 'Please select a Product Image (Clothing).');
      return;
    }

    setLoading(true);
    try {
      const response = await generateImage(basePhotoUri, productImage);

      if (response.success && response.imageUrl) {
        setGeneratedImage(response.imageUrl);

        if (response.debug_upload_error) {
          Alert.alert('Upload Failed', `Generated but NOT Saved: ${response.debug_upload_error}`);
        } else {
          Alert.alert('Success!', `URL: ${response.debug_public_url}\nData: ${response.debug_public_data}`);
        }

        // Refresh data
        await refreshCredits();
        setRefreshKey(prev => prev + 1); // Helper to reload grid

      } else {
        Alert.alert('Error', response.error || 'Something went wrong.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>OnLook Mobile</Text>
            <CreditBadge />
          </View>
          <Button title="Sign Out" onPress={handleLogout} color="red" />
        </View>

        {/* 1. Base Photo */}
        <View style={styles.section}>
          <BasePhoto />
        </View>

        <View style={styles.divider} />

        {/* 2. Product Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Pick Clothing</Text>
          <TouchableOpacity onPress={pickProductImage} style={styles.imagePicker}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Tap to select product</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* 3. Action */}
        <View style={styles.section}>
          <Button
            title={loading ? "Generating..." : "Generate Try-On"}
            onPress={handleGenerate}
            disabled={loading || !productImage}
          />
          {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
        </View>

        {/* 4. Result */}
        {generatedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>
            <Image source={{ uri: generatedImage }} style={styles.resultImage} />
          </View>
        )}

        <View style={styles.divider} />

        {/* 5. Past Generations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Closet</Text>
          <GenerationsGrid key={refreshKey} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  imagePicker: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  resultImage: {
    width: 300,
    height: 400,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#eee',
  },
  placeholder: {
    padding: 20,
  },
  placeholderText: {
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
    width: '100%',
  },
});
