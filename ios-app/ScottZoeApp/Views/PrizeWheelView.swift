//
//  PrizeWheelView.swift
//  Scott & Zoe Love Story
//
//  Interactive prize wheel with spinning animation
//

import SwiftUI

struct PrizeWheelView: View {
    @Binding var wheelRotation: Double
    @Binding var isSpinning: Bool
    let onSpin: (Int) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPrize: Int?
    
    private let prizes = [1, 2, 3, 5, 8, 13, 21, 34]
    private let colors: [Color] = [.red, .orange, .yellow, .green, .blue, .purple, .pink, .indigo]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 40) {
                Text("Prize Wheel")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text("Spin to win love points!")
                    .font(.headline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Wheel Container
                ZStack {
                    // Wheel Background
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.white, Color.gray.opacity(0.3)],
                                center: .center,
                                startRadius: 10,
                                endRadius: 150
                            )
                        )
                        .frame(width: 300, height: 300)
                        .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
                    
                    // Wheel Segments
                    ForEach(0..<prizes.count, id: \.self) { index in
                        WheelSegment(
                            prize: prizes[index],
                            color: colors[index],
                            angle: Double(index) * 45.0,
                            rotation: wheelRotation
                        )
                    }
                    
                    // Center Circle
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.white, .gray.opacity(0.5)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .shadow(color: .black.opacity(0.2), radius: 5, x: 0, y: 2)
                    
                    // Spin Button
                    Button(action: spinWheel) {
                        Text("SPIN")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    }
                    .disabled(isSpinning)
                }
                .rotationEffect(.degrees(wheelRotation))
                
                // Pointer
                VStack {
                    Triangle()
                        .fill(Color.red)
                        .frame(width: 20, height: 30)
                        .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
                    
                    Spacer()
                }
                .offset(y: -150)
                
                Spacer()
                
                // Prize Display
                if let prize = selectedPrize {
                    VStack(spacing: 8) {
                        Text("You Won!")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        
                        Text("\(prize) Love Points")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(.systemBackground))
                            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    )
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer()
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color(.systemBackground), Color(.systemGray6)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
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
    
    private func spinWheel() {
        guard !isSpinning else { return }
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
        impactFeedback.impactOccurred()
        
        isSpinning = true
        selectedPrize = nil
        
        // Calculate random rotation (multiple full rotations + random position)
        let baseRotation = Double.random(in: 1080...2160) // 3-6 full rotations
        let finalRotation = wheelRotation + baseRotation
        
        // Animate the spin
        withAnimation(.easeOut(duration: 3.0)) {
            wheelRotation = finalRotation
        }
        
        // Determine the winning prize after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            let normalizedRotation = finalRotation.truncatingRemainder(dividingBy: 360)
            let segmentAngle = 360.0 / Double(prizes.count)
            let prizeIndex = Int((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % prizes.count
            
            let wonPrize = prizes[prizeIndex]
            
            withAnimation(.spring()) {
                selectedPrize = wonPrize
            }
            
            // Success haptic
            let successFeedback = UINotificationFeedbackGenerator()
            successFeedback.notificationOccurred(.success)
            
            isSpinning = false
            onSpin(wonPrize)
        }
    }
}

struct WheelSegment: View {
    let prize: Int
    let color: Color
    let angle: Double
    let rotation: Double
    
    var body: some View {
        ZStack {
            // Segment Shape
            Path { path in
                let center = CGPoint(x: 150, y: 150)
                let radius: CGFloat = 150
                let startAngle = Angle.degrees(angle - 22.5)
                let endAngle = Angle.degrees(angle + 22.5)
                
                path.move(to: center)
                path.addArc(
                    center: center,
                    radius: radius,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    clockwise: false
                )
                path.closeSubpath()
            }
            .fill(color)
            .overlay(
                Path { path in
                    let center = CGPoint(x: 150, y: 150)
                    let radius: CGFloat = 150
                    let startAngle = Angle.degrees(angle - 22.5)
                    let endAngle = Angle.degrees(angle + 22.5)
                    
                    path.move(to: center)
                    path.addArc(
                        center: center,
                        radius: radius,
                        startAngle: startAngle,
                        endAngle: endAngle,
                        clockwise: false
                    )
                    path.closeSubpath()
                }
                .stroke(Color.white, lineWidth: 2)
            )
            
            // Prize Text
            Text("\(prize)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .shadow(color: .black.opacity(0.5), radius: 1, x: 0, y: 1)
                .offset(
                    x: cos(Angle.degrees(angle).radians) * 80,
                    y: sin(Angle.degrees(angle).radians) * 80
                )
        }
        .frame(width: 300, height: 300)
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.midX, y: rect.minY))
        
        return path
    }
}

#Preview {
    PrizeWheelView(
        wheelRotation: .constant(0),
        isSpinning: .constant(false),
        onSpin: { _ in }
    )
}