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
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });

            return this;
        },

        search: function(keyword, callback) {

            var socket = io.connect("http://localhost:3002");

             socket.on("connect", function() {
                Search.com_init(socket);

                Search(keyword).when(20, function() {
                    var results = this.videos_by_posts();

                    if (results.length) {
                        $main.addClass('large');
                        
                        hvidio
                        .loading(false)
                        .templatize(
                            '#videosTemplate', 
                            { videos: results }, 
                            '#results'
                        );
                    } else {
                        alert('No result');
                    }

                }).on("video.new", function() {
                    //console.log("new video ", this);
                }).on("video.update", function() {
                    //console.log("updated video ", this);
                });
             });

            return this;
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

            return this;
        },

        fadeImg: function(html) {
            $results.find('time').timeago();

            $results.find('img').each(function() {
                $(this).on('load', function () { 
                    $(this).css('visibility','visible').hide().fadeIn('slow'); 
                });
            });

            return this;
        }
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
