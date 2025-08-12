//
//  MainTabView.swift
//  Scott & Zoe Love Story
//
//  Main tab navigation view
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dataManager: DataManager
    @EnvironmentObject var loveCounterManager: LoveCounterManager
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard Tab
            DashboardView()
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "house.fill" : "house")
                    Text("Home")
                }
                .tag(0)
            
            // Photo Gallery Tab
            PhotoGalleryView()
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "photo.fill" : "photo")
                    Text("Photos")
                }
                .tag(1)
            
            // Love Counter Tab (Center)
            LoveCounterView()
                .tabItem {
                    Image(systemName: selectedTab == 2 ? "heart.fill" : "heart")
                    Text("Love")
                }
                .tag(2)
            
            // Memories Tab
            MemoriesView()
                .tabItem {
                    Image(systemName: selectedTab == 3 ? "calendar.circle.fill" : "calendar.circle")
                    Text("Memories")
                }
                .tag(3)
            
            // Settings Tab
            SettingsView()
                .tabItem {
                    Image(systemName: selectedTab == 4 ? "gearshape.fill" : "gearshape")
                    Text("Settings")
                }
                .tag(4)
        }
        .accentColor(.pink)
        .onAppear {
            // Customize tab bar appearance
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.systemBackground
            
            // Add subtle shadow
            appearance.shadowColor = UIColor.black.withAlphaComponent(0.1)
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager())
        .environmentObject(DataManager())
        .environmentObject(LoveCounterManager())
}