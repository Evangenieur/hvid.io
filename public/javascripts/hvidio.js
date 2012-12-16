(function() {
    var loader, socket, scroller, counter = 0, timerIdle, timerPlay,
        $main = $('#main'),
        $loading = $('#loading'),
        $form = $('#form'),
        $keyword = $('#keyword'),
        $results = $('#results'),
        $player = $('#player'),
        $close = $('#close'),
        $header = $('#header'),
        $hashtags = $('#hashtags'),
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
            });

            $main.on('click', 'a', function(e) {
                e.stopPropagation();
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

                $hashtags.remove();

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
                            hvidio.prev(1000);              
                            e.preventDefault();
                        break;
                        case 38: // up arrow
                            hvidio.prev(1000);
                            e.preventDefault();
                        break;
                        case 39: // right arrow
                            hvidio.next(1000);
                            e.preventDefault();
                        break;
                        case 40: // down arrow
                            hvidio.next(1000);
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

            // Hastags
            hvidio.hashtags();
            $hashtags.on('click', 'a', function(e) {
                var keyword = $(this).attr('href');
                $keyword.val(keyword);

                $form.submit();

                $hashtags.hide();

                e.stopPropagation();
                e.preventDefault();
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

        initTimer: function() {
            // Hide main window when idle
            $(window).on('mousemove keydown', function() {
                clearTimeout(timerIdle);
                timerIdle =  setTimeout(function() { hvidio.hide() }, 20000);
            });

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

                    hvidio
                        .play(data[0].embed)
                        .initScroller()
                        .initTimer();

                    $close.show();
                });
            }

            return this;
        },

<<<<<<< HEAD
        order: function(videos) {
            console.log("order", videos, this.keyword, $('#results'));
            hvidio.templatize('#videosTemplate', { search: urlify(this.keyword), videos: videos }, '#results');
            
            hvidio
                .loading(false)
                .play(videos[0].embed)
                .initScroller(true);
=======
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
>>>>>>> live-reordering
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
<<<<<<< HEAD
=======
                video.msg = video.msgs[0];
                /*
                video.score = _.reduce(video.msgs, function(memo, num) { 
                    return (memo + (parseInt(num.votes) + 1)) || 1; 
                }, 0);
*/
                video.score = self.get_video_score(video);
                var pos = obs.get_pos(video.score);

                video.date = video.msgs[0].post_date;
>>>>>>> live-reordering
                
                if ((pos = video.embed.indexOf("?")) != -1) {
                    video.embed = video.embed.substr(0, pos);
                }

                $('#counter').text(++counter);

                if (typeof search.initiated == "undefined") { 
                    search.initiated = true;
<<<<<<< HEAD
                    callback([this]);
                } else {
                    var html = hvidio.templatize('#videoTemplate', { video: this }),
                        $mylist = $("#video-list-" + urlify(keyword)),
                        $html = $(html);
=======
                    scroll = false;

                    callback([video]);
                } else {
>>>>>>> live-reordering

                    self.insert_video("#video-list-" + urlify(keyword), pos, video);

                    hvidio.initScroller();

                }

<<<<<<< HEAD
            }).on("video.update", function() {
                console.log("update", this.dom_id);
                var $tip = $('#' + this.dom_id + ' .tip');
=======
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
>>>>>>> live-reordering

                $tip.text(this.score + '+');
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
            if (bool) {
                loader.show();
                $loading.show();
            } else {
                loader.hide();
                $loading.hide();
            }

            return this;
        },

        hashtags: function() {
            var fp = $form.offset();
            $hashtags
                .css('top',  (fp.top) + 'px')
                .css('left', (fp.left + ($keyword.outerWidth())) + 'px')
                .fadeIn('slow');
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
                    $(this).css('visibility','visible').hide().fadeIn(); 
                });
            });

            return this;
        },

        play: function(embed, delay) {
            $results.find('.video').removeClass('current');

            $results.find('a[href="'+ embed +'"]').closest('.video').addClass('current');

            if (embed.indexOf("?") == -1) {
                embed += "?";
            } else {
                embed += "&";
            }
            embed += "wmode=transparent&autoplay=1&autohide=1";

            clearTimeout(timerPlay);
            timerPlay = setTimeout(function() {
                $player.attr('src', embed);
            }, delay);

            return this;
        },

        jump: function(index, delay) {
           var embed = $('.video').eq(index).find('.play').attr('href');

           hvidio.play(embed, delay);
        },

        next: function(delay) {
            var index = $('.current').index('.video');

            ++index;

            if (index > $('.video').size() - 1) {
                index = 0;
                $results.mCustomScrollbar("scrollTo", 0);
            }

            hvidio.jump(index, delay);
        },

        prev: function(delay) {
            var index = $('.current').index('.video');

            index--;

            if (index < 0) {
                index = $('.video').size() - 1;

                $results.mCustomScrollbar("scrollTo", 20000);
            }

            hvidio.jump(index, delay);
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

            hvidio.hashtags();
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
