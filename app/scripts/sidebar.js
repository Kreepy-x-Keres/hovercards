'use strict';

define('sidebar', ['jquery'], function($) {
    return function sidebar() {
        var obj = $('<div class="hovertoast-sidebar"></div>');
        var iframe = $('<iframe></iframe>')
            .prop('src', chrome.extension.getURL('sidebar.html'))
            .prop('frameborder', '0');
        obj.append(iframe);

        var stayVisible = false;
        var stayVisibleTimeout;

        chrome.runtime.onMessage.addListener(function(request) {
            if (request.msg !== 'sidebar') {
                return;
            }
            switch (request.visible) {
                case true:
                    obj.show();
                    if (request.important) {
                        stayVisible = true;
                        clearTimeout(stayVisibleTimeout);
                    } else {
                        stayVisibleTimeout = setTimeout(function() {
                            stayVisible = true;
                        }, 2000);
                    }
                    break;
                case null:
                    if (!stayVisible) {
                        obj.hide();
                        clearTimeout(stayVisibleTimeout);
                    }
                    break;
            }
        });

        return obj;
    };
});
