import app from '#src/app.js';
import request from 'supertest';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should health status', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const res = await request(app).get('/api').expect(200);

      expect(res.body).toHaveProperty('message', 'Acquisition API is running');
    });
  });

  describe('GET /non-existing', () => {
    it('should return 404 for non-existing route', async () => {
      const res = await request(app).get('/non-existing').expect(404);

      expect(res.body).toHaveProperty('message', 'Not Found');
    });
  });
});
