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
            $.getJSON('/fixtures.js?v=2' + Math.random()*99999999, callback);
        },

        templatize: function(template, data, output) {
            var tmpl  = $(template).html(),
                html = _.template(tmpl, data );

            $(output).html(html);

            return html;
        },

        templatizeFile: function(template, data, output) {
            $.get('/templates/'+template, function(tmpl) {
                html = _.template(tmpl, data );

                $(output).html(html);
            });
        },

        loading: function(bool) {
            if (bool) {
                loader.show();
            } else {
                loader.hide();
            }
        }
    }
})();

$(function() {
    hvidio.init(); 
})
