window.OrderByScore = class OrderByScore
  constructor: () ->
    @scores = []
    @scores_hit = {}

  get_pos: (score) ->
    pos = _(@scores).sortedIndex score
    unless @scores[pos]
      @scores[pos] = score
    else if (@scores[pos] != score) and (@scores[pos+1] != score)
      @scores.splice(pos, 0, score) 

    @scores_hit[score] or= 0
    @scores_hit[score]++

    #console.log "get_pos", score, pos#, @scores
    pos

  remove_score: (score) ->
    @scores_hit[score]--
    if @scores_hit[score] == 0
      @scores = _(@scores).without score
    
window.SearchStream = class SearchStream

  instances = {}

  constructor: (search_term, opts) ->
    if @constructor.name is "SearchStream"
      @search_term = search_term
      @ee = new EventEmitter2()

      my_timer = null
      search_me = =>
        unless SearchStream.socket?.emit? 
          my_timer = setInterval(search_me, 100) unless my_timer
        else
          clearInterval(my_timer) if my_timer
          SearchStream.socket.emit "search", @search_term, =>
            @ee.emit "finished"
      
      _.defer search_me

    else
      return instances[search_term] or= new SearchStream(search_term, opts)

  on: (msg, cb) -> @ee.on msg, cb
  emit: (msg, data...) -> @ee.emit msg, data...

  @com_init: (socket) ->
    #console.log "handling init"
    socket.on "search_result", (res) =>
      @get(res.search_term)?.ee.emit "data", res.data

    SearchStream.socket = socket

  @get: (search_term) -> instances[search_term]

