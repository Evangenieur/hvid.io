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

    var urlify = function (str) {
      return str.replace(/\s/g, '_')
        .replace(/:/g, '-')
        .replace(/\\/g, '-')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9\-_]+/g, '')
        .replace(/-{2,}/g, '-')
        .toLowerCase();
    }


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
                console.log("CONNECTED");
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
                hvidio.play($(this).attr('href')).hide();

                e.preventDefault();
            });

            $results.on('click', '.tip', function(e) {
                $(this).closest('.video').find('.video-people').fadeIn();

                e.preventDefault();
            });

            $results.on('click', '.video-people', function(e) {
                $(this).fadeOut();

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
        		$(document).bind('keydown', "play", function(e){
    				hvidio.hide();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
    			$(document).bind('keydown', "pause", function(e){
    				hvidio.show();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
				$(document).bind('keydown', "stop", function(e){
    				hvidio.show();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
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
    			$(document).bind('keydown', "fastforward", function(e){
    				//hvidio.next();
    				e.stopPropagation();
    				e.preventDefault();
    				return false;
    			});
    			$(document).bind('keydown', "rewind", function(e){
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
                    console.log("PASSE PAR LA CALLBACK");
                    $main.addClass('large');

                    hvidio.templatize('#videosTemplate', { search: urlify(keyword), videos: data }, '#results');

                    hvidio.initScroll();
                    
                    hvidio.loading(false);
                    
                    hvidio.play(data[0].embed);

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
                    hideScrollbar: false,
                    vScroll: true,
                    vScrollbar: true,
                    snap: 'li',
                    useTransition: true,
                    bounce: false,
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

            search = Search(keyword)/*.when(20, function() {
                    callback(
                        _(this.videos_by_posts()).map(function(video) {
                            video.msg = video.msgs[0];
                            video.id = hvidio.convertId(video.id);
                            // video.score = _.reduce(video.msgs, function(memo, num) { 
                            //     return (memo + (num.votes + 1)) || 1; 
                            // }, 0);
                            video.score = video.msgs.length;

                            video.date = video.msgs[0].post_date;
                            return video;
                        })
                    );

            })*/.on("video.new", function() {
                var pos;
                this.msg = this.msgs[0];
                this.id = hvidio.convertId(this.id);
                this.score = _.reduce(this.msgs, function(memo, num) { 
                    return (memo + (parseInt(num.votes) + 1)) || 1; 
                }, 0);

                this.date = this.msgs[0].post_date;
                
                if ((pos = this.embed.indexOf("?")) != -1) {
                    this.embed = this.embed.substr(0, pos);
                }

                if (typeof search.initiated == "undefined") { 
                    search.initiated = true;
                    scroll = false;
                    callback([this]);
                } else {
                    var html = hvidio.templatize('#videoTemplate', { video: this });
                    var $mylist = $("#video-list-" + urlify(keyword));
                    //$list.append(html);
                    /*
                    $mylist.append(html);
                    $(html).fadeIn()
                    */
                    var $html = $(html);

                    $mylist.append($html);

                    $html.css('visibility','visible').hide().fadeIn('slow'); 
                    hvidio.initScroll();
                }

            }).on("video.update", function() {

                var id = hvidio.convertId(this.id),
                    $tip = $('#' + id + ' .tip'),
                    $people = $('#' + id + ' .video-people ul'),
                    score = parseInt($tip.text()) || 1,
                    newScore = score + 1; //(this.msgs[this.msgs.length - 1].votes || 1);

                $tip.text(newScore + '+');
                $tip.addClass('incremented animated bounce');

                var msg = this.msgs[this.msgs.length - 1];

                var html = hvidio.templatize('#messageTemplate', { msg: msg });
                //console.log(html);
                $people.prepend($(html).hide().fadeIn());
            });

            return this;
        },

        convertId: function(id) {
            return id.replace('/', '-');
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
            $results.find('.video').removeClass('current');

            $results.find('a[href="'+ embed +'"]').closest('.video').addClass('current');

            if (embed.indexOf("?") == -1) {
                embed += "?"
            } else {
                embed += "&"
            }
            embed += "wmode=transparent&autoplay=1&autohide=1"

            $player.attr('src', embed);

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
