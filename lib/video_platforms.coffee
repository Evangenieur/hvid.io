URI = require "../public/vendors/URI.pattern-templating"
http = require "http"
Q = require "q"
_ = require "underscore"
cheerio = require "cheerio"
request = require "request"

video_platforms = 
  youtube:
    domains: ["youtube.com", "youtu.be"]
    samples: [
      "http://www.youtube.com/watch?v=Y4MnpzG5Sqc"
    ]
    urls: [
      "/watch?v={video_id}"
      "/embed/{video_id}"
      "/v/{video_id}"
      "/{video_id}"
    ]
    embed: "http://www.youtube.com/embed/{video_id}"
    default: "http://www.youtube.com/watch?v={video_id}"
  vimeo:
    domains: ["vimeo.com"]
    samples: [
      "https://vimeo.com/38260970"
    ]
    urls: [
      "/video/{video_id}"
      "/{video_id}"
    ]
    embed: "http://player.vimeo.com/video/{video_id}"
    default: "http://vimeo.com/{video_id}"
  dailymotion: 
    domains: ["dailymotion.com"]
    samples: [
      "http://www.dailymotion.com/video/xvacfx_la-surface-en-skateboard-test-de-solidite_tech"
    ]
    urls: [
      "/video/{video_id}"
      "/embed/video/{video_id}"
    ]
    embed: "http://www.dailymotion.com/embed/video/{video_id}"

http.get_redirect = (url, cb) ->
  req = http.get(url, (ret) ->
    #console.log "get_redirect #{url}", ret.headers.location
    cb ret.headers.location
  ).on "error", (e) ->
    #console.log "get_redirect #{url}", e
    cb null
  req.on "socket", (socket) ->
    socket.setTimeout 1500
    socket.on "timeout", -> 
      #console.log "get_redirect #{url} timeout"
      cb null

module.exports = me = 
  def: video_platforms
  lookup: (url) ->
    url = new URI(url)
    for name, platform of video_platforms
      if platform.domains.indexOf(url.domain()) > -1
        for url_template in platform.urls 
          #console.log url_template, url
          if (result = url.extract url_template) and result.video_id
            try 
              return _(result).extend
                  provider: name
                  embed: URI.generate platform.embed, result
                  id: "#{name}/#{result.video_id}"
                  url: URI.generate platform.default, result
            catch e
              console.log e
    not_found: url.toString()

  getVideoFromMsg: (msg, url, vdo = {}, deferred = Q.defer()) ->
    video = me.lookup url
    #console.log video
    if video.id
      # getVideoInfos
      _(video).extend vdo
      video.msg = msg
      if not video.title or not video.thumbnail
        me.getVideoMeta(url)
          .then (meta) ->
            #console.log "TITLE: #{title}"
            _(video).extend meta
            process.send video
      else
        process.send video
      deferred.resolve("ok")
    else 
      try
        http.get_redirect url, (location) ->
          if location
            me.getVideoFromMsg msg, location, vdo, deferred
          else 
            deferred.reject("not mathcing")
      catch e
        console.log "Error", e
        deferred.reject(e)
    
    deferred.promise

  getVideoMeta: (url) ->
    deferred = Q.defer()

    request url, ( err, res, body ) ->
      if err
        deferred.reject err

      doc = cheerio.load(body)
      metas = doc('meta')

      vdo_meta = {}
      _(metas).each (m) -> 
        if m.attribs.property? and m.attribs.property.match /og:title/
           vdo_meta.title = m.attribs.content
        if m.attribs.property? and m.attribs.property.match /og:image/
          vdo_meta.thumbnail = m.attribs.content
      
      unless vdo_meta.title
        vdo_meta.title = doc("title").text()

      deferred.resolve vdo_meta

    deferred.promise