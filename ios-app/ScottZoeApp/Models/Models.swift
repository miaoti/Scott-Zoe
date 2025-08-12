//
//  Models.swift
//  Scott & Zoe Love Story
//
//  Data models for the application
//

import SwiftUI
import Foundation

// MARK: - Photo Model

struct Photo: Identifiable, Codable {
    let id: Int
    let url: String
    let caption: String?
    let uploadDate: Date
    let isFavorite: Bool
    let categories: [Category]
    
    init?(from dict: [String: Any]) {
        guard let id = dict["id"] as? Int,
              let url = dict["url"] as? String else {
            return nil
        }
        
        self.id = id
        self.url = url
        self.caption = dict["caption"] as? String
        self.isFavorite = dict["isFavorite"] as? Bool ?? false
        
        // Parse upload date
        if let dateString = dict["uploadDate"] as? String {
            let formatter = ISO8601DateFormatter()
            self.uploadDate = formatter.date(from: dateString) ?? Date()
        } else {
            self.uploadDate = Date()
        }
        
        // Parse categories
        if let categoriesData = dict["categories"] as? [[String: Any]] {
            self.categories = categoriesData.compactMap { Category(from: $0) }
        } else {
            self.categories = []
        }
    }
}

// MARK: - Memory Model

struct Memory: Identifiable, Codable {
    let id: Int
    let title: String
    let description: String
    let date: Date
    let type: MemoryType
    let createdAt: Date
    
    init?(from dict: [String: Any]) {
        guard let id = dict["id"] as? Int,
              let title = dict["title"] as? String,
              let description = dict["description"] as? String else {
            return nil
        }
        
        self.id = id
        self.title = title
        self.description = description
        
        // Parse memory date
        if let dateString = dict["date"] as? String {
            let formatter = ISO8601DateFormatter()
            self.date = formatter.date(from: dateString) ?? Date()
        } else {
            self.date = Date()
        }
        
        // Parse created date
        if let createdString = dict["createdAt"] as? String {
            let formatter = ISO8601DateFormatter()
            self.createdAt = formatter.date(from: createdString) ?? Date()
        } else {
            self.createdAt = Date()
        }
        
        // Parse memory type
        if let typeString = dict["type"] as? String {
            self.type = MemoryType(rawValue: typeString) ?? .special
        } else {
            self.type = .special
        }
    }
}

enum MemoryType: String, CaseIterable, Codable {
    case anniversary = "ANNIVERSARY"
    case birthday = "BIRTHDAY"
    case special = "SPECIAL"
    case milestone = "MILESTONE"
    case holiday = "HOLIDAY"
    
    var displayName: String {
        switch self {
        case .anniversary: return "Anniversary"
        case .birthday: return "Birthday"
        case .special: return "Special"
        case .milestone: return "Milestone"
        case .holiday: return "Holiday"
        }
    }
    
    var icon: String {
        switch self {
        case .anniversary: return "heart.fill"
        case .birthday: return "gift.fill"
        case .special: return "star.fill"
        case .milestone: return "flag.fill"
        case .holiday: return "party.popper.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .anniversary: return .red
        case .birthday: return .blue
        case .special: return .purple
        case .milestone: return .green
        case .holiday: return .orange
        }
    }
}

// MARK: - Category Model

struct Category: Identifiable, Codable {
    let id: Int
    let name: String
    let description: String?
    let color: String
    let photoCount: Int
    
    init?(from dict: [String: Any]) {
        guard let id = dict["id"] as? Int,
              let name = dict["name"] as? String else {
            return nil
        }
        
        self.id = id
        self.name = name
        self.description = dict["description"] as? String
        self.color = dict["color"] as? String ?? "#FF69B4"
        self.photoCount = dict["photoCount"] as? Int ?? 0
    }
    
    var swiftUIColor: Color {
        Color(hex: color) ?? .pink
    }
}

// MARK: - Love Stats Model

struct LoveStats: Codable {
    let count: Int
    let totalCount: Int
    let nextMilestone: Int
    let remainingToMilestone: Int
    let currentLevel: Int
    let progressPercent: Double
    let isMilestoneReached: Bool
    
    init(
        count: Int = 0,
        totalCount: Int = 0,
        nextMilestone: Int = 520,
        remainingToMilestone: Int = 520,
        currentLevel: Int = 1,
        progressPercent: Double = 0.0,
        isMilestoneReached: Bool = false
    ) {
        self.count = count
        self.totalCount = totalCount
        self.nextMilestone = nextMilestone
        self.remainingToMilestone = remainingToMilestone
        self.currentLevel = currentLevel
        self.progressPercent = progressPercent
        self.isMilestoneReached = isMilestoneReached
    }
}

// MARK: - Wheel Stats Model

struct WheelStats: Codable {
    let canUseThisWeek: Bool
    let lastUsedDate: String?
    let totalEarnings: Int
    
    init(
        canUseThisWeek: Bool = true,
        lastUsedDate: String? = nil,
        totalEarnings: Int = 0
    ) {
        self.canUseThisWeek = canUseThisWeek
        self.lastUsedDate = lastUsedDate
        self.totalEarnings = totalEarnings
    }
}

// MARK: - Opportunity Stats Model

struct OpportunityStats: Codable {
    let unused: Int
    let total: Int
    
    init(unused: Int = 0, total: Int = 0) {
        self.unused = unused
        self.total = total
    }
}

// MARK: - Dashboard Stats Model

struct DashboardStats {
    let photos: Int
    let memories: Int
    let totalLove: Int
    let categories: Int
    
    init(
        photos: Int = 0,
        memories: Int = 0,
        totalLove: Int = 0,
        categories: Int = 0
    ) {
        self.photos = photos
        self.memories = memories
        self.totalLove = totalLove
        self.categories = categories
    }
}

// MARK: - Relationship Info Model

struct RelationshipInfo: Codable {
    let startDate: Date
    let daysTogether: Int
    let coupleNames: String
    
    init?(from dict: [String: Any]) {
        guard let startDateString = dict["startDate"] as? String,
              let daysTogether = dict["daysTogether"] as? Int else {
            return nil
        }
        
        let formatter = ISO8601DateFormatter()
        self.startDate = formatter.date(from: startDateString) ?? Date()
        self.daysTogether = daysTogether
        self.coupleNames = dict["coupleNames"] as? String ?? "Scott & Zoe"
    }
    
    init(
        startDate: Date = Date(),
        daysTogether: Int = 0,
        coupleNames: String = "Scott & Zoe"
    ) {
        self.startDate = startDate
        self.daysTogether = daysTogether
        self.coupleNames = coupleNames
    }
}

// MARK: - Color Extension

extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}