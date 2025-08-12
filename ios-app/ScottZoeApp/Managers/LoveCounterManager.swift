//
//  LoveCounterManager.swift
//  Scott & Zoe Love Story
//
//  Manages love counter functionality with local storage fallback
//

import SwiftUI
import Foundation

class LoveCounterManager: ObservableObject {
    @Published var loveStats: LoveStats = LoveStats()
    @Published var wheelStats: WheelStats = WheelStats()
    @Published var opportunityStats: OpportunityStats = OpportunityStats()
    @Published var isLoading = false
    @Published var showMilestoneAnimation = false
    
    private let dataManager = DataManager()
    private let userDefaults = UserDefaults.standard
    
    // Local storage keys
    private let loveCountKey = "localLoveCount"
    private let totalLoveCountKey = "localTotalLoveCount"
    private let lastWheelUseDateKey = "lastWheelUseDate"
    private let totalEarningsKey = "totalEarnings"
    private let unusedOpportunitiesKey = "unusedOpportunities"
    private let totalOpportunitiesKey = "totalOpportunities"
    
    init() {
        loadLocalData()
    }
    
    // MARK: - Data Loading
    
    func loadData() async {
        await MainActor.run {
            isLoading = true
        }
        
        do {
            async let loveStatsTask = dataManager.fetchLoveStats()
            async let wheelStatsTask = dataManager.fetchWheelStats()
            async let opportunityStatsTask = dataManager.fetchOpportunityStats()
            
            let (fetchedLoveStats, fetchedWheelStats, fetchedOpportunityStats) = try await (loveStatsTask, wheelStatsTask, opportunityStatsTask)
            
            await MainActor.run {
                self.loveStats = fetchedLoveStats
                self.wheelStats = fetchedWheelStats
                self.opportunityStats = fetchedOpportunityStats
                self.saveLocalData()
                self.isLoading = false
            }
        } catch {
            print("Failed to load love data: \(error)")
            await MainActor.run {
                self.loadLocalData()
                self.isLoading = false
            }
        }
    }
    
    private func loadLocalData() {
        let localCount = userDefaults.integer(forKey: loveCountKey)
        let localTotalCount = userDefaults.integer(forKey: totalLoveCountKey)
        let lastWheelDate = userDefaults.string(forKey: lastWheelUseDateKey)
        let earnings = userDefaults.integer(forKey: totalEarningsKey)
        let unusedOpps = userDefaults.integer(forKey: unusedOpportunitiesKey)
        let totalOpps = userDefaults.integer(forKey: totalOpportunitiesKey)
        
        loveStats = LoveStats(
            count: localCount,
            totalCount: localTotalCount,
            nextMilestone: calculateNextMilestone(for: localTotalCount),
            remainingToMilestone: calculateRemainingToMilestone(for: localTotalCount),
            currentLevel: calculateLevel(for: localTotalCount),
            progressPercent: calculateProgressPercent(for: localTotalCount),
            isMilestoneReached: false
        )
        
        wheelStats = WheelStats(
            canUseThisWeek: canUseWheelThisWeek(lastUsedDate: lastWheelDate),
            lastUsedDate: lastWheelDate,
            totalEarnings: earnings
        )
        
        opportunityStats = OpportunityStats(
            unused: unusedOpps,
            total: totalOpps
        )
    }
    
    private func saveLocalData() {
        userDefaults.set(loveStats.count, forKey: loveCountKey)
        userDefaults.set(loveStats.totalCount, forKey: totalLoveCountKey)
        userDefaults.set(wheelStats.lastUsedDate, forKey: lastWheelUseDateKey)
        userDefaults.set(wheelStats.totalEarnings, forKey: totalEarningsKey)
        userDefaults.set(opportunityStats.unused, forKey: unusedOpportunitiesKey)
        userDefaults.set(opportunityStats.total, forKey: totalOpportunitiesKey)
    }
    
    // MARK: - Love Counter Actions
    
    func incrementLove() async {
        let previousTotalCount = loveStats.totalCount
        
        // Optimistic update
        await MainActor.run {
            let newCount = loveStats.count + 1
            let newTotalCount = loveStats.totalCount + 1
            
            loveStats = LoveStats(
                count: newCount,
                totalCount: newTotalCount,
                nextMilestone: calculateNextMilestone(for: newTotalCount),
                remainingToMilestone: calculateRemainingToMilestone(for: newTotalCount),
                currentLevel: calculateLevel(for: newTotalCount),
                progressPercent: calculateProgressPercent(for: newTotalCount),
                isMilestoneReached: checkMilestoneReached(previous: previousTotalCount, current: newTotalCount)
            )
            
            if loveStats.isMilestoneReached {
                showMilestoneAnimation = true
                // Add opportunity for milestone
                opportunityStats = OpportunityStats(
                    unused: opportunityStats.unused + 1,
                    total: opportunityStats.total + 1
                )
            }
            
            saveLocalData()
        }
        
        // Try to sync with server
        do {
            let serverStats = try await dataManager.incrementLove()
            await MainActor.run {
                self.loveStats = serverStats
                self.saveLocalData()
            }
        } catch {
            print("Failed to sync love increment with server: \(error)")
            // Keep local changes
        }
    }
    
