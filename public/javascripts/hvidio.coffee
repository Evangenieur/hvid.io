loader = null
socket = null
scroller = null
timerIdle = null 
timerPlay = null
$main = $("#main")
$loading = $('#loading')
$form = $("#form")
$keyword = $("#keyword")
$results = $("#results")
$player = $("#player")
$close = $("#close")
$header = $("#header")
$hashtags = $('#hashtags')
$clickjack = $("#clickjack")
window.hvidio =
  init: ->
    
    @videos = {}

    # Loader
    loader = new CanvasLoader("loading")
    loader.setColor "#99CC32"
    loader.setDiameter 32
    loader.setDensity 32
    loader.setRange 0.6
    loader.setSpeed 1
    
    # load the hashtag
    if window.location.hash
      setTimeout (->
        $("#keyword").val window.location.hash.substr(1)
        $("#form").submit()
      ), 200
    else
      $keyword.focus()

    jQuery.timeago.settings.allowFuture = true
    
    # socket
    socket = io.connect("http://" + window.location.host)
    socket.on "connect", ->
      SearchStream.com_init socket

    
    # toggle main window
    $clickjack.on "click", (e) ->
      hvidio.show()
      e.stopPropagation()
      e.preventDefault()

    
    #$close.on('click', function(e) {
    $main.on "click", (e) ->
      hvidio.hide()
      e.stopPropagation()
      e.preventDefault()

    $keyword.on "click", (e) ->
      e.stopPropagation()

    $results.on "click", ".play", (e) ->
      
      #hvidio.play($(this).attr('href')).hide();
      hvidio.play $(this).attr("href")
      
      #e.stopPropagation();
      e.preventDefault()

    $(window).on "resize", ->
      hvidio.resize()

    
    # search
    $form.on "submit", (e) ->
      keyword = $keyword.val()
      $hashtags.remove()
      hvidio.search keyword
      window.location.hash = "#" + keyword
      e.preventDefault()

    #keyCodes
    $(document).bind "keydown", (e) ->
      tag = e.target.tagName.toLowerCase()
      if tag isnt "input" and tag isnt "textarea"
        switch e.keyCode
          when 27 # esc
            hvidio.toggle()
            e.preventDefault()
          when 37 # left arrow
            hvidio.prev(1000)
            e.preventDefault()
          when 38 # up arrow
            hvidio.prev(1000)
            e.preventDefault()
          when 39 # right arrow
            hvidio.next(1000)
            e.preventDefault()
          when 40 # down arrow
            hvidio.next(1000)
            e.preventDefault()
          when 9 # tab
            hvidio.show()
            $keyword.focus().select()
            e.preventDefault()


    # Hastags
    hvidio.hashtags();
    $hashtags.on 'click', 'a', (e) ->
      keyword = $(this).attr('href')
      $keyword.val(keyword)
      $form.submit()
      $hashtags.hide()
      e.stopPropagation()
      e.preventDefault()

    $main.addClass "bounceIn"
    this

  initScroller: (force) ->
    if not scroller or force
      $results.mCustomScrollbar()
      scroller = true
    else
      $results.mCustomScrollbar "update"
    this

  initTimer: ->
    $(window).on 'mousemove keydown', ->
      clearTimeout(timerIdle)
      timerIdle = setTimeout (-> hvidio.hide()), 20000

    @

  search: (keyword) ->
    if keyword
      @keyword = keyword
      console.log this
      hvidio.loading true
      hvidio.fetch keyword, (data) ->

        $main.addClass "large"
        #console.log data[0].msgs.length, data[0].provider, data[0].msgs[0].provider, data[0].msgs[0].text
        hvidio.templatize "#videosTemplate",
          search: urlify(keyword)
          videos: data
        , "#results"
        
        #hvidio.loading(false);
        hvidio.play data[0].embed
        hvidio.initScroller(true).initTimer()

        $close.show()

    this

  insert_video: (container, pos, video) ->
    $html = $(hvidio.templatize("#videoTemplate",
      video: video
    ))
    #console.log $("#{container} > li").length
    elem = $("#{container} > li:eq(#{pos})")
    if elem.length
      elem.before $html
      #console.log  $("#{container} > li").length, $("time", elem).attr("datetime"), " < ", video.date, elem, elem[0], $html[0]
    else
      $("#{container} > li:eq(#{pos - 1})").after $html
    $html.css("visibility", "visible").hide().fadeIn "fast"

  video_reduce: (video) ->
    video.dom_id = video.id.replace "/", "-"
    msg = video.msg
    video.msg = null
    delete video.msg
    video.msgs = []
    event = if @videos[@keyword][video.dom_id]?
        "video.update" 
      else 
        @videos[@keyword][video.dom_id] = video
        "video.new"
    video = @videos[@keyword][video.dom_id]
    video.msgs.push msg

    # Get More recent date
    post_date = (new Date(msg.post_date)).valueOf()
    last_date = (new Date(video.date)).valueOf()
    if not video.date or (post_date > last_date)
      #console.log "MORE RECENT DATE" if video.date
      video.date = (new Date(msg.post_date)).toISOString()

    #console.log "videos ", event, video.id
    video.score = (parseInt(video.score) or 1) + parseInt(msg.score)

    [ event, video ]


  get_video_score: (video) ->
    
    #- video.msgs.length
    -(new Date(video.date)).valueOf()

  fetch: (@keyword, callback) ->
    obs = new OrderByScore()
    @videos[@keyword] = {}
    @counter = 0
    
    #
    #                video.order_score = _.reduce(video.msgs, function(memo, num) { 
    #                    return (memo + (parseInt(num.votes) + 1)) || 1; 
    #                }, 0);
    #
    #(video.msgs[video.msgs.length - 1].votes || 1);
    search = SearchStream(@keyword).on("data", (video) =>

      search.emit @video_reduce(video)...

    ).on("video.new", (video) =>

      video.msg = video.msgs[0]
      #console.log "Video.new", video.date, (new Date(video.date)).valueOf(), @get_video_score(video)
      video.order_score = @get_video_score(video)
      pos = obs.get_pos(video.order_score)
      #video.date = video.msgs[0].post_date
      # ????
      video.embed = video.embed.substr(0, tmppos)  unless (tmppos = video.embed.indexOf("?")) is -1
      $("#counter").text ++@counter
      
      if typeof search.initiated is "undefined"
        search.initiated = true
        scroll = false
        callback [video]
      else
        @insert_video "#video-list-" + urlify(@keyword), pos, video
        hvidio.initScroller()
    
    ).on("video.update", (video) =>

      tmp_score = @get_video_score(video)

      unless tmp_score is video.order_score
        obs.remove_score video.order_score
        video.order_score = tmp_score
        pos = obs.get_pos(video.order_score)
        
        unless $("#video-list-#{urlify(@keyword)} > li:eq(#{pos})").attr("id") is video.dom_id
          #console.log "score != ?", tmp_score, video.order_score
          $("#" + video.dom_id).fadeOut().remove()
          @insert_video "#video-list-" + urlify(@keyword), pos, video
      
      #console.log "update", video.dom_id, video.order_score, video.date
      $tip = $("#" + video.dom_id + " .tip")
      score = parseInt($tip.text()) or 1
      newScore = score + 1
      $tip.text newScore + "+"
      $tip.addClass "incremented animated bounce"
      if video.date isnt $("##{video.dom_id} time").attr("datetime")
        $("##{video.dom_id} time").attr "datetime", video.date 
    
    ).on("finished", ->
      console.log "FINISHED"
      hvidio.loading false
    )
    
    #
    #                self.order(
    #                    search.videos_by_date()
    #                    //search.videos_by_posts()
    #                );
    #                
    this

  templatize: (template, data, output) ->
    tmpl = $(template).html()
    html = _.template(tmpl, data)
    $(output).html html  if output
    _.defer ->
      $("time").timeago()
    hvidio.resize()
    hvidio.fadeImg()
    html

  loading: (bool) ->
    
    #console.log("loader", loader);
    if bool
      loader.show()
      $loading.show()
    else
      loader.hide()
      $loading.hide()
    this

  hashtags: ->
    fp = $form.offset()
    $hashtags
      .css('top',  (fp.top) + 'px')
      .css('left', (fp.left + ($keyword.outerWidth())) + 'px')
      .fadeIn('slow');

  toggle: ->
    if $main.is(":visible")
      hvidio.hide()
    else
      hvidio.show()
    this

  show: ->
    $main.removeClass "bounceIn fadeOutUp fadeOutDown"
    $main.addClass("fadeInUp").show()
    this

  hide: ->
    $main.removeClass "bounceIn fadeOutUp fadeOutDown"
    $main.addClass "fadeOutDown"
    setTimeout (->
      $main.hide()
    ), 500
    this

  fadeImg: (html) ->
    $("#results img").each ->
      $(this).on "load", ->
        $(this).css("visibility", "visible").hide().fadeIn()


    this

  play: (embed, delay) ->
    $results.find(".video").removeClass "current"
    $results.find("a[href=\"" + embed + "\"]").closest(".video").addClass "current"
    if embed.indexOf("?") is -1
      embed += "?"
    else
      embed += "&"
    embed += "wmode=transparent&autoplay=1&autohide=1"
    clearTimeout timerPlay if timerPlay
    timerPlay = setTimeout ->
      $player.attr "src", embed
    , delay

    this

  jump: (index, delay) ->
    embed = $(".video").eq(index).find(".play").attr("href")
    hvidio.play embed, delay

  next: (delay) ->
    index = $(".current").index(".video")
    index++
    if index > $(".video").size() - 1
      index = 0
      $results.mCustomScrollbar "scrollTo", 0
    hvidio.jump index, delay

  prev: (delay) ->
    index = $(".current").index(".video")
    index--
    if index < 0
      index = $(".video").size() - 1
      $results.mCustomScrollbar "scrollTo", 20000
    hvidio.jump index, delay

  resize: ->
    
    # Adjusts result div height
    mh = $main.height()
    hh = $header.outerHeight()
    $results.outerHeight mh - hh - 20
    
    # Adjusts/centers result list
    mw = $main.width()
    ew = $results.find("li").outerWidth(true)
    rw = (Math.floor(mw / ew)) * ew
    $results.find(".video-list").width rw
    
    hvidio.hashtags()

# Extra scripts
urlify = (str) ->
  str.replace(/\s/g, "_").replace(/:/g, "-").replace(/\\/g, "-").replace(/\//g, "-").replace(/[^a-zA-Z0-9\-_]+/g, "").replace(/-{2,}/g, "-").toLowerCase()

_underscore_template = _.template
_.template = (str, data) ->
  _underscore_template str.replace(/<%\s*include\s*(.*?)\s*%>/g, (match, templateId) ->
    el = $("#" + templateId)
    (if el then el.html() else "")
  ), data

$ ->
  hvidio.init()
