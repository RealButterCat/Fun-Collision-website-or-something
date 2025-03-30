// 2D Physics Collision Sandbox - Core Script
// Based on Matter.js physics engine

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to Matter.js modules
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Body = Matter.Body; // Added for velocity control
    
    // Create engine with improved solver settings to prevent tunneling
    const engine = Engine.create({
        positionIterations: 8,  // Default is 6, increasing helps prevent tunneling
        velocityIterations: 8   // Default is 4, increasing helps prevent tunneling
    });
    const world = engine.world;
    
    // Create renderer
    const render = Render.create({
        canvas: document.getElementById('simulationCanvas'),
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#f0f0f0',
            showSleeping: false,
            showDebug: false,
            showBroadphase: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: false,
            showAxes: false,
            showPositions: false,
            showAngleIndicator: false,
            showIds: false,
            showShadows: false
        }
    });
    
    // Start the renderer
    Render.run(render);
    
    // Create runner for consistent physics updates
    const runner = Runner.create();
    Runner.run(runner, engine);
    
    // Create static boundaries (floor and walls) with increased thickness to prevent tunneling
    const wallThickness = 80; // Increased from 60 to prevent tunneling
    
    // Variables to store boundary objects so we can access them later
    let floor, leftWall, rightWall, ceiling;
    
    // Function to create boundaries with the current window dimensions
    function createBoundaries() {
        // Floor (positioned at bottom)
        floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight - wallThickness / 2,
            window.innerWidth,
            wallThickness,
            { 
                isStatic: true, 
                render: { fillStyle: '#cccccc' },
                friction: 0.1,
                frictionStatic: 0.5
            }
        );
        
        // Left wall
        leftWall = Bodies.rectangle(
            wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { 
                isStatic: true, 
                render: { fillStyle: '#cccccc' },
                friction: 0.1,
                frictionStatic: 0.5
            }
        );
        
        // Right wall
        rightWall = Bodies.rectangle(
            window.innerWidth - wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { 
                isStatic: true, 
                render: { fillStyle: '#cccccc' },
                friction: 0.1,
                frictionStatic: 0.5
            }
        );
        
        // Ceiling
        ceiling = Bodies.rectangle(
            window.innerWidth / 2,
            wallThickness / 2,
            window.innerWidth,
            wallThickness,
            { 
                isStatic: true, 
                render: { fillStyle: '#cccccc' },
                friction: 0.1,
                frictionStatic: 0.5
            }
        );
        
        // Add all static bodies to the world
        World.add(world, [floor, leftWall, rightWall, ceiling]);
    }
    
    // Create initial boundaries
    createBoundaries();
    
    // Setup inventory panel interaction
    const inventoryPanel = document.getElementById('inventoryPanel');
    const inventoryTab = document.getElementById('inventoryTab');

    if (inventoryTab && inventoryPanel) {
        inventoryTab.addEventListener('mouseenter', () => {
            inventoryPanel.classList.add('inventory-open');
            inventoryTab.classList.add('inventory-open');
            console.log('Opening inventory panel');
        });

        inventoryPanel.addEventListener('mouseleave', () => {
            inventoryPanel.classList.remove('inventory-open');
            inventoryTab.classList.remove('inventory-open');
            console.log('Closing inventory panel');
        });
    } else {
        console.error("Could not find inventory panel or tab elements!");
    }
    
    // State variables for shape, material, and size selection
    let currentShapeType = 'box';   // Default shape
    let currentMaterial = 'wood';   // Default material
    let currentSize = 'medium';     // Default size
    
    // Variables for drag-and-throw mechanics
    let isDragging = false; // For canvas drag (now specific to 'clickOnCanvas' mode)
    let startDragPos = null;
    let startDragTime = null;
    
    // NEW state for interaction mode
    let currentInteractionMode = 'dragFromInventory'; // Default mode ('dragFromInventory' or 'clickOnCanvas')
    
    // NEW variables for inventory drag
    let isDraggingFromInventory = false; // Specific to 'dragFromInventory' mode
    let dragStartTimeout = null;
    let inventoryDragStartPos = null;
    let inventoryDragStartTime = null;
    let draggedShapeType = null;
    let ghostElement = null;
    let hasEnteredCanvasDuringDrag = false; // <<< ADD THIS LINE
    
    // Add mode toggle listener
    const modeRadios = document.querySelectorAll('#panelInteractionMode input[name="interactionMode"]');

    modeRadios.forEach(radio => {
        if (radio) { // Null check
            radio.addEventListener('change', (event) => {
                if (event.target.checked) {
                    currentInteractionMode = event.target.value;
                    console.log('Interaction Mode Changed To:', currentInteractionMode);

                    // Optional: Reset any ongoing drag state when mode changes
                    isDragging = false;
                    isDraggingFromInventory = false;
                    removeGhostElement(); // Clean up ghost if mode changes mid-drag
                    clearTimeout(dragStartTimeout); // Clear drag start timeout
                    startDragPos = null;
                    inventoryDragStartPos = null;
                    draggedShapeType = null;
                }
            });
        }
    });

    // Set initial state based on default checked radio
    const initialMode = document.querySelector('#panelInteractionMode input[name="interactionMode"]:checked');
    if (initialMode) {
        currentInteractionMode = initialMode.value;
    }
    console.log('Initial Interaction Mode:', currentInteractionMode);
    
    // Ghost element functions for dragging from inventory
    function createGhostElement(x, y, shapeType) {
        // Remove any existing ghost
        removeGhostElement();
        
        // Create a new ghost element
        ghostElement = document.createElement('div');
        ghostElement.className = 'shape-ghost';
        
        // Apply shape styling based on type
        if (shapeType === 'circle') {
            ghostElement.style.borderRadius = '50%';
        }
        
        // Position at cursor
        ghostElement.style.left = `${x}px`;
        ghostElement.style.top = `${y}px`;
        
        // Add to body
        document.body.appendChild(ghostElement);
        
        // Apply basic styles
        ghostElement.style.position = 'absolute';
        ghostElement.style.width = '40px';
        ghostElement.style.height = '40px';
        ghostElement.style.backgroundColor = '#aaaaaaaa';
        ghostElement.style.border = '2px dashed #555';
        ghostElement.style.transform = 'translate(-50%, -50%)';
        ghostElement.style.pointerEvents = 'none'; // So it doesn't interfere with mouse events
        ghostElement.style.zIndex = '100';
    }
    
    function updateGhostElement(x, y) {
        if (ghostElement) {
            ghostElement.style.left = `${x}px`;
            ghostElement.style.top = `${y}px`;
        }
    }
    
    function removeGhostElement() {
        if (ghostElement) {
            document.body.removeChild(ghostElement);
            ghostElement = null;
        }
    }
    
    // Shape preview selection
    const shapePreviews = document.querySelectorAll('#panelShapeSelector .shapePreview');
    
    function updateActivePreview(selectedPreview) {
        shapePreviews.forEach(preview => preview.classList.remove('active'));
        if (selectedPreview) selectedPreview.classList.add('active');
    }
    
    shapePreviews.forEach(preview => {
        if (preview) {
            preview.addEventListener('mousedown', (event) => {
                event.stopPropagation();
                const shape = preview.dataset.shape;
                console.log(`Shape preview mousedown: ${shape}`);

                // Always select the shape on mousedown
                currentShapeType = shape;
                updateActivePreview(preview); // Update visual feedback

                // Only start drag logic if in the correct mode
                if (currentInteractionMode === 'dragFromInventory') {
                    inventoryDragStartPos = { x: event.clientX, y: event.clientY };
                    draggedShapeType = shape;

                    clearTimeout(dragStartTimeout);
                    dragStartTimeout = setTimeout(() => {
                        console.log(`Starting DRAG from inventory for: ${draggedShapeType}`);
                        isDraggingFromInventory = true;
                        inventoryDragStartTime = Date.now(); // Record drag start time for velocity
                        createGhostElement(event.clientX, event.clientY, draggedShapeType);
                    }, 150); // Drag delay

                    event.preventDefault(); // Prevent default image/div drag
                } else {
                    console.log("Mode is 'clickOnCanvas', only selecting shape.");
                }
            });
        }
    });
    
    // Set initial active shape preview
    const initialActivePreview = document.querySelector(`#panelShapeSelector .shapePreview[data-shape="${currentShapeType}"]`);
    updateActivePreview(initialActivePreview);
    
    // Add event listeners to material selection buttons
    const materialButtons = document.querySelectorAll('#panelMaterialSelector .materialBtn');
    
    function updateActiveMaterialButton(selectedButton) {
        materialButtons.forEach(btn => btn.classList.remove('active'));
        if (selectedButton) selectedButton.classList.add('active');
    }
    
    materialButtons.forEach(button => {
        if (button) { // Null check
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                currentMaterial = button.dataset.material;
                console.log('Selected material:', currentMaterial);
                updateActiveMaterialButton(button);
            });
        }
    });
    
    // Set initial active material button
    const initialActiveMaterial = document.querySelector(`#panelMaterialSelector .materialBtn[data-material="${currentMaterial}"]`);
    updateActiveMaterialButton(initialActiveMaterial);
    
    // Add event listeners to size selection buttons
    const sizeButtons = document.querySelectorAll('#panelSizeSelector .sizeBtn');
    
    function updateActiveSizeButton(selectedButton) {
        sizeButtons.forEach(btn => btn.classList.remove('active'));
        if (selectedButton) selectedButton.classList.add('active');
    }
    
    sizeButtons.forEach(button => {
        if (button) { // Null check
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                currentSize = button.dataset.size;
                console.log('Selected size:', currentSize);
                updateActiveSizeButton(button);
            });
        }
    });
    
    // Set initial active size button
    const initialActiveSize = document.querySelector(`#panelSizeSelector .sizeBtn[data-size="${currentSize}"]`);
    updateActiveSizeButton(initialActiveSize);
    
    // Function to spawn a shape with initial velocity
    function spawnShapeWithVelocity(x, y, velocity, shapeType, material, size) {
        console.log(`--- Inside spawnShapeWithVelocity ---`);
        console.log(`Shape: ${shapeType}, Material: ${material}, Size: ${size}`); // Log received values
        console.log(`Coords: ${x}, ${y}, Velocity:`, velocity);
        
        // Prevent extreme velocities that might cause tunneling
        const maxVelocity = 25; // Maximum velocity magnitude
        if (Math.abs(velocity.x) > maxVelocity) {
            velocity.x = Math.sign(velocity.x) * maxVelocity;
        }
        if (Math.abs(velocity.y) > maxVelocity) {
            velocity.y = Math.sign(velocity.y) * maxVelocity;
        }
        
        const baseDimension = 50; // Keep using a base size for now
        let newBody;
        
        // Generate a random color for the shape
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        
        // Create appropriate shape based on selection
        if (shapeType === 'box') {
            newBody = Bodies.rectangle(
                x, 
                y, 
                baseDimension, 
                baseDimension, 
                {
                    restitution: 0.8, // Bounciness
                    friction: 0.3,    // Friction
                    render: {
                        fillStyle: color
                    }
                }
            );
            console.log('Created rectangle:', newBody);
        } else if (shapeType === 'circle') {
            const radius = baseDimension / 2;
            newBody = Bodies.circle(
                x, 
                y, 
                radius, 
                {
                    restitution: 0.8, // Bounciness
                    friction: 0.3,    // Friction
                    render: {
                        fillStyle: color
                    }
                }
            );
            console.log('Created circle:', newBody);
        }
        
        if (newBody) {
            // TODO LATER: Apply material properties (friction, restitution, render style)
            // TODO LATER: Apply actual size scaling based on 'size' parameter
            
            console.log('Attempting to add body to world:', newBody);
            World.add(world, newBody);
            console.log('Body added to world.');
            
            console.log('Attempting to set velocity:', velocity);
            Body.setVelocity(newBody, velocity);
            console.log('Velocity set.');
        } else {
            console.error('Failed to create body! shapeType might be invalid:', shapeType);
        }
    }
    
    // Mouse down event - start drag
    const simulationCanvas = document.getElementById('simulationCanvas');
    simulationCanvas.addEventListener('mousedown', (event) => {
        // Check 1: Ignore if dragging from inventory
        if (isDraggingFromInventory) {
            console.log("Ignoring canvas mousedown, inventory drag in progress.");
            return;
        }

        // Check 2: Only proceed if in 'clickOnCanvas' mode
        if (currentInteractionMode !== 'clickOnCanvas') {
            console.log("Ignoring canvas mousedown, mode is not 'clickOnCanvas'.");
            return;
        }

        console.log('--- Canvas Mousedown Fired (clickOnCanvas mode) ---', event.target);

        // Check if click is actually on canvas (prevent UI clicks)
        if (event.target !== simulationCanvas) {
             console.log('Mousedown ignored (not on canvas element)');
             return;
        }

        // Set state for CANVAS drag
        isDragging = true; // Use the original canvas drag flag
        startDragPos = { x: event.clientX, y: event.clientY };
        startDragTime = Date.now(); // Ensure you have startDragTime if needed for velocity
        console.log('Canvas Drag Start:', startDragPos);
        event.preventDefault(); // Optional: prevent text selection etc.
    });
    
    // Mouse move event - track drag
    document.addEventListener('mousemove', (event) => {
        if (isDraggingFromInventory) {
            // Update inventory drag ghost position
            if (ghostElement) {
                updateGhostElement(event.clientX, event.clientY);
            }
            
            // --- Detect Canvas Entry & Reset Start Point (ADD THIS LOGIC) ---
            if (!hasEnteredCanvasDuringDrag) { // Only check/reset once per drag
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
                    // This is crucial for basing velocity on canvas movement
                    inventoryDragStartPos = { x: event.clientX, y: event.clientY };
                    inventoryDragStartTime = Date.now(); // Reset time too!
                }
            }
            // --- End ADDED Logic ---
            
        } else if (isDragging) { // Check the canvas drag flag
            // Handle canvas drag mousemove (e.g., draw preview line if you have one)
            // console.log('Canvas dragging to:', event.clientX, event.clientY);
        }
    });
    
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

                // --- Add Focused Logging Here ---
                console.log('>>> Inventory Drag Calculation (Mouseup) <<<');
                console.log('Final Start Pos (after potential reset):', inventoryDragStartPos);
                console.log('Final End Pos:', endDragPos);
                console.log('Final Start Time (after potential reset):', inventoryDragStartTime);
                console.log('Final End Time:', endDragTime);
                console.log('Was canvas entered during drag?', hasEnteredCanvasDuringDrag);
                // --- End Focused Logging ---

                // Check if start pos/time exist before calculating
                if (!inventoryDragStartPos || !inventoryDragStartTime) {
                     console.error("ERROR: Missing start position or time for inventory drag!");
                     velocityX = 0; // Default to zero velocity
                     velocityY = 0;
                } else {
                     const dragDuration = (endDragTime - inventoryDragStartTime) / 1000;
                     const dx = endDragPos.x - inventoryDragStartPos.x; // Uses potentially reset startPos
                     const dy = endDragPos.y - inventoryDragStartPos.y; // Uses potentially reset startPos
                     console.log(`Final dx: ${dx.toFixed(0)}, dy: ${dy.toFixed(0)}, duration: ${dragDuration.toFixed(3)}s (since reset/start)`);

                     const velocityScale = 0.025;
                     let velocityX = 0, velocityY = 0;
                     const minDurationForThrow = 0.05; // Maybe slightly shorter threshold now?
                     const minDistanceSqForThrow = 30 * 30; // Maybe slightly smaller threshold now?

                     // Use distance check (Approach B - generally better for drops)
                     const distanceSq = dx * dx + dy * dy;
                     if (distanceSq > minDistanceSqForThrow && dragDuration > 0.02) {
                         velocityX = (dx / dragDuration) * velocityScale;
                         velocityY = (dy / dragDuration) * velocityScale;
                     } else {
                         console.log("Movement since reset/start too small/short, treating as drop.");
                         // Velocity remains 0, 0
                     }
                     console.log(`Calculated Velocity: vx=${velocityX.toFixed(2)}, vy=${velocityY.toFixed(2)}`);
                
                     console.log(`Spawning from inventory: ${draggedShapeType} with final v=(${velocityX.toFixed(1)}, ${velocityY.toFixed(1)})`);
                     spawnShapeWithVelocity(
                         spawnX, spawnY, { x: velocityX, y: velocityY },
                         draggedShapeType, currentMaterial, currentSize
                     );
                }
            } else {
                console.log("Inventory drag dropped outside canvas.");
            }

            // Cleanup inventory drag state
            removeGhostElement();
            isDraggingFromInventory = false;
            draggedShapeType = null;
            inventoryDragStartPos = null;
            inventoryDragStartTime = null;
            hasEnteredCanvasDuringDrag = false; // <<< RESET THE FLAG HERE

        // Handle end of CANVAS drag
        } else if (isDragging) {
            console.log(`Canvas drag mouseup at (${event.clientX}, ${event.clientY})`);
            const endDragPos = { x: event.clientX, y: event.clientY };
            const endDragTime = Date.now();
            const dragDuration = (endDragTime - startDragTime) / 1000; // Use original canvas drag times

            // Calculate Velocity for Canvas Drag (should be your existing logic)
            const dx = endDragPos.x - startDragPos.x;
            const dy = endDragPos.y - startDragPos.y;
            const velocityScale = 0.025; // Use your tuned scale
            let velocityX = 0, velocityY = 0;
            if (dragDuration > 0.02) {
                velocityX = (dx / dragDuration) * velocityScale;
                velocityY = (dy / dragDuration) * velocityScale;
            }

            console.log(`Spawning from canvas: ${currentShapeType} with v=(${velocityX.toFixed(1)}, ${velocityY.toFixed(1)})`);
            // Spawn using the currently *selected* shape, material, size
            spawnShapeWithVelocity(
                endDragPos.x, endDragPos.y, { x: velocityX, y: velocityY },
                currentShapeType, currentMaterial, currentSize
            );

            // Cleanup canvas drag state
            isDragging = false;
            startDragPos = null;
            startDragTime = null;
        }
    }, true); // Use capture phase if needed
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Update renderer dimensions
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        
        // Remove old boundaries
        World.remove(world, [floor, leftWall, rightWall, ceiling]);
        
        // Recreate boundaries with new dimensions
        createBoundaries();
    });
});