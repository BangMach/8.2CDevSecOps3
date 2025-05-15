const request = require('supertest');
const app = require('../app');

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