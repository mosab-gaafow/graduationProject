import {
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import styles from '../styles/profile.styles';
import ProfileHeader from '../components/ProfileHeader';
import LogoutButton from '../components/LogoutButton';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/color';
import Loader from '../components/Loader';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Profile() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/myBookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      // console.log('📦 Booking response text:', text);

      const data = JSON.parse(text);
      if (!response.ok) throw new Error(data.message || 'Failed to fetch bookings');

      setBookings(data);
    } catch (e) {
      console.error('Error fetching bookings', e.message);
      Alert.alert('Error', 'There was a problem fetching your bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'green';
      case 'CANCELED':
        return 'red';
      default:
        return COLORS.primary;
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>
          {item.trip.origin} → {item.trip.destination}
        </Text>
        <Text style={styles.bookCaption}>
          {item.seatsBooked} seat(s) • {new Date(item.trip.date).toLocaleDateString()} at {item.trip.time}
        </Text>
        <Text style={styles.bookDate}>Booked on: {new Date(item.bookingTime).toLocaleDateString()}</Text>
        <Text
          style={{
            color: getStatusColor(item.status),
            fontWeight: '600',
            marginTop: 4,
          }}
        >
          Status: {item.status}
        </Text>
      </View>
    </View>
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />

      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Your Booked Trips</Text>
        <Text style={styles.booksCount}>{bookings.length} trips</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/')}>
              <Text style={styles.addButtonText}>Find Trips</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
