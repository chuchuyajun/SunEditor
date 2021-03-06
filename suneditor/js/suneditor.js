/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
if (typeof window.SUNEDITOR === 'undefined') {
    window.SUNEDITOR = {};
    SUNEDITOR.plugin = {};
}

/**
 * @description default language (english)
 */
SUNEDITOR.defaultLang = {
    toolbar: {
        font: 'Font',
        fontDelete: 'Remove Font Family',
        formats: 'Formats',
        fontSize: 'Size',
        bold: 'Bold',
        underline: 'Underline',
        italic: 'Italic',
        strike: 'Strike',
        fontColor: 'Font Color',
        hiliteColor: 'Hilite Color',
        indent: 'Indent',
        outdent: 'Outdent',
        align: 'Align',
        alignLeft: 'Align left',
        alignRight: 'Align right',
        alignCenter: 'Align center',
        justifyFull: 'Justify full',
        list: 'list',
        orderList: 'Ordered list',
        unorderList: 'Unordered list',
        line: 'Line',
        table: 'Table',
        link: 'Link',
        image: 'Picture',
        video: 'Video',
        fullScreen: 'Full Screen',
        codeView: 'Code View',
        undo: 'Undo',
        redo: 'Redo'
    },
    dialogBox: {
        linkBox: {
            title: 'Insert Link',
            url: 'URL to link',
            text: 'Text to display',
            newWindowCheck: 'Open in new window'
        },
        imageBox: {
            title: 'Insert Image',
            file: 'Select from files',
            url: 'Image URL',
            resize100: 'resize 100%',
            resize75: 'resize 75%',
            resize50: 'resize 50%',
            resize25: 'resize 25%',
            remove: 'remove image'
        },
        videoBox: {
            title: 'Insert Video',
            url: 'Media embed URL, YouTube',
            width: 'Width',
            height: 'Height'
        },
        submitButton: 'Submit'
    },
    editLink: {
        edit: 'Edit',
        remove: 'Remove'
    }
};

