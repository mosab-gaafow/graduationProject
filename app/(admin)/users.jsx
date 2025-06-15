import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    ScrollView,
    Modal,
    TouchableOpacity,
  } from "react-native";
  import React, { useEffect, useState } from "react";
  import { useAuthStore } from "../../store/authStore";
  import COLORS from "../../constants/color";
  import { Ionicons } from "@expo/vector-icons";
  import styles from "../styles/home.styles";
  import { API_URL } from "../../constants/api";
  
  export default function UsersScreen() {
    const { token } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
  
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
  
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/getAllUsers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch users");
  
        setUsers(data);
      } catch (err) {
        console.error("User fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchUsers();
    }, []);
  
    const handleShowUser = (user) => {
      setSelectedUser(user);
      setModalVisible(true);
    };
  
    const renderUserItem = ({ item, index }) => (
      <View style={tableRowStyle}>
        <Text style={[cellStyle, { flex: 1 }]}>{index + 1}</Text>
        <Text style={[cellStyle, { flex: 3 }]}>{item.name}</Text>
        <Text style={[cellStyle, { flex: 3 }]}>{item.email}</Text>
        <Text
          style={[
            cellStyle,
            { flex: 2, textTransform: "capitalize", color: COLORS.primary },
          ]}
        >
          {item.role}
        </Text>
  
        <TouchableOpacity onPress={() => handleShowUser(item)} style={{ flex: 0.5, alignItems: 'center' }}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  
    const renderUserModal = () => (
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={modalBackdrop}>
          <View style={modalContent}>
            <Text style={modalTitle}>👤 User Details</Text>
            <View style={modalItem}>
              <Text style={modalLabel}>Name:</Text>
              <Text style={modalValue}>{selectedUser?.name}</Text>
            </View>
            <View style={modalItem}>
              <Text style={modalLabel}>Email:</Text>
              <Text style={modalValue}>{selectedUser?.email}</Text>
            </View>
            <View style={modalItem}>
              <Text style={modalLabel}>Phone:</Text>
              <Text style={modalValue}>{selectedUser?.phone || "N/A"}</Text>
            </View>
            <View style={modalItem}>
              <Text style={modalLabel}>Role:</Text>
              <Text style={[modalValue, { textTransform: "capitalize" }]}>
                {selectedUser?.role}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={modalCloseBtn}
            >
              <Text style={modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
  
    return (
        <View style={[styles.container, { paddingBottom: 100, backgroundColor: COLORS.background }]}>
          <Text
            style={[styles.bookTitle, { fontSize: 22, marginBottom: 16 }]}
          >
            👥 All Users
          </Text>
  
          {/* Table Header */}
          <View style={tableHeaderStyle}>
            <Text style={[cellStyle, { flex: 1, fontWeight: "700" }]}>#</Text>
            <Text style={[cellStyle, { flex: 3, fontWeight: "700" }]}>Name</Text>
            <Text style={[cellStyle, { flex: 3, fontWeight: "700" }]}>Email</Text>
            <Text style={[cellStyle, { flex: 2, fontWeight: "700" }]}>Role</Text>
            <Text style={[cellStyle, { flex: 0.5 }]}></Text>
          </View>
  
          {/* User Rows */}
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
          />
  
          {/* Modal */}
          {renderUserModal()}
        </View>
    );
  }
  
  // 📦 STYLES
  const tableHeaderStyle = {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  };
  
  const tableRowStyle = {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: "center",
  };
  
  const cellStyle = {
    fontSize: 14,
    color: COLORS.textPrimary,
  };
  
  // Modal styles
  const modalBackdrop = {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  };
  
  const modalContent = {
    backgroundColor: COLORS.cardBackground,
    width: "85%",
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  };
  
  const modalTitle = {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
    // textAlign: "center",
  };
  
  const modalItem = {
    marginBottom: 12,
  };
  
  const modalLabel = {
    fontSize: 13,
    color: COLORS.textSecondary,
  };
  
  const modalValue = {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  };
  
  const modalCloseBtn = {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  };
  
  const modalCloseText = {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  };
  