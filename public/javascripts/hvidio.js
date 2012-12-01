(function() {
    var loader,
        $main = $('#main'),
        $form = $('#form'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $hashtags = $('#hashtags');

    window.hvidio = {

        init: function() {
            loader = new CanvasLoader('loading');
            loader.setColor('#99CC32');
            loader.setDiameter(32);
            loader.setDensity(32);
            loader.setRange(0.6);
            loader.setSpeed(1);

            $hashtags.on('click', 'a', function(e) {
                var keyword = $keyword.val();

                $keyword.val(keyword);
                $form.submit();
                
                e.preventDefault();
            });

            $('body').on('click', function(e) {
                $main.fadeIn('fast');
                
                e.stopPropagation();
            });

            $main.on('click', function(e) {
                $main.fadeOut('fast');

                e.stopPropagation();
            });

            $form.on('submit', function(e) {
                var keyword = $keyword.val();

                if (keyword) {
                    hvidio.loading(true);
                    hvidio.search(keyword, function(data) {

                        $main.addClass('large');

                        hvidio.templatize('#videosTemplate', { videos: data }, '#results');

                        hvidio.loading(false);
                    });
                }

                e.preventDefault();
                return false;
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            return this;
        },

        search: function(keyword, callback) {
            Search(keyword).when(20, function() {
              callback(
                _(this.videos_by_posts()).map(function(video) {
                    video.msg = video.msgs[0]
                    return video;
                })
              );
            }).on("video.new", function() {
              return console.log("new video ", this);
            }).on("video.update", function() {
              return console.log("updated video ", this);
             });
            /*$.getJSON('/fixtures.js?' + new Date().getTime(), callback);*/
        },

        templatize: function(template, data, output) {
            var tmpl  = $(template).html(),
                html = _.template(tmpl, data );

            $(output).html(html);

            hvidio.fadeImg();

            return html;
        },

        loading: function(bool) {
            if (bool) {
                loader.show();
            } else {
                loader.hide();
            }
        },

        fadeImg: function(html) {
            $('#results img').each(function() {
                $(this).on('load', function () { 
                    $(this).css('visibility','visible').hide().fadeIn('slow'); 
                });
            });

            return this;
        }
    }
})();

$(function() {
  var socket = io.connect();
  socket.on("connect", function() {
    console.log("CONNECTION");
    Search.com_init(socket);
  });

    hvidio.init(); 

})
