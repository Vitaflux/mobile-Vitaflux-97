import { View, Text, TextInput, Pressable } from "react-native";

export default function Login() {
  return (
    <View className="flex-1 justify-center bg-surface px-6">
      <Text className="mb-6 text-3xl font-bold text-primary">Vitaflux</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4 rounded-md border border-line px-4 py-3 text-base"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        className="mb-4 rounded-md border border-line px-4 py-3 text-base"
      />

      <Pressable className="items-center rounded-md bg-primary py-3 active:bg-primary-dark">
        <Text className="text-base font-semibold text-white">Masuk</Text>
      </Pressable>
    </View>
  );
}
