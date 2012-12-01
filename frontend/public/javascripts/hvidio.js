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

                hvidio.loading(true);
                hvidio.getVideos(keyword, function(data) {
                    console.log(data);
                    hvidio.loading(false);
                });

                e.preventDefault();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
            });
        },

        getVideos: function(keyword, callback) {
            $.getJSON('/fixtures.js?v=' + Math.random()*99999999, callback);
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
