import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Users,
  CirclePlus,
  Building2,
} from "lucide-react-native";

export default function FacilityLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#EC3013",
        tabBarInactiveTintColor: "#605D5D",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D7D3D3",
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },

        tabBarLabelStyle: {
          fontFamily: "Archivo_600SemiBold",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="applicants"
        options={{
          title: "Pendaftar",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Buat",
          tabBarIcon: ({ color, size }) => (
            <CirclePlus color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="faskes"
        options={{
          title: "Faskes",
          tabBarIcon: ({ color, size }) => (
            <Building2 color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
