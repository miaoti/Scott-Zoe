//
//  PhotoGalleryView.swift
//  Scott & Zoe Love Story
//
//  Photo gallery with categories and upload functionality
//

import SwiftUI
import PhotosUI

struct PhotoGalleryView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var photos: [Photo] = []
    @State private var categories: [Category] = []
    @State private var selectedCategory: Category?
    @State private var isLoading = false
    @State private var showingImagePicker = false
    @State private var showingPhotoDetail = false
    @State private var selectedPhoto: Photo?
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var searchText = ""
    
    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var filteredPhotos: [Photo] {
        var filtered = photos
        
        // Filter by category
        if let selectedCategory = selectedCategory {
            if selectedCategory.name == "Favorites" {
                filtered = filtered.filter { $0.isFavorite }
            } else {
                filtered = filtered.filter { photo in
                    photo.categories.contains { $0.id == selectedCategory.id }
                }
            }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { photo in
                photo.caption?.localizedCaseInsensitiveContains(searchText) == true ||
                photo.categories.contains { $0.name.localizedCaseInsensitiveContains(searchText) }
            }
        }
        
        return filtered
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                    .padding(.top, 8)
                
                // Categories Scroll
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        CategoryChip(
                            name: "All",
                            color: .blue,
                            isSelected: selectedCategory == nil
                        ) {
                            selectedCategory = nil
                        }
                        
                        CategoryChip(
                            name: "Favorites",
                            color: .red,
                            isSelected: selectedCategory?.name == "Favorites"
                        ) {
                            selectedCategory = Category(
                                id: -1,
                                name: "Favorites",
                                description: "Favorite photos",
                                color: "#FF0000",
                                photoCount: photos.filter { $0.isFavorite }.count
                            )
                        }
                        
                        ForEach(categories) { category in
                            CategoryChip(
                                name: category.name,
                                color: category.swiftUIColor,
                                isSelected: selectedCategory?.id == category.id
                            ) {
                                selectedCategory = category
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                
                // Photos Grid
                if isLoading {
                    Spacer()
                    ProgressView("Loading photos...")
                        .foregroundColor(.secondary)
                    Spacer()
                } else if filteredPhotos.isEmpty {
                    Spacer()
                    VStack(spacing: 16) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text(searchText.isEmpty ? "No photos yet" : "No photos found")
                            .font(.title2)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                        
                        if searchText.isEmpty {
                            Text("Upload your first photo to get started")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding()
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 8) {
                            ForEach(filteredPhotos) { photo in
                                PhotoGridItem(photo: photo) {
                                    selectedPhoto = photo
                                    showingPhotoDetail = true
                                }
                                .animation(.easeInOut(duration: 0.3), value: filteredPhotos)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 100) // Space for floating button
                    }
                }
            }
            .navigationTitle("Photos")
            .navigationBarTitleDisplayMode(.large)
            .background(
                LinearGradient(
                    colors: [Color(.systemBackground), Color(.systemGray6)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                // Floating Upload Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            showingImagePicker = true
                        }) {
                            Image(systemName: "plus")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .frame(width: 56, height: 56)
                                .background(
                                    LinearGradient(
                                        colors: [.pink, .purple],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                        }
                        .scaleEffect(showingImagePicker ? 0.9 : 1.0)
                        .animation(.easeInOut(duration: 0.1), value: showingImagePicker)
                        .padding(.trailing, 20)
                        .padding(.bottom, 20)
                    }
                }
            )
        }
        .photosPicker(
            isPresented: $showingImagePicker,
            selection: $selectedItems,
            maxSelectionCount: 5,
            matching: .images
        )
        .sheet(isPresented: $showingPhotoDetail) {
            if let photo = selectedPhoto {
                PhotoDetailView(photo: photo) {
                    loadPhotos()
                }
            }
        }
        .task {
            await loadData()
        }
        .refreshable {
            await loadData()
        }
        .onChange(of: selectedItems) { items in
            Task {
                await uploadSelectedPhotos(items)
            }
        }
    }
    
    private func loadData() async {
        isLoading = true
        
        async let photosTask = loadPhotos()
        async let categoriesTask = loadCategories()
        
        await photosTask
        await categoriesTask
        
        isLoading = false
    }
    
    private func loadPhotos() async {
        do {
            let fetchedPhotos = try await dataManager.fetchPhotos()
            await MainActor.run {
                photos = fetchedPhotos
            }
        } catch {
            print("Failed to load photos: \(error)")
        }
    }
    
    private func loadCategories() async {
        do {
            let fetchedCategories = try await dataManager.fetchCategories()
            await MainActor.run {
                categories = fetchedCategories
            }
        } catch {
            print("Failed to load categories: \(error)")
        }
    }
    
    private func uploadSelectedPhotos(_ items: [PhotosPickerItem]) async {
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self) {
                do {
                    _ = try await dataManager.uploadPhoto(imageData: data)
                    await loadPhotos()
                } catch {
                    print("Failed to upload photo: \(error)")
                }
            }
        }
        
        await MainActor.run {
            selectedItems = []
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search photos...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemGray5))
        .cornerRadius(10)
    }
}

struct CategoryChip: View {
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

struct PhotoGridItem: View {
    let photo: Photo
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            AsyncImage(url: URL(string: photo.url)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay(
                        ProgressView()
                            .scaleEffect(0.8)
                    )
            }
            .frame(height: 120)
            .clipped()
            .cornerRadius(12)
            .overlay(
                // Favorite indicator
                VStack {
                    HStack {
                        Spacer()
                        if photo.isFavorite {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.red)
                                .font(.caption)
                                .padding(4)
                                .background(Color.white.opacity(0.8))
                                .clipShape(Circle())
                                .padding(6)
                        }
                    }
                    Spacer()
                }
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    PhotoGalleryView()
        .environmentObject(DataManager())
}