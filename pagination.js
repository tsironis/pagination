/*
pagination 0.1.0
http://github.com/tsironis/pagination
Copyright (c) 2014 Dimitris Tsironis
Licensed under the MIT @license.
*/


(function (factory) {
  // CommonJS
  if (typeof exports === "object") {
    module.exports = factory(require("underscore"), require("backbone"));
  }
  // AMD
  else if (typeof define === "function" && define.amd) {
    define(["underscore", "backbone"], factory);
  }
  // Browser
  else if (typeof _ !== "undefined" && typeof Backbone !== "undefined") {
    var oldPageableCollection = Backbone.PageableCollection;
    var PageableCollection = factory(_, Backbone);
    Backbone.PageableCollection.noConflict = function () {
      Backbone.PageableCollection = oldPageableCollection;
      return PageableCollection;
    };
  }
}(function (_, Backbone) {

  "use strict";
  var BBColProto = Backbone.Collection.prototype;
  var PageableCollection = Backbone.PageableCollection = Backbone.Collection.extend({

    state: {
      firstPage: 0,
      lastPage: null,
      currentPage: null,
      pageSize: 25,
      totalPages: null,
      totalRecords: null,
      sortKey: null,
      order: -1
    },

    mode: "server",

    queryParams: {
      currentPage: "page",
      pageSize: "per_page",
      totalPages: "total_pages",
      totalRecords: "total_entries",
      sortKey: "sort_by",
      order: "order",
      directions: {
        "-1": "asc",
        "1": "desc"
      }
    },

    constructor: function(models, options) {

      options = options || {};
      var state = this.state = _.extend({}, PageableProto.state, this.state,
                                       options.state || {});
      var queryParams = this.queryParams = _.extend({}, PageableProto.queryParams, this.queryParams,
                                       options.queryParams || {});
      state.currentPage = state.firstPage;
      this._makeFullCollection(models);

      this.on('sync', this._onSync, this);
      this.on('reset', this._onReset, this);

      this._updateState();

      BBColProto.constructor.apply(this, arguments);
    },

    getFirstPage: function() {
      this.getPage('first');
    },

    getLastPage: function() {
      this.getPage('last');
    },

    getNextPage: function() {
      this.getPage('next');
    },

    getPreviousPage: function() {
      this.getPage('previous');
    },

    getPage: function(page) {
      var totalPages = this.state.totalPages;
      switch (page) {
        case 'first':
          page = 0;
          break;
        case 'last':
          page = totalPages - 1;
          break;
        case 'next':
          page = ++this.state.currentPage;
          break;
        case 'previous':
          page = --this.state.currentPage;
          break;
      }

      this.state.currentPage = page;

      if (this.mode === "server") {
        this.fetch();
      } else {
        this._paginate();
      }
    },

    _updateState: function() {
      this.state.totalPages ? this.state.totalPages : Math.ceil(this.fullCollection.length / this.state.pageSize);
    },

    _onSync: function() {
      var mode = this.mode;
      if (mode === "client") {
        this._paginate(true);
      }
    },

    _onReset: function() {
      var mode = this.mode;
      if (mode === "client") {
        this.state.totalPages = Math.ceil(this.fullCollection.length / this.state.pageSize);
      }
    },

    _onResetFull: function() {
      this._paginate();
    },

    _makeFullCollection: function(models) {
      this.fullCollection = new Backbone.Collection(models);
      this.fullCollection.on('reset', this._onResetFull, this);
    },

    _paginate: function(sync) {
      var state = _.clone(this.state);
      var currentPage = state.currentPage;

      if (state.firstPage === 0 && currentPage > 0) {
        currentPage--;
      }

      var pageSize = state.pageSize;
      var pageStart = currentPage * pageSize, pageEnd = pageStart + pageSize;
      if (this.mode === "client" && sync) {
        this._makeFullCollection(this.models);
      }

      var models = _.clone(this.fullCollection.models || this.models);

      this.reset(models.slice(pageStart, pageEnd));
    },

    setPageSize: function(pageSize) {
      this.state.pageSize = pageSize;
      this.getFirstPage();
    },

    fetch: function(options) {
      options = options || {};
      var state = this.state;
      var queryParams = this.queryParams;
      var data = {};

      _.each(queryParams, function(value, key) {
        if (!_.isNull(state[key]) &&
            !_.isUndefined(state[key]) &&
            state[key] !== PageableProto.state[key])
        {
          data[value] = state[key];
        }
      });


      var url = options.url || this.url || "";
      if (_.isFunction(url)) url = url.call(this);

      options.url = url;
      options.data = _.extend(options.data, data);

      return BBColProto.fetch.call(this, options);
    }
  });

  var PageableProto = PageableCollection.prototype;

}));

