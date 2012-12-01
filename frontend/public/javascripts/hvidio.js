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
                e.preventDefault();

                var keyword = $(this).text();

                $keyword.val(keyword);
                $form.submit();
            });

            $('body').on('click', function(e) {
                e.stopPropagation();
                $main.fadeIn('fast');
            });

            $main.on('click', function(e) {
                e.stopPropagation();

                $main.fadeOut('fast');
            });

            $form.on('submit', function(e) {
                e.preventDefault();
            });

            $keyword.on('click', function(e) {
                e.stopPropagation();
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
