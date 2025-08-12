//
//  PhotoDetailView.swift
//  Scott & Zoe Love Story
//
//  Detailed photo view with full-screen display and interactions
//

import SwiftUI

struct PhotoDetailView: View {
    let photo: Photo
    let onUpdate: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var dataManager: DataManager
    @State private var isFavorite: Bool
    @State private var showingDeleteAlert = false
    @State private var isLoading = false
    @State private var scale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var showingShareSheet = false
    
    init(photo: Photo, onUpdate: @escaping () -> Void) {
        self.photo = photo
        self.onUpdate = onUpdate
        self._isFavorite = State(initialValue: photo.isFavorite)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black
                    .ignoresSafeArea()
                
                VStack {
                    // Photo Display
                    GeometryReader { geometry in
                        AsyncImage(url: URL(string: photo.url)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .scaleEffect(scale)
                                .offset(offset)
                                .gesture(
                                    SimultaneousGesture(
                                        MagnificationGesture()
                                            .onChanged { value in
                                                scale = value
                                            }
                                            .onEnded { value in
                                                withAnimation(.spring()) {
                                                    if scale < 1 {
                                                        scale = 1
                                                        offset = .zero
                                                    } else if scale > 3 {
                                                        scale = 3
                                                    }
                                                }
                                            },
                                        DragGesture()
                                            .onChanged { value in
                                                if scale > 1 {
                                                    offset = value.translation
                                                }
                                            }
                                            .onEnded { value in
                                                withAnimation(.spring()) {
                                                    if scale <= 1 {
                                                        offset = .zero
                                                    }
                                                }
                                            }
                                    )
                                )
                                .onTapGesture(count: 2) {
                                    withAnimation(.spring()) {
                                        if scale == 1 {
                                            scale = 2
                                        } else {
                                            scale = 1
                                            offset = .zero
                                        }
                                    }
                                }
                        } placeholder: {
                            Rectangle()
                                .fill(Color(.systemGray6))
                                .overlay(
                                    ProgressView()
                                        .scaleEffect(1.5)
                                        .tint(.white)
                                )
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                    
                    // Photo Info
                    VStack(alignment: .leading, spacing: 12) {
                        if let caption = photo.caption, !caption.isEmpty {
                            Text(caption)
                                .font(.body)
                                .foregroundColor(.white)
                                .multilineTextAlignment(.leading)
                        }
                        
                        // Categories
                        if !photo.categories.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(photo.categories) { category in
                                        Text(category.name)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(category.swiftUIColor)
                                            .foregroundColor(.white)
                                            .cornerRadius(12)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        // Upload Date
                        Text("Uploaded \(formatDate(photo.uploadDate))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color.clear, Color.black.opacity(0.8)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        // Favorite Button
                        Button(action: toggleFavorite) {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .foregroundColor(isFavorite ? .red : .white)
                                .font(.title3)
                        }
                        .disabled(isLoading)
                        
                        // Share Button
                        Button(action: {
                            showingShareSheet = true
                        }) {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundColor(.white)
                                .font(.title3)
                        }
                        
                        // More Options
                        Menu {
                            Button(action: {
                                showingDeleteAlert = true
                            }) {
                                Label("Delete Photo", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis")
                                .foregroundColor(.white)
                                .font(.title3)
                        }
                    }
                }
            }
            .toolbarBackground(.hidden, for: .navigationBar)
        }
        .alert("Delete Photo", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    await deletePhoto()
                }
            }
        } message: {
            Text("Are you sure you want to delete this photo? This action cannot be undone.")
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = URL(string: photo.url) {
                ShareSheet(items: [url])
            }
        }
    }
    
    private func toggleFavorite() {
        Task {
            isLoading = true
            
            do {
                try await dataManager.togglePhotoFavorite(photoId: photo.id)
                await MainActor.run {
                    isFavorite.toggle()
                    onUpdate()
                }
            } catch {
                print("Failed to toggle favorite: \(error)")
            }
            
            isLoading = false
        }
    }
    
    private func deletePhoto() {
        Task {
            isLoading = true
            
            do {
                try await dataManager.deletePhoto(photoId: photo.id)
                await MainActor.run {
                    onUpdate()
                    dismiss()
                }
            } catch {
                print("Failed to delete photo: \(error)")
            }
            
            isLoading = false
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {
        // No updates needed
    }
}

#Preview {
    PhotoDetailView(
        photo: Photo(
            id: 1,
            url: "https://example.com/photo.jpg",
            caption: "A beautiful memory",
            uploadDate: Date(),
            isFavorite: true,
            categories: []
        )!,
        onUpdate: {}
    )
    .environmentObject(DataManager())
}