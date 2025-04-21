import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import styles from "../styles/create.styles";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Trip() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [typeOpen, setTypeOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [vehciles, setVehciles] = useState([]);
  const [userOpen, setUserOpen] = useState(false);
  const [type, setType] = useState(null);


  const tripStatus = [
    { label: "Pending", value: "PENDING" },
    { label: "OnGoing", value: "ONGOING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const fetchVehciles = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const options = data.map(car => ({
        label: `${car.model} (${car.type})`,
        value: car.id
      }));
      setVehciles(options);
    } catch (e) {
      console.error("Failed to fetch vehciles:", e.message);
    }
  };

  useEffect(() => {
    fetchVehciles();
  }, []);


  const handleSubmit = async () => {
    if (!origin || !destination || !date || !time || !price || !totalSeats) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/trips/registerTrip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
          date,
          time,
          price,
          totalSeats,
          status: "PENDING",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong!");

      Alert.alert("Success", "Trip created successfully");
      router.push("/(owner)/trip");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <DropDownPicker
        open={userOpen}
        value={userId}
        items={vehciles}
        setOpen={setUserOpen}
        setValue={setUserId}
        placeholder="Select Vehicle"
        style={{ borderColor: COLORS.border, marginHorizontal: 20, marginTop: 16 }}
        dropDownContainerStyle={{ borderColor: COLORS.border, marginHorizontal: 20 }}
        zIndex={3000}
        zIndexInverse={1000}
      />
      <DropDownPicker
        open={typeOpen}
        value={type}
        items={tripStatus}
        setOpen={setTypeOpen}
        setValue={setType}
        placeholder="Select Trip status"
        style={{ borderColor: COLORS.border, marginHorizontal: 20, marginTop: 16 }}
        dropDownContainerStyle={{ borderColor: COLORS.border, marginHorizontal: 20 }}
        zIndex={2000}
        zIndexInverse={2000}
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Trip</Text>
            <Text style={styles.subtitle}>Enter details for your upcoming journey</Text>
          </View>
  
          <View style={styles.form}>
            {/* Origin */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Origin *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="navigate-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mogadishu"
                  placeholderTextColor={COLORS.placeholderText}
                  value={origin}
                  onChangeText={setOrigin}
                />
              </View>
            </View>
  
            {/* Destination */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Destination *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Baidoa"
                  placeholderTextColor={COLORS.placeholderText}
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>
            </View>
  
            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.input}>{date || "Tap to select date"}</Text>
              </TouchableOpacity>
  
              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate.toISOString().split("T")[0]);
                  }}
                />
              )}
            </View>
  
            {/* Time */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.input}>{time || "Tap to select time"}</Text>
              </TouchableOpacity>
  
              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      const hours = selectedTime.getHours().toString().padStart(2, "0");
                      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
                      setTime(`${hours}:${minutes}`);
                    }
                  }}
                />
              )}
            </View>
  
            {/* Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price (USD) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.placeholderText}
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>
  
            {/* Total Seats */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Seats *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.placeholderText}
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                />
              </View>
            </View>
  
            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Create Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  
}