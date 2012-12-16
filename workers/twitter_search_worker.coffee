process.send = (msg) ->
  process.stdout.write JSON.stringify(msg) + "\n"

ntwitter = require 'ntwitter'
argv = require("optimist").argv
video_platforms = require "../lib/video_platforms"
_ = require "underscore"



tc = new ntwitter


video_search = (search, opts = {}) ->
  _(opts).defaults
    include_entities: on
    rpp: 20
    result_type: "recent"
    #lang: "fr"

  #console.log "video_search #{search}", opts

  tc.search "#{search} filter:videos", opts,
    (err, out) ->
      return unless out?.results?
      tweets = out.results
      #console.log out.results
      #console.log "URLs : #{out.results.length}"
      _(tweets).chain().map (tweet) ->
        _(tweet.entities.urls).map (url) ->
          url = url.expanded_url
          #console.log url
          msg = 
            provider: "twitter"
            id: "twitter/#{tweet.id_str}"
            id_str: tweet.id_str
            name: tweet.from_user_name
            username: tweet.from_user
            post_date: tweet.created_at
            text: tweet.text
            avatar_url: tweet.profile_image_url

          video_platforms.getVideoFromMsg msg, url

video_search argv.search, argv