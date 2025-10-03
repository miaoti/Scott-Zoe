# Box Functionality Test Plan

## Test Users
- Username: scott, Password: mmqqforever
- Username: zoe, Password: mmqqforever

## Test Cases

### 1. Box Creation Limitation Test
**Objective**: Verify users cannot create multiple active boxes

**Steps**:
1. Login as 'scott'
2. Create a new surprise box for 'zoe' with custom drop delay (e.g., 30 minutes)
3. Verify the box is created successfully
4. Try to create another box while the first one is still active
5. Verify the create button is disabled and shows appropriate message
6. Check backend validation by attempting API call directly

**Expected Results**:
- First box creation succeeds
- Create button becomes disabled after first box
- Tooltip shows "You already have an active box"
- Backend returns error if API called directly

### 2. Drop Countdown Timer Test
**Objective**: Verify countdown uses actual backend dropAt timestamp

**Steps**:
1. Create a box with custom drop delay (e.g., 10 minutes for quick testing)
2. Note the countdown timer display
3. Verify countdown matches the dropDelayMinutes set during creation
4. Wait for countdown to reach zero
5. Verify box status changes to 'DROPPED' when timer expires

**Expected Results**:
- Countdown shows correct time based on dropDelayMinutes
- No hardcoded 5-hour delay
- Box drops exactly when countdown reaches zero
- Frontend and backend timing are synchronized

### 3. API Endpoints Test
**Endpoints to verify**:
- POST /surprise-boxes (with dropDelayMinutes parameter)
- GET /surprise-boxes/active/{userId}
- GET /surprise-boxes/has-active/{userId}

## Test Results
[To be filled during testing]