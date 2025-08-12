//
//  ScottZoeApp.swift
//  Scott & Zoe Love Story
//
//  Created by AI Assistant
//  Copyright © 2024 Scott & Zoe. All rights reserved.
//

import SwiftUI

@main
struct ScottZoeApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var dataManager = DataManager()
    @StateObject private var loveCounterManager = LoveCounterManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(dataManager)
                .environmentObject(loveCounterManager)
                .preferredColorScheme(.light)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(DataManager())
        .environmentObject(LoveCounterManager())
}