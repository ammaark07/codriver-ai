import React, { useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlagOptions, MemoryEntry, MemoryType } from '../types/memory_schema';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: MemoryEntry) => void;
  initialData?: MemoryEntry;
  onDelete?: (key: string) => void;
  onMemoryUpdate?: (newEntry: MemoryEntry) => void;
}

export default function MemoryModal({ visible, onClose, onSave, initialData, onDelete, onMemoryUpdate }: Props) {
  const [keyField, setKeyField] = useState(initialData?.key || '');
  const [valueField, setValueField] = useState(initialData?.value?.toString() || '');
  const [typeField, setTypeField] = useState<MemoryType>(initialData?.type || MemoryType.OTHER);
  const [flags, setFlags] = useState<FlagOptions>(initialData?.flags || {});

  const toggleFlag = (flag: keyof FlagOptions) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleSave = () => {
    const newEntry: MemoryEntry = {
      ...initialData,
      key: keyField,
      value: valueField,
      type: typeField,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
      flags,
    };
    onSave(newEntry);
    if (onMemoryUpdate) {
      onMemoryUpdate(newEntry);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{initialData ? 'Edit Memory' : 'Add New Memory'}</Text>

          <TextInput
            placeholder="Key"
            style={styles.input}
            value={keyField}
            onChangeText={setKeyField}
          />
          <TextInput
            placeholder="Value"
            style={styles.input}
            value={valueField}
            onChangeText={setValueField}
          />

          <Text style={styles.label}>Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {Object.values(MemoryType).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  type === typeField && styles.typeButtonSelected,
                ]}
                onPress={() => setTypeField(type)}
              >
                <Text style={styles.typeButtonText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Flags:</Text>
          <View style={styles.flagsContainer}>
            {['useForRouting', 'avoid', 'favorite', 'temporary'].map(flag => (
              <TouchableOpacity
                key={flag}
                style={[
                  styles.flagButton,
                  flags[flag as keyof FlagOptions] && styles.flagButtonActive,
                ]}
                onPress={() => toggleFlag(flag as keyof FlagOptions)}
              >
                <Text style={styles.flagButtonText}>{flag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonRow}>
            {initialData && onDelete && (
              <Button
                title="Delete"
                color="red"
                onPress={() => {
                  onDelete(initialData.key);
                  onClose();
                }}
              />
            )}
            <Button title="Cancel" onPress={onClose} />
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    paddingVertical: 6,
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginRight: 6,
  },
  typeButtonSelected: {
    backgroundColor: '#007bff',
  },
  typeButtonText: {
    color: '#000',
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  flagButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    margin: 4,
  },
  flagButtonActive: {
    backgroundColor: '#28a745',
  },
  flagButtonText: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});