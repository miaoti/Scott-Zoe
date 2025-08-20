import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../contexts/DataContext';

interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'first_date' | 'anniversary' | 'vacation' | 'milestone' | 'other';
  createdAt: string;
}

interface MemoryItemProps {
  memory: Memory;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MemoryItem({ memory, onPress, onEdit, onDelete }: MemoryItemProps) {
  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'first_date':
        return 'heart-circle';
      case 'anniversary':
        return 'gift';
      case 'vacation':
        return 'airplane';
      case 'milestone':
        return 'trophy';
      default:
        return 'bookmark';
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case 'first_date':
        return '#FF6B9D';
      case 'anniversary':
        return '#C44569';
      case 'vacation':
        return '#F8B500';
      case 'milestone':
        return '#6C5CE7';
      default:
        return '#74B9FF';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const dateStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <TouchableOpacity
      style={styles.memoryItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.memoryContent}>
        <View style={styles.memoryHeader}>
          <View
            style={[
              styles.memoryIcon,
              { backgroundColor: getMemoryColor(memory.type) },
            ]}
          >
            <Ionicons
              name={getMemoryIcon(memory.type) as keyof typeof Ionicons.glyphMap}
              size={20}
              color="white"
            />
          </View>
          <View style={styles.memoryInfo}>
            <Text style={styles.memoryTitle} numberOfLines={1}>
              {memory.title}
            </Text>
            <Text style={styles.memoryDate}>{formatDate(memory.date)}</Text>
          </View>
          <View style={styles.memoryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash" size={16} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.memoryDescription} numberOfLines={2}>
          {memory.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface CreateMemoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (memory: Partial<Memory>) => void;
  editingMemory?: Memory | null;
}

function CreateMemoryModal({ visible, onClose, onSave, editingMemory }: CreateMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<Memory['type']>('other');

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setDescription(editingMemory.description);
      const memoryDate = editingMemory.date;
      if (memoryDate instanceof Date) {
        const year = memoryDate.getFullYear();
        const month = String(memoryDate.getMonth() + 1).padStart(2, '0');
        const day = String(memoryDate.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      } else {
        setDate(memoryDate);
      }
      setType(editingMemory.type);
    } else {
      setTitle('');
      setDescription('');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setType('other');
    }
  }, [editingMemory, visible]);

  const handleSave = () => {
    if (!title.trim() || !description.trim() || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      type,
    });
    onClose();
  };

  const memoryTypes = [
    { value: 'first_date', label: 'First Date', icon: 'heart-circle' },
    { value: 'anniversary', label: 'Anniversary', icon: 'gift' },
    { value: 'vacation', label: 'Vacation', icon: 'airplane' },
    { value: 'milestone', label: 'Milestone', icon: 'trophy' },
    { value: 'other', label: 'Other', icon: 'bookmark' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingMemory ? 'Edit Memory' : 'New Memory'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter memory title"
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this special memory"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date</Text>
            <TextInput
              style={styles.formInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {memoryTypes.map((memoryType) => (
                <TouchableOpacity
                  key={memoryType.value}
                  style={[
                    styles.typeOption,
                    type === memoryType.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => setType(memoryType.value as Memory['type'])}
                >
                  <Ionicons
                    name={memoryType.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={type === memoryType.value ? 'white' : '#666'}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      type === memoryType.value && styles.typeOptionTextSelected,
                    ]}
                  >
                    {memoryType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MemoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  
  const {
    memories,
    fetchMemories,
    createMemory,
    updateMemory,
    deleteMemory,
  } = useData();

  useEffect(() => {
    fetchMemories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchMemories();
    setRefreshing(false);
  };

  const handleCreateMemory = async (memoryData: Partial<Memory>) => {
    try {
      await createMemory(memoryData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchMemories();
    } catch (error) {
      console.error('Error creating memory:', error);
      Alert.alert('Error', 'Failed to create memory. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setShowCreateModal(true);
  };

  const handleUpdateMemory = async (memoryData: Partial<Memory>) => {
    if (!editingMemory) return;
    
    try {
      await updateMemory(editingMemory.id, memoryData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchMemories();
      setEditingMemory(null);
    } catch (error) {
      console.error('Error updating memory:', error);
      Alert.alert('Error', 'Failed to update memory. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDeleteMemory = (memory: Memory) => {
    Alert.alert(
      'Delete Memory',
      `Are you sure you want to delete "${memory.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemory(memory.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchMemories();
            } catch (error) {
              console.error('Error deleting memory:', error);
              Alert.alert('Error', 'Failed to delete memory. Please try again.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const filteredMemories = memories
    .filter((memory) => {
      const matchesSearch = memory.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        memory.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || memory.type === selectedType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      //  ort by oldest first (ascending order) 
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const upcomingMemories = memories
    .map((memory) => {
      const memoryDate = new Date(memory.date);
      const today = new Date();
      const thisYear = today.getFullYear();
      const anniversaryThisYear = new Date(thisYear, memoryDate.getMonth(), memoryDate.getDate());
      const nextAnniversary = anniversaryThisYear >= today ? anniversaryThisYear : new Date(thisYear + 1, memoryDate.getMonth(), memoryDate.getDate());
      
      return {
        ...memory,
        nextAnniversaryDate: nextAnniversary,
        daysUntil: Math.ceil((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  const memoryTypes = [
    { value: 'all', label: 'All' },
    { value: 'first_date', label: 'First Date' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'other', label: 'Other' },
  ];

  const renderMemory = ({ item }: { item: Memory }) => (
    <MemoryItem
      memory={item}
      onPress={() => {/* Navigate to memory detail */}}
      onEdit={() => handleEditMemory(item)}
      onDelete={() => handleDeleteMemory(item)}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Our Memories</Text>
          <Text style={styles.headerSubtitle}>
            {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
          </Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {memoryTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.filterChip,
              selectedType === type.value && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedType(type.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type.value && styles.filterChipTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Upcoming Anniversaries */}
      {upcomingMemories.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Anniversaries</Text>
          {upcomingMemories.map((memory) => (
            <View key={memory.id} style={styles.upcomingItem}>
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle}>{memory.title}</Text>
                <Text style={styles.upcomingDescription} numberOfLines={2}>
                  {memory.description}
                </Text>
                <Text style={styles.upcomingDate}>
                  {memory.nextAnniversaryDate.toLocaleDateString()} • {memory.daysUntil} days
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Memories List */}
      <FlatList
        data={filteredMemories}
        renderItem={renderMemory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.memoriesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No memories found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start by creating your first memory'}
            </Text>
          </View>
        }
      />

      {/* Add Memory Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingMemory(null);
          setShowCreateModal(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B9D', '#C44569']}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create/Edit Memory Modal */}
      <CreateMemoryModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingMemory(null);
        }}
        onSave={editingMemory ? handleUpdateMemory : handleCreateMemory}
        editingMemory={editingMemory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterChip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  memoriesContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  memoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memoryContent: {
    padding: 15,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memoryDate: {
    fontSize: 14,
    color: '#666',
  },
  memoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeOptionSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  upcomingSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  upcomingItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  upcomingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#FF6B9D',
    fontWeight: '500',
  },
});