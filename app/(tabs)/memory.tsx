

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { MemoryStore } from '../memory_schema';

export default function MemoryTab() {
  const [memory, setMemory] = useState<MemoryStore | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadMemory = async () => {
      try {
        const raw = await AsyncStorage.getItem('user_memory');
        if (raw) {
          const parsed: MemoryStore = JSON.parse(raw);
          setMemory(parsed);
        } else {
          setMemory(null);
        }
      } catch (e) {
        console.error('Failed to load memory:', e);
        setMemory(null);
      }
    };
    loadMemory();
  }, [refreshKey]);

  const handleClearMemory = async () => {
    await AsyncStorage.removeItem('user_memory');
    setMemory(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧠 User Memory</Text>
      <Button title="🔄 Refresh Memory" onPress={() => setRefreshKey(k => k + 1)} />
      <Button title="🧹 Clear Memory" color="red" onPress={handleClearMemory} />

      {memory ? (
        <>
          <Text style={styles.categoryTitle}>📍 Places</Text>
          {memory.places.length > 0 ? memory.places.map((entry, idx) => (
            <Text key={idx} style={styles.entry}>{JSON.stringify(entry)}</Text>
          )) : <Text style={styles.empty}>None</Text>}

          <Text style={styles.categoryTitle}>⚙️ Preferences</Text>
          {memory.preferences.length > 0 ? memory.preferences.map((entry, idx) => (
            <Text key={idx} style={styles.entry}>{JSON.stringify(entry)}</Text>
          )) : <Text style={styles.empty}>None</Text>}

          <Text style={styles.categoryTitle}>😀 People</Text>
          {memory.people.length > 0 ? memory.people.map((entry, idx) => (
            <Text key={idx} style={styles.entry}>{JSON.stringify(entry)}</Text>
          )) : <Text style={styles.empty}>None</Text>}
        </>
      ) : (
        <Text style={styles.empty}>No memory found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  entry: {
    fontSize: 14,
    paddingVertical: 5,
    color: '#333',
  },
  empty: {
    fontStyle: 'italic',
    color: '#999',
    paddingVertical: 5,
  },
});