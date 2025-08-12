//
//  LoveCounterView.swift
//  Scott & Zoe Love Story
//
//  Love counter with interactive features and prize wheel
//

import SwiftUI

struct LoveCounterView: View {
    @EnvironmentObject var loveCounterManager: LoveCounterManager
    @State private var isAnimating = false
    @State private var showingWheel = false
    @State private var wheelRotation: Double = 0
    @State private var isSpinning = false
    @State private var selectedPrize: Int?
    @State private var showingPrizeAlert = false
    @State private var heartAnimations: [HeartAnimation] = []
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Love Stats Card
                    LoveStatsCard(
                        loveStats: loveCounterManager.loveStats,
                        isAnimating: $isAnimating
                    )
                    
                    // Love Button
                    LoveButton(
                        onTap: {
                            addLove()
                        },
                        isAnimating: $isAnimating
                    )
                    
                    // Prize Wheel Section
                    PrizeWheelCard(
                        wheelStats: loveCounterManager.wheelStats,
                        opportunityStats: loveCounterManager.opportunityStats,
                        onSpinWheel: {
                            showingWheel = true
                        },
                        onUseOpportunity: {
                            useOpportunity()
                        }
                    )
                    
                    // Progress Section
                    ProgressCard(loveStats: loveCounterManager.loveStats)
                }
                .padding()
            }
            .navigationTitle("Love Counter")
            .navigationBarTitleDisplayMode(.large)
            .background(
                LinearGradient(
                    colors: [Color(.systemBackground), Color(.systemPink).opacity(0.1)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                // Floating hearts animation
                ForEach(heartAnimations, id: \.id) { heart in
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.title2)
                        .position(heart.position)
                        .opacity(heart.opacity)
                        .scaleEffect(heart.scale)
                }
            )
        }
        .sheet(isPresented: $showingWheel) {
            PrizeWheelView(
                wheelRotation: $wheelRotation,
                isSpinning: $isSpinning,
                onSpin: { prize in
                    selectedPrize = prize
                    showingPrizeAlert = true
                    Task {
                        await loveCounterManager.useWheel(prizeAmount: prize)
                    }
                }
            )
        }
        .alert("Congratulations!", isPresented: $showingPrizeAlert) {
            Button("Awesome!") {
                selectedPrize = nil
            }
        } message: {
            if let prize = selectedPrize {
                Text("You won \(prize) love points! 🎉")
            }
        }
        .alert("Milestone Reached!", isPresented: $loveCounterManager.showMilestoneAnimation) {
            Button("Amazing!") {
                loveCounterManager.dismissMilestoneAnimation()
            }
        } message: {
            Text("You've reached a new love milestone! You earned a wheel opportunity! 🎊")
        }
        .task {
            await loveCounterManager.loadData()
        }
        .refreshable {
            await loveCounterManager.loadData()
        }
    }
    
    private func addLove() {
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        // Animation
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            isAnimating = true
        }
        
        // Create floating heart
        createFloatingHeart()
        
        // Increment love
        Task {
            await loveCounterManager.incrementLove()
        }
        
        // Reset animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            isAnimating = false
        }
    }
    
    private func useOpportunity() {
        Task {
            await loveCounterManager.useOpportunity()
            showingWheel = true
        }
    }
    
    private func createFloatingHeart() {
        let heart = HeartAnimation(
            id: UUID(),
            position: CGPoint(x: UIScreen.main.bounds.width / 2, y: UIScreen.main.bounds.height * 0.6),
            opacity: 1.0,
            scale: 1.0
        )
        
        heartAnimations.append(heart)
        
        withAnimation(.easeOut(duration: 2.0)) {
            if let index = heartAnimations.firstIndex(where: { $0.id == heart.id }) {
                heartAnimations[index].position.y -= 200
                heartAnimations[index].opacity = 0
                heartAnimations[index].scale = 1.5
            }
        }
        
        // Remove heart after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            heartAnimations.removeAll { $0.id == heart.id }
        }
    }
}

struct LoveStatsCard: View {
    let loveStats: LoveStats
    @Binding var isAnimating: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // Current Love Count
            VStack(spacing: 4) {
                Text("Current Love")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                Text("\(loveStats.count)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                    .scaleEffect(isAnimating ? 1.2 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isAnimating)
            }
            
            Divider()
            
            // Stats Row
            HStack(spacing: 24) {
                StatItem(title: "Total Love", value: "\(loveStats.totalCount)")
                StatItem(title: "Level", value: "\(loveStats.currentLevel)")
                StatItem(title: "Next Milestone", value: "\(loveStats.nextMilestone)")
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct StatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
        }
    }
}

struct LoveButton: View {
    let onTap: () -> Void
    @Binding var isAnimating: Bool
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.white)
                    .scaleEffect(isAnimating ? 1.3 : 1.0)
                
                Text("Tap to Love")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            .frame(width: 160, height: 160)
            .background(
                LinearGradient(
                    colors: [.pink, .red],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(Circle())
            .shadow(color: .red.opacity(0.4), radius: 20, x: 0, y: 10)
            .scaleEffect(isAnimating ? 0.95 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct PrizeWheelCard: View {
    let wheelStats: WheelStats
    let opportunityStats: OpportunityStats
    let onSpinWheel: () -> Void
    let onUseOpportunity: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Prize Wheel")
                .font(.title2)
                .fontWeight(.bold)
            
            HStack(spacing: 24) {
                VStack {
                    Text("Total Earnings")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(wheelStats.totalEarnings)")
                        .font(.title3)
                        .fontWeight(.semibold)
                }
                
                VStack {
                    Text("Opportunities")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(opportunityStats.unused)")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                }
            }
            
            HStack(spacing: 12) {
                if wheelStats.canUseThisWeek {
                    Button("Weekly Spin") {
                        onSpinWheel()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                } else {
                    Text("Weekly spin used")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding()
                        .background(Color(.systemGray5))
                        .cornerRadius(8)
                }
                
                if opportunityStats.unused > 0 {
                    Button("Use Opportunity") {
                        onUseOpportunity()
                    }
                    .buttonStyle(SecondaryButtonStyle())
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct ProgressCard: View {
    let loveStats: LoveStats
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress to Next Milestone")
                .font(.headline)
                .fontWeight(.semibold)
            
            ProgressView(value: loveStats.progressPercent / 100.0) {
                HStack {
                    Text("\(loveStats.totalCount)")
                    Spacer()
                    Text("\(loveStats.nextMilestone)")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .tint(.pink)
            
            Text("\(loveStats.remainingToMilestone) more to go!")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.orange)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.orange, lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct HeartAnimation {
    let id: UUID
    var position: CGPoint
    var opacity: Double
    var scale: Double
}

#Preview {
    LoveCounterView()
        .environmentObject(LoveCounterManager())
}