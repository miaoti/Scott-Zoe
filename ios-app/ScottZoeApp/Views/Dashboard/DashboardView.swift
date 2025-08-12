//
//  DashboardView.swift
//  Scott & Zoe Love Story
//
//  Main dashboard with love stats, recent photos, and quick actions
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dataManager: DataManager
    @EnvironmentObject var loveCounterManager: LoveCounterManager
    
    @State private var recentPhotos: [Photo] = []
    @State private var upcomingMemories: [Memory] = []
    @State private var stats = DashboardStats()
    @State private var isLoading = true
    @State private var showPhotoUpload = false
    @State private var animateCards = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 24) {
                    // Header with relationship info
                    headerSection
                    
                    // Love counter section
                    loveCounterSection
                    
                    // Quick stats cards
                    statsSection
                    
                    // Recent photos section
                    recentPhotosSection
                    
                    // Upcoming memories section
                    upcomingMemoriesSection
                    
                    // Quick actions
                    quickActionsSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 100)
            }
            .background(
                LinearGradient(
                    colors: [
                        Color(.systemBackground),
                        Color(.systemGray6).opacity(0.3)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .navigationBarHidden(true)
            .refreshable {
                await fetchDashboardData()
            }
        }
        .onAppear {
            Task {
                await fetchDashboardData()
            }
            
            // Animate cards on appear
            withAnimation(.easeOut(duration: 0.8).delay(0.2)) {
                animateCards = true
            }
        }
        .sheet(isPresented: $showPhotoUpload) {
            PhotoUploadView()
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            // Greeting
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(greetingText)
                        .font(.title2)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    Text("Welcome to Our Love Story")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Profile/Settings button
                Button(action: {
                    // Navigate to settings
                }) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.pink)
                }
            }
            .padding(.top, 20)
            
            // Relationship counter
            if let relationshipInfo = authManager.relationshipInfo {
                RelationshipCounterCard(relationshipInfo: relationshipInfo)
                    .scaleEffect(animateCards ? 1.0 : 0.9)
                    .opacity(animateCards ? 1.0 : 0.0)
            }
        }
    }
    
    private var loveCounterSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Love Counter")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "heart.fill")
                    .foregroundColor(.pink)
                    .font(.title3)
            }
            
            LoveCounterCard()
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8).delay(0.3), value: animateCards)
        }
    }
    
    private var statsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Quick Stats")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatCard(
                    title: "Photos",
                    value: "\(stats.photos)",
                    icon: "photo.fill",
                    color: .blue,
                    destination: AnyView(PhotoGalleryView())
                )
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8).delay(0.4), value: animateCards)
                
                StatCard(
                    title: "Memories",
                    value: "\(stats.memories)",
                    icon: "calendar.circle.fill",
                    color: .purple,
                    destination: AnyView(MemoriesView())
                )
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8).delay(0.5), value: animateCards)
                
                StatCard(
                    title: "Total Love",
                    value: "\(stats.totalLove)",
                    icon: "heart.fill",
                    color: .pink,
                    destination: AnyView(LoveCounterView())
                )
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8).delay(0.6), value: animateCards)
                
                StatCard(
                    title: "Categories",
                    value: "\(stats.categories)",
                    icon: "tag.fill",
                    color: .orange,
                    destination: AnyView(CategoriesView())
                )
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(.easeOut(duration: 0.8).delay(0.7), value: animateCards)
            }
        }
    }
    
    private var recentPhotosSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Recent Photos")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                NavigationLink(destination: PhotoGalleryView()) {
                    Text("See All")
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.pink)
                }
            }
            
            if recentPhotos.isEmpty {
                EmptyStateCard(
                    icon: "photo",
                    title: "No Photos Yet",
                    subtitle: "Start capturing your beautiful moments together",
                    actionTitle: "Add Photo",
                    action: { showPhotoUpload = true }
                )
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 12) {
                        ForEach(Array(recentPhotos.prefix(6).enumerated()), id: \.element.id) { index, photo in
                            PhotoThumbnailCard(photo: photo)
                                .scaleEffect(animateCards ? 1.0 : 0.9)
                                .opacity(animateCards ? 1.0 : 0.0)
                                .animation(.easeOut(duration: 0.8).delay(0.8 + Double(index) * 0.1), value: animateCards)
                        }
                    }
                    .padding(.horizontal, 4)
                }
            }
        }
    }
    
    private var upcomingMemoriesSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Upcoming Memories")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                NavigationLink(destination: MemoriesView()) {
                    Text("See All")
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.pink)
                }
            }
            
            if upcomingMemories.isEmpty {
                EmptyStateCard(
                    icon: "calendar.badge.plus",
                    title: "No Upcoming Memories",
                    subtitle: "Create special memories to celebrate together",
                    actionTitle: "Add Memory",
                    action: { /* Navigate to memories */ }
                )
            } else {
                VStack(spacing: 12) {
                    ForEach(Array(upcomingMemories.prefix(3).enumerated()), id: \.element.id) { index, memory in
                        MemoryPreviewCard(memory: memory)
                            .scaleEffect(animateCards ? 1.0 : 0.9)
                            .opacity(animateCards ? 1.0 : 0.0)
                            .animation(.easeOut(duration: 0.8).delay(1.0 + Double(index) * 0.1), value: animateCards)
                    }
                }
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Quick Actions")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                QuickActionCard(
                    title: "Add Photo",
                    icon: "camera.fill",
                    color: .blue,
                    action: { showPhotoUpload = true }
                )
                
                QuickActionCard(
                    title: "Create Memory",
                    icon: "calendar.badge.plus",
                    color: .purple,
                    action: { /* Navigate to create memory */ }
                )
            }
            .scaleEffect(animateCards ? 1.0 : 0.9)
            .opacity(animateCards ? 1.0 : 0.0)
            .animation(.easeOut(duration: 0.8).delay(1.2), value: animateCards)
        }
    }
    
    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12:
            return "Good Morning"
        case 12..<17:
            return "Good Afternoon"
        default:
            return "Good Evening"
        }
    }
    
    private func fetchDashboardData() async {
        isLoading = true
        
        async let photosTask = dataManager.fetchRecentPhotos(limit: 6)
        async let memoriesTask = dataManager.fetchUpcomingMemories(limit: 3)
        async let statsTask = dataManager.fetchDashboardStats()
        
        do {
            let (photos, memories, dashboardStats) = try await (photosTask, memoriesTask, statsTask)
            
            await MainActor.run {
                self.recentPhotos = photos
                self.upcomingMemories = memories
                self.stats = dashboardStats
                self.isLoading = false
            }
        } catch {
            print("Error fetching dashboard data: \(error)")
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
}

struct DashboardStats {
    var photos: Int = 0
    var memories: Int = 0
    var totalLove: Int = 0
    var categories: Int = 0
}

#Preview {
    DashboardView()
        .environmentObject(AuthManager())
        .environmentObject(DataManager())
        .environmentObject(LoveCounterManager())
}