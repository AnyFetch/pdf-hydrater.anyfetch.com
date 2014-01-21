/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab filetype=javascript : */
/** 
 * @license 
 * pdf2htmlEX.js: Core UI functions for pdf2htmlEX 
 * Copyright 2012,2013 Lu Wang <coolwanglu@gmail.com> and other contributors 
 * https://github.com/coolwanglu/pdf2htmlEX/blob/master/share/LICENSE 
 */

/*
 * Attention:
 * This files is to be optimized by closure-compiler, 
 * so pay attention to the forms of property names:
 *
 * string/bracket form is safe, won't be optimized:
 * var obj={ 'a':'b' }; obj['a'] = 'b';
 * name/dot form will be optimized, the name is likely to be modified:
 * var obj={ a:'b' }; obj.a = 'b';
 *
 * Either form can be used for internal objects, 
 * but must be consistent for each one respectively.
 *
 * string/bracket form must be used for external objects
 * e.g. DEFAULT_CONFIG, object stored in page-data
 * property names are part of the `protocol` in these cases.
 *
 */

'use strict';

var pdf2htmlEX = window['pdf2htmlEX'] = window['pdf2htmlEX'] || {};

/** 
 * @const 
 * @struct
 */
var CSS_CLASS_NAMES = {
  page_frame       : 'pf',
  page_content_box : 'pc',
  page_data        : 'pi',
  background_image : 'bi',
  link             : 'l',
  __dummy__        : 'no comma'
};

/** 
 * configurations of Viewer
 * @const 
 * @dict
 */
var DEFAULT_CONFIG = {
  // id of the element to put the pages in
  'container_id' : 'page-container',
  // id of the element for sidebar (to open and close)
  'sidebar_id' : 'sidebar',
  // id of the element for outline
  'outline_id' : 'outline',
  // class for the loading indicator
  'loading_indicator_cls' : 'loading-indicator',
  // How many page shall we preload that are below the last visible page
  'preload_pages' : 3,
  // how many ms should we wait before actually rendering the pages and after a scroll event
  'render_timeout' : 100,
  // zoom ratio step for each zoom in/out event
  'scale_step' : 0.9,
  // register global key handler
  'register_key_handler' : true,

  '__dummy__'        : 'no comma'
};

/** @const */
var EPS = 1e-6;

/************************************/
/* utility function */
/**
 * @param{Array.<number>} ctm
 */
function invert(ctm) {
  var det = ctm[0] * ctm[3] - ctm[1] * ctm[2];
  return [ ctm[3] / det
          ,-ctm[1] / det
          ,-ctm[2] / det
          ,ctm[0] / det
          ,(ctm[2] * ctm[5] - ctm[3] * ctm[4]) / det
          ,(ctm[1] * ctm[4] - ctm[0] * ctm[5]) / det
        ];
};
/**
 * @param{Array.<number>} ctm
 * @param{Array.<number>} pos
 */
function transform(ctm, pos) {
  return [ctm[0] * pos[0] + ctm[2] * pos[1] + ctm[4]
         ,ctm[1] * pos[0] + ctm[3] * pos[1] + ctm[5]];
};

/**
 * @param{Element} ele
 */
function get_page_number(ele) {
  return parseInt(ele.getAttribute('data-page-no'), 16);
};

/**
 * @param{NodeList} eles
 */
function disable_dragstart(eles) {
  for (var i = 0, l = eles.length; i < l; ++i) {
    eles[i].addEventListener('dragstart', function() {
      return false;
    }, false);
  }
};

/**
 * @param{...Object} var_args
 */
function clone_and_extend_objs(var_args) {
  var result_obj = {};
  for (var i = 0, l = arguments.length; i < l; ++i) {
    var cur_obj = arguments[i];
    for (var k in cur_obj) {
      if (cur_obj.hasOwnProperty(k)) {
        result_obj[k] = cur_obj[k];
      }
    }
  }
  return result_obj;
};

