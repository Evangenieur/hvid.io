(function() {
    var loader, socket, scroll
        $main = $('#main'),
        $form = $('#form'),
        $list = $('#video-list'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $hashtags = $('#hashtags');

    window.hvidio = {

        init: function() {
            // Loader
            loader = new CanvasLoader('loading');
            loader.setColor('#99CC32');
            loader.setDiameter(32);
            loader.setDensity(32);
            loader.setRange(0.6);
            loader.setSpeed(1);

            // socket
            socket = io.connect();
            socket.on("connect", function() {
                console.log("CONNECTION");
                Search.com_init(socket);
            });

            // hashtags
            $hashtags.on('click', 'a', function(e) {
                var keyword = $keyword.val();

                $keyword.val(keyword);
                $form.submit();
                
                e.preventDefault();
            });

            // toggle main window
            $('body').on('click', function(e) {
                $main.fadeIn('fast');
                
                e.stopPropagation();
            });

            $main.on('click', function(e) {
                $main.fadeOut('fast');

                e.stopPropagation();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            $results.on('click', function(e) {
                e.stopPropagation();
            });

            // search
            $form.on('submit', function(e) {
                var keyword = $keyword.val();

                hvidio.search(keyword);

                e.preventDefault();
                return false;
            });

            return this;
        },

        search: function(keyword) {
            if (keyword) {
                hvidio.loading(true);

                hvidio.fetch(keyword, function(data) {
                    $main.addClass('large');

                    hvidio.templatize('#videosTemplate', { videos: data }, '#results');
                    
                    hvidio.loading(false);
                    
                    if (scroll) {
                        scroll.refresh();
                    } else {
                        scroll = new iScroll('results', {
                            scrollbarClass: 'myScrollbar',
                        });
                    }
                });
            }
        },

        fetch: function(keyword, callback) {
            Search(keyword).when(20, function() {

                    callback(
                        _(this.videos_by_posts()).map(function(video) {
                            video.msg = video.msgs[0];
                            video.id = video.id.replace('/', '-', video.id);
                            video.score = video.msgs.length;
    
                            return video;
                        })
                    );

            }).on("video.new", function() {
                var html = hvidio.templatize('#videoTemplate', { video: this });
                $list.prepend($(html).hide().fadeIn());

                console.log("new video", this.embed);
            }).on("video.update", function() {
                console.log("updated video ", this);
            });
        },

        templatize: function(template, data, output) {
            var tmpl  = $(template).html(),
                html = _.template(tmpl, data );

            if (output) {
                $(output).html(html);
            }

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

    // Extra scripts
    var _underscore_template = _.template;
    _.template = function(str, data) {
        return _underscore_template(
            str.replace(
                /<%\s*include\s*(.*?)\s*%>/g,
                function(match, templateId) {
                    var el = $('#' + templateId);
                    return el ? el.html() : '';
                }
            ),
            data
        );
    };
})();

$(function() {
    hvidio.init(); 

    // debug
    setTimeout(function() {
        $('#keyword').val("metallica");
        $('#form').submit(); 
    }, 500);
})
