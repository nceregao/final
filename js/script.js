$(function() {
    var addTpl    = _.template($('#add_tpl').html()),
        placeTpl  = _.template($('#place_tpl').html()),
        listTpl   = _.template($('#list_tpl').html()),
        eventTpl  = _.template($('#event_tpl').html()),
        errrorTpl = _.template($('#errorpage_tpl').html()),
        listEvent = JSON.parse(localStorage.getItem('listEvent')) || [];


    function generateId() {
        var newId = _.uniqueId();
        var oneEvent = _.find(listEvent, function(item) {
            return item.id === newId;
        });
        return oneEvent ? generateId(listEvent) : newId;
    }

    function mapInit() {
        return new google.maps.Map(document.getElementById("map"), {
            center: new google.maps.LatLng(49.9945914, 36.2858248),
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    }

    function saveListEvent() {
        localStorage.setItem('listEvent', JSON.stringify(listEvent));
    }

    function Event(param) {
        param = param || {};
        this.id = param.id || '';
        this.name = param.name || '';
        this.text = param.text || '';
        this.textStyle = param.textStyle || '';
        this.date = param.date || '';
        this.related = param.related || '';
        this.marker = param.marker || '';
    }

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
        $('#date').datepicker({
            dateFormat: 'dd.mm.yy'
        });
        $(window).one('hashchange', function(){
            $('#date').datepicker('destroy');
        });
        $('select').selectmenu();
        map = mapInit();
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
            e.preventDefault();

            var nameEvent = $(this.nameEvent).val(),
                text = $(this.description).val(),
                textStyle = $(this.description).attr('style'),
                date = Date.parse($(this.date).datepicker("getDate")),
                related = $(this.related).val(),
                errorList = '',
                newEvent;

            if (nameEvent === '') {
                $(this.nameEvent).addClass('g-error');
                errorList = 'Введите название события!';
            }
            if (text === '') {
                $(this.description).addClass('g-error');
                errorList = errorList === '' ? 'Введите описание события!' : errorList;
            }
            if (/^\d\d.\d\d.\d\d$/.test(date)) {
                $(this.date).addClass('g-error');
                errorList = errorList === '' ? 'Введите правильную дату!' : errorList;
            }
            if (errorList === '' && $('.errormsg').is(':empty')) {
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
                date: date,
                related: related
            });

            if (marker) {
                newEvent.marker = [marker.position.k, marker.position.D];
            }
            if ( id ) {
                oneEvent = _.extend(oneEvent, newEvent);
            } else {
                listEvent.push(newEvent);
            }
            saveListEvent();
            location.hash = '#event/' + (id || newEvent.id);
        });

        $('.select-color').click(function(ev) {
            $(this).toggleClass('open');
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
    }


    function showPlace() {
        var map,
            markers = [];

        $('#content').html(placeTpl());
        map = mapInit();

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


    function remove(id) {
        listEvent = _.filter(listEvent, function(event) {
            return event.id != id;
        });
        saveListEvent();
    }


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
            width: 150,
            change: function(ev, ui) {
                var val = ui.item.value;

                if (val === '') {
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
                }
                saveListEvent();
                showList(val);
            }
        });
        $('#search-form').submit(function(e){
            e.preventDefault();
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


    function showErrorPage() {
        $('#content').html(errrorTpl());
    }



    function route() {
        var hash = location.hash,
            navActive = $('.nav a[href="' + hash + '"]'),
            id;

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
        } else {
            showErrorPage();
        }

        if (navActive.length && !navActive.parent().hasClass('active')) {
            navActive.parent().addClass('active').siblings().removeClass('active');
        } else {
            $('.nav .active').removeClass('active');
        }
        $(document).scrollTop(0);
    }

    removeDialog();
    route();
    $(window).on('hashchange', route);
});