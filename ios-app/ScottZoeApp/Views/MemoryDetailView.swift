//
//  MemoryDetailView.swift
//  Scott & Zoe Love Story
//
//  Detailed memory view with editing and deletion capabilities
//

import SwiftUI

struct MemoryDetailView: View {
    let memory: Memory
    let onUpdate: (Memory) -> Void
    let onDelete: (Memory) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var dataManager: DataManager
    @State private var isEditing = false
    @State private var showingDeleteAlert = false
    @State private var isLoading = false
    
    // Edit state
    @State private var editTitle: String
    @State private var editDescription: String
    @State private var editDate: Date
    @State private var editType: MemoryType
    
    init(memory: Memory, onUpdate: @escaping (Memory) -> Void, onDelete: @escaping (Memory) -> Void) {
        self.memory = memory
        self.onUpdate = onUpdate
        self.onDelete = onDelete
        
        // Initialize edit state
        self._editTitle = State(initialValue: memory.title)
        self._editDescription = State(initialValue: memory.description)
        self._editDate = State(initialValue: memory.date)
        self._editType = State(initialValue: memory.type)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header Card
                    VStack(alignment: .leading, spacing: 16) {
                        // Type and Date
                        HStack {
                            HStack(spacing: 8) {
                                Image(systemName: memory.type.icon)
                                    .foregroundColor(memory.type.color)
                                    .font(.title2)
                                
                                Text(memory.type.displayName)
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(memory.type.color)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing, spacing: 4) {
                                Text(formatDate(memory.date))
                                    .font(.headline)
                                    .fontWeight(.semibold)
                                
                                if isUpcoming(memory.date) {
                                    Text("In \(daysUntil(memory.date)) days")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                        .fontWeight(.medium)
                                } else if isToday(memory.date) {
                                    Text("Today!")
                                        .font(.caption)
                                        .foregroundColor(.yellow)
                                        .fontWeight(.bold)
                                } else {
                                    Text("\(daysSince(memory.date)) days ago")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        
                        Divider()
                        
                        // Title
                        if isEditing {
                            TextField("Title", text: $editTitle)
                                .font(.title)
                                .fontWeight(.bold)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        } else {
                            Text(memory.title)
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                    
                    // Description Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Description")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        if isEditing {
                            TextField("Description", text: $editDescription, axis: .vertical)
                                .lineLimit(5...10)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        } else {
                            Text(memory.description)
                                .font(.body)
                                .foregroundColor(.primary)
                                .lineSpacing(4)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                    
                    // Edit Fields (when editing)
                    if isEditing {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Edit Details")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Date")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                DatePicker("Memory Date", selection: $editDate, displayedComponents: .date)
                                    .datePickerStyle(CompactDatePickerStyle())
                            }
                            
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Type")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Picker("Memory Type", selection: $editType) {
                                    ForEach(MemoryType.allCases, id: \.self) { type in
                                        HStack {
                                            Image(systemName: type.icon)
                                                .foregroundColor(type.color)
                                            Text(type.displayName)
                                        }
                                        .tag(type)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color(.systemBackground))
                                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                        )
                    }
                    
                    // Metadata Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Memory Info")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        VStack(spacing: 8) {
                            InfoRow(label: "Created", value: formatDateTime(memory.createdAt))
                            InfoRow(label: "Type", value: memory.type.displayName)
                            InfoRow(label: "Days Until/Since", value: daysDescription)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                }
                .padding()
            }
            .navigationTitle("Memory")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        if isEditing {
                            Button("Cancel") {
                                cancelEditing()
                            }
                            
                            Button("Save") {
                                saveChanges()
                            }
                            .disabled(editTitle.isEmpty || editDescription.isEmpty || isLoading)
                        } else {
                            Button("Edit") {
                                isEditing = true
                            }
                            
                            Menu {
                                Button(action: {
                                    showingDeleteAlert = true
                                }) {
                                    Label("Delete Memory", systemImage: "trash")
                                }
                            } label: {
                                Image(systemName: "ellipsis")
                            }
                        }
                    }
                }
            }
        }
        .alert("Delete Memory", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                deleteMemory()
            }
        } message: {
            Text("Are you sure you want to delete this memory? This action cannot be undone.")
        }
    }
    
    private var daysDescription: String {
        if isToday(memory.date) {
            return "Today"
        } else if isUpcoming(memory.date) {
            return "In \(daysUntil(memory.date)) days"
        } else {
            return "\(daysSince(memory.date)) days ago"
        }
    }
    
    private func cancelEditing() {
        editTitle = memory.title
        editDescription = memory.description
        editDate = memory.date
        editType = memory.type
        isEditing = false
    }
    
    private func saveChanges() {
        Task {
            isLoading = true
            
            do {
                let updatedMemory = try await dataManager.updateMemory(
                    id: memory.id,
                    title: editTitle,
                    description: editDescription,
                    date: editDate,
                    type: editType
                )
                
                await MainActor.run {
                    onUpdate(updatedMemory)
                    isEditing = false
                }
            } catch {
                print("Failed to update memory: \(error)")
            }
            
            isLoading = false
        }
    }
    
    private func deleteMemory() {
        Task {
            isLoading = true
            
            do {
                try await dataManager.deleteMemory(id: memory.id)
                
                await MainActor.run {
                    onDelete(memory)
                    dismiss()
                }
            } catch {
                print("Failed to delete memory: \(error)")
            }
            
            isLoading = false
        }
    }
    
    // Helper functions
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        return formatter.string(from: date)
    }
    
    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
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
    
    private func daysSince(_ date: Date) -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let memoryDate = calendar.startOfDay(for: date)
        return calendar.dateComponents([.day], from: memoryDate, to: today).day ?? 0
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

#Preview {
    MemoryDetailView(
        memory: Memory(
            id: 1,
            title: "Our First Date",
            description: "We went to that amazing restaurant downtown and talked for hours. It was magical!",
            date: Date(),
            type: .special,
            createdAt: Date()
        )!,
        onUpdate: { _ in },
        onDelete: { _ in }
    )
    .environmentObject(DataManager())
}