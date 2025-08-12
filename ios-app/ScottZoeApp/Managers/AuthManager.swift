//
//  AuthManager.swift
//  Scott & Zoe Love Story
//
//  Handles authentication state and API communication
//

import SwiftUI
import Foundation

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var relationshipInfo: RelationshipInfo?
    
    private let baseURL = "https://scott-zoe-production.up.railway.app"
    private let keychain = KeychainHelper()
    
    init() {
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        // Check if we have a stored token
        if let token = keychain.get("auth_token") {
            // Validate token with backend
            validateToken(token)
        } else {
            isLoading = false
        }
    }
    
    func login(password: String) async {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            let loginData = ["password": password]
            let response = try await APIClient.shared.post("/auth/login", body: loginData)
            
            if let token = response["token"] as? String {
                // Store token securely
                keychain.set(token, forKey: "auth_token")
                
                await MainActor.run {
                    self.isAuthenticated = true
                    self.isLoading = false
                }
                
                // Fetch relationship info
                await fetchRelationshipInfo()
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
            print("Login error: \(error)")
        }
    }
    
    func logout() {
        keychain.delete("auth_token")
        isAuthenticated = false
        relationshipInfo = nil
    }
    
    private func validateToken(_ token: String) {
        Task {
            do {
                // Try to fetch relationship info to validate token
                let response = try await APIClient.shared.get("/auth/relationship-info")
                
                await MainActor.run {
                    self.isAuthenticated = true
                    self.isLoading = false
                }
                
                // Parse relationship info
                if let startDateString = response["startDate"] as? String,
                   let daysTogether = response["daysTogether"] as? Int,
                   let names = response["names"] as? [String] {
                    
                    await MainActor.run {
                        self.relationshipInfo = RelationshipInfo(
                            startDate: startDateString,
                            daysTogether: daysTogether,
                            names: names
                        )
                    }
                }
            } catch {
                // Token is invalid
                keychain.delete("auth_token")
                await MainActor.run {
                    self.isAuthenticated = false
                    self.isLoading = false
                }
            }
        }
    }
    
    private func fetchRelationshipInfo() async {
        do {
            let response = try await APIClient.shared.get("/auth/relationship-info")
            
            if let startDateString = response["startDate"] as? String,
               let daysTogether = response["daysTogether"] as? Int,
               let names = response["names"] as? [String] {
                
                await MainActor.run {
                    self.relationshipInfo = RelationshipInfo(
                        startDate: startDateString,
                        daysTogether: daysTogether,
                        names: names
                    )
                }
            }
        } catch {
            print("Failed to fetch relationship info: \(error)")
        }
    }
}

struct RelationshipInfo {
    let startDate: String
    let daysTogether: Int
    let names: [String]
    
    var formattedStartDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        if let date = formatter.date(from: startDate) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .long
            return displayFormatter.string(from: date)
        }
        return startDate
    }
    
    var coupleNames: String {
        return names.joined(separator: " & ")
    }
}