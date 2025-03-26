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
    
    // Shape selection state variable
    let currentShapeType = 'box'; // Default shape
    
    // Add event listeners to shape selection buttons
    const shapeButtons = document.querySelectorAll('#panelShapeSelector .shapeBtn');
    
    if (shapeButtons.length === 0) {
        console.error("ERROR: No elements found matching '#panelShapeSelector .shapeBtn'");
    } else {
        console.log(`Found ${shapeButtons.length} shape buttons`);
        
        // Function to update active button visual state
        function updateActiveButton(activeButton) {
            // Remove active class from all buttons
            shapeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            activeButton.classList.add('active');
        }
        
        // Add click event to each shape button
        shapeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                currentShapeType = button.dataset.shape;
                console.log('Selected shape:', currentShapeType);
                updateActiveButton(button);
            });
        });
        
        // Set default active button (first button)
        if (shapeButtons[0]) {
            shapeButtons[0].classList.add('active');
        }
    }
    
    // Variables for drag-and-throw mechanics
    let isDragging = false;
    let startDragPos = null;
    let startDragTime = null;
    
    // Function to spawn a shape with initial velocity
    function spawnShapeWithVelocity(x, y, velocity) {
        // Prevent extreme velocities that might cause tunneling
        const maxVelocity = 25; // Maximum velocity magnitude
        if (Math.abs(velocity.x) > maxVelocity) {
            velocity.x = Math.sign(velocity.x) * maxVelocity;
        }
        if (Math.abs(velocity.y) > maxVelocity) {
            velocity.y = Math.sign(velocity.y) * maxVelocity;
        }
        
        const defaultSize = 50; // Default size parameter
        let newBody;
        
        // Generate a random color for the shape
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        
        // Create appropriate shape based on selection
        if (currentShapeType === 'box') {
            newBody = Bodies.rectangle(
                x, 
                y, 
                defaultSize, 
                defaultSize, 
                {
                    restitution: 0.8, // Bounciness
                    friction: 0.3,    // Friction
                    render: {
                        fillStyle: color
                    }
                }
            );
        } else if (currentShapeType === 'circle') {
            const radius = defaultSize / 2;
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
        }
        
        if (newBody) {
            // Add the shape to the world
            World.add(world, newBody);
            console.log(`Spawned ${currentShapeType} at ${x}, ${y}`);
            
            // Apply the calculated velocity
            Body.setVelocity(newBody, velocity);
            console.log(`Applied velocity: vx=${velocity.x.toFixed(2)}, vy=${velocity.y.toFixed(2)}`);
        }
    }
    
    // Mouse down event - start drag
    document.addEventListener('mousedown', (event) => {
        // Only process if the click is within the canvas area and not on UI elements
        if (event.target.id === 'simulationCanvas') {
            isDragging = true;
            startDragPos = { x: event.clientX, y: event.clientY };
            startDragTime = Date.now();
            console.log('Drag Start:', startDragPos);
        }
    });
    
    // Mouse move event - track drag
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        // Optional: Draw a line or visual indicator for the drag
    });
    
    // Mouse up event - end drag and spawn with velocity
    document.addEventListener('mouseup', (event) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endDragPos = { x: event.clientX, y: event.clientY };
        const endDragTime = Date.now();
        const dragDuration = (endDragTime - startDragTime) / 1000; // Duration in seconds
        
        // Calculate displacement vector
        const dx = endDragPos.x - startDragPos.x;
        const dy = endDragPos.y - startDragPos.y;
        
        // Calculate velocity vector (scale as needed to feel right)
        const velocityScale = 0.025; // Reduced from 0.03 to help prevent extreme velocities
        let velocityX = 0;
        let velocityY = 0;
        
        if (dragDuration > 0.01) { // Avoid division by zero or tiny durations
            velocityX = (dx / dragDuration) * velocityScale;
            velocityY = (dy / dragDuration) * velocityScale;
        }
        
        console.log('Drag End:', endDragPos);
        console.log(`Duration: ${dragDuration.toFixed(3)}s, dx: ${dx}, dy: ${dy}`);
        console.log(`Calculated Velocity: vx=${velocityX.toFixed(2)}, vy=${velocityY.toFixed(2)}`);
        
        // Spawn the shape at the end position with calculated velocity
        spawnShapeWithVelocity(endDragPos.x, endDragPos.y, { x: velocityX, y: velocityY });
        
        // Reset tracking variables
        startDragPos = null;
        startDragTime = null;
    });
    
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