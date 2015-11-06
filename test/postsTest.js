process.env.NODE_ENV = 'test';

var request = require('request'),
    expect = require('chai').expect,
    baseUrl = 'http://localhost:3000';

describe('Posts', function() {
  it('should list ALL posts on GET /api/posts', function (done) {
    request(baseUrl + '/api/posts', function (error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should add a NEW post on POST /api/posts', function (done) {
    request.post(
      {
        url: baseUrl + '/api/posts',
        form: {
          task: 'Walk Dog',
          description: 'Take Fluffy for a walk'
        }
      },
      function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      }
    );
  });

  it('should list a SINGLE post on GET /api/post/:id', function (done) {
    request(baseUrl + '/api/posts', function (error, response, body) {
      var allPosts = JSON.parse(body).posts;
      var singlePost = allPosts[allPosts.length - 1];
      request(baseUrl + '/api/posts/' + singlePost._id, function (error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });

  it('should update a SINGLE post on PUT /api/posts/:id', function (done) {
    request(baseUrl + '/api/posts', function (error, response, body) {
      var allPosts = JSON.parse(body).posts;
      var singlePost = allPosts[allPosts.length - 1];
      request.put(
        {
          url: baseUrl + '/api/posts/' + singlePost._id,
          form: {
            task: 'Walk Dog',
            description: 'Take Spot for a walk'
          }
        },
        function (error, response, body) {
          expect(response.statusCode).to.equal(200);
          done();
        }
      );
    });
  });

  it('should delete a SINGLE post on DELETE /posts/:id', function (done) {
    request(baseUrl + '/api/posts', function (error, response, body) {
      var allPosts = JSON.parse(body).posts;
      var singlePost = allPosts[allPosts.length - 1];
      request.del(baseUrl + '/api/posts/' + singlePost._id, function (error, response, body) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });
});