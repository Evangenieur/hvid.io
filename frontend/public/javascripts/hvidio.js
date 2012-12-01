var hvidio;

(function() {
    var loader,
        $main = $('#main'),
        $form = $('#form'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $hashtags = $('#hashtags');

    hvidio = {

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
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });
        },

        search: function(keyword, callback) {
            var socket = io.connect("http://localhost:3002");

             socket.on("connect", function() {
                Search.com_init(socket);

                Search(keyword).when(20, function() {
                    return console.log(this.videos_by_posts());
                }).on("video.new", function() {
                    return console.log("new video ", this);
                }).on("video.update", function() {
                    return console.log("updated video ", this);
                });
             });
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
            $results.find('time').timeago();

            $results.find('img').each(function() {
                $(this).on('load', function () { 
                    $(this).css('visibility','visible').hide().fadeIn('slow'); 
                });
            });
        }
    }
})();

$(function() {
    hvidio.init(); 
})
