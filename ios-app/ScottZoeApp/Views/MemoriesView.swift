//
//  MemoriesView.swift
//  Scott & Zoe Love Story
//
//  Memories management with creation, editing, and viewing
//

import SwiftUI

struct MemoriesView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var memories: [Memory] = []
    @State private var isLoading = false
    @State private var showingCreateMemory = false
    @State private var selectedMemory: Memory?
    @State private var showingMemoryDetail = false
    @State private var searchText = ""
    @State private var selectedType: MemoryType?
    
    var filteredMemories: [Memory] {
        var filtered = memories
        
        // Filter by type
        if let selectedType = selectedType {
            filtered = filtered.filter { $0.type == selectedType }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { memory in
                memory.title.localizedCaseInsensitiveContains(searchText) ||
                memory.description.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Sort by date (newest first)
        return filtered.sorted { $0.date > $1.date }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                    .padding(.top, 8)
                
                // Type Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        TypeChip(
                            name: "All",
                            color: .blue,
                            isSelected: selectedType == nil
                        ) {
                            selectedType = nil
                        }
                        
                        ForEach(MemoryType.allCases, id: \.self) { type in
                            TypeChip(
                                name: type.displayName,
                                color: type.color,
                                isSelected: selectedType == type
                            ) {
                                selectedType = type
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                
                // Memories List
                if isLoading {
                    Spacer()
                    ProgressView("Loading memories...")
                        .foregroundColor(.secondary)
                    Spacer()
                } else if filteredMemories.isEmpty {
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "heart.text.square")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text(searchText.isEmpty ? "No memories yet" : "No memories found")
                            .font(.title2)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                        
                        if searchText.isEmpty {
                            Text("Create your first memory to get started")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding()
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredMemories) { memory in
                                MemoryCard(memory: memory) {
                                    selectedMemory = memory
                                    showingMemoryDetail = true
                                }
                                .animation(.easeInOut(duration: 0.3), value: filteredMemories)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 100) // Space for floating button
                    }
                }
            }
            .navigationTitle("Memories")
            .navigationBarTitleDisplayMode(.large)
            .background(
                LinearGradient(
                    colors: [Color(.systemBackground), Color(.systemGray6)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                // Floating Add Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            showingCreateMemory = true
                        }) {
                            Image(systemName: "plus")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .frame(width: 56, height: 56)
                                .background(
                                    LinearGradient(
                                        colors: [.purple, .blue],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                        }
                        .scaleEffect(showingCreateMemory ? 0.9 : 1.0)
                        .animation(.easeInOut(duration: 0.1), value: showingCreateMemory)
                        .padding(.trailing, 20)
                        .padding(.bottom, 20)
                    }
                }
            )
        }
        .sheet(isPresented: $showingCreateMemory) {
            CreateMemoryView { newMemory in
                memories.append(newMemory)
            }
        }
        .sheet(isPresented: $showingMemoryDetail) {
            if let memory = selectedMemory {
                MemoryDetailView(memory: memory) { updatedMemory in
                    if let index = memories.firstIndex(where: { $0.id == updatedMemory.id }) {
                        memories[index] = updatedMemory
                    }
                } onDelete: { deletedMemory in
                    memories.removeAll { $0.id == deletedMemory.id }
                }
            }
        }
        .task {
            await loadMemories()
        }
        .refreshable {
            await loadMemories()
        }
    }
    
    private func loadMemories() async {
        isLoading = true
        
        do {
            let fetchedMemories = try await dataManager.fetchMemories()
            await MainActor.run {
                memories = fetchedMemories
            }
        } catch {
            print("Failed to load memories: \(error)")
        }
        
        isLoading = false
    }
}

struct MemoryCard: View {
    let memory: Memory
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: memory.type.icon)
                            .foregroundColor(memory.type.color)
                            .font(.title3)
                        
                        Text(memory.type.displayName)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(memory.type.color)
                    }
                    
                    Spacer()
                    
                    Text(formatDate(memory.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 8) {
                    Text(memory.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .multilineTextAlignment(.leading)
                    
                    Text(memory.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                }
                
                // Days indicator
                if isUpcoming(memory.date) {
                    HStack {
                        Image(systemName: "clock")
                            .foregroundColor(.orange)
                            .font(.caption)
                        
                        Text("In \(daysUntil(memory.date)) days")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.orange)
                    }
                } else if isToday(memory.date) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)
                        
                        Text("Today!")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.yellow)
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    private func isUpcoming(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let memoryDate = calendar.startOfDay(for: date)
        return memoryDate > today
    }
    
    private func isToday(_ date: Date) -> Bool {
        let calendar = Calendar.current
        return calendar.isDateInToday(date)
    }
    
    private func daysUntil(_ date: Date) -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let memoryDate = calendar.startOfDay(for: date)
        return calendar.dateComponents([.day], from: today, to: memoryDate).day ?? 0
    }
}

struct TypeChip: View {
    let name: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(name)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    isSelected ? color : Color(.systemGray5)
                )
                .foregroundColor(
                    isSelected ? .white : .primary
                )
                .cornerRadius(16)
        }
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

struct CreateMemoryView: View {
    let onSave: (Memory) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var dataManager: DataManager
    @State private var title = ""
    @State private var description = ""
    @State private var selectedDate = Date()
    @State private var selectedType = MemoryType.special
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("Memory Details") {
                    TextField("Title", text: $title)
                    
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Date & Type") {
                    DatePicker("Date", selection: $selectedDate, displayedComponents: .date)
                    
                    Picker("Type", selection: $selectedType) {
                        ForEach(MemoryType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                    .foregroundColor(type.color)
                                Text(type.displayName)
                            }
                            .tag(type)
                        }
                    }
                }
            }
            .navigationTitle("New Memory")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveMemory()
                    }
                    .disabled(title.isEmpty || description.isEmpty || isLoading)
                }
            }
        }
    }
    
    private func saveMemory() {
        Task {
            isLoading = true
            
            do {
                let newMemory = try await dataManager.createMemory(
                    title: title,
                    description: description,
                    date: selectedDate,
                    type: selectedType
                )
                
                await MainActor.run {
                    onSave(newMemory)
                    dismiss()
                }
            } catch {
                print("Failed to create memory: \(error)")
            }
            
            isLoading = false
        }
    }
}

#Preview {
    MemoriesView()
        .environmentObject(DataManager())
}