(function() {
    var loader, socket, scroll
        $main = $('#main'),
        $form = $('#form'),
        $list = $('#video-list'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $hashtags = $('#hashtags'),
        $player = $('#player'),
        $close = $('#close'),
        $up = $('#up'),
        $down = $('#down'),
        $header = $('#header'),
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

            // load the hashtag
            if (window.location.hash) {
                setTimeout(function() {
                    $('#keyword').val(window.location.hash.substr(1));
                    $('#form').submit(); 
                }, 200);
            }

            // socket
            socket = io.connect();
            socket.on("connect", function() {
                Search.com_init(socket);
            });

            // hashtags
            $hashtags.on('click', 'a', function(e) {
                $keyword.val($keyword.val());
                $form.submit();
                
                e.preventDefault();
            });

            // toggle main window
            $clickjack.on('click', function(e) {
                hvidio.show();

                e.stopPropagation();
                e.preventDefault();
            });

            $close.on('click', function(e) {
                hvidio.hide();

                e.stopPropagation();
                e.preventDefault();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            $results.on('click', '.play', function(e) {
                hvidio.play($(this).attr('href'));

                e.preventDefault();
            });

            $results.on('click', '#up', function(e) {
                var h = $results.find('li').outerHeight(true);

                scroll.scrollTo(0, (scroll.y + h), 100);

                e.preventDefault();
            });

            $results.on('click', '#down', function(e) {
                var h = $results.find('li').outerHeight(true);

                scroll.scrollTo(0, (scroll.y - h), 100);

                e.preventDefault();
            });

            $(window).on('resize', function() {
                hvidio.resize();
            });

            // search
            $form.on('submit', function(e) {
                var keyword = $keyword.val();

                hvidio.search(keyword);
                window.location.hash = "#" + keyword;

                e.preventDefault();
            });
            
            //keyCodes      
            if (navigator.userAgent.match(/GoogleTv/)) {     
    			$(document).bind('keydown', "right", function(e){
    				//hvidio.next();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
    			$(document).bind('keydown', "left", function(e){
    				//hvidio.prev();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
    			$(document).bind('keydown', "esc", function(e){
    				hvidio.show();

    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
            }

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

                    hvidio.initScroll();

                    $close.fadeIn(5000);
                });
            }

            return this;
        },

        initScroll: function() {
            var toggleButtons = function(scroll) {
                if (scroll.y == scroll.maxScrollY) {
                    $('#down').hide();
                } else {
                    $('#down').show();
                }

                if (scroll.y == 0) {
                    $('#up').hide();
                } else {
                    $('#up').show();
                }
            }

            if (scroll) {
                scroll.refresh();
            } else {
                scroll = new iScroll('results', {
                    scrollbarClass: 'myScrollbar',
                    fadeScrollbar: true,
                    hideScrollbar: true,
                    vScroll: true,
                    vScrollbar: true,
                    useTransition: true,
                    onRefresh: function() {
                        toggleButtons(this);
                    },
                    onScrollEnd: function () {
                        toggleButtons(this);
                    }
                });
            }
        },

        fetch: function(keyword, callback) {

            search = Search(keyword).when(20, function() {

                    callback(
                        _(this.videos_by_posts()).map(function(video) {
                            video.msg = video.msgs[0];
                            video.id = hvidio.convertId(video.id);
                            //video.score = video.msgs.length;
                            video.score = _.reduce(video.msgs, function(memo, num) { 
                                return (memo + (parseInt(num.votes) + 1)) || 1; 
                            }, 0);

                            video.date = video.msgs[0].post_date;
                            return video;
                        })
                    );
            }).on("video.new", function() {
                /*
                var html = hvidio.templatize('#videoTemplate', { video: this });
                //console.log(html);
                $list.prepend($(html).hide().fadeIn());
                */

                console.log("new video", this.embed);
            }).on("video.update", function() {
                var id = hvidio.convertId(this.id),
                    $tip = $('#' + id + ' .tip'),
                    score = parseInt($tip.text()) || 1,
                    newScore = score + (this.msgs[this.msgs.length - 1].votes || 1);

                $tip.text(newScore + '+');
                $tip.addClass('incremented animated bounce');

                console.log("updated video ", this);
            });

            return this;
        },

        convertId: function(id) {
            return id.replace('/', '-', id);
        },

        templatize: function(template, data, output) {
            var tmpl  = $(template).html(),
                html = _.template(tmpl, data );

            if (output) {
                $(output).html(html);
            }

            $('time').timeago();

            hvidio.resize();
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
            if (embed.indexOf("?") == -1) {
                embed += "?"
            } else {
                embed += "&"
            }
            embed += "wmode=transparent&autoplay=1"
            $player.attr('src', embed);

            $results.find('.video').removeClass('current');

            $results.find('a[href="'+ embed +'"]').closest('.video').addClass('current');

            return this;
        },

        resize: function() {
            var mh = $main.height(),
                hh = $header.outerHeight();

            $results.outerHeight(mh - hh - 20);
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
})
