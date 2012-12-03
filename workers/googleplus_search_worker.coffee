process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

argv = require("optimist").argv
video_platforms = require "../lib/video_platforms"
google_conf = require "../config/google_api"
_ = require "underscore"
request = require "request"

video_search = (search, opts = {}) ->
  _(opts).defaults
    #language: "fr" #"en"
    maxResults: 20

  opts_str = ""
  for k, v of opts
    opts_str += "#{k}=#{v}&"

  url = "https://www.googleapis.com/plus/v1/activities?key=#{google_conf.api_key}&query=#{encodeURIComponent search}&#{opts_str}"
  #console.log url
  request url,
    (err, res, body) ->
      try 
        out = JSON.parse(body)
      catch e
        return
      posts = out.items
      #console.log out, out.items.length
      _(posts).chain().each (post) ->
        _(post.object.attachments).each (attachment) ->
          if attachment.objectType is "video"
            url = attachment.url

            msg = 
              provider: "googleplus"
              id: "googleplus/#{post.etag}"
              name: post.actor.displayName
              username: post.actor.id
              avatar_url: post.actor.image.url
              post_date: post.published
              text: post.title
              votes: 0

            for prop in ["replies", "plusoners", "resharers"]
              msg.votes += post.object[prop].totalItems

            vdo = {}
            vdo.title = attachment.displayName
            vdo.thumbnail = attachment.image.url

            video_platforms.getVideoFromMsg msg, url, vdo

video_search argv.search, argv