    // MARK: - Prize Wheel Actions
    
    func spinWheel() -> Int {
        let prizes = [1, 2, 3, 5, 8, 13, 21, 34]
        let weights = [30, 25, 20, 15, 5, 3, 1, 1] // Higher chance for smaller prizes
        
        let totalWeight = weights.reduce(0, +)
        let randomValue = Int.random(in: 1...totalWeight)
        
        var currentWeight = 0
        for (index, weight) in weights.enumerated() {
            currentWeight += weight
            if randomValue <= currentWeight {
                return prizes[index]
            }
        }
        
        return prizes[0] // Fallback
    }
    
    func useWheel(prizeAmount: Int) async {
        // Update local state immediately
        await MainActor.run {
            let currentDate = ISO8601DateFormatter().string(from: Date())
            wheelStats = WheelStats(
                canUseThisWeek: false,
                lastUsedDate: currentDate,
                totalEarnings: wheelStats.totalEarnings + prizeAmount
            )
            saveLocalData()
        }
        
        // Try to sync with server
        do {
            try await dataManager.useWheel(prizeAmount: prizeAmount)
        } catch {
            print("Failed to sync wheel use with server: \(error)")
            // Keep local changes
        }
    }
    
    func useOpportunity() async {
        guard opportunityStats.unused > 0 else { return }
        
        // Update local state immediately
        await MainActor.run {
            opportunityStats = OpportunityStats(
                unused: opportunityStats.unused - 1,
                total: opportunityStats.total
            )
            saveLocalData()
        }
        
        // Try to sync with server
        do {
            try await dataManager.useOpportunity()
        } catch {
            print("Failed to sync opportunity use with server: \(error)")
            // Keep local changes
        }
    }
    
    // MARK: - Helper Functions
    
    private func calculateNextMilestone(for totalCount: Int) -> Int {
        let milestones = [520, 1314, 2520, 5200, 10000, 20000, 52000, 131400]
        return milestones.first { $0 > totalCount } ?? (totalCount + 10000)
    }
    
    private func calculateRemainingToMilestone(for totalCount: Int) -> Int {
        let nextMilestone = calculateNextMilestone(for: totalCount)
        return nextMilestone - totalCount
    }
    
    private func calculateLevel(for totalCount: Int) -> Int {
        let milestones = [0, 520, 1314, 2520, 5200, 10000, 20000, 52000, 131400]
        for (index, milestone) in milestones.enumerated() {
            if totalCount < milestone {
                return index
            }
        }
        return milestones.count
    }
    
    private func calculateProgressPercent(for totalCount: Int) -> Double {
        let currentLevel = calculateLevel(for: totalCount)
        let milestones = [0, 520, 1314, 2520, 5200, 10000, 20000, 52000, 131400]
        
        if currentLevel == 0 {
            return Double(totalCount) / Double(milestones[1]) * 100
        } else if currentLevel < milestones.count {
            let previousMilestone = milestones[currentLevel - 1]
            let nextMilestone = milestones[currentLevel]
            let progress = Double(totalCount - previousMilestone) / Double(nextMilestone - previousMilestone)
            return progress * 100
        } else {
            return 100.0
        }
    }
    
    private func checkMilestoneReached(previous: Int, current: Int) -> Bool {
        let milestones = [520, 1314, 2520, 5200, 10000, 20000, 52000, 131400]
        return milestones.contains { previous < $0 && current >= $0 }
    }
    
    private func canUseWheelThisWeek(lastUsedDate: String?) -> Bool {
        guard let lastUsedDate = lastUsedDate,
              let lastDate = ISO8601DateFormatter().date(from: lastUsedDate) else {
            return true
        }
        
        let calendar = Calendar.current
        let now = Date()
        
        // Check if it's been a week since last use
        return calendar.dateInterval(of: .weekOfYear, for: lastDate) != calendar.dateInterval(of: .weekOfYear, for: now)
    }
    
    func dismissMilestoneAnimation() {
        showMilestoneAnimation = false
    }
}