package com.couplewebsite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EditControlMessage {
    // Message type constants
    public static final String REQUEST_EDIT_CONTROL = "REQUEST_EDIT_CONTROL";
    public static final String RELEASE_EDIT_CONTROL = "RELEASE_EDIT_CONTROL";
    public static final String CONTENT_UPDATE = "CONTENT_UPDATE";
    public static final String TYPING_STATUS = "TYPING_STATUS";
    private String type;
    private Long userId;
    private Long noteId;
    private Long grantToUserId;
    private Long requesterId;
    private String requesterName;
    private Long currentEditorId;
    private Long newEditorId;
    private String newEditorName;
    private Long previousEditorId;
    private String content;
    private Integer cursorPosition;
    private String timestamp;
    private String userName;
    private Boolean isTyping;
    private String sessionId;

    // Constructors
    public EditControlMessage() {}

    public EditControlMessage(String type) {
        this.type = type;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public Long getGrantToUserId() {
        return grantToUserId;
    }

    public void setGrantToUserId(Long grantToUserId) {
        this.grantToUserId = grantToUserId;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public Long getCurrentEditorId() {
        return currentEditorId;
    }

    public void setCurrentEditorId(Long currentEditorId) {
        this.currentEditorId = currentEditorId;
    }

    public Long getNewEditorId() {
        return newEditorId;
    }

    public void setNewEditorId(Long newEditorId) {
        this.newEditorId = newEditorId;
    }

    public String getNewEditorName() {
        return newEditorName;
    }

    public void setNewEditorName(String newEditorName) {
        this.newEditorName = newEditorName;
    }

    public Long getPreviousEditorId() {
        return previousEditorId;
    }

    public void setPreviousEditorId(Long previousEditorId) {
        this.previousEditorId = previousEditorId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getCursorPosition() {
        return cursorPosition;
    }

    public void setCursorPosition(Integer cursorPosition) {
        this.cursorPosition = cursorPosition;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    @JsonProperty("isTyping")
    public Boolean getIsTyping() {
        return isTyping;
    }

    public void setIsTyping(Boolean isTyping) {
        this.isTyping = isTyping;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Boolean isTyping() {
        return isTyping;
    }

    // Static factory methods for common message types
    public static EditControlMessage requestEditControl(Long userId, Long noteId) {
        EditControlMessage message = new EditControlMessage("REQUEST_EDIT_CONTROL");
        message.setUserId(userId);
        message.setNoteId(noteId);
        return message;
    }

    public static EditControlMessage editControlRequested(Long requesterId, String requesterName, Long currentEditorId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_REQUESTED");
        message.setRequesterId(requesterId);
        message.setRequesterName(requesterName);
        message.setCurrentEditorId(currentEditorId);
        return message;
    }

    public static EditControlMessage grantEditControl(Long userId, Long noteId, Long grantToUserId) {
        EditControlMessage message = new EditControlMessage("GRANT_EDIT_CONTROL");
        message.setUserId(userId);
        message.setNoteId(noteId);
        message.setGrantToUserId(grantToUserId);
        return message;
    }

    public static EditControlMessage editControlChanged(Long newEditorId, String newEditorName, Long previousEditorId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_CHANGED");
        message.setNewEditorId(newEditorId);
        message.setNewEditorName(newEditorName);
        message.setPreviousEditorId(previousEditorId);
        return message;
    }

    public static EditControlMessage releaseEditControl(Long userId, Long noteId) {
        EditControlMessage message = new EditControlMessage("RELEASE_EDIT_CONTROL");
        message.setUserId(userId);
        message.setNoteId(noteId);
        return message;
    }

    public static EditControlMessage editControlReleased(Long previousEditorId, Long noteId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_RELEASED");
        message.setPreviousEditorId(previousEditorId);
        message.setNoteId(noteId);
        return message;
    }

    public static EditControlMessage contentUpdate(Long userId, Long noteId, String content, Integer cursorPosition) {
        EditControlMessage message = new EditControlMessage("CONTENT_UPDATE");
        message.setUserId(userId);
        message.setNoteId(noteId);
        message.setContent(content);
        message.setCursorPosition(cursorPosition);
        return message;
    }

    public static EditControlMessage contentUpdated(String content, Long editorId, Integer cursorPosition, String timestamp) {
        EditControlMessage message = new EditControlMessage("CONTENT_UPDATED");
        message.setContent(content);
        message.setNewEditorId(editorId);
        message.setCursorPosition(cursorPosition);
        message.setTimestamp(timestamp);
        return message;
    }

    public static EditControlMessage typingStatus(Long noteId, Long userId, String userName, Boolean isTyping) {
        EditControlMessage message = new EditControlMessage("TYPING_STATUS");
        message.setUserId(userId);
        message.setNoteId(noteId);
        message.setUserName(userName);
        message.setIsTyping(isTyping);
        return message;
    }

    public static EditControlMessage userTyping(Long userId, String userName, Boolean isTyping) {
        EditControlMessage message = new EditControlMessage("USER_TYPING");
        message.setUserId(userId);
        message.setUserName(userName);
        message.setIsTyping(isTyping);
        return message;
    }

    public static EditControlMessage editControlGranted(Long userId, Long noteId, String sessionId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_GRANTED");
        message.setUserId(userId);
        message.setNoteId(noteId);
        message.setSessionId(sessionId);
        return message;
    }

    public static EditControlMessage denyEditControl(Long userId, Long noteId, String reason) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_DENIED");
        message.setUserId(userId);
        message.setNoteId(noteId);
        message.setContent(reason); // Using content field for reason
        return message;
    }

    // Additional overloaded methods for compatibility
    public static EditControlMessage editControlGranted(Long userId, Long noteId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_GRANTED");
        message.setUserId(userId);
        message.setNoteId(noteId);
        return message;
    }

    public static EditControlMessage denyEditControl(Long userId, Long noteId) {
        EditControlMessage message = new EditControlMessage("EDIT_CONTROL_DENIED");
        message.setUserId(userId);
        message.setNoteId(noteId);
        return message;
    }


}