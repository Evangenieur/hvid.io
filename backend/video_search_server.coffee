videos_mockup = require "./videos_mockup.json"


require('zappajs') ->
  @get "/": -> 
    @render "index"

  @view "index": ->
    html ->
      script src: "/socket.io/socket.io.js"
      body ->
        div "#output", ""
      coffeescript ->

        socket = io.connect()
        console.log socket
        socket.on "connect", ->
          console.log "CONNECTION"
          socket.emit "search", "metallica"
        socket.on "search_result", (res) ->
          console.log "RESULT for search #{res.search_term}", res.videos

        class Search
          instances = {}
          constructor: (search_term) ->
            if @constructor.name is "Search"
              console.log "instance"
              @search_term = search_term
            else
              console.log "instanciation"
              instances[@search_term] or= new Search(search_term)
            instances[@search_term] = @

        console.log Search("coucou")
        console.log new Search("test")



  @on "search": ->
    console.log "search #{@data}"
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
    , Math.floor((Math.random()*10)+1) * 100

