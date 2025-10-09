package com.couplewebsite.service;

import com.couplewebsite.entity.NoteOperation;
import com.couplewebsite.entity.OperationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OperationalTransformService {
    
    private static final Logger logger = LoggerFactory.getLogger(OperationalTransformService.class);
    
    /**
     * Transform an operation against another operation using Operational Transform algorithm
     * This ensures that concurrent operations can be applied in any order and produce the same result
     */
    public NoteOperation transform(NoteOperation op1, NoteOperation op2, boolean op1HasPriority) {
        if (op1 == null || op2 == null) {
            return op1;
        }
        
        logger.debug("Transforming operation {} against operation {}", 
            op1.getOperationType(), op2.getOperationType());
        
        // Create a new transformed operation based on op1
        NoteOperation transformed = createTransformedOperation(op1);
        
        // Apply transformation rules based on operation types
        switch (op1.getOperationType()) {
            case INSERT:
                transformed = transformInsert(op1, op2, op1HasPriority);
                break;
            case DELETE:
                transformed = transformDelete(op1, op2, op1HasPriority);
                break;
            case RETAIN:
                transformed = transformRetain(op1, op2, op1HasPriority);
                break;
        }
        
        return transformed;
    }
    
    /**
     * Transform an INSERT operation
     */
    private NoteOperation transformInsert(NoteOperation insertOp, NoteOperation otherOp, boolean insertHasPriority) {
        NoteOperation transformed = createTransformedOperation(insertOp);
        
        switch (otherOp.getOperationType()) {
            case INSERT:
                // Two concurrent inserts
                if (insertOp.getPosition() <= otherOp.getPosition()) {
                    // Insert position stays the same if it's before or at the same position
                    if (insertOp.getPosition().equals(otherOp.getPosition()) && !insertHasPriority) {
                        // If at same position and doesn't have priority, move after the other insert
                        transformed.setPosition(insertOp.getPosition() + otherOp.getContent().length());
                    }
                } else {
                    // Insert position moves forward by the length of the other insert
                    transformed.setPosition(insertOp.getPosition() + otherOp.getContent().length());
                }
                break;
                
            case DELETE:
                // Insert against delete
                if (insertOp.getPosition() <= otherOp.getPosition()) {
                    // Insert position stays the same if it's before the delete
                } else if (insertOp.getPosition() > otherOp.getPosition() + otherOp.getLength()) {
                    // Insert position moves back by the length of the delete
                    transformed.setPosition(insertOp.getPosition() - otherOp.getLength());
                } else {
                    // Insert is within the deleted range, move to delete position
                    transformed.setPosition(otherOp.getPosition());
                }
                break;
                
            case RETAIN:
                // Insert against retain - no transformation needed
                break;
        }
        
        return transformed;
    }
    
    /**
     * Transform a DELETE operation
     */
    private NoteOperation transformDelete(NoteOperation deleteOp, NoteOperation otherOp, boolean deleteHasPriority) {
        NoteOperation transformed = createTransformedOperation(deleteOp);
        
        switch (otherOp.getOperationType()) {
            case INSERT:
                // Delete against insert
                if (deleteOp.getPosition() < otherOp.getPosition()) {
                    // Delete position stays the same if it's before the insert
                } else {
                    // Delete position moves forward by the length of the insert
                    transformed.setPosition(deleteOp.getPosition() + otherOp.getContent().length());
                }
                break;
                
            case DELETE:
                // Two concurrent deletes
                if (deleteOp.getPosition() <= otherOp.getPosition()) {
                    if (deleteOp.getPosition() + deleteOp.getLength() <= otherOp.getPosition()) {
                        // No overlap, delete position stays the same
                    } else {
                        // Overlapping deletes - adjust length
                        int overlap = Math.min(deleteOp.getPosition() + deleteOp.getLength(), 
                                             otherOp.getPosition() + otherOp.getLength()) - 
                                     Math.max(deleteOp.getPosition(), otherOp.getPosition());
                        transformed.setLength(Math.max(0, deleteOp.getLength() - overlap));
                    }
                } else {
                    // Delete position moves back by the length of the other delete
                    if (deleteOp.getPosition() >= otherOp.getPosition() + otherOp.getLength()) {
                        transformed.setPosition(deleteOp.getPosition() - otherOp.getLength());
                    } else {
                        // Overlapping - complex case
                        int newPosition = otherOp.getPosition();
                        int newLength = Math.max(0, 
                            (deleteOp.getPosition() + deleteOp.getLength()) - 
                            (otherOp.getPosition() + otherOp.getLength()));
                        transformed.setPosition(newPosition);
                        transformed.setLength(newLength);
                    }
                }
                break;
                
            case RETAIN:
                // Delete against retain - no transformation needed
                break;
        }
        
        return transformed;
    }
    
    /**
     * Transform a RETAIN operation
     */
    private NoteOperation transformRetain(NoteOperation retainOp, NoteOperation otherOp, boolean retainHasPriority) {
        NoteOperation transformed = createTransformedOperation(retainOp);
        
        switch (otherOp.getOperationType()) {
            case INSERT:
                // Retain against insert
                if (retainOp.getPosition() < otherOp.getPosition()) {
                    // Retain position stays the same if it's before the insert
                } else {
                    // Retain position moves forward by the length of the insert
                    transformed.setPosition(retainOp.getPosition() + otherOp.getContent().length());
                }
                break;
                
            case DELETE:
                // Retain against delete
                if (retainOp.getPosition() <= otherOp.getPosition()) {
                    // Retain position stays the same if it's before or at the delete
                } else if (retainOp.getPosition() >= otherOp.getPosition() + otherOp.getLength()) {
                    // Retain position moves back by the length of the delete
                    transformed.setPosition(retainOp.getPosition() - otherOp.getLength());
                } else {
                    // Retain is within the deleted range, move to delete position
                    transformed.setPosition(otherOp.getPosition());
                }
                break;
                
            case RETAIN:
                // Retain against retain - no transformation needed
                break;
        }
        
        return transformed;
    }
    
    /**
     * Transform a list of operations against another list of operations
     */
    public List<NoteOperation> transformOperations(List<NoteOperation> ops1, List<NoteOperation> ops2) {
        List<NoteOperation> transformedOps = new ArrayList<>();
        
        for (NoteOperation op1 : ops1) {
            NoteOperation currentOp = op1;
            
            // Transform against each operation in ops2
            for (NoteOperation op2 : ops2) {
                // Use sequence number to determine priority
                boolean op1HasPriority = op1.getSequenceNumber() < op2.getSequenceNumber();
                currentOp = transform(currentOp, op2, op1HasPriority);
            }
            
            transformedOps.add(currentOp);
        }
        
        return transformedOps;
    }
    
    /**
     * Apply an operation to text content
     */
    public String applyOperation(String content, NoteOperation operation) {
        if (content == null) {
            content = "";
        }
        
        try {
            switch (operation.getOperationType()) {
                case INSERT:
                    return applyInsert(content, operation);
                case DELETE:
                    return applyDelete(content, operation);
                case RETAIN:
                    return content; // RETAIN doesn't change content
                default:
                    logger.warn("Unknown operation type: {}", operation.getOperationType());
                    return content;
            }
        } catch (Exception e) {
            logger.error("Error applying operation: {}", e.getMessage());
            return content;
        }
    }
    
    /**
     * Apply an INSERT operation to content
     */
    private String applyInsert(String content, NoteOperation operation) {
        int position = Math.max(0, Math.min(operation.getPosition(), content.length()));
        String insertText = operation.getContent() != null ? operation.getContent() : "";
        
        return content.substring(0, position) + insertText + content.substring(position);
    }
    
    /**
     * Apply a DELETE operation to content
     */
    private String applyDelete(String content, NoteOperation operation) {
        int position = Math.max(0, Math.min(operation.getPosition(), content.length()));
        int length = Math.max(0, Math.min(operation.getLength(), content.length() - position));
        
        return content.substring(0, position) + content.substring(position + length);
    }
    
    /**
     * Create a copy of an operation for transformation
     */
    private NoteOperation createTransformedOperation(NoteOperation original) {
        NoteOperation transformed = new NoteOperation();
        transformed.setNote(original.getNote());
        transformed.setUser(original.getUser());
        transformed.setOperationType(original.getOperationType());
        transformed.setPosition(original.getPosition());
        transformed.setContent(original.getContent());
        transformed.setLength(original.getLength());
        transformed.setSequenceNumber(original.getSequenceNumber());
        transformed.setCreatedAt(original.getCreatedAt());
        return transformed;
    }
    
    /**
     * Compose two operations into a single operation if possible
     */
    public NoteOperation composeOperations(NoteOperation op1, NoteOperation op2) {
        // Simple composition rules - can be extended for more complex cases
        if (op1.getOperationType() == OperationType.INSERT && 
            op2.getOperationType() == OperationType.INSERT &&
            op1.getPosition() + op1.getContent().length() == op2.getPosition()) {
            
            // Consecutive inserts can be composed
            NoteOperation composed = createTransformedOperation(op1);
            composed.setContent(op1.getContent() + op2.getContent());
            return composed;
        }
        
        if (op1.getOperationType() == OperationType.DELETE && 
            op2.getOperationType() == OperationType.DELETE &&
            op1.getPosition() == op2.getPosition()) {
            
            // Consecutive deletes at same position can be composed
            NoteOperation composed = createTransformedOperation(op1);
            composed.setLength(op1.getLength() + op2.getLength());
            return composed;
        }
        
        // Cannot compose - return null
        return null;
    }
}