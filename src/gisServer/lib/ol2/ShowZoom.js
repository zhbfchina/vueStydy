/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Lang.js
 */

/**
 * Class: OpenLayers.Control.Scale
 * The Scale control displays the current map scale as a ratio (e.g. Scale = 
 * 1:1M). By default it is displayed in the lower right corner of the map.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ShowZoom = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * Property: element
     * {DOMElement}
     */
    element: null,
    
    /**
     * APIProperty: geodesic
     * {Boolean} Use geodesic measurement. Default is false. The recommended
     * setting for maps in EPSG:4326 is false, and true EPSG:900913. If set to
     * true, the scale will be calculated based on the horizontal size of the
     * pixel in the center of the map viewport.
     */
    geodesic: false,

    /**
     * Constructor: OpenLayers.Control.Scale
     * 
     * Parameters:
     * element - {DOMElement} 
     * options - {Object} 
     */
    initialize: function(element, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.element = OpenLayers.Util.getElement(element);        
    },

    /**
     * Method: draw
     * 
     * Returns:
     * {DOMElement}
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!this.element) {
            this.element = document.createElement("div");
            this.div.appendChild(this.element);
        }
        this.map.events.register( 'moveend', this, this.updateScale);
        this.updateScale();
        return this.div;
    },
   
    /**
     * Method: updateScale
     */
    updateScale: function() {
       
        var zoom=this.map.getZoom();
        this.element.innerHTML = "级别："+zoom;
        this.element.style.fontSize ="12px";
    }, 

    CLASS_NAME: "OpenLayers.Control.ShowZoom"
});