(function (SUNEDITOR) {
    'use strict';

    /**
     * @description utile function
     */
    var func = SUNEDITOR.func = {
        /**
         * @description A function that returns a value of true.
         * @returns {Boolean}
         */
        returnTrue: function () {
            return true;
        },

        /**
         * @description Gets XMLHttpRequest object
         * @returns {Object}
         */
        getXMLHttpRequest: function () {
            /** IE */
            if (window.ActiveXObject) {
                try {
                    return new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        return new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e1) {
                        return null;
                    }
                }
            }
            /** netscape */
            else if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            /** fail */
            else {
                return null;
            }
        },

        /**
         * @description Copies object
         * @param {Object} obj - Object to be copy
         * @returns {Object}
         */
        copyObj: function (obj) {
            var copy = {};
            for (var attr in obj) {
                copy[attr] = obj[attr];
            }
            return copy;
        },

        /**
         * @description Get suneditor's default path
         */
        getBasePath: (function () {
            var path = SUNEDITOR.SUNEDITOR_BASEPATH || "";
            if (!path) {
                for (var c = document.getElementsByTagName("script"), i = 0; i < c.length; i++) {
                    var editorTag = c[i].src.match(/(^|.*[\\\/])suneditor(\.min)?\.js(?:\?.*|;.*)?$/i);
                    if (editorTag) {
                        path = editorTag[1];
                        break
                    }
                }
            }
            -1 === path.indexOf(":/") && "//" !== path.slice(0, 2) && (path = 0 === path.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] + path : location.href.match(/^[^\?]*\/(?:)/)[0] + path);

            if (!path) throw '[SUNEDITOR.func.getBasePath.fail] The SUNEDITOR installation path could not be automatically detected. Please set the global variable "SUNEDITOR.SUNEDITOR_BASEPATH" before creating editor instances.';

            return path;
        })(),

        /**
         * @description Add script File
         * @param {string} fileType - File type ("text/javascript")
         * @param {string} fullUrl - The full url of the js file to call
         * @param {function} callBack - Function to be executed immediately after module call
         */
        includeFile: function (fileType, fullUrl, callBack) {
            var scriptFile = document.createElement("script");
            scriptFile.type = fileType;
            scriptFile.src = fullUrl;
            scriptFile.onload = callBack;

            document.getElementsByTagName("head")[0].appendChild(scriptFile);
        }
    };

    /**
     * @description document function
     */
    var dom = SUNEDITOR.dom = {
        /**
         * @description Get the index of the argument value in the element array
         * @param {array} array - element array
         * @param {element} element - Element to find index
         * @returns {Number}
         */
        getArrayIndex: function (array, element) {
            var idx = -1;
            var len = array.length;

            for (var i = 0; i < len; i++) {
                if (array[i] === element) {
                    idx = i;
                    break;
                }
            }

            return idx;
        },

        /**
         * @description Get the next index of the argument value in the element array
         * @param {array} array - element array
         * @param {element} item - Element to find index
         * @returns {Number}
         */
        nextIdx: function (array, item) {
            var idx = this.getArrayIndex(array, item);
            if (idx === -1) return -1;

            return idx + 1;
        },

        /**
         * @description Get the previous index of the argument value in the element array
         * @param {array} array - element array
         * @param {element} item - Element to find index
         * @returns {Number}
         */
        prevIdx: function (array, item) {
            var idx = this.getArrayIndex(array, item);
            if (idx === -1) return -1;

            return idx - 1;
        },

        /**
         * @description Gets whether the cell is a table
         * @param {element} node - Nodes to scan
         * @returns {Boolean}
         */
        isCell: function (node) {
            return node && /^TD$|^TH$/i.test(node.nodeName);
        },

        /**
         * @description Get all child nodes of the argument value element (Without text node)
         * @param {element} element - element to get child node
         * @param {(function|null)} validation - Conditional function
         * @returns {Array}
         */
        getListChildren: function (element, validation) {
            var children = [];
            validation = validation || func.returnTrue;

            (function recursionFunc(current) {
                if (element !== current && validation(current)) {
                    children.push(current);
                }

                var childLen = current.children.length;
                for (var i = 0, len = childLen; i < len; i++) {
                    recursionFunc(current.children[i]);
                }
            })(element);

            return children;
        },

        /**
         * @description Get all child nodes of the argument value element (Include text nodes)
         * @param {element} element - element to get child node
         * @param {(function|null)} validation - Conditional function
         * @returns {Array}
         */
        getListChildNodes: function (element, validation) {
            var children = [];
            validation = validation || func.returnTrue;

            (function recursionFunc(current) {
                if (validation(current)) {
                    children.push(current);
                }

                var childLen = current.childNodes.length;
                for (var i = 0, len = childLen; i < len; i++) {
                    recursionFunc(current.childNodes[i]);
                }
            })(element);

            return children;
        },

        /**
         * @description Argument value The argument value of the parent node of the element. Get the tag name if it exists.
         * @param {element} element - Reference element
         * @param {string} tagName - Tag name to find
         * @returns {Element}
         */
        getParentNode: function (element, tagName) {
            var check = new RegExp("^" + tagName + "$", "i");

            while (!check.test(element.tagName)) {
                element = element.parentNode;
            }

            return element;
        },

        /**
         * @description Set the text content value of the argument value element
         * @param {element} element - Elements to replace text content
         * @param {String} txt - Text to be applied
         */
        changeTxt: function (element, txt) {
            if (!element || !txt) return;
            element.textContent = txt;
        },

        /**
         * @description Append the className value of the argument value element
         ** @param {element} element - Elements to add class name
         * @param {string} className - Class name to be add
         */
        addClass: function (element, className) {
            if (!element) return;

            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");
            if (check.test(element.className)) return;

            element.className += " " + className;
        },

        /**
         * @description Delete the className value of the argument value element
         * @param {element} element - Elements to remove class name
         * @param {string} className - Class name to be remove
         */
        removeClass: function (element, className) {
            if (!element) return;

            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");
            element.className = element.className.replace(check, " ").trim();
        },

        /**
         * @description Argument value If there is no class name, insert it and delete the class name if it exists
         * @param {element} element - Elements to replace class name
         * @param {string} className - Class name to be change
         */
        toggleClass: function (element, className) {
            if (!element) return;

            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");

            if (check.test(element.className)) {
                element.className = element.className.replace(check, " ").trim();
            }
            else {
                element.className += " " + className;
            }
        },

        /**
         * @description Delete argumenu value element
         * @param {element} item - Element to be remove
         */
        removeItem: function (item) {
            try {
                item.remove();
            } catch (e) {
                item.removeNode();
            }
        }
    };

    /**
     * @description SunEditor core closure
     * @param context
     * @param dom
     * @param func
     * @returns {{save: save, getContent: getContent, setContent: setContent, appendContent: appendContent, disabled: disabled, enabled: enabled, show: show, hide: hide, destroy: destroy}}
     */
    var core = function (context, dom, func) {
        /**
         * @description Practical editor function
         * This function is 'this' used by other plugins
         */
        var editor = SUNEDITOR.editor = {
            /**
             * @description Elements and user options parameters of the suneditor
             */
            context: context,
            /**
             * @description loaded plugins
             */
            loadedPlugins: {},

            /**
             * @description dialog element
             */
            dialogForm: null,
            /**
             * @description submenu element
             */
            submenu: null,
            /**
             * @description controllers array (image resize area, link modified button)
             */
            controllerArray: [],

            /**
             * @description Elements that need to change text or className for each selection change
             * @property {element} FONT - font family button
             * @property {element} B - bold button
             * @property {element} U - underline button
             * @property {element} I - italic button
             * @property {element} STRIKE - strike button
             * @property {element} SIZE - font size button
             */
            commandMap: {
                FONT: context.tool.font,
                B: context.tool.bold,
                U: context.tool.underline,
                I: context.tool.italic,
                STRIKE: context.tool.strike,
                SIZE: context.tool.fontSize
            },

            /**
             * @description Variables used internally in editor operation
             * @property {(element|null)} selectionNode - Contains selection node
             * @property {(element|null)} copySelection - The selection object is copied
             * @property {boolean} wysiwygActive - The wysiwyg frame or code view state
             * @property {boolean} isFullScreen - State of full screen
             * @property {number} innerHeight_fullScreen - InnerHeight in editor when in full screen
             * @property {number} resizeClientY - Remember the vertical size of the editor before resizing the editor (Used when calculating during resize operation)
             * @property {number} tabSize - Indented size when tab button clicked (4)
             * @property {element} originCssText - Remembered the CSS of the editor before full screen (Used when returning to original size again)
             * @property {number} editorHeight - The height value entered by the user or the height value of the "textarea" when the suneditor is created
             * @property {boolean} isTouchMove - Check if mobile has moved after touching (Allowing scrolling in the toolbar area)
             */
            _variable: {
                selectionNode: null,
                copySelection: null,
                wysiwygActive: true,
                isFullScreen: false,
                innerHeight_fullScreen: 0,
                resizeClientY: 0,
                tabSize: 4,
                originCssText: context.element.topArea.style.cssText,
                editorHeight: context.user.height,
                isTouchMove: false
            },

            /**
             * @description Call the module
             * @param {string} directory - The directory(plugin/{directory}) of the js file to call
             * @param {string} moduleName - The name of the js file to call
             * @param {element} targetElement - If this is element, the element is inserted into the sibling node (submenu)
             * @param {function} callBackFunction - Function to be executed immediately after module call
             */
            callModule: function (directory, moduleName, targetElement, callBackFunction) {
                var fullDirectory = func.getBasePath + 'plugins/' + directory;
                var fileType = "text/javascript";

                /** Dialog first call */
                if (directory === 'dialog') {
                    var dialogCallback = this._callBack_addModule.bind(this, 'dialog', 'dialog', targetElement, this.callModule.bind(this, directory, moduleName, targetElement, callBackFunction));

                    if (!SUNEDITOR.plugin.dialog) {
                        func.includeFile(fileType, (fullDirectory + '/dialog.js'), dialogCallback);
                        return;
                    }
                    else if (!this.loadedPlugins['dialog']) {
                        dialogCallback();
                        return;
                    }
                    dialogCallback = null;
                }

                /** etc */
                if (!SUNEDITOR.plugin[moduleName]) {
                    func.includeFile(fileType, (fullDirectory + '/' + moduleName + '.js'), this._callBack_addModule.bind(this, directory, moduleName, targetElement, callBackFunction));
                }
                else if (!this.loadedPlugins[moduleName]) {
                    this._callBack_addModule(directory, moduleName, targetElement, callBackFunction);
                }
                else {
                    if (typeof callBackFunction === 'function') callBackFunction();
                }
            },

            /**
             * @callback
             * @description After the module is added, call the main function and the callback function
             * @param {string} directory - The directory(plugin/{directory}) of the js file to call
             * @param {string} moduleName - The name of the js file to call
             * @param {element} targetElement - If this is element, the element is inserted into the sibling node (submenu)
             * @param {function} callBackFunction - Function to be executed immediately after module call
             */
            _callBack_addModule: function (directory, moduleName, targetElement, callBackFunction) {
                if (!this.context[directory]) this.context[directory] = {};

                SUNEDITOR.plugin[moduleName].add(this, targetElement);
                this.loadedPlugins[moduleName] = true;

                if (typeof callBackFunction === 'function') callBackFunction();
            },

            /**
             * @description Enabled submenu
             * @param {element} element - Submenu element to call
             */
            submenuOn: function (element) {
                this.submenu = element.nextElementSibling;
                this.submenu.style.display = "block";
            },

            /**
             * @description Disable submenu
             */
            submenuOff: function () {
                if (!!this.submenu) {
                    this.submenu.style.display = "none";
                    this.submenu = null;
                }

                this.controllersOff();
            },

            /**
             * @description Disable controller in editor area (link button, image resize button)
             */
            controllersOff: function () {
                var len = this.controllerArray.length;
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        this.controllerArray[i].style.display = "none";
                    }
                    this.controllerArray = [];
                }
            },

            /**
             * @description javascript execCommand
             * @param {string} command - javascript execCommand function property
             * @param {boolean} showDefaultUI - javascript execCommand function property
             * @param {string} value - javascript execCommand function property
             */
            execCommand: function (command, showDefaultUI, value) {
                context.element.wysiwygWindow.document.execCommand(command, showDefaultUI, value);
            },

            /**
             * @description Focus to wysiwyg area
             */
            focus: function () {
                context.element.wysiwygWindow.document.body.focus();
            },

            /**
             * @description Determine if this node is the last offset
             * @param {object} container - The container property of the selection object.
             * @param {number} offset - The offset property of the selection object.
             * @returns {boolean}
             */
            isEdgePoint: function (container, offset) {
                return (offset === 0) || (offset === container.nodeValue.length);
            },

            /**
             * @description Create range object
             * @returns {Range}
             */
            createRange: function () {
                return context.element.wysiwygWindow.document.createRange();
            },

            /**
             * @description Get current selection object
             * @returns {Selection}
             */
            getSelection: function () {
                return context.element.wysiwygWindow.getSelection();
            },

            /**
             * @description Get current select node
             * @returns {Node}
             */
            getSelectionNode: function () {
                return this.getSelection().extentNode || this.getSelection().anchorNode;
            },

            /**
             * @description Get current range object
             * @returns {Range}
             */
            getRange: function () {
                var selection = this.getSelection();
                var nativeRng = null;

                if (selection.rangeCount > 0) {
                    nativeRng = selection.getRangeAt(0);
                } else {
                    // IE 10
                    selection = this._variable.copySelection;

                    nativeRng = this.createRange();
                    nativeRng.setStart(selection.anchorNode, selection.anchorOffset);
                    nativeRng.setEnd(selection.focusNode, selection.focusOffset);
                }

                return nativeRng;
            },

            /**
             * @description Set range object
             * @param {object} startCon - The startContainer property of the selection object.
             * @param {number} startOff - The startOffset property of the selection object.
             * @param {object} endCon - The endContainer property of the selection object.
             * @param {number} endOff - The endOffset property of the selection object.
             */
            setRange: function (startCon, startOff, endCon, endOff) {
                var range = this.createRange();
                range.setStart(startCon, startOff);
                range.setEnd(endCon, endOff);

                var selection = this.getSelection();
                if (selection.rangeCount > 0) {
                    selection.removeAllRanges();
                }
                selection.addRange(range);
            },

            /**
             * @description Show loading box
             */
            showLoading: function () {
                context.element.loading.style.display = "block";
            },

            /**
             * @description Close loading box
             */
            closeLoading: function () {
                context.element.loading.style.display = "none";
            },

            /**
             * @description Get node of current line (P,Table..)
             * @param {element} element - Reference element
             * @returns {Element}
             */
            getLineElement: function (element) {
                while (!/^BODY$/i.test(element.parentNode.tagName)) {
                    element = element.parentNode;
                }

                return element;
            },

            /**
             * @description Append P tag to current line next
             * @param {element} element - Insert as siblings of that element
             */
            appendP: function (element) {
                element = this.getLineElement(element);
                var oP = document.createElement("P");
                oP.innerHTML = '&#65279';
                element.parentNode.insertBefore(oP, element.nextElementSibling);
            },

            /**
             * @description Delete selected node and insert argument value node
             * @param {element} oNode - Node to be inserted
             * @param {(element|null)} rightNode - If the node exists, it is inserted after the node
             */
            insertNode: function (oNode, rightNode) {
                var parentNode = null;
                if (!rightNode) {
                    var selection = this.getSelection();
                    var nativeRng = this.getRange();

                    var startCon = nativeRng.startContainer;
                    var startOff = nativeRng.startOffset;
                    var endCon = nativeRng.endContainer;
                    var endOff = nativeRng.endOffset;

                    parentNode = startCon;
                    if (/^#text$/i.test(startCon.nodeName)) {
                        parentNode = startCon.parentNode;
                    }

                    /** Select within the same node */
                    if (startCon === endCon && startOff === endOff) {
                        if (!!selection.focusNode && /^#text$/i.test(selection.focusNode.nodeName)) {
                            rightNode = selection.focusNode.splitText(endOff);
                            parentNode.insertBefore(oNode, rightNode);
                        }
                        else {
                            if (parentNode.lastChild !== null && /^BR$/i.test(parentNode.lastChild.nodeName)) {
                                parentNode.removeChild(parentNode.lastChild);
                            }
                            parentNode.appendChild(oNode);
                        }
                    }
                    /** Select multiple nodes */
                    else {
                        var removeNode = startCon;
                        var isSameContainer = startCon === endCon;

                        if (isSameContainer) {
                            if (!this.isEdgePoint(endCon, endOff)) {
                                rightNode = endCon.splitText(endOff);
                            }

                            if (!this.isEdgePoint(startCon, startOff)) {
                                removeNode = startCon.splitText(startOff);
                            }

                            parentNode.removeChild(removeNode);
                        }
                        else {
                            if (selection.deleteFromDocument) selection.deleteFromDocument();
                            else this.removeNode();

                            rightNode = endCon;

                            while (rightNode.nodeType !== 1) {
                                rightNode = rightNode.parentNode;
                            }
                        }
                    }
                }
                else {
                    parentNode = rightNode.parentNode;
                    rightNode = rightNode.nextSibling;
                }

                try {
                    parentNode.insertBefore(oNode, rightNode);
                } catch (e) {
                    parentNode.appendChild(oNode);
                }

                // this.setRange(oNode, 0, oNode, 0);
            },

            /**
             * @description Delete the currently selected node
             */
            removeNode: function () {
                var ELEMENT_NODE = 1;
                var TEXT_NODE = 3;
                var nativeRng = this.getRange();

                var startCon = nativeRng.startContainer;
                var startOff = nativeRng.startOffset;
                var endCon = nativeRng.endContainer;
                var endOff = nativeRng.endOffset;
                var commonCon = nativeRng.commonAncestorContainer;

                var beforeNode = null;
                var afterNode = null;

                var childNodes = dom.getListChildNodes(commonCon);
                var startIndex = dom.getArrayIndex(childNodes, startCon);
                var endIndex = dom.getArrayIndex(childNodes, endCon);

                var startNode = startCon;
                for (var i = startIndex + 1; i >= 0; i--) {
                    if (childNodes[i] === startNode.parentNode && /^SPAN$/i.test(childNodes[i].nodeName) && childNodes[i].firstChild === startNode && startOff === 0) {
                        startIndex = i;
                        startNode = startNode.parentNode;
                    }
                }

                var endNode = endCon;
                for (var i = endIndex - 1; i > startIndex; i--) {
                    if (childNodes[i] === endNode.parentNode && childNodes[i].nodeType === ELEMENT_NODE) {
                        childNodes.splice(i, 1);
                        endNode = endNode.parentNode;
                        --endIndex;
                    }
                }

                for (var i = startIndex; i <= endIndex; i++) {
                    var item = childNodes[i];

                    if (item.length === 0 || (item.nodeType === TEXT_NODE && item.data === undefined)) {
                        dom.removeItem(item);
                        continue;
                    }

                    if (item === startCon) {
                        if (startCon.nodeType === ELEMENT_NODE) {
                            beforeNode = document.createTextNode(startCon.textContent);
                        } else {
                            beforeNode = document.createTextNode(startCon.substringData(0, startOff));
                        }

                        if (beforeNode.length > 0) {
                            startCon.data = beforeNode.data;
                        } else {
                            dom.removeItem(startCon);
                        }

                        continue;
                    }

                    if (item === endCon) {
                        if (endCon.nodeType === ELEMENT_NODE) {
                            afterNode = document.createTextNode(endCon.textContent);
                        } else {
                            afterNode = document.createTextNode(endCon.substringData(endOff, (endCon.length - endOff)));
                        }

                        if (afterNode.length > 0) {
                            endCon.data = afterNode.data;
                        } else {
                            dom.removeItem(endCon);
                        }

                        continue;
                    }

                    dom.removeItem(item);
                }
            },

            /**
             * @description Changes to code view or wysiwyg view
             */
            toggleFrame: function () {
                if (!this._variable.wysiwygActive) {
                    var ec = {"&amp;": "&", "&nbsp;": "\u00A0", "&quot;": "\"", "&lt;": "<", "&gt;": ">"};
                    var code_html = context.element.code.value.replace(/&[a-z]+;/g, function (m) {
                        return (typeof ec[m] === "string") ? ec[m] : m;
                    });
                    context.element.wysiwygWindow.document.body.innerHTML = code_html.trim().length > 0 ? code_html : "<p>&#65279</p>";
                    context.element.wysiwygWindow.document.body.scrollTop = 0;
                    context.element.code.style.display = "none";
                    context.element.wysiwygElement.style.display = "block";
                    this._variable.wysiwygActive = true;
                }
                else {
                    context.element.code.value = context.element.wysiwygWindow.document.body.innerHTML.trim().replace(/<\/p>(?=[^\n])/gi, "<\/p>\n");
                    context.element.wysiwygElement.style.display = "none";
                    context.element.code.style.display = "block";
                    this._variable.wysiwygActive = false;
                }
            },

            /**
             * @description Changes to full screen or default screen
             * @param {element} element - full screen button
             */
            toggleFullScreen: function (element) {
                if (!this._variable.isFullScreen) {
                    context.element.topArea.style.position = "fixed";
                    context.element.topArea.style.top = "0";
                    context.element.topArea.style.left = "0";
                    context.element.topArea.style.width = "100%";
                    context.element.topArea.style.height = "100%";

                    this._variable.innerHeight_fullScreen = (window.innerHeight - context.tool.bar.offsetHeight);
                    context.element.editorArea.style.height = this._variable.innerHeight_fullScreen + "px";

                    dom.removeClass(element.firstElementChild, 'ico_full_screen_e');
                    dom.addClass(element.firstElementChild, 'ico_full_screen_i');
                }
                else {
                    context.element.topArea.style.cssText = this._variable.originCssText;
                    context.element.editorArea.style.height = this._variable.editorHeight + "px";

                    dom.removeClass(element.firstElementChild, 'ico_full_screen_i');
                    dom.addClass(element.firstElementChild, 'ico_full_screen_e');
                }

                this._variable.isFullScreen = !this._variable.isFullScreen;
            }
        };

        /**
         * @description event function
         */
        var event = {
            _shortcutKeyCode: {
                66: ['bold', 'B'],
                83: ['strikethrough', 'STRIKE'],
                85: ['underline', 'U'],
                73: ['italic', 'I'],
                89: ['redo'],
                90: ['undo'],
                219: ['outdent'],
                221: ['indent']
            },

            _directionKeyKeycode: new RegExp('8|13|32|46|33|34|35|36|37|38|39|40|98|100|102|104'),

            _findButtonEffectTag: function () {
                editor._variable.copySelection = func.copyObj(editor.getSelection());

                var range = editor.getRange();
                if (range.startContainer !== range.endContainer) {
                    editor._variable.selectionNode = range.startContainer;
                } else {
                    editor._variable.selectionNode = editor.getSelectionNode();
                }

                var selectionParent = editor._variable.selectionNode;
                var findFont = true;
                var findSize = true;
                var findA = true;
                var map = "B|U|I|STRIKE|FONT|SIZE|";
                var check = new RegExp(map, "i");
                while (!/^P$|^BODY$|^HTML$|^DIV$/i.test(selectionParent.nodeName)) {
                    var nodeName = (/^STRONG$/.test(selectionParent.nodeName) ? 'B' : (/^EM/.test(selectionParent.nodeName) ? 'I' : selectionParent.nodeName));

                    /** Font */
                    if (findFont && selectionParent.nodeType === 1 && ((/^FONT$/i.test(nodeName) && selectionParent.face.length > 0) || selectionParent.style.font.length > 0)) {
                        nodeName = 'FONT';
                        var selectFont = (selectionParent.face || selectionParent.style.font || SUNEDITOR.lang.toolbar.font);
                        dom.changeTxt(editor.commandMap[nodeName], selectFont);
                        findFont = false;
                        map = map.replace(nodeName + "|", "");
                        check = new RegExp(map, "i");
                    }

                    /** A */
                    if (findA && /^A$/i.test(selectionParent.nodeName) && (!context.link || editor.controllerArray[0] !== context.link.linkBtn)) {
                        var selectionATag = selectionParent;
                        editor.callModule('dialog', 'link', null, function () {
                            SUNEDITOR.plugin.link.call_controller_linkButton.call(editor, selectionATag);
                        });
                        findA = false;
                    } else if (findA && context.link && editor.controllerArray[0] === context.link.linkBtn) {
                        editor.controllersOff();
                    }

                    /** span (font size) */
                    if (findSize && /^SPAN$/i.test(nodeName) && selectionParent.style.fontSize.length > 0) {
                        dom.changeTxt(editor.commandMap["SIZE"], selectionParent.style.fontSize.match(/\d+/)[0]);
                        findSize = false;
                        map = map.replace("SIZE|", "");
                        check = new RegExp(map, "i");
                    }

                    /** command */
                    if (check.test(nodeName)) {
                        dom.addClass(editor.commandMap[nodeName], "on");
                        map = map.replace(nodeName + "|", "");
                        check = new RegExp(map, "i");
                    }

                    selectionParent = selectionParent.parentNode;
                }

                /** remove */
                map = map.split("|");
                var mapLen = map.length - 1;
                for (var i = 0; i < mapLen; i++) {
                    if (/^FONT$/i.test(map[i])) {
                        dom.changeTxt(editor.commandMap[map[i]], SUNEDITOR.lang.toolbar.font);
                    }
                    else if (/^SIZE$/i.test(map[i])) {
                        dom.changeTxt(editor.commandMap[map[i]], SUNEDITOR.lang.toolbar.fontSize);
                    }
                    else {
                        dom.removeClass(editor.commandMap[map[i]], "on");
                    }
                }
            },

            resize_window: function () {
                if (editor._variable.isFullScreen) {
                    editor._variable.innerHeight_fullScreen += (window.innerHeight - context.tool.bar.offsetHeight) - editor._variable.innerHeight_fullScreen;
                    context.element.editorArea.style.height = editor._variable.innerHeight_fullScreen + "px";
                }
            },

            touchstart_toolbar: function () {
                editor._variable.isTouchMove = false;
            },

            touchmove_toolbar: function () {
                editor._variable.isTouchMove = true;
            },

            onClick_toolbar: function (e) {
                if (editor._variable.isTouchMove) return true;

                var targetElement = e.target;
                var display = targetElement.getAttribute("data-display");
                var command = targetElement.getAttribute("data-command");
                var className = targetElement.className;

                while (!command && !/editor_tool/.test(className) && !/sun-editor-id-toolbar/.test(className)) {
                    targetElement = targetElement.parentNode;
                    command = targetElement.getAttribute("data-command");
                    display = targetElement.getAttribute("data-display");
                    className = targetElement.className;
                }

                if (!command && !display) return true;

                e.preventDefault();
                e.stopPropagation();

                editor.focus();

                /** Dialog, Submenu */
                if (!!display) {
                    var prevSubmenu = editor.submenu;
                    editor.submenuOff();

                    if (/submenu/.test(display) && (targetElement.nextElementSibling === null || targetElement.nextElementSibling !== prevSubmenu)) {
                        editor.callModule('submenu', command, targetElement, function () {
                            editor.submenuOn(targetElement)
                        });
                    }
                    else if (/dialog/.test(display)) {
                        editor.callModule('dialog', command, null, function () {
                            SUNEDITOR.plugin.dialog.openDialog.call(editor, command, targetElement.getAttribute('data-option'));
                        });
                    }

                    return;
                }

                /** default command */
                if (!!command) {
                    var value = targetElement.getAttribute("data-value");
                    switch (command) {
                        case 'codeView':
                            editor.toggleFrame();
                            dom.toggleClass(targetElement, 'on');
                            break;
                        case 'fullScreen':
                            editor.toggleFullScreen(targetElement);
                            dom.toggleClass(targetElement, "on");
                            break;
                        case 'indent':
                        case 'outdent':
                        case 'redo':
                        case 'undo':
                            editor.execCommand(command, false, null);
                            break;
                        default :
                            editor.execCommand(command, false, value);
                            dom.toggleClass(targetElement, "on");
                    }

                    editor.submenuOff();
                }
            },

            onMouseUp_wysiwyg: function (e) {
                e.stopPropagation();

                var targetElement = e.target;
                editor.submenuOff();


                if (/^HTML$/i.test(targetElement.nodeName)) {
                    e.preventDefault();
                    editor.focus();
                    return;
                }

                if (/^IMG$/i.test(targetElement.nodeName)) {
                    editor.callModule('dialog', 'image', null, function () {
                        SUNEDITOR.plugin.image.call_controller_imageResize_.call(editor, targetElement);
                    });
                    return;
                }

                event._findButtonEffectTag();
            },

            onKeyDown_wysiwyg: function (e) {
                var target = e.target;
                var keyCode = e.keyCode;
                var shift = e.shiftKey;
                var ctrl = e.ctrlKey;
                var alt = e.altKey;
                e.stopPropagation();

                function shortcutCommand(keyCode) {
                    var key = event._shortcutKeyCode[keyCode];
                    if (!key) return false;

                    editor.execCommand(key[0], false, null);
                    dom.toggleClass(editor.commandMap[key[1]], "on");

                    return true;
                }

                /** Shortcuts */
                if (ctrl && keyCode !== 17 && keyCode !== 18) {
                    if (shortcutCommand(keyCode)) {
                        e.preventDefault();
                        return;
                    }
                }

                /** default key action */
                switch (keyCode) {
                    case 8: /**backspace key*/
                        if (target.childElementCount === 1 && target.children[0].innerHTML === "<br/>") {
                            e.preventDefault();
                            return false;
                        }
                        break;
                    case 9:
                        /**tab key*/
                        e.preventDefault();
                        if (ctrl || alt) break;

                        var currentNode = editor._variable.selectionNode || editor.getSelection().anchorNode;
                        while (!/^TD$/i.test(currentNode.tagName) && !/^BODY$/i.test(currentNode.tagName)) {
                            currentNode = currentNode.parentNode;
                        }

                        if (!!currentNode && /^TD$/i.test(currentNode.tagName)) {
                            var table = dom.getParentNode(currentNode, "table");
                            var cells = dom.getListChildren(table, dom.isCell);
                            var idx = shift ? dom.prevIdx(cells, currentNode) : dom.nextIdx(cells, currentNode);

                            if (idx === cells.length && !shift) idx = 0;
                            if (idx === -1 && shift) idx = cells.length - 1;

                            var moveCell = cells[idx];
                            if (!moveCell) return false;

                            var range = editor.createRange();
                            range.setStart(moveCell, 0);
                            range.setEnd(moveCell, 0);

                            var selection = editor.getSelection();
                            if (selection.rangeCount > 0) {
                                selection.removeAllRanges();
                            }
                            selection.addRange(range);

                            break;
                        }

                        /** if P Tag */
                        if (shift) break;

                        var tabText = context.element.wysiwygWindow.document.createTextNode(new Array(editor._variable.tabSize + 1).join("\u00A0"));
                        editor.insertNode(tabText, null);

                        var selection = editor.getSelection();
                        var rng = editor.createRange();

                        rng.setStart(tabText, editor._variable.tabSize);
                        rng.setEnd(tabText, editor._variable.tabSize);

                        if (selection.rangeCount > 0) {
                            selection.removeAllRanges();
                        }

                        selection.addRange(rng);

                        break;
                }
            },

            onKeyUp_wysiwyg: function (e) {
                if (event._directionKeyKeycode.test(e.keyCode)) {
                    event._findButtonEffectTag();
                }
            },

            onScroll_wysiwyg: function () {
                editor.controllersOff();
            },

            onMouseDown_resizeBar: function (e) {
                e.stopPropagation();

                editor._variable.resizeClientY = e.clientY;
                context.element.resizeBackground.style.display = "block";

                function closureFunc() {
                    context.element.resizeBackground.style.display = "none";
                    document.removeEventListener('mousemove', event.resize_editor);
                    document.removeEventListener('mouseup', closureFunc);
                }

                document.addEventListener('mousemove', event.resize_editor);
                document.addEventListener('mouseup', closureFunc);
            },

            resize_editor: function (e) {
                var resizeInterval = (e.clientY - editor._variable.resizeClientY);

                context.element.editorArea.style.height = (context.element.editorArea.offsetHeight + resizeInterval) + "px";

                editor._variable.editorHeight = (context.element.editorArea.offsetHeight + resizeInterval);

                editor._variable.resizeClientY = e.clientY;
            }
        };

        /** add event listeners */
        window.onresize = function () {
            event.resize_window()
        };
        /** tool bar event */
        context.tool.bar.addEventListener('touchstart', event.touchstart_toolbar);
        context.tool.bar.addEventListener('touchmove', event.touchmove_toolbar);
        context.tool.bar.addEventListener('touchend', event.onClick_toolbar);
        context.tool.bar.addEventListener('click', event.onClick_toolbar);
        /** editor area */
        context.element.wysiwygWindow.addEventListener('mouseup', event.onMouseUp_wysiwyg);
        context.element.wysiwygWindow.addEventListener('keydown', event.onKeyDown_wysiwyg);
        context.element.wysiwygWindow.addEventListener('keyup', event.onKeyUp_wysiwyg);
        context.element.wysiwygWindow.addEventListener('scroll', event.onScroll_wysiwyg);
        /** resize bar */
        context.element.resizebar.addEventListener('mousedown', event.onMouseDown_resizeBar);

        /** User function */
        return {
            /**
             * @description Copying the contents of the editor to the original textarea
             */
            save: function () {
                if (editor._variable.wysiwygActive) {
                    context.element.textElement.innerHTML = context.element.wysiwygWindow.document.body.innerHTML;
                } else {
                    context.element.textElement.innerHTML = context.element.code.value;
                }
            },

            /**
             * @description Gets the contents of the suneditor
             * @returns {String}
             */
            getContent: function () {
                var content = "";
                if (editor._variable.wysiwygActive) {
                    content = context.element.wysiwygWindow.document.body.innerHTML;
                } else {
                    content = context.element.code.value;
                }
                return content;
            },

            /**
             * @description Change the contents of the suneditor
             * @param {string} content - Content to Input
             */
            setContent: function (content) {
                if (editor._variable.wysiwygActive) {
                    context.element.wysiwygWindow.document.body.innerHTML = content;
                } else {
                    context.element.code.value = content;
                }
            },

            /**
             * @description Add content to the suneditor
             * @param {string} content - to Input
             */
            appendContent: function (content) {
                if (editor._variable.wysiwygActive) {
                    var oP = document.createElement("P");
                    oP.innerHTML = content;
                    context.element.wysiwygWindow.document.body.appendChild(oP);
                } else {
                    context.element.code.value += content;
                }
            },

            /**
             * @description Disable the suneditor
             */
            disabled: function () {
                context.tool.cover.style.display = "block";
                context.element.wysiwygWindow.document.body.setAttribute("contenteditable", false);
            },

            /**
             * @description Enabled the suneditor
             */
            enabled: function () {
                context.tool.cover.style.display = "none";
                context.element.wysiwygWindow.document.body.setAttribute("contenteditable", true);
            },

            /**
             * @description Show the suneditor
             */
            show: function () {
                var topAreaStyle = context.element.topArea.style;
                topAreaStyle.cssText = editor._variable.originCssText;
                if (topAreaStyle.display === "none") topAreaStyle.display = "block";
            },

            /**
             * @description Hide the suneditor
             */
            hide: function () {
                context.element.topArea.style.display = "none";
            },

            /**
             * @description Destroy the suneditor
             */
            destroy: function () {
                context.element.topArea.parentNode.removeChild(context.element.topArea);
                context.element.textElement.style.display = "";

                delete this.save;
                delete this.getContent;
                delete this.setContent;
                delete this.appendContent;
                delete this.disabled;
                delete this.enabled;
                delete this.show;
                delete this.hide;
                delete this.destroy;
            }
        };
    };

    /**
     * ↓↓↓↓↓↓ Create Suneditor ↓↓↓↓↓↓
     */
    var lang = SUNEDITOR.lang = SUNEDITOR.lang ? SUNEDITOR.lang : SUNEDITOR.defaultLang;

    /**
     * @description Suneditor's Default button list
     * @private
     */
    var _defaultButtonsList = {
        font: ['btn_font', lang.toolbar.font, 'font', 'submenu', '',
            '<span class="txt sun-editor-font-family">' + lang.toolbar.font + '</span><span class="ico_more"></span>'
        ],
        formats: ['btn_format', lang.toolbar.formats, 'formatBlock', 'submenu', '',
            '<span class="txt">' + lang.toolbar.formats + '</span><span class="ico_more"></span>'
        ],

        fontSize: ['btn_size', lang.toolbar.fontSize, 'fontSize', 'submenu', '',
            '<span class="txt sun-editor-font-size">' + lang.toolbar.fontSize + '</span><span class="ico_more"></span>'
        ],

        bold: ['sun-editor-id-bold', lang.toolbar.bold + '(Ctrl+B)', 'bold', '', '',
            '<div class="ico_bold"></div>'
        ],

        underline: ['sun-editor-id-underline', lang.toolbar.underline + '(Ctrl+U)', 'underline', '', '',
            '<div class="ico_underline"></div>'
        ],

        italic: ['sun-editor-id-italic', lang.toolbar.italic + '(Ctrl+I)', 'italic', '', '',
            '<div class="ico_italic"></div>'
        ],

        strike: ['sun-editor-id-strike', lang.toolbar.strike + '(Ctrl+SHIFT+S)', 'strikethrough', '', '',
            '<div class="ico_strike"></div>'
        ],

        fontColor: ['', lang.toolbar.fontColor, 'foreColor', 'submenu', '',
            '<div class="ico_foreColor"></div>'
        ],

        hiliteColor: ['', lang.toolbar.hiliteColor, 'hiliteColor', 'submenu', '',
            '<div class="ico_hiliteColor"></div>'
        ],

        indent: ['', lang.toolbar.indent + '(Ctrl + [)', 'indent', '', '',
            '<div class="ico_indnet"></div>'
        ],

        outdent: ['', lang.toolbar.outdent + '(Ctrl + ])', 'outdent', '', '',
            '<div class="ico_outdent"></div>'
        ],

        align: ['btn_align', lang.toolbar.align, 'align', 'submenu', '',
            '<div class="ico_align"></div>'
        ],

        list: ['', lang.toolbar.list, 'list', 'submenu', '',
            '<div class="ico_list_num"></div>'
        ],

        line: ['btn_line', lang.toolbar.line, 'horizontalRules', 'submenu', '',
            '<hr style="border-width: 1px 0 0; border-style: solid none none; border-color: black; border-image: initial; height: 1px;" />' +
            '<hr style="border-width: 1px 0 0; border-style: dotted none none; border-color: black; border-image: initial; height: 1px;" />' +
            '<hr style="border-width: 1px 0 0; border-style: dashed none none; border-color: black; border-image: initial; height: 1px;" />'
        ],

        table: ['', lang.toolbar.table, 'table', 'submenu', '',
            '<div class="ico_table"></div>'
        ],

        link: ['', lang.toolbar.link, 'link', 'dialog', '',
            '<div class="ico_url"></div>'
        ],

        image: ['', lang.toolbar.image, 'image', 'dialog', '',
            '<div class="ico_picture"></div>'
        ],

        video: ['', lang.toolbar.video, 'video', 'dialog', '',
            '<div class="ico_video"></div>'
        ],

        fullScreen: ['', lang.toolbar.fullScreen, 'fullScreen', '', '',
            '<div class="ico_full_screen_e"></div>'
        ],

        codeView: ['', lang.toolbar.codeView, 'codeView', '', '',
            '<div class="ico_html"></div>'
        ],

        undo: ['', lang.toolbar.undo + ' (Ctrl+Z)', 'undo', '', '',
            '<div class="ico_undo"></div>'
        ],

        redo: ['', lang.toolbar.redo + ' (Ctrl+Y)', 'redo', '', '',
            '<div class="ico_redo"></div>'
        ]
    };

    /**
     * @description Create a group div containing each module
     * @param {string} innerHTML - module button html
     * @returns {string}
     * @private
     */
    function _createModuleGroup(innerHTML) {
        if (!innerHTML) return '';
        return '<div class="tool_module"><ul class="editor_tool">' + innerHTML + '</ul></div>';
    }

    /**
     * @description Create a button element
     * @param {string} buttonClass - className in button
     * @param {string} title - Title in button
     * @param {string} dataCommand - The data-command property of the button
     * @param {string} dataDisplay - The data-display property of the button ('dialog', 'submenu')
     * @param {string} displayOption - Options for whether the range of the dialog is inside the editor or for the entire screen ('', 'full')
     * @param {string} innerHTML - Html in button
     * @returns {string}
     * @private
     */
    function _createButton(buttonClass, title, dataCommand, dataDisplay, displayOption, innerHTML) {
        return '' +
            '<li>' +
            '   <button type="button" class="btn_editor ' + buttonClass + '" title="' + title + '" data-command="' + dataCommand + '" data-display="' + dataDisplay + '" data-option="' + displayOption + '">' +
            innerHTML +
            '   </button>' +
            '</li>';
    }

    /**
     * @description Create editor HTML
     * @param {array} buttonList - option.buttonList
     * @private
     */
    function _createToolBar(buttonList) {
        var html = '<div class="sun-editor-id-toolbar-cover"></div>';
        var moduleHtml = null;

        /** create button list */
        var button = null;
        var module = null;

        for (var i = 0; i < buttonList.length; i++) {

            var buttonGroup = buttonList[i];
            for (var j = 0; j < buttonGroup.length; j++) {

                button = buttonGroup[j];
                if (typeof button === 'object') {
                    module = [button.className, button.title, button.dataCommand, button.dataDisplay, button.displayOption, button.innerHTML];
                } else {
                    module = _defaultButtonsList[button];
                }

                moduleHtml += _createButton(module[0], module[1], module[2], module[3], module[4], module[5]);
            }

            html += _createModuleGroup(moduleHtml);
            moduleHtml = null;
        }

        return html;
    }

    /**
     * @description document create - call _createToolBar()
     * @param {element} element - textarea
     * @param {json} options - user options
     * @returns {{constructed: {_top: HTMLElement, _relative: HTMLElement, _toolBar: HTMLElement, _editorArea: HTMLElement, _resizeBar: HTMLElement, _loading: HTMLElement, _resizeBack: HTMLElement}, options: *}}
     * @private
     */
    function _Constructor(element, options) {
        if (!(typeof options === "object")) options = {};

        /** user options */
        options.addFont = options.addFont || null;
        options.videoX = options.videoX || 560;
        options.videoY = options.videoY || 315;
        options.imageSize = options.imageSize || '350px';
        options.imageUploadUrl = options.imageUploadUrl || null;
        options.fontList = options.fontList || null;
        options.fontSizeList = options.fontSizeList || null;
        options.height = /^\d+/.test(options.height) ? (/^\d+$/.test(options.height) ? options.height + "px" : options.height) : element.clientHeight + "px";
        options.buttonList = options.buttonList || [
            ['undo', 'redo'],
            ['font', 'fontSize', 'formats'],
            ['bold', 'underline', 'italic', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['indent', 'outdent'],
            ['align', 'line', 'list', 'table'],
            ['link', 'image', 'video'],
            ['fullScreen', 'codeView']
        ];

        /** editor seting options */
        options.width = /^\d+/.test(options.width) ? (/^\d+$/.test(options.width) ? options.width + "px" : options.width) : (/%|auto/.test(element.style.width) ? element.style.width : element.clientWidth + "px");
        options.display = options.display || (element.style.display === 'none' || !element.style.display ? 'block' : element.style.display);
        options.editorIframeFont = options.editorIframeFont || 'inherit';

        var doc = document;

        /** suneditor div */
        var top_div = doc.createElement("DIV");
        top_div.className = "sun-editor";
        top_div.id = "suneditor_" + element.id;
        top_div.style.width = options.width;
        top_div.style.display = options.display;

        /** relative div */
        var relative = doc.createElement("DIV");
        relative.className = "sun-editor-container";

        /** tool bar */
        var tool_bar = doc.createElement("DIV");
        tool_bar.className = "sun-editor-id-toolbar";
        tool_bar.innerHTML = _createToolBar(options.buttonList);

        /** inner editor div */
        var editor_div = doc.createElement("DIV");
        editor_div.className = "sun-editor-id-editorArea";
        editor_div.style.height = options.height;

        /** iframe */
        var iframe = doc.createElement("IFRAME");
        iframe.allowFullscreen = true;
        iframe.frameBorder = 0;
        iframe.className = "input_editor sun-editor-id-wysiwyg";
        iframe.style.display = "block";

        /** textarea for code view */
        var textarea = doc.createElement("TEXTAREA");
        textarea.className = "input_editor html sun-editor-id-code";
        textarea.style.display = "none";

        iframe.addEventListener("load", function () {
            this.setAttribute("scrolling", "auto");
            this.contentWindow.document.head.innerHTML = '' +
                '<meta charset=\"utf-8\" />' +
                '<style type=\"text/css\">' +
                '   body {font-family:' + options.editorIframeFont + '; margin:15px; word-break:break-all;} p {margin:0; padding:0;} blockquote {margin-top:0; margin-bottom:0; margin-right:0;}' +
                '   table {table-layout:auto; border:1px solid rgb(204, 204, 204); width:100%; max-width:100%; margin-bottom:20px; background-color:transparent; border-spacing:0; border-collapse:collapse;}' +
                '   table tr {border:1px solid #ccc;}' +
                '   table tr td {border:1px solid #ccc; padding:8px;}' +
                '</style>';
            this.contentWindow.document.body.setAttribute("contenteditable", true);
            if (element.value.length > 0) {
                this.contentWindow.document.body.innerHTML = '<p>' + element.value + '</p>';
            } else {
                this.contentWindow.document.body.innerHTML = '<p>&#65279</p>';
            }
        });

        /** resize bar */
        var resize_bar = doc.createElement("DIV");
        resize_bar.className = "sun-editor-id-resizeBar";

        /** loading box */
        var loading_box = doc.createElement("DIV");
        loading_box.className = "sun-editor-id-loading";
        loading_box.innerHTML = "<div class=\"ico-loading\"></div>";

        /** resize operation background */
        var resize_back = doc.createElement("DIV");
        resize_back.className = "sun-editor-id-resize-background";

        /** append html */
        editor_div.appendChild(iframe);
        editor_div.appendChild(textarea);
        relative.appendChild(tool_bar);
        relative.appendChild(editor_div);
        relative.appendChild(resize_bar);
        relative.appendChild(resize_back);
        relative.appendChild(loading_box);
        top_div.appendChild(relative);

        return {
            constructed: {
                _top: top_div,
                _relative: relative,
                _toolBar: tool_bar,
                _editorArea: editor_div,
                _resizeBar: resize_bar,
                _loading: loading_box,
                _resizeBack: resize_back
            },
            options: options
        };
    }

    /**
     * @description Elements and variables you should have
     * @param {HTMLElement} element - textarea element
     * @param {object} cons - Toolbar element you created
     * @param {json} options - user options
     * @returns Elements, variables of the editor
     * @private
     */
    function _Context(element, cons, options) {
        return {
            element: {
                textElement: element,
                topArea: cons._top,
                relative: cons._relative,
                resizebar: cons._resizeBar,
                editorArea: cons._editorArea,
                wysiwygWindow: cons._editorArea.getElementsByClassName('sun-editor-id-wysiwyg')[0].contentWindow,
                wysiwygElement: cons._editorArea.getElementsByClassName('sun-editor-id-wysiwyg')[0],
                code: cons._editorArea.getElementsByClassName('sun-editor-id-code')[0],
                loading: cons._loading,
                resizeBackground: cons._resizeBack
            },
            tool: {
                bar: cons._toolBar,
                cover: cons._toolBar.getElementsByClassName('sun-editor-id-toolbar-cover')[0],
                bold: cons._toolBar.getElementsByClassName('sun-editor-id-bold')[0],
                underline: cons._toolBar.getElementsByClassName('sun-editor-id-underline')[0],
                italic: cons._toolBar.getElementsByClassName('sun-editor-id-italic')[0],
                strike: cons._toolBar.getElementsByClassName('sun-editor-id-strike')[0],
                font: cons._toolBar.getElementsByClassName('sun-editor-font-family')[0],
                fontSize: cons._toolBar.getElementsByClassName('sun-editor-font-size')[0]
            },
            user: {
                videoX: options.videoX,
                videoY: options.videoY,
                imageSize: options.imageSize,
                imageUploadUrl: options.imageUploadUrl,
                addFont: options.addFont,
                fontList: options.fontList,
                fontSizeList: options.fontSizeList,
                height: options.height.match(/\d+/)[0]
            }
        };
    }

    /**
     * @description Create the suneditor
     * @param {string} elementId - textarea Id
     * @param {json} options - user options
     * @returns {{save: save, getContent: getContent, setContent: setContent, appendContent: appendContent, disabled: disabled, enabled: enabled, show: show, hide: hide, destroy: destroy}}
     */
    SUNEDITOR.create = function (elementId, options) {
        var element = document.getElementById(elementId);

        if (element === null) {
            throw Error('[SUNEDITOR.create.fail] The element for that id was not found (ID:"' + elementId + '")');
        }

        var cons = _Constructor(element, options);

        if (!!document.getElementById(cons.constructed._top.id)) {
            throw Error('[SUNEDITOR.create.fail] The ID of the suneditor you are trying to create already exists (ID:"' + cons.constructed._top.id + '")');
        }

        /** Create to sibling node */
        if (typeof element.nextElementSibling === 'object') {
            element.parentNode.insertBefore(cons.constructed._top, element.nextElementSibling);
        } else {
            element.parentNode.appendChild(cons.constructed._top);
        }

        element.style.display = "none";

        return core(_Context(element, cons.constructed, cons.options), dom, func);
    };

    /**
     * @description Destroy the suneditor
     * @param {string} elementId - textarea Id
     */
    SUNEDITOR.destroy = function (elementId) {
        var element = document.getElementById('suneditor_' + elementId);
        element.parentNode.removeChild(element);
        document.getElementById(elementId).style.display = "";
    };

})(SUNEDITOR);