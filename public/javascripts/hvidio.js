(function() {
    var loader, socket, scroll
        $main = $('#main'),
        $form = $('#form'),
        $list = $('#video-list'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $hashtags = $('#hashtags'),
        $player = $('#player'),
        $clickjack = $('#clickjack');

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
            $clickjack.on('click', function(e) {
                hvidio.show();
                e.stopPropagation();
                e.preventDefault();
            });

            $main.on('click', function(e) {
                hvidio.hide();

                e.stopPropagation();
                e.preventDefault();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            $results.on('click', function(e) {
                e.stopPropagation();
            });

            $results.on('click', '.play', function(e) {
                hvidio
                .play($(this).attr('href'));

                e.preventDefault();
            });

            // search
            $form.on('submit', function(e) {
                var keyword = $keyword.val();

                hvidio.search(keyword);

                e.preventDefault();
            });

            $main.addClass('bounceIn');

            return this;
        },

        search: function(keyword) {
            if (keyword) {
                hvidio.loading(true);

                hvidio.fetch(keyword, function(data) {
                    $main.addClass('large');

                    hvidio.templatize('#videosTemplate', { videos: data }, '#results');
                    
                    hvidio.loading(false);
                    
                    hvidio.play(data[0].embed);

                    if (scroll) {
                        scroll.refresh();
                    } else {
                        scroll = new iScroll('results', {
                            scrollbarClass: 'myScrollbar',
                        });
                    }
                });
            }

            return this;
        },

        fetch: function(keyword, callback) {
            Search(keyword).when(20, function() {

                    callback(
                        _(this.videos_by_posts()).map(function(video) {
                            video.msg = video.msgs[0];
                            video.id = video.id.replace('/', '-', video.id);
                            video.score = video.msgs.length;
                            video.date = video.msgs[0].post_date;
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

            return this;
        },

        templatize: function(template, data, output) {
            var tmpl  = $(template).html(),
                html = _.template(tmpl, data );

            if (output) {
                $(output).html(html);
            }

            $('time').timeago();

            hvidio.fadeImg();

            return html;
        },

        loading: function(bool) {
            if (bool) {
                loader.show();
            } else {
                loader.hide();
            }

            return this;
        },

        show: function() {
            //$main.show();
            $main.removeClass('bounceIn fadeOutUp fadeOutDown');
            $main.addClass('fadeInUp').show();;

            return this;
        },

        hide: function() {
            //$main.hide();
            $main.removeClass('bounceIn fadeOutUp fadeOutDown');
            $main.addClass('fadeOutDown');
            setTimeout(function() { $main.hide() }, 500);

            return this;
        },

        fadeImg: function(html) {
            $('#results img').each(function() {
                $(this).on('load', function () { 
                    $(this).css('visibility','visible').hide().fadeIn('slow'); 
                });
            });

            return this;
        },

        play: function(embed) {
            $player.attr('src', embed);

            $results.find('.video').removeClass('current');

            $results.find('a[href="'+ embed +'"]').closest('.video').addClass('current');

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
