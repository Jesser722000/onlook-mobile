import { sharedStyles } from '@/constants/styles';
import { Generation } from '@/constants/types';
import { fetchUserGenerations } from '@/services/api';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 10;
const ITEM_WIDTH = (width - (GAP * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

export const GenerationsGrid = () => {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        const data = await fetchUserGenerations();
        setGenerations(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const renderItem = ({ item }: { item: Generation }) => (
        <View style={[styles.itemContainer, sharedStyles.shadow]}>
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );

    if (!loading && generations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No generations yet. Start creating!</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={generations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
            scrollEnabled={false} // Let the parent scroll
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        padding: GAP,
    },
    columnWrapper: {
        gap: GAP,
    },
    itemContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.5, // Portrait aspect
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#2A2A2A',
        marginBottom: GAP,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
    }
});
