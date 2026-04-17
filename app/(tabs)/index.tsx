import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import MemoryModal from '../components/MemoryModal';
import { MemoryStore } from '../types/memory_schema';

export default function HomeScreen() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transcript, setTranscript] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [typedInput, setTypedInput] = useState<string>('');
  const [locationInfo, setLocationInfo] = useState<Location.LocationObjectCoords | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [memoryStore, setMemoryStore] = useState<MemoryStore | null>(null);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const key = process.env.EXPO_PUBLIC_GOOGLE_GEOCODE_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      const address = data.results?.[0]?.formatted_address;
      return address || "Unknown address";
    } catch (e) {
      console.error("🛑 Reverse geocoding failed:", e);
      return "Unknown address";
    }
  };

  const loadMemory = async () => {
    try {
      const raw = await AsyncStorage.getItem('user_memory');
      if (raw) {
        const parsed: MemoryStore = JSON.parse(raw);
        setMemoryStore(parsed);
      } else {
        setMemoryStore(null);
      }
    } catch (e) {
      console.error('Failed to load memory:', e);
      setMemoryStore(null);
    }
  };

  useEffect(() => {

    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("isDarkMode");
      if (storedTheme !== null) setIsDarkMode(JSON.parse(storedTheme));
    };
    loadTheme();

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setLocationInfo(location.coords);
          reverseGeocode(location.coords.latitude, location.coords.longitude)
            .then((address) => {
              setCurrentAddress(address);
              //console.log("📍 Current address:", address);
            });
          //console.log("📍 Location update:", location.coords);
        }
      );
    };
    startLocationTracking();

    loadMemory();
  });

  const systemPrompt = `
  You are Codriver, an AI driving assistant.

  ${locationInfo ? `
  The user's current location is:
  {
    "latitude": ${locationInfo.latitude},
    "longitude": ${locationInfo.longitude},
    "address": "${currentAddress || "Unknown address"}"
  }

  You can use this location to:
  - Detect if the user is near known places in memory
  - Confirm where they might be headed
  - Suggest actions (e.g., rerouting, reminders)
  - Store new locations if the user labels them (e.g. "save this as my gym")

  - You are allowed to make smart inferences based on the user's current location, context, or behavior. 
    However, if you are unsure or relying on inference (rather than explicit memory), you must confirm with the user before saving or acting on that information. 
    Example: "You're currently at 123 Maple St — do you want me to save this as your home address?"
  ` : ``}

  ${memoryStore ? `
  The user's full stored memory is below. Use this to recall information, plan routes, and personalize responses.

  ${JSON.stringify(memoryStore, null, 2)}
  ` : ''}

  
  Never invent memory fields. Only reason from what is injected above.

  Speak naturally and conversationally in your reply, then append memory updates in JSON at the end (if any).

  If a preference or location is vague (e.g., "the masjid", "school"), ask the user to clarify. If it's clearly a known place or unique enough (e.g., "Islamic Centre of Waterloo"), you may auto-save it.

  If the user consistently uses a phrase to mean a known memory location (e.g. "school" = Lazaridis Hall), you may auto-update memory for it, but always confirm:
  "Routing you to Lazaridis Hall, since that's where you usually go for school. Let me know if that's not correct."

  Here is the memory entry template you must follow, memory updates should be wrapped in the following format::

  {
  "type": "memory_update",
  "entries": [
    {
      "key": string; // e.g. "home_address", "preferred_gas"
      "value": string | boolean | number | object;
      "type": "places" | "preferences" | "people" | "context" | "temporary" | "habits" | "tasks" | "routes" | "vehicles" | "other";
      "createdAt": number; // timestamp in milliseconds
      "updatedAt"?: number;
      "use_count"?: number;
      "location"?: {
        "latitude": number;
        "longitude": number;
        "address"?: string;
      };
      "notes"?: string;
      "flags"?: {
        "useForRouting"?: boolean;
        "avoid"?: boolean;
        "favorite"?: boolean;
        "temporary"?: boolean;
      };
      "confidence"?: "confirmed" | "inferred";
      "source"?: "user" | "gpt" | "location_context" | "system";
      "requiresConfirmation"?: boolean;
    }
  ]
  }   

  EXAMPLE:

  {
  "type": "memory_update",
  "entries": [
    {
      "key": "example_key",
      "value": "example_value",
      "type": "place",
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "use_count": 1,
      "location": {
        "latitude": 43.123,
        "longitude": -80.456,
        "address": "123 Example St"
      },
      "notes": "Example note",
      "flags": {
        "useForRouting": true,
        "avoid": false,
        "favorite": true,
        "temporary": false
      },
      "confidence": "confirmed",
      "source": "user",
      "requiresConfirmation": false
    }
  ]
}

  Only use fields that are valid in this schema. Do not add extra fields.

  If you are unsure about the user's intent, ask for clarification.
  
  `;

  const handleSubmit = async (voiceInput: string) => {
    const userMessage = { role: 'user', content: voiceInput };

    const initialHistory = conversationHistory.length === 0
      ? [{ role: 'system', content: systemPrompt }, userMessage]
      : [...conversationHistory, userMessage];

    setConversationHistory(initialHistory);
    setLoading(true);

    const payload = {
      model: 'gpt-4-turbo',
      messages: initialHistory
    };

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const message = data.choices[0].message.content;

      // Parse and store memory update JSON from assistant response
      try {
        // Find the last occurrence of a complete JSON object
        let jsonText = '';
        let braceCount = 0;
        let startIndex = -1;
        
        for (let i = message.length - 1; i >= 0; i--) {
          if (message[i] === '}') {
            if (startIndex === -1) startIndex = i;
            braceCount++;
          } else if (message[i] === '{') {
            braceCount--;
            if (braceCount === 0) {
              jsonText = message.substring(i, startIndex + 1);
              break;
            }
          }
        }

        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          console.log("📦 Detected memory update JSON:", parsed);

          if (parsed.type === "memory_update" && Array.isArray(parsed.entries)) {
            const existingRaw = await AsyncStorage.getItem("user_memory");
            const existing: MemoryStore = existingRaw ? JSON.parse(existingRaw) : {
              places: [], preferences: [], people: [],
              context: [], temporary: [], habits: [],
              tasks: [], routes: [], vehicles: [], other: []
            };

            for (const entry of parsed.entries) {
              const targetCategory = `${entry.type}s` as keyof MemoryStore;
              if (targetCategory in existing) {
                existing[targetCategory].push(entry);
              } else {
                existing.other.push(entry);
              }
            }

            await AsyncStorage.setItem("user_memory", JSON.stringify(existing));
            setMemoryStore(existing);
          }
        }
      } catch (e) {
        console.warn("No valid memory JSON found or failed to save:", e);
      }

      setConversationHistory([...initialHistory, { role: 'assistant', content: message }]);
      Speech.speak(message);
    } catch (error) {
      console.error('Error talking to OpenAI:', error);
      setResponse('Something went wrong.');
    }

    setLoading(false);
  };

  //console.log("🎯 Button mounted.");

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>🎙️ CoDriver Prototype</Text>
      <Button title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} onPress={() => {
        setIsDarkMode(!isDarkMode);
        AsyncStorage.setItem("isDarkMode", JSON.stringify(!isDarkMode));
      }} />
      <TextInput
        placeholder="Type your message..."
        placeholderTextColor={isDarkMode ? "#888" : "#666"}
        style={{
          width: '100%',
          padding: 10,
          marginTop: 20,
          backgroundColor: isDarkMode ? '#222' : '#eee',
          color: isDarkMode ? '#fff' : '#000',
          borderRadius: 5,
        }}
        value={typedInput}
        onChangeText={setTypedInput}
      />
      <Button
        title="Send"
        onPress={() => {
          if (typedInput.trim()) {
            handleSubmit(typedInput);
            setTypedInput('');
          }
        }}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {transcript !== '' && <Text style={[styles.transcript, { color: isDarkMode ? "#aaa" : "gray" }]}>You said: {transcript}</Text>}
      {conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant' && (
        <Text style={[styles.response, { color: isDarkMode ? "#fff" : "#000" }]}>
          {conversationHistory[conversationHistory.length - 1].content}
        </Text>
      )}
      {locationInfo && (
        <Text style={{ color: isDarkMode ? "#aaa" : "#333", marginTop: 20 }}>
          📍 Lat: {locationInfo.latitude.toFixed(4)}, Lng: {locationInfo.longitude.toFixed(4)}
        </Text>
      )}
      <MemoryModal 
        visible={false}
        onClose={() => {}}
        onSave={() => {}}
        onMemoryUpdate={loadMemory} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  transcript: {
    marginTop: 20,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: 'gray',
  },
  response: {
    marginTop: 30,
    fontSize: 16,
    textAlign: 'center',
  },
});
