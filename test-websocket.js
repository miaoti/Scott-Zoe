const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');
const axios = require('axios');

const API_URL = 'http://localhost:8080';
const WS_URL = 'http://localhost:8080';

// Test login and WebSocket connection
async function testWebSocketConnection() {
    try {
        console.log('Testing login with default credentials...');
        
        // First, try to login
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            username: 'scott',
            password: 'mmqqforever'
        });
        
        console.log('Login response status:', loginResponse.status);
        console.log('Login response data:', loginResponse.data);
        
        // Extract token from response
        const token = loginResponse.data.token || loginResponse.data.accessToken;
        
        if (!token) {
            console.error('No token received from login');
            return;
        }
        
        console.log('Login successful, token received');
        
        // Now test WebSocket connection
        console.log('Testing WebSocket connection...');
        
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
            debug: function (str) {
                console.log('STOMP Debug:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });
        
        stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
        
        stompClient.onConnect = function(frame) {
            console.log('WebSocket connected successfully!');
            console.log('Connected frame:', frame);
            
            // Subscribe to surprise box notifications
            stompClient.subscribe('/topic/surprise-box/notifications', function(message) {
                console.log('Received notification:', message.body);
            });
            
            // Send a test message
            stompClient.publish({
                destination: '/app/surprise-box/subscribe',
                body: JSON.stringify({ userId: 'scott' })
            });
            
            console.log('WebSocket test completed successfully!');
            
            // Disconnect after a short delay
            setTimeout(() => {
                stompClient.deactivate();
                console.log('WebSocket disconnected');
                process.exit(0);
            }, 3000);
        };
        
        stompClient.onStompError = function(frame) {
            console.error('WebSocket connection failed:', frame.headers['message']);
            console.error('Additional details:', frame.body);
            process.exit(1);
        };
        
        stompClient.onWebSocketError = function(event) {
            console.error('WebSocket error:', event);
            process.exit(1);
        };
        
        stompClient.onWebSocketClose = function(event) {
            console.log('WebSocket closed:', event);
        };
        
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.error('WebSocket connection timeout after 10 seconds');
            stompClient.deactivate();
            process.exit(1);
        }, 10000);
        
        stompClient.activate();
        
        // Clear timeout if connection succeeds
        const originalOnConnect = stompClient.onConnect;
        stompClient.onConnect = function(frame) {
            clearTimeout(timeout);
            originalOnConnect.call(this, frame);
        };
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
testWebSocketConnection();