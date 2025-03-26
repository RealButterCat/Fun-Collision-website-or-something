// 2D Physics Collision Sandbox - Core Script
// Based on Matter.js physics engine

document.addEventListener('DOMContentLoaded', function() {
    // [Previous code remains unchanged until mouseup event]

    // Mouse up event - end drag and spawn with velocity
    document.addEventListener('mouseup', (event) => {
        // Timeout clearing logic (for inventory drag start)
        if (dragStartTimeout) {
            clearTimeout(dragStartTimeout);
            dragStartTimeout = null;
        }

        // Handle end of INVENTORY drag
        if (isDraggingFromInventory) {
            console.log(`Inventory drag mouseup at (${event.clientX}, ${event.clientY})`);
            const canvasRect = simulationCanvas.getBoundingClientRect();
            const isOverCanvas = (
                event.clientX >= canvasRect.left &&
                event.clientX <= canvasRect.right &&
                event.clientY >= canvasRect.top &&
                event.clientY <= canvasRect.bottom
            );

            if (isOverCanvas) {
                const spawnX = event.clientX;
                const spawnY = event.clientY;
                const endDragPos = { x: spawnX, y: spawnY };
                const endDragTime = Date.now();

                // Log velocity calculation details
                console.log('>>> Inventory Drag Calculation <<<');
                console.log('Start Pos:', inventoryDragStartPos);
                console.log('End Pos:', endDragPos);
                console.log('Start Time:', inventoryDragStartTime);
                console.log('End Time:', endDragTime);

                // Calculate velocity only if we have valid start data
                if (!inventoryDragStartPos || !inventoryDragStartTime) {
                    console.error("ERROR: Missing start position or time for inventory drag!");
                    velocityX = 0;
                    velocityY = 0;
                } else {
                    const dragDuration = (endDragTime - inventoryDragStartTime) / 1000;
                    const dx = endDragPos.x - inventoryDragStartPos.x;
                    const dy = endDragPos.y - inventoryDragStartPos.y;
                    console.log(`Raw dx: ${dx.toFixed(0)}, dy: ${dy.toFixed(0)}, duration: ${dragDuration.toFixed(3)}s`);

                    // Improved velocity calculation with distance threshold
                    const distanceSq = dx * dx + dy * dy;
                    const minDistanceSqForThrow = 50 * 50;

                    const velocityScale = 0.025;
                    let velocityX = 0, velocityY = 0;

                    if (distanceSq > minDistanceSqForThrow && dragDuration > 0.02) {
                        velocityX = (dx / dragDuration) * velocityScale;
                        velocityY = (dy / dragDuration) * velocityScale;
                    } else {
                        console.log("Drag distance or duration too short, treating as drop (zero velocity).");
                    }
                    console.log(`Calculated Velocity: vx=${velocityX.toFixed(2)}, vy=${velocityY.toFixed(2)}`);

                    // Spawn the shape with calculated velocity
                    console.log(`Spawning from inventory: ${draggedShapeType} with calculated v=(${velocityX.toFixed(1)}, ${velocityY.toFixed(1)})`);
                    spawnShapeWithVelocity(
                        spawnX, spawnY, { x: velocityX, y: velocityY },
                        draggedShapeType, currentMaterial, currentSize
                    );
                }
            } else {
                console.log("Inventory drag dropped outside canvas.");
            }

            // Cleanup inventory drag state (INCLUDING NEW FLAG)
            removeGhostElement();
            isDraggingFromInventory = false;
            draggedShapeType = null;
            inventoryDragStartPos = null;
            inventoryDragStartTime = null;
            hasEnteredCanvasDuringDrag = false; // Reset the new flag
        } 
        // Rest of the code for canvas drag remains unchanged
    }, true);

    // [Rest of the code remains unchanged]
});