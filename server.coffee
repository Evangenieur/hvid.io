_ = require "underscore"
child_launcher = require "./lib/child_launcher"


require('zappajs') ->
  @use "static", "favicon", require('less-middleware')({ src: __dirname + '/public' })
  @set 'view engine': 'jade'

  @io.set 'log level', 1

  @get "/": -> 
    @render "index"

  @on "search": ->

    for worker in ["twitter", "facebook", "googleplus", "youtube"]
      child_launcher "./workers/#{worker}_search_worker.coffee", 
        search: @data
        (video) =>
          @emit search_result: 
            search_term: @data
            videos: [
              video
            ]
