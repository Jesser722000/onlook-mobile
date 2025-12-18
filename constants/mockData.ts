export type Product = {
    id: string;
    name: string;
    store: string;
    imageUrl: string;
    price: string;
};

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Vintage Denim Jacket',
        store: 'Urban Outfitters',
        imageUrl: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1000&auto=format&fit=crop',
        price: '$79.00'
    },
    {
        id: '2',
        name: 'Summer Floral Dress',
        store: 'Zara',
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop',
        price: '$49.90'
    },
    {
        id: '3',
        name: 'Oversized Hoodie',
        store: 'H&M',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
        price: '$34.99'
    },
    {
        id: '4',
        name: 'Classic White Tee',
        store: 'Uniqlo',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
        price: '$14.90'
    }
];
