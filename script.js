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
    
    // Add click event listener to spawn objects
    document.addEventListener('mousedown', function(event) {
        const boxSize = 50; // Size of the box
        
        // Generate a random color for the box
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        
        // Create a new box at the mouse position
        const newBox = Bodies.rectangle(
            event.clientX,
            event.clientY,
            boxSize,
            boxSize,
            {
                restitution: 0.8, // Bounciness
                friction: 0.3,    // Friction
                render: {
                    fillStyle: color
                }
            }
        );
        
        // Add the box to the world
        World.add(world, newBox);
        
        console.log('Object spawned at:', event.clientX, event.clientY);
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