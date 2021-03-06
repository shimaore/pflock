var each = require('../lib/foreach'),
    attr = require('../lib/attr'),
    event = require('component-event'),
    util = require('../util'),
    jsonpointer = require('../lib/json-pointer');

/**
 * Pflock plugin: provides x-bind syntax
 *
 * @param instance
 */
module.exports = function (instance) {
    'use strict';

    var $ = util.getQueryEngine(instance.element);

    instance.on('init', setupEvents);
    instance.on('write', function () {
        jsonpointer.walk(instance.data, function (value, pointer) {
            writeToDocument(value, pointer);
        });
    });

    instance.on('read', readFromDocument);

    /**
     * Adds the required event listeners
     */
    function setupEvents () {
        var events = instance.options.events;
        each(events, function (eventName) {
            event.bind(instance.element, eventName, function (event) {
                if (util.getEventTarget(event).attributes['x-bind'] !== undefined) {
                    handleEvent(event);
                }
            });
        });
    }

    /**
     * Handles changes in document
     *
     * @param event
     */
    function handleEvent (event) {
        var target  = util.getEventTarget(event),
            binding = util.parseXBind(target),
            value   = readElement(target, binding.attribute);

        writeToDocument(value, binding.pointer, binding.element);
        instance.emit('path-changed', binding.pointer, value);
        instance.emit('send-changes');

        event.stopPropagation();
    }

    function readFromDocument () {
        each($('[x-bind]'), function (el) {
            var binding = util.parseXBind(el),
                value   = readElement(el, binding.attribute);
            instance.emit('path-changed', binding.pointer, value);
        });
    }

    /**
     * Reads the current value of an element
     *
     * @param el
     * @param attribute
     * @return {String}
     */
    function readElement (el, attribute) {
        if (attribute === 'value') {
            if (el.type === 'checkbox') {
                return el.checked;
            }
            return el.value;
        }
        if (attribute === '') {
            return el.innerHTML;
        }
        if (!attr(el).has(attribute)) {
            return null;
        }
        return attr(el).get(attribute);
    }

    /**
     * Writes a value to all elements bound to pointer
     *
     * @param value
     * @param pointer
     * @param src
     */
    function writeToDocument (value, pointer, src) {
        each($('[x-bind]'), function (el) {
            if (el !== src) {
                var currentBinding = util.parseXBind(el);
                if (pointer === currentBinding.pointer) {
                    writeToElement(el, value);
                }
            }
        });
    }

    /**
     * Writes a value to an element
     *
     * @param el
     * @param value
     */
    function writeToElement(el, value) {
        var binding = util.parseXBind(el),
            attribute = binding.attribute;

        if (attribute === 'value') {
            if (el.type === 'checkbox') {
                el.checked = !!value;
                return;
            }
            if (el.type === 'select-one') {
                var index;
                for( index = 0; index < el.options.length; index++ ) {
                    if (el.options[index].value === value) {
                        el.selectedIndex = index;
                        return;
                    }
                }
            }    
            el.value = value;
        } else if(attribute === '') {
            if (el.innerHTML !== value) {
                el.innerHTML = value;
            }
        } else {
            attr(el).set(attribute, value);
        }
    }
};
