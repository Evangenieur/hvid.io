var hvidio;

(function() {
    var loader;

    hvidio = {
        init: function() {
            loader = new CanvasLoader('loading');
            loader.setColor('#99CC32');
            loader.setDiameter(32);
            loader.setDensity(32);
            loader.setRange(0.6);
            loader.setSpeed(1);
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

hvidio.init();
hvidio.loading(true);