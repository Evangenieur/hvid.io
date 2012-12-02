process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

request = require "request"
argv = require("optimist").argv
_ = require "underscore"
video_platforms = require "../lib/video_platforms"
google_conf = require "../config/google_api"


video_search = (search, opts = {}) ->
  _(opts).defaults
    #locale: "fr_FR" #"en_US"
    maxResults: 50
    order: "date"
    part: "snippet"

  opts_str = ""
  for k, v of opts
    opts_str += "#{k}=#{v}&"


  url = "https://www.googleapis.com/youtube/v3/search?q=#{encodeURIComponent search}&key=#{google_conf.api_key}&#{opts_str}"
  console.log "video_search #{search}", opts, url

  request url,
    (err, res, body) ->
      console.log err, res, body
      try 
        out = JSON.parse(body)
      catch e
        return
      posts = out.items
      console.log body, posts, posts.length
      _(posts).chain().each (post) ->
        return unless post.id.videoId
        url = URI.generate video_platforms.def.youtube.embed, video_id: post.id.videoId

        vdo = {}
        vdo.title = post.snippet.title
        vdo.thumbnail = post.snippet.thumbnails.medium.url

        msg = 
          provider: "youtube"
          id: "youtube/#{post.id.videoId}"
          post_date: post.publishedAt
          text: ""
          votes: 0

        video_platforms.getVideoFromMsg msg, url, vdo

video_search argv.search, argv