// 2D Physics Collision Sandbox - Core Script
// Based on Matter.js physics engine

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... [Previous code remains unchanged until inventory drag variables] ...

    // NEW variables for inventory drag
    let isDraggingFromInventory = false; // Specific to 'dragFromInventory' mode
    let dragStartTimeout = null;
    let inventoryDragStartPos = null;
    let inventoryDragStartTime = null;
    let hasEnteredCanvasDuringDrag = false; // NEW FLAG
    let draggedShapeType = null;
    let ghostElement = null;

    // ... [Rest of the code remains unchanged] ...
});