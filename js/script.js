$(function() {



    var addTpl = _.template($('#add_tpl').html()),
        placeTpl = _.template($('#place_tpl').html()),
        listTpl = _.template($('#list_tpl').html()),
        eventTpl = _.template($('#event_tpl').html());



    function showEdit(id) {
        var def = {
            id: '',
            name: '',
            text: '',
            date: '',
            related: ''
        };
        var param;
        var listEvent;

        if ( id ) {
            listEvent = JSON.parse(localStorage.getItem('listEvent'));
            param = _.find(listEvent, function(e) {
                return e.id == id;
            });
        }

        $('#content').html(addTpl(_.extend(def, param || {})));
        $('#date').datepicker({
            dateFormat: 'dd.mm.yy'
        });
        $('select').selectmenu();

        var mapOptions = {
            center: new google.maps.LatLng(49.9945914, 36.2858248),
            zoom: 10,
            scrollwheel: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        var marker;

        if ( id ) {
            if ( param.related ) {
                $('select').val(param.related);
            }
            if ( param.marker ) {
                marker = new google.maps.Marker({
                    map: map,
                    draggable: true,
                    position: new google.maps.LatLng(param.marker[0], param.marker[1])
                });
            }
        }
        google.maps.event.addListener(map, 'click', function(ev) {
            if (marker) {
                marker.setPosition(ev.latLng);
            } else {
                marker = new google.maps.Marker({
                    map: this,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    position: ev.latLng
                });
            }
        });

        $('#add-event').on('submit', function(e) {
            e.preventDefault();

            var nameEvent = $(this.nameEvent).val(),
                text = $(this.description).val(),
                date = Date.parse( $(this.date).datepicker("getDate") ),
                related = $(this.related).val();

            var listEvent = JSON.parse(localStorage.getItem('listEvent'));
            var event = {
                id: listEvent.length + 1,
                name: nameEvent,
                text: text,
                date: date,
                related: related
            };

            if (marker) {
                event.marker = [marker.position.k, marker.position.D];
            }

            if ( id ) {
                ev = _.find(listEvent, function(item) {
                    return item.id === param.id;
                });
                event = _.extend(ev, event);
            } else {
                listEvent.push(event);
            }
            localStorage.setItem('listEvent', JSON.stringify(listEvent));
        });
    }






    function map() {
        var mapOptions = {
            center: new google.maps.LatLng(49.9945914, 36.2858248),
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var listEvent = JSON.parse(localStorage.getItem('listEvent'));
        var markers = [];
        for (var i = 0; i < listEvent.length; i++) {
            if (listEvent[i].marker) {
                markers[i] = new google.maps.Marker({
                    map: map,
                    title: listEvent[i].name,
                    position: new google.maps.LatLng(listEvent[i].marker[0], listEvent[i].marker[1])
                });

                google.maps.event.addListener(markers[i], 'click', (function(i) {
                    return function(ev) {
                        location.hash = '#event/' + listEvent[i].id;
                    };
                })(i));
            }
        }
    }


    function showEvent(id) {
        var listEvent = JSON.parse(localStorage.getItem('listEvent'));
        listEvent = _.filter(listEvent, function(event) {
            return event.id == id;
        });
        var event = listEvent[0];
        $('#content').html(eventTpl(event));

        var mapOptions = {
            center: new google.maps.LatLng(49.9945914, 36.2858248),
            zoom: 10,
            scrollwheel: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        var marker;

        if ( event.marker ) {
            marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(event.marker[0], event.marker[1])
            });
        }

        $("#dialog").dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                OK: function() {
                    var id = $(this).data('id');
                    remove(listEvent, id);
                    $('#content li[data-id=' + id + ']').remove();
                    $(this).dialog( "close" );
                },
                Cancel: function() {
                    $(this).dialog( "close" );
                }
            }
        });
        $('#content').on('click', '.delete', function(e){
            var id = $(this).parent().data('id');
            $("#dialog").data('id', id).dialog('open');
            e.preventDefault();
        });
    }


    function showPlace() {
        $('#content').html(placeTpl());
        map();
    }



    function remove(listEvent, id) {
        listEvent = _.filter(listEvent, function(event) {
            return event.id != id;
        });
        localStorage.setItem('listEvent', JSON.stringify(listEvent));
    }




    function showList() {
        var listEvent = JSON.parse(localStorage.getItem('listEvent'));
        $('#content').html( listTpl({item: listEvent}) );


        $("#dialog").dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                OK: function() {
                    var id = $(this).data('id');
                    remove(listEvent, id);
                    $('#content li[data-id=' + id + ']').remove();
                    $(this).dialog( "close" );
                },
                Cancel: function() {
                    $(this).dialog( "close" );
                }
            }
        });
        $('#content').on('click', '.delete', function(e){
            var id = $(this).parent().data('id');
            $("#dialog").data('id', id).dialog('open');
            e.preventDefault();
        });
    }



    function show() {
        var hash = location.hash;
        if (hash === "" || hash === "#list") {
            showList();
        } else if (hash === "#place") {
            showPlace();
        } else if (hash === "#event/add") {
            showEdit();
        } else if (/#event\/edit\//.test(hash)) {
            showEdit(hash.match(/#event\/edit\/(.+?)$/)[1]);
        } else if (/#event\//.test(hash)) {
            showEvent(hash.match(/#event\/(.+?)$/)[1]);
        }
        $('.nav a').filter('[href="' + hash + '"]').trigger('click');
    }


    show();

    $(window).on('hashchange', show);

    $('.nav').on('click', 'a', function(e){
        var li = $(this).parent();
        if (!li.hasClass('active')) {
            li.addClass('active').siblings().removeClass('active');
        }
    });

});