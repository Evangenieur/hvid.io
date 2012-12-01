_ = require "underscore"
#child_launcher = require "child_launcher"

videos_mockup = require "./backend/videos_mockup.json"
for i in [0..8]
  for video in videos_mockup[0..3]
    new_video = _(video).clone()
    new_video.id += i
    videos_mockup.push new_video

require('zappajs') ->
  @use "static", "favicon", require('less-middleware')({ src: __dirname + '/public' })
  @set 'view engine': 'jade'

  @get "/": -> 
    @render "index"

  ###
  @view "index": ->
    html ->
      script src: "/socket.io/socket.io.js"
      script src: "/vendors/underscore.min.js"
      script src: "/js/live-search.js"
      body ->
        div "#output", ""
      coffeescript ->
        socket = io.connect()
        console.log socket
        socket.on "connect", ->
          console.log "CONNECTION"
          Search.com_init(socket)

          Search("coucou")
            .when(20, -> console.log @videos_by_posts())
            .on("video.new", -> console.log "new video ", @)
            .on("video.update", -> console.log "updated video ", @)
  ###
  @on "search": ->
    ###
    console.log "search #{@data}"
    child_launcher "twitter_search_worker.coffee", (video) =>
      @emit search_result: 
        search_term: @data
        videos: [
          video
        ]
     return
     ###

    count = 0
    do chieur = => setTimeout =>
      idx = Math.floor((Math.random()*videos_mockup.length ))
      console.log "#{idx} / #{videos_mockup.length}"

      @emit search_result: 
        search_term: @data
        videos: [
          videos_mockup[idx]
        ]
      if ++count <= 40
        chieur()
    , Math.floor((Math.random()*10)+1) * 10