/** 
 * @constructor 
 * @param{Element} page The element for the page
 */
function Page(page) {
  if (!page) return;

  this.loaded = false;
  this.shown = false;
  this.page = page; // page frame element

  this.num = get_page_number(page);

  // page size
  // Need to make rescale work when page_content_box is not loaded, yet
  this.original_height = page.clientHeight;     
  this.original_width = page.clientWidth;

  // content box
  var content_box = page.getElementsByClassName(CSS_CLASS_NAMES.page_content_box)[0];

  // if page is loaded
  if (content_box) {
    this.content_box = content_box;
    /*
     * scale ratios
     *
     * original_scale : the first one
     * cur_scale : currently using
     */
    this.original_scale = this.cur_scale = this.original_height / content_box.clientHeight;
    this.page_data = JSON.parse(page.getElementsByClassName(CSS_CLASS_NAMES.page_data)[0].getAttribute('data-data'));

    this.ctm = this.page_data['ctm'];
    this.ictm = invert(this.ctm);

    this.loaded = true;
  }
};
Page.prototype = {
  /* hide & show are for contents, the page frame is still there */
  hide : function(){
    if (this.loaded && this.shown) {
      this.content_box.classList.remove('opened');
      this.shown = false;
    }
  },
  show : function(){
    if (this.loaded && !this.shown) {
      this.content_box.classList.add('opened');
      this.shown = true;
    }
  },
  /**
   * @param{number} ratio
   */
  rescale : function(ratio) {
    if (ratio == 0) {
      // reset scale
      this.cur_scale = this.original_scale;
    } else {
      this.cur_scale = ratio;
    }

    // scale the content box
    if (this.loaded) {
      var cbs = this.content_box.style;
      cbs.msTransform = cbs.webkitTransform = cbs.transform = 'scale('+this.cur_scale.toFixed(3)+')';
    }

    // stretch the page frame to hold the place
    {
      var ps = this.page.style;
      ps.height = (this.original_height * this.cur_scale) + 'px';
      ps.width = (this.original_width * this.cur_scale) + 'px';
    }
  },
  /*
   * return the coordinate of the top-left corner of container
   * in our coordinate system
   * assuming that p.parentNode == p.offsetParent
   */
  view_position : function () {
    var p = this.page;
    var c = p.parentNode;
    return [c.scrollLeft - p.offsetLeft - p.clientLeft
           ,c.scrollTop - p.offsetTop - p.clientTop];
  },
  height : function () {
    return this.page.clientHeight;
  },
  width : function () {
    return this.page.clientWidth;
  }
};

/** 
 * export pdf2htmlEX.Viewer
 * @constructor
 * @param{Object=} config
 */
function Viewer(config) {
  this.config = clone_and_extend_objs(DEFAULT_CONFIG, (arguments.length > 0 ? config : {}));
  this.pages_loading = [];
  this.init_before_loading_content();

  var _ = this;
  document.addEventListener('DOMContentLoaded', function(){
    _.init_after_loading_content();
  }, false);
};

