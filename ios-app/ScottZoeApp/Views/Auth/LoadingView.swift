//
//  LoadingView.swift
//  Scott & Zoe Love Story
//
//  Beautiful loading screen with heart animations
//

import SwiftUI

struct LoadingView: View {
    @State private var heartScale: CGFloat = 0.8
    @State private var heartOpacity: Double = 0.5
    @State private var rotationAngle: Double = 0
    @State private var pulseScale: CGFloat = 1.0
    
    var body: some View {
        ZStack {
            // Gradient background
            LinearGradient(
                colors: [
                    Color.pink.opacity(0.1),
                    Color.purple.opacity(0.05),
                    Color.blue.opacity(0.1)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Animated heart logo
                ZStack {
                    // Pulsing background circle
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [.pink.opacity(0.3), .clear],
                                center: .center,
                                startRadius: 20,
                                endRadius: 80
                            )
                        )
                        .frame(width: 160, height: 160)
                        .scaleEffect(pulseScale)
                        .opacity(0.6)
                    
                    // Main heart
                    Image(systemName: "heart.fill")
                        .font(.system(size: 60, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.pink, .red],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .scaleEffect(heartScale)
                        .opacity(heartOpacity)
                        .rotationEffect(.degrees(rotationAngle))
                        .shadow(color: .pink.opacity(0.4), radius: 15, x: 0, y: 8)
                }
                
                // Loading text
                VStack(spacing: 12) {
                    Text("Scott & Zoe")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.primary, .secondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    
                    Text("Loading your love story...")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .opacity(heartOpacity)
                }
                
                // Custom loading indicator
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(Color.pink)
                            .frame(width: 8, height: 8)
                            .scaleEffect(heartScale)
                            .animation(
                                .easeInOut(duration: 0.6)
                                .repeatForever(autoreverses: true)
                                .delay(Double(index) * 0.2),
                                value: heartScale
                            )
                    }
                }
                .padding(.top, 20)
            }
        }
        .onAppear {
            startAnimations()
        }
    }
    
    private func startAnimations() {
        // Heart scale animation
        withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            heartScale = 1.2
        }
        
        // Heart opacity animation
        withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
            heartOpacity = 1.0
        }
        
        // Rotation animation
        withAnimation(.linear(duration: 8.0).repeatForever(autoreverses: false)) {
            rotationAngle = 360
        }
        
        // Pulse animation
        withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
            pulseScale = 1.3
        }
    }
}

#Preview {
    LoadingView()
}