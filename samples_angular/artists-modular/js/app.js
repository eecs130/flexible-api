var app = angular.module("modelsApp", ['ngRoute']);
app.adminMode = true;
app.url = "https://guarded-atoll-17283.herokuapp.com/artists/";
app.config(function ($routeProvider) {
    'use strict';
    $routeProvider
        .when("/", {
            templateUrl: "list.html",
            controller: "ListArtistController"
        })
        .when("/new/artist", {
            controller: "CreateArtistController",
            templateUrl: "detail-form.html"
        })
        .when("/artist/:modelId", {
            controller: "EditArtistController",
            templateUrl: "detail.html"
        })
        .otherwise({
            redirectTo: "/"
        });
});