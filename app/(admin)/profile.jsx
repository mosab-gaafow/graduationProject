import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import COLORS from "../../constants/color";
import styles from "../styles/admin.profile.styles";

export default function Profile() {
  const { user, logout } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => logout() },
    ]);
  };

  const handleSave = () => {
    if (!email || !phone) {
      return Alert.alert("Error", "Email and phone cannot be empty");
    }

    // Here you'd make an API call to update the user info
    Alert.alert("Success", "Profile updated successfully.");
    setEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>🛡️ {user?.role?.toUpperCase()}</Text>

        {editing ? (
          <>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.inputField}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.inputField}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoGroup}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{email}</Text>
            </View>
            <View style={styles.infoGroup}>
              <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{phone}</Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={editing ? handleSave : () => setEditing(true)}
        >
          <Ionicons
            name={editing ? "save-outline" : "create-outline"}
            size={20}
            color="#fff"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>{editing ? "Save" : "Edit Profile"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
