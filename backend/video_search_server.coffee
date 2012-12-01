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


  @on "search": ->
    mockup = [
      {
        id: "232313/2312312"
        title: "Test title"
        thumbnail: "http://www.youtube.com/watch?v=MZSN-MkehOQ&feature=g-logo"
        provider: "youtube"
        msgs: [
          { 
            text: "Tweet / Fb message"
            post_date: "Thu Oct 21 16:02:46 +0000 2010"
            username: "gnip"
            avatar_url: "http:\/\/a3.twimg.com\/profile_images\/62803643\/icon_normal.png"
          }
        ]
      }
    ]
    console.log "search #{@data}"
    setTimeout =>
      @emit search_result: 
        search_term: @data
        videos: [
          mockup[0]
        ]
    , Math.floor((Math.random()*10)+1) * 100

