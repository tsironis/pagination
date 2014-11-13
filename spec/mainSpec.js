var Client = Backbone.PageableCollection.extend({
  url: "/api/v1/users",
  state: {
    pageSize: 3
  },
  mode: "client",
  comparator: function(person) {
    return person.get('age');
  }
});

var Server = Backbone.PageableCollection.extend({
  url: "/api/v1/users",
  state: {
    pageSize: 3
  }
});

var data = [
  {name: "George", age: 18},
  {name: "Peter", age: 48},
  {name: "Mary", age: 52},
  {name: "Kate", age: 28 },
  {name: "Brian", age: 7},
  {name: "Stewie", age: 1},
  {name: "Jess", age: 15}
];

describe('Client Mode: Pagination should', function() {
  beforeEach(function() {
    collection = new Client(data);
  });
  describe('create a collection', function() {
    it('successfully', function() {
      expect(collection.length).toEqual(7);
    });
    it('and be sorted in the correct order', function() {
      expect(collection.first().get('name')).toBe("Stewie");
      expect(collection.at(1).get('name')).toBe("Brian");
    });
    it('with correct state attributes', function() {
      expect(collection.state.pageSize).toEqual(3);
      expect(collection.mode).toEqual('client');
    });
  });
  describe('_paginate', function() {
    it('should get first page', function() {
      collection.getFirstPage();
      expect(collection.state.currentPage).toEqual(0);
      expect(collection.models.length).toEqual(3);
    });
    it('should get second page', function() {
      collection.getPage(1);
      expect(collection.state.currentPage).toEqual(1);
      expect(collection.models.length).toEqual(3);
    });
    it('and then get last page', function() {
      collection.getLastPage();
      expect(collection.state.currentPage).toEqual(2);
      expect(collection.state.totalPages).toEqual(3);
      expect(collection.models.length).toEqual(1);
    });
  });
  describe('fetch', function() {
    beforeEach(function () {
      jasmine.Ajax.install();
    });
    afterEach(function() {
      jasmine.Ajax.uninstall();
    })
    it('should fetch some attributes', function() {
      spyOn(collection, '_paginate').and.callThrough();
      collection.fetch();
      jasmine.Ajax.requests.mostRecent().response({
        "status": 200,
        "contentType": 'text/plain',
        "responseText": JSON.stringify(data)
      });
      expect(collection.state.currentPage).toEqual(1);
      expect(jasmine.Ajax.requests.count()).toEqual(1);
      expect(collection._paginate).toHaveBeenCalledWith(true);
      expect(jasmine.Ajax.requests.mostRecent().url).toEqual('/api/v1/users?page=1&per_page=3&order=-1');
      expect(collection.length).toEqual(3);
      expect(collection.fullCollection.length).toEqual(7);
      collection._paginate.calls.reset();
    });
  });
});
describe('Server Mode: Pagination should', function() {
  beforeEach(function () {
    jasmine.Ajax.install();
    collectionServer = new Server();
  });
  afterEach(function() {
    jasmine.Ajax.uninstall();
  })
  describe('create a collection', function() {
    it('with correct state attributes', function() {
      expect(collectionServer.state.pageSize).toEqual(3);
      expect(collectionServer.mode).toEqual('server');
    });
    it('should fetch some attributes', function() {
      spyOn(collectionServer, '_paginate');
      collectionServer.fetch();
      jasmine.Ajax.requests.mostRecent().response({
        "status": 200,
        "contentType": 'text/plain',
        "responseText": JSON.stringify(data)
      });
      expect(collectionServer.state.currentPage).toEqual(1);
      expect(jasmine.Ajax.requests.count()).toEqual(1);
      expect(collectionServer._paginate).not.toHaveBeenCalled();
      expect(jasmine.Ajax.requests.mostRecent().url).toEqual('/api/v1/users?page=1&per_page=3&order=-1');
      expect(collectionServer.length).toEqual(7);
      collectionServer._paginate.calls.reset();
    });
    it('should get next page', function() {
      spyOn(collectionServer, '_paginate');
      collectionServer.getNextPage();
      expect(jasmine.Ajax.requests.count()).toEqual(1);
      expect(collectionServer.state.currentPage).toEqual(2);
      jasmine.Ajax.requests.mostRecent().response({
        "status": 200,
        "contentType": 'text/plain',
        "responseText": JSON.stringify(data)
      });
      expect(collectionServer._paginate).not.toHaveBeenCalled();
      expect(collectionServer.length).toEqual(7);
      collectionServer._paginate.calls.reset();
    });
  });
});

