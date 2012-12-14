(function() {
    var loader, socket, scroller,
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
                console.log("CONNECTED");
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

                e.stopPropagation();
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

        initScroller: function() {
            if (!scroller) {
                $results.mCustomScrollbar();
                scroller = true;
            } else {
               $results.mCustomScrollbar("update");
            }

            return this;
        },

        search: function(keyword) {
            if (keyword) {
                hvidio.loading(true);

                hvidio.fetch(keyword, function(data) {
                    $main.addClass('large');

                    hvidio.templatize('#videosTemplate', { search: urlify(keyword), videos: data }, '#results');
                    
                    hvidio.loading(false);
                    
                    hvidio.play(data[0].embed);

                    hvidio.initScroller();

                    $close.fadeIn(5000);
                });
            }

            return this;
        },

        fetch: function(keyword, callback) {

            search = Search(keyword)
            .on("video.new", function() {
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

                    hvidio.initScroller();

                    $html.css('visibility','visible').hide().fadeIn('slow'); 
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
