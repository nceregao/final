$(function() {
    var addTpl     = _.template($('#add_tpl').html()),
        placeTpl   = _.template($('#place_tpl').html()),
        listTpl    = _.template($('#list_tpl').html()),
        eventTpl   = _.template($('#event_tpl').html()),
        errrorTpl  = _.template($('#errorpage_tpl').html()),
        infoMarkerTpl = _.template($('#infomarker_tpl').html()),
        listEvent = JSON.parse(localStorage.getItem('listEvent')) || [];



    // конструктор события
    function Event(param) {
        param = param || {};
        this.id = param.id || '';
        this.name = param.name || '';
        this.text = param.text || '';
        this.textStyle = param.textStyle || '';
        this.date = param.date || '';
        this.related = param.related || '';
        this.video = param.video || '';
        this.marker = param.marker || '';
        this.photos = param.photos || '';
    }



    // сохранение списка на localStorage
    function saveListEvent() {
        localStorage.setItem('listEvent', JSON.stringify(listEvent));
    }




    // генерация уникального id с проверкой на совпадения
    function generateId() {
        var newId = _.uniqueId();
        var oneEvent = _.find(listEvent, function(item) {
            return item.id === newId;
        });
        return oneEvent ? generateId(listEvent) : newId;
    }



    // инициализация карты
    function mapInit() {
        var mapOptions = {
            zoom: 10,
            panControl: false,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(49.9945914, 36.2858248)
        };
        return new google.maps.Map(document.getElementById("map"), mapOptions);
    }






    // форма для добавления и редактирования события
    function showEdit(id) {
        var oneEvent,
            formEvent,
            map,
            marker;

        if ( id ) {
            oneEvent = _.find(listEvent, function(e) {
                return e.id == id;
            });
        } else {
            oneEvent = new Event();
        }

        $('#content').html(addTpl(oneEvent));
        map = mapInit();
        $('#date').datepicker({
            dateFormat: 'dd.mm.yy'
        });
        $(window).one('hashchange', function(){
            $('#date').datepicker('destroy');
        });
        $('select').selectmenu();
        formEvent = $('#add-event');

        if ( id ) {
            if ( oneEvent.related ) {
                $('#related').val(oneEvent.related);
            }
            if ( oneEvent.marker ) {
                marker = new google.maps.Marker({
                    map: map,
                    draggable: true,
                    position: new google.maps.LatLng(oneEvent.marker[0], oneEvent.marker[1])
                });
                map.setCenter(marker.getPosition());
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

        formEvent.on('submit', function(e) {
            var nameEvent = $(this.nameEvent).val(),
                text = $(this.description).val(),
                textStyle = $(this.description).attr('style'),
                date = $(this.date).datepicker("getDate"),
                related = $(this.related).val(),
                video = $(this.video).val(),
                photos = $(this.photos).val(),
                errorList = '',
                newEvent;

            e.preventDefault();

            if (nameEvent === '') {
                $(this.nameEvent).addClass('g-error');
                errorList = 'Введите название события!';
            } else if (text === '') {
                $(this.description).addClass('g-error');
                errorList = 'Введите описание события!';
            } else if (!_.isDate(date)) {
                $(this.date).addClass('g-error');
                errorList = 'Введите правильную дату!';
            }
            if (errorList === '') {
                $('.errormsg').hide().empty();
                $(this).find('.g-error').removeClass('g-error');
            } else {
                $('.errormsg').text(errorList).show();
                return;
            }

            newEvent = new Event({
                id: id || generateId(),
                name: nameEvent,
                text: text,
                textStyle: textStyle,
                date: Date.parse(date),
                related: related,
                video: video,
                photos: photos
            });

            if (marker) {
                newEvent.marker = _.toArray(marker.getPosition());
            }
            if ( id ) {
                oneEvent = _.extend(oneEvent, newEvent);
            } else {
                listEvent.push(newEvent);
            }
            saveListEvent();
            location.hash = '#event/' + (id || newEvent.id);
        });

        $('.select-color').click(function(e) {
            e.stopPropagation();
            $(this).toggleClass('open');
        });
        $('body').on('click', function(){
            if ($('.select-color').hasClass('open')) {
                $('.select-color').removeClass('open');
            }
        });

        formEvent.on('change', '[name=fontWeight], [name=fontStyle], [name=textDecoration], [name=color]', function(event) {
            var field = formEvent.find('[name=description]'),
                target = $(event.target),
                styleName = target.attr('name'),
                value = $(target).val();

            if (target.is(':radio') || target.is('select')) {
                field.css(styleName, value);
            } else if (target.is(':checkbox')) {
                field.css(styleName, target.is(':checked') ? value : '');
            }
        });

        formEvent.find('[name=fontSize]').val($('[name=description]').css('fontSize')).selectmenu({
            change: function(event, ui) {
                formEvent.find('[name=description]').css('font-size', $(this).val() + 'px');
            }
        });

        formEvent.find('[name=nameEvent]').change(function(){
            var $this = $(this),
                val = $this.val();

            if (val.length === 0 && !$this.hasClass('g-error')) {
                $this.addClass('g-error');
                $('.errormsg').text('Введите название события!').show();;
            } else if ($this.hasClass('g-error')) {
                $this.removeClass('g-error');
                $('.errormsg').hide().empty();
            }
        });
        formEvent.find('[name=description]').change(function(){
            var $this = $(this),
                val = $this.val();

            if (val.length === 0 && !$this.hasClass('g-error')) {
                $this.addClass('g-error');
                $('.errormsg').text('Введите описание события!').show();;
            } else if ($this.hasClass('g-error')) {
                $this.removeClass('g-error');
                $('.errormsg').hide().empty();
            }
        });
        formEvent.find('[name=date]').change(function(){
            var $this = $(this),
                val =  $(this).datepicker("getDate");

            if (!_.isDate(val) && !$this.hasClass('g-error')) {
                $this.addClass('g-error');
                $('.errormsg').text('Введите правильную дату!').show();;
            } else if ($this.hasClass('g-error')) {
                $this.removeClass('g-error');
                $('.errormsg').hide().empty();
            }
        });
    }





    // отображение всех событий на карте
    function showPlace() {
        var map,
            image = {
                url: 'images/marker.png',
                size: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(20, 40),
                scaledSize: new google.maps.Size(40, 40)
            },
            infowindow = new google.maps.InfoWindow({
                maxWidth: 300
            }),
            latlngbounds = new google.maps.LatLngBounds(),
            markers = {};

        $('#content').html(placeTpl());
        map = mapInit();


        _.each(listEvent, function(oneEvent, i) {
            var marker,
                position;

            if (!oneEvent.marker) {
                return;
            }
            position = new google.maps.LatLng(oneEvent.marker[0], oneEvent.marker[1]);
            latlngbounds.extend(position);

            marker = new google.maps.Marker({
                map: map,
                position: position,
                icon: image,
                title: oneEvent.name
            });
            infowindow = new google.maps.InfoWindow({
                content: infoMarkerTpl(listEvent[i]),
                maxWidth: 300
            });
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.setContent( infoMarkerTpl(oneEvent) );
                infowindow.open(map, marker);
            });
            markers[oneEvent.id] = marker;
        });

        if (listEvent > 0) {
            map.fitBounds(latlngbounds);
        }

        google.maps.event.addListener(map, 'click', function() {
            infowindow.close();
        });

        map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('map-search'));
        $('#map-search').autocomplete({
            source: function(request, response){
                var resEvent = _.filter(listEvent, function(event) {
                    var pattern = new RegExp(request.term);
                    return pattern.test(event.name);
                });
                var resValue = _.map(resEvent, function(event){
                    return {
                        label: event.name,
                        oneEvent: event
                    };
                });
                response(resValue);
            },
            select: function(event, ui) {
                infowindow.setContent( infoMarkerTpl(ui.item.oneEvent) );
                infowindow.open(map, markers[ui.item.oneEvent.id]);
            },
            focus: function(event, ui) {
                map.panTo(markers[ui.item.oneEvent.id].getPosition());
            }
        });

        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('full-switch'));
        $('#full-switch').click(function(e){
            var center = map.getCenter();
            $('body').toggleClass('scroll-lock');
            $('#map').toggleClass('map-open-full');
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
            e.preventDefault();
        });
    }





    // удаление события по id
    function remove(id) {
        listEvent = _.filter(listEvent, function(event) {
            return event.id != id;
        });
        saveListEvent();
    }





    // модальное окно подтверждения удаления события
    function removeDialog() {
        $("#dialog").dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                OK: function() {
                    var id = $(this).data('id');
                    remove(id);
                    $(this).dialog("close");
                    if (location.hash === "#list") {
                        $('#content li[data-id=' + id + ']').slideUp(function(){
                            $(this).remove();
                            listEvent.length || showList();
                        });
                    } else {
                        location.hash = '#list';
                    }
                },
                Cancel: function() {
                    $(this).dialog( "close" );
                }
            }
        });
    }





    // отображение списка событий
    function showList(sort) {
        $('#content').html(listTpl({item: listEvent}));

        if (listEvent.length === 0) {
            return;
        }

        $('.list-events').on('click', '.delete', function(e){
            var id = $(this).parent().data('id');
            $("#dialog").data('id', id).dialog('open');
            e.preventDefault();
        });
        $('#sorting').val(sort || '').selectmenu({
            width: 160,
            change: function(ev, ui) {
                var val = ui.item.value;

                if (val === '') {
                    $('.list-events li').show();
                    return;
                } else if (val === 'date') {
                    listEvent.sort(function(a, b) {
                        return (a.date - b.date);
                    });
                } else if (val === 'name') {
                    listEvent.sort(function(a, b) {
                       var compA = a.name.toUpperCase();
                       var compB = b.name.toUpperCase();
                       return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
                    })
                } else if (val === 'Положительно' || val === 'Отрицательное' || val === 'Нейтральное') {
                    $('.list-events li').each(function(i) {
                        if (listEvent[i].related == val) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                    return;
                }
                saveListEvent();
                showList(val);
            }
        });
        $('#search').autocomplete({
            source: function(request, response){
                var resEvent = _.filter(listEvent, function(event) {
                    var pattern = new RegExp(request.term);
                    return pattern.test(event.name);
                });
                var resValue = _.map(resEvent, function(event){
                    return {
                        label: event.name,
                        id: event.id
                    };
                });
                response(resValue);
            },
            select: function(event, ui) {
                location.hash = '#event/' + ui.item.id;
            }
        });
    }





    // отображение одного события
    function showEvent(id) {
        var map,
            marker,
            oneEvent;

        oneEvent = _.find(listEvent, function(e) {
            return e.id == id;
        });
        if (!oneEvent) {
            location.hash = '#list';
            return;
        }
        $('#content').html(eventTpl(oneEvent));
        map = mapInit();

        if ( oneEvent.marker ) {
            marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(oneEvent.marker[0], oneEvent.marker[1])
            });
            map.setCenter(marker.getPosition());
        }

        $('#content').on('click', '.delete', function(e){
            var id = $(this).parent().data('id');
            $("#dialog").data('id', id).dialog('open');
            e.preventDefault();
        });
    }





    // 404
    function showErrorPage() {
        $('#content').html(errrorTpl());
    }





    function route() {
        var hash = location.hash,
            navActive = $('.nav a[href="' + hash + '"]'),
            id = hash.match(/^(#event\/(edit\/)?)(.+?)$/);

        $('.nav .active').removeClass('active');
        if (navActive.length) {
            navActive.addClass('active');
        } else if (hash === "") {
            $('.nav a').first().addClass('active');
        }

        if (hash === "" || hash === "#list") {
            showList();
        } else if (hash === "#place") {
            showPlace();
        } else if (hash === "#event/add") {
            showEdit();
        } else if (id && id[1] == '#event/edit/') {
            showEdit(id[3]);
        } else if (id && id[1] == '#event/') {
            showEvent(id[3]);
        } else {
            showErrorPage();
        }
        $(document).scrollTop(0);
    }

    removeDialog();
    route();
    $(window).on('hashchange', route);
});