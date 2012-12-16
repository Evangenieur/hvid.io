(function() {
    var loader, socket, scroller, counter = 0,
        $main = $('#main'),
        $form = $('#form'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $player = $('#player'),
        $close = $('#close'),
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
            } else {
                $keyword.focus();
            }

            // socket
            socket = io.connect("http://"+window.location.host);
            socket.on("connect", function() {
                Search.com_init(socket);
            });

            // toggle main window
            $clickjack.on('click', function(e) {
                hvidio.show();

                e.stopPropagation();
                e.preventDefault();
            });

            //$close.on('click', function(e) {
            $main.on('click', function(e) {    
                hvidio.hide();

                e.stopPropagation();
                e.preventDefault();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            $results.on('click', '.play', function(e) {
                //hvidio.play($(this).attr('href')).hide();
                hvidio.play($(this).attr('href'));

                //e.stopPropagation();
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
            $(document).bind('keydown', function(e) {
                var tag = e.target.tagName.toLowerCase();
                if (tag != 'input' && tag != 'textarea') {
                    switch (e.keyCode) {
                        case 27: // esc
                            hvidio.toggle();
                            e.preventDefault();
                        break;
                        case 37: // left arrow
                            hvidio.prev();              
                            e.preventDefault();
                        break;
                        case 38: // up arrow
                            hvidio.prev();
                            e.preventDefault();
                        break;
                        case 39: // right arrow
                            hvidio.next();
                            e.preventDefault();
                        break;
                        case 40: // down arrow
                            hvidio.next();
                            e.preventDefault();
                        break;
                        case 9: // tab
                            hvidio.show();
                            $keyword.focus().select();
                            e.preventDefault();
                        break;
                    }
                }
            });

            $main.addClass('bounceIn');

            return this;
        },

        initScroller: function(force) {
            if (!scroller || force) {
                $results.mCustomScrollbar();
                scroller = true;
            } else {
               $results.mCustomScrollbar("update");
            }

            return this;
        },

        search: function(keyword) {
            if (keyword) {
                this.keyword = keyword;
                console.log(this);

                hvidio.loading(true);

                hvidio.fetch(keyword, function(data) {
                    $main.addClass('large');

                    console.log(data[0].msgs.length, data[0].provider, data[0].msgs[0].provider, data[0].msgs[0].text );
                    hvidio.templatize('#videosTemplate', { search: urlify(keyword), videos: data }, '#results');
                    
                    //hvidio.loading(false);
                    
                    hvidio.play(data[0].embed);

                    hvidio.initScroller(true);

                    $close.fadeIn(5000);
                });
            }

            return this;
        },

        insert_video: function(container, pos, video) {
            var $html = $(hvidio.templatize('#videoTemplate', { video: video }));

            elem = $(container + " > li:eq("+pos+")")
            if ( elem.length ) {
              elem.before($html);
            } else {
              $(container + " > li:eq("+(pos - 1)+")").after($html);
            }
            $html.css('visibility','visible').hide().fadeIn('fast'); 
        },
        get_video_score: function(video) {
            //return - video.msgs.length;
            return - (new Date(video.date)).valueOf();
        },
        fetch: function(keyword, callback) {
            var self = this;

            obs = new OrderByScore();
            var videos = {};

            search = Search(keyword)
            .reduce(function(video) {
            })
            .on("video.new", function(video) {
                var pos;
                video.msg = video.msgs[0];
                /*
                video.score = _.reduce(video.msgs, function(memo, num) { 
                    return (memo + (parseInt(num.votes) + 1)) || 1; 
                }, 0);
*/
                video.score = self.get_video_score(video);
                var pos = obs.get_pos(video.score);

                video.date = video.msgs[0].post_date;
                
                if ((pos = video.embed.indexOf("?")) != -1) {
                    video.embed = video.embed.substr(0, pos);
                }

                $('#counter').text(counter++);

                if (typeof search.initiated == "undefined") { 
                    search.initiated = true;
                    scroll = false;

                    callback([video]);
                } else {

                    self.insert_video("#video-list-" + urlify(keyword), pos, video);

                    hvidio.initScroller();

                }

            }).on("video.update", function(video) {
                var tmp_score = self.get_video_score(video);
                if (tmp_score != video.score) {
                    obs.remove_score(video.score);
                    video.score = tmp_score
                    var pos = obs.get_pos(video.score);
                    if ($("#video-list-" + urlify(keyword) + " > li:eq("+pos+")").attr("id") != video.dom_id) {
                        console.log("score != ?", tmp_score, video.score)
                        $('#' + video.dom_id).fadeOut().remove()
                        self.insert_video("#video-list-" + urlify(keyword), pos, video);
                    }
                }

                console.log("update", video.dom_id, video.provider, video.msgs[0].provider, video.msgs.length, video.msgs[0].text);
                var $tip = $('#' + video.dom_id + ' .tip'),
                    score = parseInt($tip.text()) || 1,
                    newScore = score + 1; //(video.msgs[video.msgs.length - 1].votes || 1);

                $tip.text(newScore + '+');
                $tip.addClass('incremented animated bounce');

            }).on("finished", function() {
                console.log("FINISHED");
                hvidio.loading(false);
                /*
                self.order(
                    search.videos_by_date()
                    //search.videos_by_posts()
                );
                */
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

            hvidio.resize();
            hvidio.fadeImg();

            return html;
        },

        loading: function(bool) {
            //console.log("loader", loader);
            if (bool) {
                loader.show();
            } else {
                loader.hide();
            }

            return this;
        },

        toggle: function() {
            if ($main.is(':visible')) {
                hvidio.hide();
            } else {
                hvidio.show();
            }

            return this;
        },

        show: function() {
            $main.removeClass('bounceIn fadeOutUp fadeOutDown');
            $main.addClass('fadeInUp').show();;

            return this;
        },

        hide: function() {
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
            $results.find('.video').removeClass('current');

            $results.find('a[href="'+ embed +'"]').closest('.video').addClass('current');

            if (embed.indexOf("?") == -1) {
                embed += "?";
            } else {
                embed += "&";
            }
            embed += "wmode=transparent&autoplay=1&autohide=1";

            $player.attr('src', embed);

            return this;
        },

        jump: function(index) {
           var embed = $('.video').eq(index).find('.play').attr('href');

           hvidio.play(embed);
        },

        next: function() {
            var index = $('.current').index('.video');

            index++;

            if (index > $('.video').size() - 1) {
                index = 0;
                $results.mCustomScrollbar("scrollTo", 0);
            }

            hvidio.jump(index);
        },

        prev: function() {
            var index = $('.current').index('.video');

            index--;

            if (index < 0) {
                index = $('.video').size() - 1;

                $results.mCustomScrollbar("scrollTo", 20000);
            }

            hvidio.jump(index);
        },

        resize: function() {
            // Adjusts result div height
            var mh = $main.height(),
                hh = $header.outerHeight();

            $results.outerHeight(mh - hh - 20);

            // Adjusts/centers result list
            var mw = $main.width(),
                ew = $results.find('li').outerWidth(true),
                rw = (Math.floor(mw / ew)) * ew;

            $results.find('.video-list').width(rw);
        }
    }

    // Extra scripts

    var urlify = function (str) {
      return str.replace(/\s/g, '_')
        .replace(/:/g, '-')
        .replace(/\\/g, '-')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9\-_]+/g, '')
        .replace(/-{2,}/g, '-')
        .toLowerCase();
    }

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
