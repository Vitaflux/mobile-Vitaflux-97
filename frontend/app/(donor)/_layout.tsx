import { Tabs } from "expo-router";
import { Home, Activity, History, UserRound } from "lucide-react-native";

const PRIMARY = "#EC3013";
const INACTIVE = "#605D5D";
const SURFACE = "#FFFFFF";
const LINE = "#D7D3D3";

export default function DonorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,

        tabBarStyle: {
          backgroundColor: SURFACE,
          borderTopColor: LINE,
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
          title: "Beranda",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="riwayat"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />

      {/* Route push, bukan tab */}
      <Tabs.Screen
        name="detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="screening"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
