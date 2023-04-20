import { expect, assert } from 'chai';
import request from 'request';
import sinon from 'sinon';
import AppController from '../controllers/AppControllers';

const sandbox = sinon.createSandbox();

describe('appController tests', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('[GET] /status route', () => {
    it('should return a status code 200 and send body', () => {
      const requestStub = sandbox
        .stub(request, 'get')
        .yields(null, { statusCode: 200 }, '{"redis":true,"db":true}');
      AppController.getStatus({}, {
        status(statusCode) {
          expect(statusCode).equals(200);
        },
        send(body) {
          expect(body).to.deep.equals({ redis: true, db: true });
        },
      });
      requestStub.restore();
    });
  });
});
