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
    
    // Create engine
    const engine = Engine.create();
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
    
    // Create static boundaries (floor and walls)
    const floorThickness = 60;
    const wallThickness = 60;
    
    // Floor (positioned at bottom)
    const floor = Bodies.rectangle(
        window.innerWidth / 2,
        window.innerHeight - floorThickness / 2,
        window.innerWidth,
        floorThickness,
        { isStatic: true, render: { fillStyle: '#cccccc' } }
    );
    
    // Left wall
    const leftWall = Bodies.rectangle(
        wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        { isStatic: true, render: { fillStyle: '#cccccc' } }
    );
    
    // Right wall
    const rightWall = Bodies.rectangle(
        window.innerWidth - wallThickness / 2,
        window.innerHeight / 2,
        wallThickness,
        window.innerHeight,
        { isStatic: true, render: { fillStyle: '#cccccc' } }
    );
    
    // Ceiling
    const ceiling = Bodies.rectangle(
        window.innerWidth / 2,
        floorThickness / 2,
        window.innerWidth,
        floorThickness,
        { isStatic: true, render: { fillStyle: '#cccccc' } }
    );
    
    // Add all static bodies to the world
    World.add(world, [floor, leftWall, rightWall, ceiling]);
    
    // Shape selection state variable
    let currentShapeType = 'box'; // Default shape
    
    // Add event listeners to shape selection buttons
    document.getElementById('selectBox').addEventListener('click', () => {
        currentShapeType = 'box';
        console.log('Selected shape:', currentShapeType);
        
        // Visual feedback for active button (optional)
        document.getElementById('selectBox').classList.add('active');
        document.getElementById('selectCircle').classList.remove('active');
    });
    
    document.getElementById('selectCircle').addEventListener('click', () => {
        currentShapeType = 'circle';
        console.log('Selected shape:', currentShapeType);
        
        // Visual feedback for active button (optional)
        document.getElementById('selectCircle').classList.add('active');
        document.getElementById('selectBox').classList.remove('active');
    });
    
    // Set default active button
    document.getElementById('selectBox').classList.add('active');
    
    // Variables for drag-and-throw mechanics
    let isDragging = false;
    let startDragPos = null;
    let startDragTime = null;
    
    // Function to spawn a shape with initial velocity
    function spawnShapeWithVelocity(x, y, velocity) {
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
        const velocityScale = 0.03; // Tuning parameter
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
        
        // Update static boundaries
        World.remove(world, [floor, leftWall, rightWall, ceiling]);
        
        // Recreate boundaries with new dimensions
        const floorNew = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight - floorThickness / 2,
            window.innerWidth,
            floorThickness,
            { isStatic: true, render: { fillStyle: '#cccccc' } }
        );
        
        const leftWallNew = Bodies.rectangle(
            wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { fillStyle: '#cccccc' } }
        );
        
        const rightWallNew = Bodies.rectangle(
            window.innerWidth - wallThickness / 2,
            window.innerHeight / 2,
            wallThickness,
            window.innerHeight,
            { isStatic: true, render: { fillStyle: '#cccccc' } }
        );
        
        const ceilingNew = Bodies.rectangle(
            window.innerWidth / 2,
            floorThickness / 2,
            window.innerWidth,
            floorThickness,
            { isStatic: true, render: { fillStyle: '#cccccc' } }
        );
        
        World.add(world, [floorNew, leftWallNew, rightWallNew, ceilingNew]);
    });
});