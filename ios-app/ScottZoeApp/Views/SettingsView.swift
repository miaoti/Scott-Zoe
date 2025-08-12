//
//  SettingsView.swift
//  Scott & Zoe Love Story
//
//  Settings and relationship information view
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dataManager: DataManager
    @EnvironmentObject var loveCounterManager: LoveCounterManager
    @State private var showingLogoutAlert = false
    @State private var showingAbout = false
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            List {
                // Relationship Info Section
                Section {
                    RelationshipInfoCard(relationshipInfo: authManager.relationshipInfo)
                } header: {
                    Text("Relationship")
                }
                
                // App Info Section
                Section {
                    AppInfoRow()
                } header: {
                    Text("App Information")
                }
                
                // Data Management Section
                Section {
                    DataManagementRows(
                        onRefreshData: {
                            await refreshAllData()
                        },
                        onClearCache: {
                            clearLocalCache()
                        }
                    )
                } header: {
                    Text("Data Management")
                }
                
                // Account Section
                Section {
                    AccountRows(
                        onLogout: {
                            showingLogoutAlert = true
                        },
                        onAbout: {
                            showingAbout = true
                        }
                    )
                } header: {
                    Text("Account")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await refreshAllData()
            }
        }
        .alert("Sign Out", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Sign Out", role: .destructive) {
                authManager.logout()
            }
        } message: {
            Text("Are you sure you want to sign out?")
        }
        .sheet(isPresented: $showingAbout) {
            AboutView()
        }
    }
    
    private func refreshAllData() async {
        isLoading = true
        
        async let authTask = authManager.checkAuthenticationStatus()
        async let loveTask = loveCounterManager.loadData()
        
        await authTask
        await loveTask
        
        isLoading = false
    }
    
    private func clearLocalCache() {
        // Clear UserDefaults
        let defaults = UserDefaults.standard
        let keys = [
            "localLoveCount",
            "localTotalLoveCount",
            "lastWheelUseDate",
            "totalEarnings",
            "unusedOpportunities",
            "totalOpportunities"
        ]
        
        for key in keys {
            defaults.removeObject(forKey: key)
        }
        
        // Trigger data reload
        Task {
            await loveCounterManager.loadData()
        }
    }
}

struct RelationshipInfoCard: View {
    let relationshipInfo: RelationshipInfo?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Couple Names
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .font(.title2)
                
                Text(relationshipInfo?.coupleNames ?? "Scott & Zoe")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
            
            Divider()
            
            // Relationship Stats
            VStack(spacing: 12) {
                InfoRow(
                    icon: "calendar",
                    label: "Started",
                    value: formatStartDate(relationshipInfo?.startDate),
                    color: .blue
                )
                
                InfoRow(
                    icon: "clock",
                    label: "Days Together",
                    value: "\(relationshipInfo?.daysTogether ?? calculateDaysTogether())",
                    color: .green
                )
                
                InfoRow(
                    icon: "heart.circle",
                    label: "Years Together",
                    value: formatYearsTogether(relationshipInfo?.daysTogether),
                    color: .pink
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemGray6))
        )
        .listRowInsets(EdgeInsets())
        .listRowBackground(Color.clear)
    }
    
    private func formatStartDate(_ date: Date?) -> String {
        guard let date = date else { return "Unknown" }
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        return formatter.string(from: date)
    }
    
    private func calculateDaysTogether() -> Int {
        guard let startDate = relationshipInfo?.startDate else { return 0 }
        let calendar = Calendar.current
        return calendar.dateComponents([.day], from: startDate, to: Date()).day ?? 0
    }
    
    private func formatYearsTogether(_ days: Int?) -> String {
        guard let days = days else { return "0 years" }
        let years = Double(days) / 365.25
        return String(format: "%.1f years", years)
    }
}

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }
            
            Spacer()
        }
    }
}

struct AppInfoRow: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "heart.circle.fill")
                    .foregroundColor(.red)
                    .font(.title2)
                
                VStack(alignment: .leading) {
                    Text("Scott & Zoe Love Story")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Text("A beautiful app to track your love story, memories, and special moments together.")
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(nil)
        }
        .padding(.vertical, 4)
    }
}

struct DataManagementRows: View {
    let onRefreshData: () async -> Void
    let onClearCache: () -> Void
    
    var body: some View {
        Group {
            Button(action: {
                Task {
                    await onRefreshData()
                }
            }) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.blue)
                    
                    Text("Refresh Data")
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
            }
            
            Button(action: onClearCache) {
                HStack {
                    Image(systemName: "trash")
                        .foregroundColor(.orange)
                    
                    Text("Clear Local Cache")
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
            }
        }
    }
}

struct AccountRows: View {
    let onLogout: () -> Void
    let onAbout: () -> Void
    
    var body: some View {
        Group {
            Button(action: onAbout) {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundColor(.blue)
                    
                    Text("About")
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
            
            Button(action: onLogout) {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .foregroundColor(.red)
                    
                    Text("Sign Out")
                        .foregroundColor(.red)
                    
                    Spacer()
                }
            }
        }
    }
}

struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // App Icon and Title
                    VStack(spacing: 16) {
                        Image(systemName: "heart.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.red)
                        
                        Text("Scott & Zoe Love Story")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("Version 1.0.0")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top)
                    
                    // Description
                    VStack(alignment: .leading, spacing: 12) {
                        Text("About This App")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("Scott & Zoe Love Story is a beautiful app designed to help couples track their love journey, create lasting memories, and celebrate special moments together.")
                            .font(.body)
                            .lineSpacing(4)
                    }
                    
                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Features")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            FeatureRow(icon: "photo", text: "Photo Gallery with Categories")
                            FeatureRow(icon: "heart.fill", text: "Interactive Love Counter")
                            FeatureRow(icon: "calendar", text: "Memory Tracking")
                            FeatureRow(icon: "gamecontroller", text: "Prize Wheel Game")
                            FeatureRow(icon: "chart.line.uptrend.xyaxis", text: "Relationship Statistics")
                        }
                    }
                    
                    // Credits
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Made with Love")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("Created for Scott & Zoe to celebrate their beautiful love story. May this app help you cherish every moment together! ❤️")
                            .font(.body)
                            .lineSpacing(4)
                            .italic()
                    }
                }
                .padding()
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .font(.title3)
                .frame(width: 24)
            
            Text(text)
                .font(.body)
                .foregroundColor(.primary)
            
            Spacer()
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager())
        .environmentObject(DataManager())
        .environmentObject(LoveCounterManager())
}