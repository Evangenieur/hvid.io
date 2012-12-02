process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

request = require "request"
argv = require("optimist").argv
_ = require "underscore"
video_platforms = require "../lib/video_platforms"

video_search = (search, opts = {}) ->
  _(opts).defaults
    locale: "fr_FR" #"en_US"

  opts_str = ""
  for k, v of opts
    opts_str += "#{k}=#{v}&"


  #console.log "video_search #{search}", opts

  request "http://graph.facebook.com/search?q=#{search}&type=post&#{opts_str}",
    (err, res, body) ->
      try
        out = JSON.parse(body)
      catch e
        console.log e
      return unless out?.data?
      posts = out.data
      #console.log "URLs : #{posts.length}"
      _(posts).chain().select( (post) ->
        post.type is "video"
        ).map (post) ->
          url = post.link
          return unless url
          msg = 
            provider: "facebook"
            id: "facebook/#{post.id}"
            name: post.from.name
            username: post.from.id
            post_date: post.created_time
            text: post.message
            votes: post.likes.count if post.likes

          if post.picture
            thumb = decodeURIComponent _(post.picture.split("&")).chain().map( (param) -> 
              if ret = param.match /url=(.+)$/
                ret[1]
            ).compact().value()[0]

          vdo = {}
          vdo.title = post.name if post.name?
          vdo.embed = post.source if post.source?
          vdo.thumbnail = thumb if thumb?

          video_platforms.getVideoFromMsg msg, url, vdo

video_search argv.search, argv