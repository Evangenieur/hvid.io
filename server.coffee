_ = require "underscore"
child_launcher = require "./lib/child_launcher"
Q = require "q"

require('zappajs') ->
  @use "static", "favicon", require('less-middleware')({ src: __dirname + '/public' })
  @set 'view engine': 'jade'

  @io.set 'log level', 2

  @get "/": -> 
    @render "index"

  @get "/no": -> 
    @render "no"
    
  ###
  @get "/info": ->
     os = require "os"
     @send
      loadavg  : os.loadavg()
      uptime   : os.uptime()
      freemem  : os.freemem()
      totalmem : os.totalmem()
  ###
  @on "search": ->
    promises = []
    _(["twitter", "facebook", "googleplus", "youtube"]).each (worker) =>
      deferred = Q.defer()

      child_launcher "./workers/#{worker}_search_worker.coffee", 
        search: @data
        message: (video) =>
          @emit search_result: 
            search_term: @data
            videos: [
              video
            ]
        exit: ->
          console.log "exit #{worker}"
          deferred.resolve()
      promises.push deferred.promise
    
    console.log promises
    Q.allResolved(promises).then =>
      console.log "all done"
      @ack "end"