Viewer.prototype = {
  scale : 1,
  cur_page_idx : 0,

  init_before_loading_content : function() {
    /*hide all pages before loading, will reveal only visible ones later */
    this.pre_hide_pages();
  },

  init_after_loading_content : function() {
    this.sidebar = document.getElementById(this.config['sidebar_id']);
    this.outline = document.getElementById(this.config['outline_id']);
    this.container = document.getElementById(this.config['container_id']);
    this.loading_indicator = document.getElementsByClassName(this.config['loading_indicator_cls'])[0];

    
    {
      // Open the outline if nonempty
      var empty = true;
      var nodes = this.outline.childNodes;
      for (var i = 0, l = nodes.length; i < l; ++i) {
        var cur_node = nodes[i];
        if (cur_node.nodeName == 'UL') {
          empty = false;
          break;
        }
      }
      if (!empty)
        this.sidebar.classList.add('opened');
    }

    this.find_pages();

    // disable dragging of background images
    disable_dragstart(document.getElementsByClassName(CSS_CLASS_NAMES.background_image));

    if (this.config['register_key_handler'])
      this.register_key_handler();

    // register schedule rendering
    // renew old schedules since scroll() may be called frequently
    var _ = this;
    this.container.addEventListener('scroll', function() {
      _.schedule_render(true);
    }, false);

    // handle links
    [this.container, this.outline].forEach(function(ele) {
      ele.addEventListener('click', _.link_handler.bind(_), false);
    });

    this.render();
  },

  /*
   * set up this.pages and this.page_map
   * pages is an array holding all the Page objects
   * page-Map maps an original page number (in PDF) to the corresponding index in page
   */
  find_pages : function() {
    var new_pages = [];
    var new_page_map = {};
    var nodes = this.container.childNodes;
    for (var i = 0, l = nodes.length; i < l; ++i) {
      var cur_node = nodes[i];
      if ((cur_node.nodeType == Node.ELEMENT_NODE)
          && cur_node.classList.contains(CSS_CLASS_NAMES.page_frame)) {
        var p = new Page(cur_node);
        new_pages.push(p);
        new_page_map[p.num] = new_pages.length - 1;
      }
    }
    this.pages = new_pages;
    this.page_map = new_page_map;
  },

  /**
   * @param{number} idx
   * @param{number=} pages_to_preload
   * @param{function(Page)=} callback
   *
   * TODO: remove callback
   */
  load_page : function(idx, pages_to_preload, callback) {
    var pages = this.pages;
    if (idx >= pages.length)
      return;  // Page does not exist

    var cur_page = pages[idx];
    if (cur_page.loaded)
      return;  // Page is loaded

    if (this.pages_loading[idx])
      return;  // Page is already loading

    var new_loading_indicator = this.loading_indicator.cloneNode();
    new_loading_indicator.classList.add('active');

    var cur_page_ele = cur_page.page;
    cur_page_ele.appendChild(new_loading_indicator);

    var url = cur_page_ele.getAttribute('data-page-url');
    if (url) {
      this.pages_loading[idx] = true;       // set semaphore

      /* closure variables */
      var _ = this;
      var _idx = idx;

      // load data
      {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function(){
          if (xhr.readyState != 4) return;
          if (xhr.status == 200) {
            // find the page element in the data
            var div = document.createElement('div');
            div.innerHTML = xhr.responseText;

            var new_page = null;
            var nodes = div.childNodes;
            for (var i = 0, l = nodes.length; i < l; ++i) {
              var cur_node = nodes[i];
              if ((cur_node.nodeType == Node.ELEMENT_NODE)
                  && cur_node.classList.contains(CSS_CLASS_NAMES.page_frame)) {
                new_page = cur_node;
                break;
              }
            }

            // replace the old page with loaded data
            // the loading indicator on this page should also be destroyed
            var p = _.pages[_idx];
            _.container.replaceChild(new_page, p.page);
            p = new Page(new_page);
            _.pages[_idx] = p;

            p.hide();
            p.rescale(_.scale);

            // disable background image dragging
            disable_dragstart(new_page.getElementsByClassName(CSS_CLASS_NAMES.background_image));

            _.schedule_render(false);

            if (callback){ callback(p); }
          }

          // Reset loading token
          delete _.pages_loading[_idx];
        };
        xhr.send(null);
      }
    }
    // Concurrent prefetch of the next pages
    if (pages_to_preload === undefined)
      pages_to_preload = this.config['preload_pages'];

    if (--pages_to_preload > 0)
      this.load_page(idx+1, pages_to_preload);
  },

  /*
   * Hide all pages that have no 'opened' class
   * The 'opened' class will be added to visible pages by JavaScript
   * We cannot add this in the default CSS because JavaScript may be disabled
   */
  pre_hide_pages : function() {
    /* pages might have not been loaded yet, so add a CSS rule */
    var s = '@media screen{.'+CSS_CLASS_NAMES.page_content_box+'{display:none;}}';
    var n = document.createElement('style');
    if (n.styleSheet) {
      n.styleSheet.cssText = s;
    } else {
      n.appendChild(document.createTextNode(s));
    }
    document.head.appendChild(n);
  },

  /*
   * show visible pages and hide invisible pages
   * update current page number
   */
  render : function () {
    var container = this.container;
    /* 
     * show the pages that are 'nearly' visible -- it's right above or below the container
     *
     * all the y values are in the all-page element's coordinate system
     */
    var container_min_y = container.scrollTop;
    var container_height = container.clientHeight;
    var container_max_y = container_min_y + container_height;
    var visible_min_y = container_min_y - container_height;
    var visible_max_y = container_max_y + container_height;

    var cur_page_fully_visible = false;
    var cur_page_idx = this.cur_page_idx;
    var max_visible_page_idx = cur_page_idx;
    var max_visible_ratio = 0.0;

    var pl = this.pages;
    for (var i = 0, l = pl.length; i < l; ++i) {
      var cur_page = pl[i];
      var cur_page_ele = cur_page.page;
      var page_min_y = cur_page_ele.offsetTop + cur_page_ele.clientTop;
      var page_height = cur_page_ele.clientHeight;
      var page_max_y = page_min_y + page_height;
      if ((page_min_y <= visible_max_y) && (page_max_y >= visible_min_y))
      {
        // cur_page is 'nearly' visible, show it or load it
        if (cur_page.loaded) {
          cur_page.show();
        } else {
          this.load_page(i);
        }

        if (!cur_page_fully_visible) {
          // check the visible fraction of the page
          var page_visible_ratio = (Math.min(container_max_y, page_max_y) - Math.max(container_min_y, page_min_y)) / page_height;
          if ((i == cur_page_idx) && (Math.abs(page_visible_ratio - 1.0) <= EPS)) {
            cur_page_fully_visible = true;
          } else if (page_visible_ratio > max_visible_ratio) {
            max_visible_ratio = page_visible_ratio;
            max_visible_page_idx = i;
          }
        }
      } else {
        cur_page.hide();
      }
    }
    /*
     * update current page number to the maximum visible page
     * do not update it when current page is still fully visible
     */
    if (!cur_page_fully_visible) 
      this.cur_page_idx = max_visible_page_idx;
  },

  /**
   * @param{boolean} renew renew the existing schedule instead of using the old one
   */
  schedule_render : function(renew) {
    if (this.render_timer !== undefined) {
      if (!renew) return;
      clearTimeout(this.render_timer);
    }

    var _ = this;
    this.render_timer = setTimeout(function () {
      /*
       * render() may trigger load_page(), which may in turn trigger another render()
       * so delete render_timer first
       */
      delete _.render_timer;
      _.render();
    }, this.config['render_timeout']);
  },

  /*
   * Handling key events, zooming, scrolling etc.
   */
  register_key_handler: function () {
    /* 
     * When user try to zoom in/out using ctrl + +/- or mouse wheel
     * handle this and prevent the default behaviours
     *
     * Code credit to PDF.js
     */
    var _ = this;
    // Firefox specific event, so that we can prevent browser from zooming
    window.addEventListener('DOMMouseScroll', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        _.rescale(Math.pow(_.config['scale_step'], e.detail), true);
      }
    }, false);

    window.addEventListener('keydown', function(e) {
      var handled = false;
      /*
      var cmd = (e.ctrlKey ? 1 : 0)
                | (e.altKey ? 2 : 0)
                | (e.shiftKey ? 4 : 0)
                | (e.metaKey ? 8 : 0)
                ;
                */
      var with_ctrl = e.ctrlKey || e.metaKey;
      var with_alt = e.altKey;
      switch (e.keyCode) {
        case 61: // FF/Mac '='
        case 107: // FF '+' and '='
        case 187: // Chrome '+'
          if (with_ctrl){
            _.rescale(1.0 / _.config['scale_step'], true);
            handled = true;
          }
          break;
        case 173: // FF/Mac '-'
        case 109: // FF '-'
        case 189: // Chrome '-'
          if (with_ctrl){
            _.rescale(_.config['scale_step'], true);
            handled = true;
          }
          break;
        case 48: // '0'
          if (with_ctrl){
            _.rescale(0, false);
            handled = true;
          }
          break;
        case 33: // Page UP:
          if (with_alt) { // alt-pageup    -> scroll one page up
            _.scroll_to(_.cur_page_idx - 1);
          } else { // pageup        -> scroll one screen up
            _.container.scrollTop -= _.container.clientHeight;
          }
          handled = true;
          break;
        case 34: // Page DOWN
          if (with_alt) { // alt-pagedown  -> scroll one page down
            _.scroll_to(_.cur_page_idx + 1);
          } else { // pagedown      -> scroll one screen down
            _.container.scrollTop += _.container.clientHeight;
          }
          handled = true;
          break;
        case 35: // End
          _.container.scrollTop = _.container.scrollHeight;
          handled = true;
          break;
        case 36: // Home
          _.container.scrollTop = 0;
          handled = true;
          break;
      }
      if (handled) {
        e.preventDefault();
        return;
      }
    }, false);
  },

  /**
   * @param{number} ratio
   * @param{boolean} is_relative
   * @param{number=} offsetX
   * @param{number=} offsetY
   *
   * TODO: offsetX/Y is by default the center of container
   * TODO consider scale on offsetX/Y
   */
  rescale : function (ratio, is_relative, offsetX, offsetY) {
    var old_scale = this.scale;
    var new_scale = old_scale;
    // set new scale
    if (ratio == 0) {
      new_scale = 1;
      is_relative = false;
    } else if (is_relative)
      new_scale *= ratio;
    else
      new_scale = ratio;

    this.scale = new_scale;

    if (! offsetX)
      offsetX = 0;
    if (! offsetY)
      offsetY = 0;

    // Save offset of the active page
    var active_page = this.pages[this.cur_page_idx];
    if (!active_page) return;

    var active_page_ele = active_page.page;
    var prev_offset = [ active_page_ele.offsetLeft, active_page_ele.offsetTop ];

    // Rescale pages
    var pl = this.pages;
    for (var i = 0, l = pl.length; i < l; ++i) 
        pl[i].rescale(new_scale);  

    var container = this.container;
    // Correct container scroll to keep view aligned while zooming
    var correction_top = active_page_ele.offsetTop - prev_offset[1];
    container.scrollTop += correction_top + offsetY;

    // Take the center of the view as a reference
    var prev_center_x = container.clientWidth / 2 - prev_offset[0];
    // Calculate the difference respect the center of the view after the zooming
    var correction_left = prev_center_x * (new_scale/old_scale - 1) + active_page_ele.offsetLeft - prev_offset[0];
    // Scroll the container accordingly to keep alignment to the initial reference
    container.scrollLeft += correction_left + offsetX;

    // some pages' visibility may be toggled, wait for next render()
    // renew old schedules since rescale() may be called frequently
    this.schedule_render(true);
  },

  fit_width : function () {
    var page_idx = this.cur_page_idx;
    this.rescale(this.container.clientWidth / this.pages[page_idx].width(), false);
    this.scroll_to(page_idx, [0,0]);
  },

  fit_height : function () {
    var page_idx = this.cur_page_idx;
    this.rescale(this.container.clientHeight / this.pages[page_idx].height(), false);
    this.scroll_to(page_idx, [0,0]);
  },
  /**
   * @param{Node} ele
   */
  get_containing_page : function(ele) {
    /* get the page obj containing obj */
    while(ele) {
      if ((ele.nodeType == Node.ELEMENT_NODE)
          && ele.classList.contains(CSS_CLASS_NAMES.page_frame)) {
        /*
         * Get original page number and map it to index of pages
         * TODO: store the index on the dom element
         */
        var pn = get_page_number(/** @type{Element} */(ele));
        var pm = this.page_map;
        return (pn in pm) ? this.pages[pm[pn]] : null;
      }
      ele = ele.parentNode;
    }
    return null;
  },

  /**
   * @param{Event} e
   */
  link_handler : function (e) {
    var target = /** @type{Node} */(e.target);

    var cur_pos = [0,0];

    // cur_page might be undefined, e.g. from Outline
    var cur_page = this.get_containing_page(target);
    if (cur_page)
    {
      cur_pos = cur_page.view_position();
      //get the coordinates in default user system
      cur_pos = transform(cur_page.ictm, [cur_pos[0], cur_page.height()-cur_pos[1]]);
    }

    var detail_str = /** @type{string} */ (target.getAttribute('data-dest-detail'));
    if (!detail_str) return;

    var ok = false;
    var detail = JSON.parse(detail_str);

    var target_page_no = detail[0];
    var page_map = this.page_map;
    if (!(target_page_no in page_map)) return;
    var target_page_idx = page_map[target_page_no];
    var target_page = this.pages[target_page_idx];

    var pos = [0,0];
    var zoom = this.scale;
    var upside_down = true;
    // TODO: fitb*
    // TODO: BBox
    switch(detail[1]) {
      case 'XYZ':
        pos = [(detail[2] == null) ? cur_pos[0] : detail[2]
          ,(detail[3] == null) ? cur_pos[1] : detail[3]];
        zoom = detail[4];
        if ((zoom == null) || (zoom == 0))
          zoom = this.scale;
        ok = true;
        break;
      case 'Fit':
      case 'FitB':
        pos = [0,0];
        ok = true;
        break;
      case 'FitH':
      case 'FitBH':
        pos = [0, (detail[2] == null) ? cur_pos[1] : detail[2]];
        ok = true;
        break;
      case 'FitV':
      case 'FitBV':
        pos = [(detail[2] == null) ? cur_pos[0] : detail[2], 0];
        ok = true;
        break;
      case 'FitR':
        /* locate the top-left corner of the rectangle */
        pos = [detail[2], detail[5]];
        upside_down = false;
        ok = true;
        break;
      default:
        ok = false;
        break;
    }

    if (ok) {
      this.rescale(zoom, false);

      var _ = this;
      /**
       * page should of type Page 
       * @param{Page} page 
       */
      var transform_and_scroll = function(page) {
        pos = transform(page.ctm, pos);
        if (upside_down) {
          pos[1] = page.original_height - pos[1];
        }
        _.scroll_to(target_page_idx, pos);
      };

      if (target_page.loaded) {
        transform_and_scroll(target_page);
      } else {
        // TODO: scroll_to may finish before load_page

        // Scroll to the exact position once loaded.
        this.load_page(target_page_idx, undefined, transform_and_scroll);

        // In the meantime page gets loaded, scroll approximately position for maximum responsiveness.
        this.scroll_to(target_page_idx, [0,0]);
      }
      e.preventDefault();
    }
  }, 

  /**
   * @param{number} page_idx
   * @param{Array.<number>=} pos [x,y] in UNSCALED COORDINATION, where (0,0) is the top-left corner
   */
  scroll_to : function(page_idx, pos) {
    var pl = this.pages;
    if ((page_idx < 0) || (page_idx >= pl.length)) return;
    var target_page = pl[page_idx];
    var cur_target_pos = target_page.view_position();

    if (pos === undefined)
      pos = [0,0];

    var container = this.container;
    var scale = this.scale;
    container.scrollLeft += pos[0] * scale - cur_target_pos[0];
    container.scrollTop += pos[1] * scale - cur_target_pos[1];
  }
};

pdf2htmlEX['Viewer'] = Viewer;
