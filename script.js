// 2D Physics Collision Sandbox - Core Script
// Based on Matter.js physics engine

document.addEventListener('DOMContentLoaded', function() {
    // [Previous code remains unchanged until mousemove listener]

    // Mouse move event - track drag
    document.addEventListener('mousemove', (event) => {
        if (isDraggingFromInventory && ghostElement) {
            // Update inventory drag ghost position
            updateGhostElement(event.clientX, event.clientY);

            // --- Detect Canvas Entry & Reset Start Point (NEW) ---
            if (!hasEnteredCanvasDuringDrag) { // Only run this check once per drag
                const canvasRect = simulationCanvas.getBoundingClientRect();
                const isOverCanvasNow = (
                    event.clientX >= canvasRect.left &&
                    event.clientX <= canvasRect.right &&
                    event.clientY >= canvasRect.top &&
                    event.clientY <= canvasRect.bottom
                );

                if (isOverCanvasNow) {
                    console.log(">>> Drag entered canvas - Resetting velocity reference point <<<");
                    hasEnteredCanvasDuringDrag = true;
                    // Reset start position and time to the CURRENT position/time
                    inventoryDragStartPos = { x: event.clientX, y: event.clientY };
                    inventoryDragStartTime = Date.now(); // Reset time as well!
                }
            }
            // --- End NEW Logic ---

        } else if (isDragging) { // Check the canvas drag flag
            // Handle canvas drag mousemove (e.g., draw preview line if you have one)
            // console.log('Canvas dragging to:', event.clientX, event.clientY);
        }
    });

    // [Rest of the code remains unchanged]
});