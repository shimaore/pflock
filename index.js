/*global module*/

var each    = require('each'),
    attr    = require('attr'),
    val     = require('val'),
    emitter = require('emitter'),
    extend  = require('extend');

exports = module.exports = pflock;

var defaults = {
    updateData: true,
    events: [
        'checked',
        'selected',
        'input',
        'change'
    ]
};

/**
 * Bind data to the document
 *
 * @param element   Root element for bindings
 * @param data      The data to be bound
 * @param options
 * @return {Object}
 */
function pflock (element, data, options) {
    'use strict';

    element = element || document.body;
    options = extend(defaults, options);

    var $ = getQueryEngine();

    var api = {
        toDocument:     toDocument,
        fromDocument:   fromDocument
    };

    emitter(api);
    setupEvents();
    toDocument();

    return api;

    /**
     * Write the data to the document
     *
     * @param {Object} [replace] replace the used data
     */
    function toDocument (replace) {
        if (replace !== undefined) {
            data = replace;
        }
        each(toPathValueHash(data), updateDocument);
    }

    /**
     * Returns the data from the document
     *
     * @return {Object} the data object
     */
    function fromDocument () {
       return data;
    }

    /**
     * Handles changes in document
     *
     * @param event
     */
    function handleEvent (event) {
        var target  = getEventTarget(event),
            binding = getElementBinding(target),
            value   = readElement(target, binding.attribute);
        updateDocument(value, binding.path, binding.element);

        if (options.updateData) {
            toData(binding.path, value);
        }
        api.emit('changed', binding.path, value);
        event.stopPropagation();
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
            return val(el).value();
        }
        if (attribute === '') {
            return el.innerHTML;
        }
        return attr(el, attribute);
    }

    /**
     * Writes a value to an element
     *
     * @param el
     * @param value
     */
    function writeToElement(el, value) {
        var binding = getElementBinding(el),
            attribute = binding.attribute;

        if (attribute === 'value') {
            if (el.type === 'checkbox') {
                el.checked = !!value;
            } else {
                val(el).value(value);
            }
        } else if(attribute === '') {
            el.innerHTML = value;
        } else {
            attr(el, attribute, value);
        }
    }

    /**
     * Writes a value to all elements bound to path
     *
     * @param value
     * @param path
     * @param src
     */
    function updateDocument (value, path, src) {
        each($('[x-bind]'), function (el) {
            if (el !== src) {
                var currentBinding = getElementBinding(el);
                if (path === currentBinding.path) {
                    writeToElement(el, value);
                }
            }
        });
    }

    /**
     * Writes a value back to the data object
     *
     * @param path
     * @param value
     */
    function toData (path, value) {
        var pathParts = path.split(/\./),
            obj = data,
            part;

        while (pathParts.length > 1) {
            part = pathParts.shift();
            obj = obj[part] || (obj = obj[part] = {});
        }
        obj[pathParts.shift()] = value;
    }

    /**
     * Gets the element binding definition
     *
     * @param el
     * @return {Object}
     */
    function getElementBinding(el) {
        var bindValue       = el.attributes['x-bind'].value,
            bindParts       = bindValue.split(/:/),
            attribute       = bindParts.length > 1 ? bindParts.shift(): '',
            path            = bindParts.shift();
        return {
            attribute: attribute,
            path: path,
            element: el
        };
    }

    /**
     * Adds the required event listeners
     */
    function setupEvents () {
        each(options.events, function (eventName) {
            element.addEventListener(eventName, function (event) {
                if (getEventTarget(event).attributes['x-bind'] !== undefined) {
                    handleEvent(event);
                }
            });
        });
    }

    /**
     * Checks if obj is iterable using each
     *
     * @param obj
     * @return {Boolean}
     */
    function isIterable (obj) {
        return obj instanceof Array || obj === Object(obj);
    }

    /**
     * Converts the object data to a hash with path and value
     *
     * Example:
     *  toPathValue({user: 'test', foo: {bla: 'word'}})
     * Returns:
     *  {
     *      'user': 'test',
     *      'foo.bla': 'word'
     *  }
     *
     * @param data
     * @return {Object}
     */
    function toPathValueHash (data) {
        var result = {};
        function convert (obj, path) {
            each(obj, function (item, key) {
                var itemPath = (path ? path + '.' : '') + key;
                if (isIterable(item)) {
                    convert(item, itemPath);
                } else {
                    result[itemPath] = item;
                }
            });
        }
        convert(data);
        return result;
    }

    /**
     * Get querySelectorAll with jQuery fallback, if available
     *
     * @return function
     */
    function getQueryEngine () {
        if (element.querySelectorAll) {
            return function (selector) {
                return element.querySelectorAll(selector);
            };
        }
        return function (selector) {
            return window.$(element).find(selector).get();
        };
    }

    /**
     * Returns the target of an event
     *
     * @param event
     * @return {*|Object}
     */
    function getEventTarget (event) {
        return event.target || event.srcElement;
    }
}
