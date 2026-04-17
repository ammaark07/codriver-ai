import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Drive', tabBarIcon: () => null }} // Add icon later if you want
      />
      <Tabs.Screen
        name="memory"
        options={{ title: 'Memory', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}