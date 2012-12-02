process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

request = require "request"
argv = require("optimist").argv
_ = require "underscore"
video_platforms = require "../lib/video_platforms"
youtube_conf = require "../config/youtube_api"
Q = require "q"


getUserInfo = (user_uri) ->
  deferred = Q.defer()
  request user_uri += "?alt=json", (err, res, body) ->
    if err
      deferred.reject err
    out = JSON.parse(body)
    deferred.resolve out.entry["media$thumbnail"].url

  deferred.promise

video_search = (search, opts = {}) ->
  _(opts).defaults
    #locale: "fr_FR" #"en_US"
    "max-results": 50
    orderby: "published"

  opts_str = ""
  for k, v of opts
    opts_str += "#{k}=#{v}&"


  url = "https://gdata.youtube.com/feeds/api/videos?q=#{encodeURIComponent search}&v=2&alt=json&key=#{youtube_conf.api_key}&#{opts_str}"

  request url,
    (err, res, body) ->
      try 
        out = JSON.parse(body)
      catch e
        return
      posts = out.feed.entry
      #console.log body, posts, posts.length
      _(posts).chain().each (post) ->

        #console.log post["yt$statistics"]
        return unless post['gd$etag']
        #url = URI.generate video_platforms.def.youtube.embed, video_id: post.id.videoId

        vdo = {}
        vdo.title = post.title["$t"]
        vdo.thumbnail = post["media$group"]["media$thumbnail"][0].url

        msg = 
          provider: "youtube"
          id: "youtube/#{post['gd$etag']}"
          post_date: post.published["$t"]
          text: post["media$group"]["media$description"]["$t"]
          name: post.author[0].name["$t"]
          username: post.author[0]["yt$userId"]["$t"]
          votes: post["yt$statistics"]?["favoriteCount"] || 0

        getUserInfo(post.author[0].uri["$t"])
          .then (avatar_url) ->
            msg.avatar_url = avatar_url
            video_platforms.getVideoFromMsg msg, post.content.src, vdo

video_search argv.search, argv