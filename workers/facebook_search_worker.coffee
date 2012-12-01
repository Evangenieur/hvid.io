process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

request = require "request"
global._ = require "underscore"
global.Q = require "q"
argv = require("optimist").argv
video_platforms = require "../lib/video_platforms"

video_search = (search, opts = {}) ->
  _(opts).defaults
    locale: "en_US"

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

          video_platforms.getVideoFromMsg msg, url, 
            title: post.title
            embed: post.source
            thumbnail: thumb

video_search argv.search, argv