const request = require('supertest');
const mongoose = require('mongoose');
let app;
let server;

// Setup before tests
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = 3001;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/express-todo-test';
    
    // Import app after setting environment variables
    app = require('../app');
    
    // Create server
    server = app.listen(process.env.PORT);
});

// Cleanup after tests
afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

describe('Todo Application', () => {
    describe('GET /', () => {
        it('should return 200 OK', async () => {
            const response = await request(app)
                .get('/')
                .expect('Content-Type', /html/)
                .expect(200);
        });
    });

    describe('GET /todos', () => {
        it('should return todos list', async () => {
            const response = await request(app)
                .get('/todos')
                .expect('Content-Type', /json/)
                .expect(200);
            
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });
}); 