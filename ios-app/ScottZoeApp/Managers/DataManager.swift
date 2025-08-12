//
//  DataManager.swift
//  Scott & Zoe Love Story
//
//  Manages all data operations and API calls
//

import SwiftUI
import Foundation

class DataManager: ObservableObject {
    @Published var photos: [Photo] = []
    @Published var memories: [Memory] = []
    @Published var categories: [Category] = []
    @Published var isLoading = false
    
    // MARK: - Photos
    
    func fetchPhotos(page: Int = 0, limit: Int = 50) async throws -> [Photo] {
        let response = try await APIClient.shared.get("/api/photos?page=\(page)&limit=\(limit)")
        
        // Handle both old and new API response formats
        let photosData: [[String: Any]]
        if let photos = response["photos"] as? [[String: Any]] {
            photosData = photos
        } else if let photos = response as? [[String: Any]] {
            photosData = photos
        } else {
            photosData = []
        }
        
        return photosData.compactMap { Photo(from: $0) }
    }
    
    func fetchRecentPhotos(limit: Int = 6) async throws -> [Photo] {
        let photos = try await fetchPhotos(page: 0, limit: limit)
        return Array(photos.prefix(limit))
    }
    
    func uploadPhoto(imageData: Data, caption: String? = nil, categories: [Int] = []) async throws -> Photo {
        let response = try await APIClient.shared.uploadPhoto(imageData, caption: caption, categories: categories)
        guard let photo = Photo(from: response) else {
            throw APIError.invalidData
        }
        return photo
    }
    
    func togglePhotoFavorite(photoId: Int) async throws {
        _ = try await APIClient.shared.post("/api/photos/\(photoId)/favorite")
    }
    
    func deletePhoto(photoId: Int) async throws {
        _ = try await APIClient.shared.delete("/api/photos/\(photoId)")
    }
    
    // MARK: - Memories
    
    func fetchMemories() async throws -> [Memory] {
        let response = try await APIClient.shared.get("/api/memories")
        
        if let memoriesData = response as? [[String: Any]] {
            return memoriesData.compactMap { Memory(from: $0) }
        }
        return []
    }
    
    func fetchUpcomingMemories(limit: Int = 3) async throws -> [Memory] {
        do {
            let response = try await APIClient.shared.get("/api/memories/upcoming")
            
            if let memoriesData = response as? [[String: Any]] {
                let memories = memoriesData.compactMap { Memory(from: $0) }
                return Array(memories.prefix(limit))
            }
        } catch {
            // Fallback to all memories if upcoming endpoint doesn't exist
            let allMemories = try await fetchMemories()
            return Array(allMemories.prefix(limit))
        }
        return []
    }
    
    func createMemory(title: String, description: String, date: Date, type: MemoryType) async throws -> Memory {
        let formatter = ISO8601DateFormatter()
        let memoryData: [String: Any] = [
            "title": title,
            "description": description,
            "date": formatter.string(from: date),
            "type": type.rawValue
        ]
        
        let response = try await APIClient.shared.post("/api/memories", body: memoryData)
        guard let memory = Memory(from: response) else {
            throw APIError.invalidData
        }
        return memory
    }
    
    func updateMemory(id: Int, title: String, description: String, date: Date, type: MemoryType) async throws -> Memory {
        let formatter = ISO8601DateFormatter()
        let memoryData: [String: Any] = [
            "title": title,
            "description": description,
            "date": formatter.string(from: date),
            "type": type.rawValue
        ]
        
        let response = try await APIClient.shared.put("/api/memories/\(id)", body: memoryData)
        guard let memory = Memory(from: response) else {
            throw APIError.invalidData
        }
        return memory
    }
    
    func deleteMemory(id: Int) async throws {
        _ = try await APIClient.shared.delete("/api/memories/\(id)")
    }
    
    // MARK: - Categories
    
    func fetchCategories() async throws -> [Category] {
        let response = try await APIClient.shared.get("/api/categories")
        
        if let categoriesData = response as? [[String: Any]] {
            return categoriesData.compactMap { Category(from: $0) }
        }
        return []
    }
    
