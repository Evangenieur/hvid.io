window.Search = class Search
  instances = {}
  constructor: (search_term, opts) ->
    if @constructor.name is "Search"
      @search_term = search_term
      @videos = {}
      @events or= []

      my_timer = null
      search_me = =>
        unless Search.socket?.emit? 
          my_timer = setInterval(search_me, 100) unless my_timer
        else
          clearInterval(my_timer) if my_timer
          finished = _(@events).filter((e) -> e.finished?).pop().finished
          Search.socket.emit "search", @search_term, finished
      
      _.defer search_me

      #instances[search_term] = @
    else
      return instances[search_term] or= new Search(search_term, opts)

  video_reduce: (video) ->
    msg = video.msg
    delete video.msg
    video.dom_id = video.id.replace "/", "-"
    video.msgs = []
    
    (@videos[video.id] or= video).msgs.push msg
    
    # Jay: was here
    @videos[video.id] = (@videos[video.id] or= video)
    @videos[video.id].date = msg.post_date;
    @videos[video.id].score = (@videos[video.id].score || 1) + msg.score;

    console.log "videos ", Object.keys(@videos).length
    @when _(@videos).keys().length, video.id

  videos_by_posts: ->
    _(@videos).sortBy (v) -> - v.msgs.length

  videos_by_date: ->
    _(@videos).sortBy (v) -> - (new Date(v.date)).valueOf()

  videos_ids: -> _(@videos).keys()

  when: (num, cb) ->
    if _.isFunction cb
      @events.push
        num: num
        callback: cb
    else if @events.length > 0
      for i in [0..@events.length - 1]
        if @events[i]?.num? and @events[i].num == num
          cb = @events[i].callback
          @events.splice i, 1
          @when_done = true
          cb.call @
        else if @when_done and @events[i]?["video.new"]?
          if (not @last_videos_length) or (@last_videos_length < num)
            @events[i]["video.new"].call @videos[cb]
        else if @when_done and @events[i]?["video.update"]?
          if (not @last_videos_length) or (@last_videos_length == num)
            @events[i]["video.update"].call @videos[cb]
    @last_videos_length = num
    @

  on: (msg, cb) ->
    if _.isFunction cb
      event = {}
      event[msg] = cb
      @when_done = true unless @events.length
      @events.push event
    @

  @com_init: (socket) ->
    console.log "handling init"
    socket.on "search_result", (res) =>
      @get(res.search_term)?.video_reduce video for video in res.videos

    Search.socket = socket

  @get: (search_term) -> instances[search_term]

