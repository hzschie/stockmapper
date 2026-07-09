const request = require('supertest');
const app = require('../../app'); // Adjust the path as necessary

describe('Data Route', () => {
    it('should return data successfully', async () => {
        const response = await request(app).get('/data');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('should return 404 for non-existent route', async () => {
        const response = await request(app).get('/data/non-existent');
        expect(response.status).toBe(404);
    });

    it('should handle server errors', async () => {
        const response = await request(app).get('/data/error');
        expect(response.status).toBe(500);
    });
});