    func createCategory(name: String, description: String?, color: String) async throws -> Category {
        let categoryData: [String: Any] = [
            "name": name,
            "description": description ?? "",
            "color": color
        ]
        
        let response = try await APIClient.shared.post("/api/categories", body: categoryData)
        guard let category = Category(from: response) else {
            throw APIError.invalidData
        }
        return category
    }
    
    func updateCategory(id: Int, name: String, description: String?, color: String) async throws -> Category {
        let categoryData: [String: Any] = [
            "name": name,
            "description": description ?? "",
            "color": color
        ]
        
        let response = try await APIClient.shared.put("/api/categories/\(id)", body: categoryData)
        guard let category = Category(from: response) else {
            throw APIError.invalidData
        }
        return category
    }
    
    func deleteCategory(id: Int) async throws {
        _ = try await APIClient.shared.delete("/api/categories/\(id)")
    }
    
    // MARK: - Dashboard Stats
    
    func fetchDashboardStats() async throws -> DashboardStats {
        async let photosTask = fetchPhotos(page: 0, limit: 1)
        async let memoriesTask = fetchMemories()
        async let categoriesTask = fetchCategories()
        async let loveStatsTask = fetchLoveStats()
        
        do {
            let (photos, memories, categories, loveStats) = try await (photosTask, memoriesTask, categoriesTask, loveStatsTask)
            
            return DashboardStats(
                photos: photos.count,
                memories: memories.count,
                totalLove: loveStats.totalCount,
                categories: categories.count
            )
        } catch {
            // Return default stats if any request fails
            return DashboardStats()
        }
    }
    
    // MARK: - Love Stats
    
    func fetchLoveStats() async throws -> LoveStats {
        let response = try await APIClient.shared.get("/api/love")
        
        return LoveStats(
            count: response["count"] as? Int ?? 0,
            totalCount: response["totalCount"] as? Int ?? 0,
            nextMilestone: response["nextMilestone"] as? Int ?? 520,
            remainingToMilestone: response["remainingToMilestone"] as? Int ?? 520,
            currentLevel: response["currentLevel"] as? Int ?? 1,
            progressPercent: response["progressPercent"] as? Double ?? 0.0,
            isMilestoneReached: response["isMilestoneReached"] as? Bool ?? false
        )
    }
    
    func incrementLove() async throws -> LoveStats {
        let response = try await APIClient.shared.post("/api/love/increment")
        
        return LoveStats(
            count: response["count"] as? Int ?? 0,
            totalCount: response["totalCount"] as? Int ?? 0,
            nextMilestone: response["nextMilestone"] as? Int ?? 520,
            remainingToMilestone: response["remainingToMilestone"] as? Int ?? 520,
            currentLevel: response["currentLevel"] as? Int ?? 1,
            progressPercent: response["progressPercent"] as? Double ?? 0.0,
            isMilestoneReached: response["isMilestoneReached"] as? Bool ?? false
        )
    }
    
    // MARK: - Prize Wheel
    
    func fetchWheelStats() async throws -> WheelStats {
        let response = try await APIClient.shared.get("/api/wheel/stats")
        
        return WheelStats(
            canUseThisWeek: response["canUseThisWeek"] as? Bool ?? true,
            lastUsedDate: response["lastUsedDate"] as? String,
            totalEarnings: response["totalEarnings"] as? Int ?? 0
        )
    }
    
    func useWheel(prizeAmount: Int, source: String = "weekly") async throws {
        let wheelData: [String: Any] = [
            "prizeAmount": prizeAmount,
            "source": source
        ]
        
        _ = try await APIClient.shared.post("/api/wheel/use", body: wheelData)
    }
    
    func fetchOpportunityStats() async throws -> OpportunityStats {
        let response = try await APIClient.shared.get("/api/opportunities/stats")
        
        return OpportunityStats(
            unused: response["unused"] as? Int ?? 0,
            total: response["total"] as? Int ?? 0
        )
    }
    
    func useOpportunity() async throws {
        _ = try await APIClient.shared.post("/api/opportunities/use")
    }
}