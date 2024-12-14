// logger middleware logic will go here

const logger = (req, res, next) => {
    const start = new Date();
    
    // Log request details
    console.log(`[${start.toISOString()}] ${req.method} ${req.url}`);
    
    if (Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }

    // Capture the original res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = new Date() - start;
        console.log(`[${new Date().toISOString()}] Response sent - Status: ${res.statusCode} - Duration: ${duration}ms`);
        
        // Call the original end function
        originalEnd.apply(res, arguments);
    };

    next();
};

module.exports = logger;
