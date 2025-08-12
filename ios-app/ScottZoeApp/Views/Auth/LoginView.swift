//
//  LoginView.swift
//  Scott & Zoe Love Story
//
//  Beautiful login screen with Apple-style design
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var password = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var heartScale: CGFloat = 1.0
    @State private var heartRotation: Double = 0
    @State private var showHearts = false
    
    var body: some View {
        GeometryReader { geometry in
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
                
                // Floating hearts animation
                if showHearts {
                    ForEach(0..<6, id: \.self) { index in
                        Image(systemName: "heart.fill")
                            .foregroundColor(.pink.opacity(0.3))
                            .font(.system(size: CGFloat.random(in: 20...40)))
                            .position(
                                x: CGFloat.random(in: 0...geometry.size.width),
                                y: CGFloat.random(in: 0...geometry.size.height)
                            )
                            .animation(
                                .easeInOut(duration: Double.random(in: 2...4))
                                .repeatForever(autoreverses: true)
                                .delay(Double(index) * 0.5),
                                value: showHearts
                            )
                    }
                }
                
                ScrollView {
                    VStack(spacing: 40) {
                        Spacer(minLength: 60)
                        
                        // Logo and title section
                        VStack(spacing: 24) {
                            // Animated heart logo
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [.pink.opacity(0.2), .purple.opacity(0.1)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 120, height: 120)
                                    .blur(radius: 20)
                                
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
                                    .rotationEffect(.degrees(heartRotation))
                                    .shadow(color: .pink.opacity(0.3), radius: 10, x: 0, y: 5)
                            }
                            
                            VStack(spacing: 12) {
                                Text("Scott & Zoe")
                                    .font(.system(size: 36, weight: .bold, design: .rounded))
                                    .foregroundStyle(
                                        LinearGradient(
                                            colors: [.primary, .secondary],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                
                                Text("Our Love Story")
                                    .font(.title2)
                                    .fontWeight(.medium)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .onAppear {
                            // Start heart animation
                            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                                heartScale = 1.1
                            }
                            
                            withAnimation(.linear(duration: 10).repeatForever(autoreverses: false)) {
                                heartRotation = 360
                            }
                            
                            // Show floating hearts after a delay
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                                withAnimation(.easeInOut(duration: 2)) {
                                    showHearts = true
                                }
                            }
                        }
                        
                        // Login form
                        VStack(spacing: 24) {
                            VStack(spacing: 16) {
                                Text("Welcome Back")
                                    .font(.title)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.primary)
                                
                                Text("Enter your password to continue")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                            
                            // Password field
                            VStack(spacing: 12) {
                                SecureField("Password", text: $password)
                                    .textFieldStyle(CustomTextFieldStyle())
                                    .onSubmit {
                                        Task {
                                            await handleLogin()
                                        }
                                    }
                                
                                // Login button
                                Button(action: {
                                    Task {
                                        await handleLogin()
                                    }
                                }) {
                                    HStack {
                                        if isLoading {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                                .scaleEffect(0.8)
                                        } else {
                                            Image(systemName: "heart.fill")
                                                .font(.system(size: 16, weight: .medium))
                                        }
                                        
                                        Text(isLoading ? "Signing In..." : "Sign In")
                                            .font(.headline)
                                            .fontWeight(.semibold)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 56)
                                    .background(
                                        LinearGradient(
                                            colors: [.pink, .red],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .foregroundColor(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                                    .shadow(color: .pink.opacity(0.3), radius: 8, x: 0, y: 4)
                                }
                                .disabled(isLoading || password.isEmpty)
                                .opacity(password.isEmpty ? 0.6 : 1.0)
                                .scaleEffect(isLoading ? 0.98 : 1.0)
                                .animation(.easeInOut(duration: 0.2), value: isLoading)
                            }
                        }
                        .padding(.horizontal, 32)
                        
                        Spacer(minLength: 40)
                    }
                }
            }
        }
        .alert("Login Failed", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func handleLogin() async {
        guard !password.isEmpty else { return }
        
        isLoading = true
        
        // Add haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        do {
            await authManager.login(password: password)
            
            if !authManager.isAuthenticated {
                errorMessage = "Invalid password. Please try again."
                showError = true
                
                // Error haptic feedback
                let errorFeedback = UINotificationFeedbackGenerator()
                errorFeedback.notificationOccurred(.error)
            } else {
                // Success haptic feedback
                let successFeedback = UINotificationFeedbackGenerator()
                successFeedback.notificationOccurred(.success)
            }
        } catch {
            errorMessage = "Login failed. Please check your connection and try again."
            showError = true
            
            // Error haptic feedback
            let errorFeedback = UINotificationFeedbackGenerator()
            errorFeedback.notificationOccurred(.error)
        }
        
        isLoading = false
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.systemGray6))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(.systemGray4), lineWidth: 1)
                    )
            )
            .font(.body)
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthManager())
}