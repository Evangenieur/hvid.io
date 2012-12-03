spawn = require("child_process").spawn

fork = (file, args) ->
  inputs_arr = [file]
  for k, v of args
    inputs_arr.push "--#{k}"
    inputs_arr.push if typeof(v) is "object"
        JSON.stringify v
      else if typeof(v) is "string"
        "'#{v}'"
      else
        v
  console.log inputs_arr
  spawned = spawn "coffee", inputs_arr

  spawned.stdin.setEncoding('utf8')
  spawned.stdout.setEncoding('utf8')
  spawned.send = (obj) ->
    console.log spawned.stdin.write
    spawned.stdin.write JSON.stringify obj
  spawned.on_message = (cb) ->
    spawned.stdout.on "data", (msg) ->
      console.log "parent got message", arguments
      try 
        cb JSON.parse(msg.toString())
      catch e
        console.log e
  spawned

module.exports = (file, opts, cb) ->
  console.log "forking", file, opts
  forked = fork file, opts
  forked.on_message (obj) ->
    cb obj
  forked.on "exit", ->
    console.log "Exited"
