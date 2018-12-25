// force scroll to top on initial load
window.onbeforeunload = function(){
  window.scrollTo(0,0)
}

$(window).on("load", function(){
  $.ready.then(function(){
    window.onLoadTrigger()
  });
})

$(document).ready(function(){

  //////////
  // Global variables
  //////////
  var _window = $(window);
  var _document = $(document);
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing

  var scroll = {
    y: _window.scrollTop(),
    direction: undefined,
    blocked: false,
    lastForBodyLock: 0,
    lastForScrollDir: 0
  }

  var header = {
    container: undefined, // jQuery object
    topContainer: undefined, // jQuery object
    centerContainer: undefined, // jQuery object
    bottomContainer: undefined, // jQuery object
    bottomPoint: undefined, // when header ends in px (height)
    topHeight: undefined, // top container height
    topHeightPercent: undefined, // when containerTop ends in %
    firstSectionHeight: undefined // when hide/show animation show be started
  }

  var browser = {
    isRetinaDisplay: isRetinaDisplay(),
    isIe: msieversion(),
    isMobile: isMobile()
  }

  var sliders = [] // collection of all sliders

  ////////////
  // LIST OF FUNCTIONS
  ////////////

  // some functions should be called once only
  legacySupport();
  initaos();
  // preloaderDone();

  // The new container has been loaded and injected in the wrapper.
  function pageReady(fromPjax){
    closeMobileNavi(fromPjax);
    updateHeaderActiveClass();
    closeMobileMenu(fromPjax);
    menuHider();
    formatTextsResponsive();
    setFooterMargin();

    initSliders();
    initPopups();
    initMasks();
    initSelectric();
    initScrollMonitor(fromPjax);
    initValidations();
  }

  // The transition has just finished and the old Container has been removed from the DOM.
  function pageCompleated(fromPjax){
    getHeaderParams();
    setPageOffset();
    if ( fromPjax ){
      AOS.refreshHard();
      window.onLoadTrigger()
    }
  }

  // some plugins work best with onload triggers
  window.onLoadTrigger = function onLoad(){
    preloaderDone();
    initLazyLoad();
  }

  // this is a master function which should have all functionality
  pageReady();
  pageCompleated();

  // scroll/resize listeners
  _window.on('scroll', getWindowScroll);
  _window.on('scroll', scrollHeader);
  // debounce/throttle examples
  _window.on('resize', debounce(closeMobileNavi, 100));
  _window.on('resize', debounce(menuHider, 25));
  _window.on('resize', debounce(getHeaderParams, 100));
  _window.on('resize', debounce(setPageOffset, 100));
  _window.on('resize', debounce(formatTextsResponsive, 50));
  _window.on('resize', debounce(setFooterMargin, 50));
  _window.on('resize', debounce(setBreakpoint, 200))



  //////////
  // COMMON
  //////////

  // detectors
  function isRetinaDisplay() {
    if (window.matchMedia) {
        var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
        return (mq && mq.matches || (window.devicePixelRatio > 1));
    }
  }

  function isMobile(){
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      return true
    } else {
      return false
    }
  }

  function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      return true
    } else {
      return false
    }
  }

  function initaos() {
    AOS.init({
      // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
      offset: 120, // offset (in px) from the original trigger point
      delay: 0, // values from 0 to 3000, with step 50ms
      duration: 400, // values from 0 to 3000, with step 50ms
      easing: 'ease-in', // default easing for AOS animations
      once: true, // whether animation should happen only once - while scrolling down
      mirror: false, // whether elements should animate out while scrolling past them
      anchorPlacement: 'top-bottom', // defines which position of the element regarding to window should trigger the animation
    });
  }

  function legacySupport(){
    // svg support for laggy browsers
    svg4everybody();

    // Viewport units buggyfill
    window.viewportUnitsBuggyfill.init({
      force: false,
      refreshDebounceWait: 150,
      appendToBody: true
    });

    if ( browser.isIe ){
      $('body').addClass('is-ie');

      // ie pollyfil for picture tag
      // (will be called on itialization - use as lazy load callback)
      // picturefill();
    }

    if ( browser.isMobile ){
      $('body').addClass('is-mobile');
    }
  }

  // preloader
  function preloaderDone(){
    $('#barba-wrapper').addClass('is-preloaded');
  }

  // Prevent # behavior
	_document
    .on('click', '[href="#"]', function(e) {
      e.preventDefault();
    })
    .on('click', '[js-link]', function(e){
      var dataHref = $(this).data('href');
      if (dataHref && dataHref !== "#"){
        e.preventDefault();
        e.stopPropagation();
        Barba.Dispatcher.trigger('linkClicked', $(this));
        Barba.Pjax.goTo(dataHref);
      }
    })
    .on('click', '.product-card__cta', function(e){
      // to prevent conflicts with js-link on .product-card
      e.stopPropagation();
    })
    // prevent going the same link (if barba is connected)
    .on('click', 'a, [js-link]', function(e){
      var href = $(this).data('href') || $(this).attr('href');
      var path = window.location.pathname

      if ( href === path.slice(1, path.length) ){
        e.preventDefault();
        e.stopPropagation();
      }
    })
    // scroll to section
    .on('click', 'a[href^="#section"]', function() { // section scroll
      var el = $(this).attr('href');
      var topTarget = $(el).offset().top

      // $('body, html').animate({scrollTop: topTarget}, 1000);
      TweenLite.to(window, 1, {
        scrollTo: {y: $(el).offset().top, autoKill:false},
        ease: easingSwing
      });

      return false;
    })
    // grid toggler
    .on('click', '[js-show-grid]', function(){
       $(this).toggleClass('is-active')
       $('.demo-grid').fadeToggle()
     })

  // just store global variable with scroll distance
  function getWindowScroll(){
    if ( scroll.blocked ) return

    var wScroll = _window.scrollTop()
    scroll.y = wScroll
    scroll.direction = wScroll > scroll.lastForScrollDir ? "down" : "up"

    scroll.lastForScrollDir = wScroll <= 0 ? 0 : wScroll;
  }


  // HEADER SCROLL
  function getHeaderParams(){
    var $header = $('.header');
    var $headerTop = $header.find(".header__top");
    var $headerCenter = $header.find(".header__center");
    var $headerBottom = $header.find(".header__bottom");
    var headerOffsetTop = 0
    var headerHeight = $header.outerHeight() + headerOffsetTop
    var headerTopHeight = $headerTop.outerHeight()
    var topHeightPercent =  Math.floor((headerTopHeight / headerHeight) * 100)

    // get the point when header should start disapearing of scroll direction
    var wHeight = _window.height()
    var firstSectionHeight = $('.page__content').children().first().outerHeight() + (headerHeight / 2)
    if ( firstSectionHeight > wHeight ){
      firstSectionHeight = wHeight // can't be more than 100vh
    }

    // clean up prev styles
    if ( $('#header-styles').length > 0 ) $('#header-styles').remove()
    var styles = ".header.is-fixed-visible{transform: translate3d(0,-"+topHeightPercent+"%,0) !important}"
    var headerStylesheet = $("<style type='text/css' id='header-styles'>"+styles+"</style>")
    headerStylesheet.appendTo("head");

    header = {
      container: $header,
      topContainer: $headerTop,
      centerContainer: $headerCenter,
      bottomContainer: $headerBottom,
      bottomPoint: headerHeight,
      topHeight: headerTopHeight,
      topHeightPercent: topHeightPercent,
      firstSectionHeight: firstSectionHeight
    }
  }

  function scrollHeader(){
    if ( header.container !== undefined ){
      var fixedClass = 'is-fixed';
      var visibleClass = 'is-fixed-visible';
      var targetBottomScroll = 98 // how much red menu should be hidden (2% to get red border)

      if ( scroll.blocked ) return

      // reset to initial on fast scroll
      if ( scroll.y <= 0 ){
        header.container.css({"transform": 'translate3d(0,0,0)'})
        header.bottomContainer.css({"transform": 'translate3d(0,0,0)'})
      }

      // emulate position absolute by giving negative transform on initial scroll
      if ( scroll.y < header.topHeight ){
        var normalized = Math.floor(normalize(scroll.y, header.bottomPoint, 0, 0, 100))
        var reverseNormalized = (100 - normalized) * -1

        header.container.css({
          "transform": 'translate3d(0,'+ reverseNormalized +'%,0)',
        })

        // header.container.removeClass(fixedClass);

      } else if ( scroll.y >= header.topHeight ){
        // set max on fast scroll
        header.container.css({
          "transform": 'translate3d(0,-'+ header.topHeightPercent +'%,0)',
        })
      }

      // top part is scrolled, but not all the height of header (is in range)
      if ( (scroll.y > header.topHeight) && (scroll.y < header.bottomPoint) ){
        var normalized2 = Math.floor(normalize(scroll.y, header.bottomPoint, header.topHeight, 0, 98))
        var reverseNormalized2 = (100 - normalized2) * -1

        header.bottomContainer.css({
          "transform": 'translate3d(0,'+ reverseNormalized2 +'%,0)',
        })
      }

      if ( scroll.y > header.bottomPoint ){
        // set max on fast scroll
        header.bottomContainer.css({
          "transform": 'translate3d(0,-'+ targetBottomScroll +'%,0)',
        })
      }

      if ( scroll.y > header.firstSectionHeight ){
        // set max on fast scroll
        header.bottomContainer.css({
          "transform": 'translate3d(0,-'+ targetBottomScroll +'%,0)',
        })

        header.container.addClass(fixedClass);

        if ( scroll.direction === "up" ){
          header.container.addClass(visibleClass);
        } else {
          header.container.removeClass(visibleClass);
        }
      } else {
        header.container.removeClass(fixedClass);
        header.container.removeClass(visibleClass);
      }

    }
  }

  ////////////////////
  // HAMBURGER TOGGLER
  ////////////////////
  // disable / enable scroll by setting negative margin to page-content eq. to prev. scroll
  // this methods helps to prevent page-jumping on setting body height to 100%
  function disableScroll() {
    scroll.lastForBodyLock = _window.scrollTop();
    scroll.blocked = true
    $('.page__content').css({
      'margin-top': '-' + scroll.lastForBodyLock + 'px'
    });
    $('body').addClass('body-lock');
  }

  function enableScroll(isOnload) {
    scroll.blocked = false
    scroll.direction = "up" // keeps header
    $('.page__content').css({
      'margin-top': '-' + 0 + 'px'
    });
    $('body').removeClass('body-lock');
    if ( !isOnload ){
      _window.scrollTop(scroll.lastForBodyLock)
      scroll.lastForBodyLock = 0;
    }
  }

  function blockScroll(isOnload) {
    if ( isOnload ){
      enableScroll(isOnload)
      return
    }
    // if ($('[js-hamburger]').is('.is-active')) {
    //   disableScroll();
    // } else {
    //   enableScroll();
    // }
  };

  _document.on('click', '[js-hamburger]', function(){
    // $(this).toggleClass('is-active');
    // $('.mobile-navi').toggleClass('is-active');
    //
    // blockScroll();
  });

  function closeMobileMenu(isOnload){
    // $('[js-hamburger]').removeClass('is-active');
    // $('.mobile-navi').removeClass('is-active');
    //
    // blockScroll(isOnload);
  }


  function closeMobileNavi(fromPjax){
    if ( fromPjax === true ){
      close();
      return
    }

    // resize events
    if ( getWindowWidth() >= 576 ){
      close();
    }

    function close(){
      if ( !$.magnificPopup.instance.currItem ) return

      var isNaviOpened = $.magnificPopup.instance.currItem.src === "#mobile-navi"
      if ( isNaviOpened ){
        $.magnificPopup.close()
      }
    }
  }

  // SET ACTIVE CLASS IN HEADER
  // * could be removed in production and server side rendering when header is inside barba-container
  function updateHeaderActiveClass(){
    $('.header__menu li').each(function(i,val){
      if ( $(val).find('a').attr('href') == window.location.pathname.split('/').pop() ){
        $(val).addClass('is-active');
      } else {
        $(val).removeClass('is-active')
      }
    });
  }


  /////////////
  // HEADER SEARCH
  /////////////
  _document
    .on('click', '[js-header-search-toggle]', function(){
      var $container = $(this).closest('[js-header-search]')
      $container.toggleClass('is-active');

      if ( $container.is(".is-active") ){
        $container.find("input").focus()
      }
    })

  /////////////
  // MENU HIDER
  /////////////
  function menuHider(){
    var wWidth = getWindowWidth();
    if ( wWidth <= 576 ) return
    var $menu = $('[js-menu-hider]');
    if ( $menu.length === 0 ) return
    var $menuTarget = $menu.find('[js-menu-hider-target]')
    if ( $menuTarget.length === 0 ) return

    var $menuList = $menu.find('li');

    $menuList.each(function(i, li){
      var $li = $(li);
      var hideOnData = $li.data('hide-on');

      if ( wWidth <= hideOnData ){
        $li.appendTo($menuTarget)
      } else {
        $li.insertBefore($menu.find('.header-more'))
      }
    })
  }

  // clean symbols on resize(responsive)
  function formatTextsResponsive(){
    var wWidth = getWindowWidth();
    var $elements = $('[js-clear-last-sybmol]');
    if ( $elements.length === 0 ) return

    $elements.each(function(i, el){
      var $el = $(el);
      var dataOn = $el.data('on');
      var dataSymbol = $el.data('symbol');
      var $elHtml = $el.html()
      var symbolIndex = $elHtml.indexOf(dataSymbol)

      if ( wWidth <= dataOn ){
        if ( symbolIndex === -1) return
        $el.html($elHtml.substring(0,symbolIndex))
      } else {
        if ( symbolIndex === -1){
          $el.html($elHtml + dataSymbol)
        }
      }
    })
  }


  // FOOTER
  function setFooterMargin(){
    var $col = $('[js-footer-col-margin]');
    if ( $col.length === 0 ) return

    var wWdidth = getWindowWidth();
    if ( (wWdidth <= 1200) && (wWdidth >= 600) ){
      var dataTargetSibling = $col.data('target-sibling');
      var dataTargetMain = $col.data('target-main');
      var $targetSibling = $(dataTargetSibling);
      var $targetMain = $(dataTargetMain);
      var targetSiblingHeight = $targetSibling.outerHeight();
      var targetMainHeight = $targetMain.outerHeight();

      var heightDiff = Math.abs(targetMainHeight - targetSiblingHeight)

      $col.css({
        'margin-top': '-'+heightDiff+'px'
      })
    } else {
      $col.css({'margin-top': 0})
    }

  }

  /***************
  * PAGE SPECIFIC *
  ***************/

  // set .page__content offset because of fixed header
  function setPageOffset(){
    var $header = $('.header');
    var headerHeight = $header.height()
    var $page = $('.page__content');

    $page.css({
      'padding-top': headerHeight
    })
  }

  _document
    .on('click', '[js-play-audio]', function(){
      var $this = $(this)
      var $audio = $this.find("audio");
      var audioPlayer = $audio.get(0);
      var isPlaying = $this.is(".is-playing");

      // play/stop toggle
      if ( !isPlaying ){
        $this.addClass("is-playing");
        audioPlayer.play();
      } else {
        $this.removeClass("is-playing");
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      }

      $audio.bind("ended", function(){
        $this.removeClass("is-playing");
      });
    })


  /**********
  * PLUGINS *
  **********/


  //////////
  // SLIDERS
  //////////
  function initSliders(){

    // HOMEPAGE SLIDERS
    new Swiper('[js-swiper-hero-promo]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "swiper-slide",
      direction: 'horizontal',
      loop: true,
      watchOverflow: false,
      setWrapperSize: false,
      spaceBetween: 0,
      slidesPerView: 1,
      // loop: true,
      normalizeSlideIndex: true,
      // centeredSlides: true,
      freeMode: false,
      // effect: 'fade',
      autoplay: {
        delay: 5000,
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      }
    })

    var heroChooser = new Swiper('[js-swiper-hero-chooser]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "swiper-slide",
      direction: 'horizontal',
      watchOverflow: false,
      setWrapperSize: false,
      slidesPerView: 1,
      loop: true,
      normalizeSlideIndex: true,
      freeMode: false,
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
    })

    _document
      .on('click', '[js-refresh-slider]', function(){
        var $btn = $(this);
        $btn.addClass('is-refreshing');
        setTimeout(function(){
          $btn.removeClass("is-refreshing");
        }, 250)

        // recommended to preload some images in initial markup

        // TODO - ajax load
        heroChooser.appendSlide([
          `<div class="chooser-slide swiper-slide swiper-slide-active" data-swiper-slide-index="1" style="width: 384px; opacity: 1; transform: translate3d(-768px, 0px, 0px); transition-duration: 0ms;">
            <div class="chooser-slide__content">
              <div class="chooser-slide__title">Настольные часы Hermle 01093</div>
              <div class="chooser-slide__actions">
                <div class="chooser-slide__price price">
                  <div class="price__newprice">19 800 <span class="r-mark">₽</span></div>
                  <div class="price__oldprice">28 000 ₽</div>
                </div>
              </div>
            </div>
            <div class="chooser-slide__image hero-image hero-image--smaller">
              <div class="hero-image__main"><img src="img/sale_1.png" srcset="img/sale_1@2x.png 2x"></div>
              <div class="hero-image__ghost"><img src="img/sale_1.png" srcset="img/sale_1@2x.png 2x"></div>
            </div>
          </div>`,
        ]);

        // trigger slide next
        heroChooser.slideNext()

      })

    var $featured = $('[js-swiper-featured]');

    if ( $featured.length > 0 ){
      $featured.each(function(i, slider){

        // variables that does change per slide
        var slidesPerView = $(slider).data("slides-per-view") || 4

        new Swiper(slider, {
          wrapperClass: "swiper-wrapper",
          slideClass: "swiper-slide",
          direction: 'horizontal',
          loop: false,
          watchOverflow: true,
          setWrapperSize: false,
          spaceBetween: 24,
          slidesPerView: slidesPerView,
          normalizeSlideIndex: true,
          freeMode: false,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          breakpoints: {
            // when window width is <= 320px
            375: {

            },
            // when window width is <= 480px
            576: {
              slidesPerView: 1,
              spaceBetween: 0
            },
            768: {
              slidesPerView: 2
            },
            992: {
              slidesPerView: 3
            }
          }
        })
      })
    }
    new Swiper('[js-swiper-sale]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "swiper-slide",
      direction: 'horizontal',
      loop: false,
      watchOverflow: true,
      setWrapperSize: false,
      spaceBetween: 24,
      slidesPerView: 6,
      normalizeSlideIndex: true,
      freeMode: true,
      breakpoints: {
        // when window width is <= 320px
        375: {

        },
        // when window width is <= 480px
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3
        },
        992: {
          slidesPerView: 4
        },
        1200: {
          slidesPerView: 5
        }
      }
    })

  }

  //////////
  // MODALS
  //////////

  function initPopups(){
    // Magnific Popup
    var closeMarkup = '<button title="%title%" class="mfp-close"><svg class="ico ico-mono-close"><use xlink:href="img/sprite-mono.svg#ico-mono-close"></use></svg></button>'

    var startWindowScroll = 0;
    $('[js-popup]').magnificPopup({
      type: 'inline',
      fixedContentPos: true,
      fixedBgPos: true,
      overflowY: 'auto',
      closeBtnInside: true,
      preloader: false,
      midClick: true,
      removalDelay: 300,
      mainClass: 'popup-buble',
      closeMarkup: closeMarkup,
      callbacks: {
        beforeOpen: function() {
          startWindowScroll = _window.scrollTop();
          // $('html').addClass('mfp-helper');
        },
        close: function() {
          // $('html').removeClass('mfp-helper');
          _window.scrollTop(startWindowScroll);
        }
      }
    });

    $('[js-popup-gallery]').magnificPopup({
  		delegate: 'a',
  		type: 'image',
  		tLoading: 'Загрузка #%curr%...',
  		mainClass: 'popup-buble',
      closeMarkup: closeMarkup,
  		gallery: {
  			enabled: true,
  			navigateByImgClick: true,
  			preload: [0,1]
  		},
      zoom: {
        enabled: true,
        duration: 300, // also to be changed in CSS
        opener: function(element) {
          return element.find('img');
        }
      },
  		image: {
  			tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
  		}
  	});
  }

  function closeMfp(){
    $.magnificPopup.close();
  }

  //////////
  // LAZY LOAD
  //////////
  function initLazyLoad(){

    var $lazy = _document.find('[js-lazy]');
    if ($lazy.length === 0 ) return

    var fadeTimeout = 250

    $lazy.Lazy({
      threshold: 400, //Amount of pixels below the viewport, in which all images gets loaded before the user sees them.
      enableThrottle: true,
      throttle: 100,
      scrollDirection: 'vertical',
      // effect: 'fadeIn',
      // effectTime: fadeTimeout,
      // visibleOnly: true,
      onError: function(element) {
          console.log('error loading ' + element.data('src'));
      },
      beforeLoad: function(element){
        // element.attr('style', '')
      },
      afterLoad: function(element){
        if ( browser.isIe ){
          picturefill(); // ie pollyfil
        }
        animateLazy(element)
      }
    });

  }

  ////////////
  // UI
  ////////////

  // textarea autoExpand
  _document
    .one('focus.autoExpand', '.ui-group textarea', function(){
        var savedValue = this.value;
        this.value = '';
        this.baseScrollHeight = this.scrollHeight;
        this.value = savedValue;
    })
    .on('input.autoExpand', '.ui-group textarea', function(){
        var minRows = this.getAttribute('data-min-rows')|0, rows;
        this.rows = minRows;
        rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 17);
        this.rows = minRows + rows;
    });

  // Masked input
  function initMasks(){
    $("[js-dateMask]").mask("99.99.99",{placeholder:"ДД.ММ.ГГ"});
    $("[js-phone-mask]").mask("+7 (000) 000-0000");
  }

  // selectric
  function initSelectric(){
    var $select = $('[js-select]')
    if ( $select.length === 0 ) return

    $select.selectric({
      maxHeight: 300,
      arrowButtonMarkup: '<b class="button"><svg class="ico ico-select-down"><use xlink:href="img/sprite.svg#ico-select-down"></use></svg></b>',

      onInit: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').html($elm.attr('placeholder'));
      },
      onBeforeOpen: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').data('value', $wrapper.find('.label').html()).html($elm.attr('placeholder'));
      },
      onBeforeClose: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').html($wrapper.find('.label').data('value'));
      }
    });
  }

  ////////////
  // SCROLLMONITOR
  ////////////
  function initScrollMonitor(fromPjax){

    // REVEAL animations
    var $reveals = $('[js-reveal]');

    if ( $reveals.length > 0 ){
      var animatedClass = "is-animated";
      var pageTransitionTimeout = 500

      $('[js-reveal]').each(function(i, el){
        var type = $(el).data('type') || "enterViewport"

        // onload type
        if ( type === "onload" ){
          var interval = setInterval(function(){
            // if (!preloaderActive){
              if ( fromPjax ){
                // wait till transition overlay is fullyanimated
                setTimeout(function(){
                  $(el).addClass(animatedClass);
                  clearInterval(interval)
                }, pageTransitionTimeout)
              } else {
                $(el).addClass(animatedClass);
                clearInterval(interval)
              }
            // }
          }, 100)
          return
        }

        // halfy enter
        if ( type === "halflyEnterViewport"){
          var scrollListener = throttle(function(){
            var vScrollBottom = _window.scrollTop() + _window.height();
            var elTop = $(el).offset().top
            var triggerPoint = elTop + ( $(el).height() / 2)

            if ( vScrollBottom > triggerPoint ){
              $(el).addClass(animatedClass);
              window.removeEventListener('scroll', scrollListener, false); // clear debounce func
            }
          }, 100)

          window.addEventListener('scroll', scrollListener, false);
          return
        }

        // regular (default) type
        var elWatcher = scrollMonitor.create( $(el) );
        elWatcher.enterViewport(throttle(function() {
          $(el).addClass(animatedClass);
        }, 100, {
          'leading': true
        }));

      });

    }

    // wow (regular animations)
    // depreciated in favour of AOS
    var $wows = $('.wow');
    if ( $wows.length > 0 ){
      // $('.wow').each(function(i, el){
      //
      //   var elWatcher = scrollMonitor.create( $(el) );
      //
      //   var delay;
      //   if ( getWindowWidth() <= 767 ){
      //     delay = 0
      //   } else {
      //     delay = $(el).data('animation-delay');
      //   }
      //
      //   var animationClass = $(el).data('animation-class') || "wowFadeUp"
      //
      //   var animationName = $(el).data('animation-name') || "wowFade"
      //
      //   elWatcher.enterViewport(throttle(function() {
      //     $(el).addClass(animationClass);
      //     $(el).css({
      //       'animation-name': animationName,
      //       'animation-delay': delay,
      //       'visibility': 'visible'
      //     });
      //   }, 100, {
      //     'leading': true
      //   }));
      // });
    }

  }

  ////////////////
  // FORM VALIDATIONS
  ////////////////

  // jQuery validate plugin
  // https://jqueryvalidation.org
  function initValidations(){
    // GENERIC FUNCTIONS
    var validateErrorPlacement = function(error, element) {
      error.addClass('ui-input__validation');
      error.appendTo(element.parent("div"));
    }
    var validateHighlight = function(element) {
      $(element).addClass("has-error");
    }
    var validateUnhighlight = function(element) {
      $(element).removeClass("has-error");
    }
    var validateSubmitHandler = function(form) {
      $(form).addClass('loading');
      $.ajax({
        type: "POST",
        url: $(form).attr('action'),
        data: $(form).serialize(),
        success: function(response) {
          $(form).removeClass('loading');
          var data = $.parseJSON(response);
          if (data.status == 'success') {
            // do something I can't test
          } else {
              $(form).find('[data-error]').html(data.message).show();
          }
        }
      });
    }

    var validatePhone = {
      required: true,
      normalizer: function(value) {
          var PHONE_MASK = '+X (XXX) XXX-XXXX';
          if (!value || value === PHONE_MASK) {
              return value;
          } else {
              return value.replace(/[^\d]/g, '');
          }
      },
      minlength: 11,
      digits: true
    }

    // REGISTRATION FORM
    $("[js-validate-registration]").validate({
      errorPlacement: validateErrorPlacement,
      highlight: validateHighlight,
      unhighlight: validateUnhighlight,
      submitHandler: validateSubmitHandler,
      rules: {
        last_name: "required",
        first_name: "required",
        email: {
          required: true,
          email: true
        },
        password: {
          required: true,
          minlength: 6,
        }
        // phone: validatePhone
      },
      messages: {
        last_name: "Заполните это поле",
        first_name: "Заполните это поле",
        email: {
          required: "Заполните это поле",
          email: "Email содержит неправильный формат"
        },
        password: {
          required: "Заполните это поле",
          email: "Пароль мимимум 6 символов"
        },
        // phone: {
        //     required: "Заполните это поле",
        //     minlength: "Введите корректный телефон"
        // }
      }
    });

    // callback form
    $("[js-validate-callback]").validate({
      errorPlacement: validateErrorPlacement,
      highlight: validateHighlight,
      unhighlight: validateUnhighlight,
      submitHandler: validateSubmitHandler,
      rules: {
        name: "required",
        phone: validatePhone
      },
      messages: {
        name: "Заполните это поле",
        phone: {
          required: "Заполните это поле",
          minlength: "Введите корректный телефон"
        }
      }
    });



    // when multiple forms share functionality

    // var subscriptionValidationObject = {
    //   errorPlacement: validateErrorPlacement,
    //   highlight: validateHighlight,
    //   unhighlight: validateUnhighlight,
    //   submitHandler: validateSubmitHandler,
    //   rules: {
    //     email: {
    //       required: true,
    //       email: true
    //     }
    //   },
    //   messages: {
    //     email: {
    //       required: "Fill this field",
    //       email: "Email is invalid"
    //     }
    //   }
    // }

    // call/init
    // $("[js-subscription-validation]").validate(subscriptionValidationObject);
    // $("[js-subscription-validation-footer]").validate(subscriptionValidationObject);
    // $("[js-subscription-validation-menu]").validate(subscriptionValidationObject);
  }

  //////////
  // BARBA PJAX
  //////////

  Barba.Pjax.Dom.containerClass = "page";
  var transitionInitElement

  var FadeTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise
        .all([this.newContainerLoading, this.fadeOut()])
        .then(this.fadeIn.bind(this));
    },

    fadeOut: function() {
      var _this = this;
      var $oldPage = $(this.oldContainer)
      var $newPage = $(this.newContainer);
      var deferred = Barba.Utils.deferred();

      TweenLite.to($oldPage, .5, {
        opacity: 0,
        ease: Power1.easeIn,
        onComplete: function() {
          deferred.resolve();
        }
      });

      return deferred.promise
    },

    fadeIn: function() {
      var _this = this;
      var $oldPage = $(this.oldContainer)
      var $newPage = $(this.newContainer);

      $(this.oldContainer).hide();

      $newPage.css({
        visibility : 'visible',
        opacity : 0
      });

      TweenLite.to(window, .15, {
        scrollTo: {y: 0, autoKill: false},
        ease: easingSwing
      });

      TweenLite.to($newPage, .5, {
        opacity: 1,
        ease: Power1.easeOut,
        onComplete: function() {
          triggerBody()
          _this.done();
        }
      });

    }
  });

  // set barba transition
  Barba.Pjax.getTransition = function() {
    if ( transitionInitElement.attr('data-transition') ){
      var transition = transitionInitElement.data('transition');
      // console.log(transition)
      if ( transition === "project" ){
        return ProjectTransition
      }
    }
    return FadeTransition;
  };

  Barba.Prefetch.init();
  Barba.Pjax.start();

  // initialized transition
  Barba.Dispatcher.on('linkClicked', function(el) {
    transitionInitElement = el instanceof jQuery ? el : $(el)
  });

  // The new container has been loaded and injected in the wrapper.
  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container, newPageRawHTML) {
    pageReady(true);
  });

  // The transition has just finished and the old Container has been removed from the DOM.
  Barba.Dispatcher.on('transitionCompleted', function(currentStatus, oldStatus) {
    pageCompleated(true);
  });

  // some plugins get bindings onNewPage only that way
  function triggerBody(){
    $(window).scroll();
    $(window).resize();
  }

  //////////
  // DEVELOPMENT HELPER
  //////////
  function setBreakpoint(){
    var wHost = window.location.host.toLowerCase()
    var displayCondition = wHost.indexOf("localhost") >= 0 || wHost.indexOf("surge") >= 0
    if (displayCondition){
      var wWidth = getWindowWidth();
      var wHeight = _window.height()

      var content = "<div class='dev-bp-debug'>"+wWidth+" x "+wHeight+"</div>";

      $('.page').append(content);
      setTimeout(function(){
        $('.dev-bp-debug').fadeOut();
      },1000);
      setTimeout(function(){
        $('.dev-bp-debug').remove();
      },1500)
    }
  }

});


// HELPERS and PROTOTYPE FUNCTIONS

// LINEAR NORMALIZATION
function normalize(value, fromMin, fromMax, toMin, toMax) {
  var pct = (value - fromMin) / (fromMax - fromMin);
  var normalized = pct * (toMax - toMin) + toMin;

  //Cap output to min/max
  if (normalized > toMax) return toMax;
  if (normalized < toMin) return toMin;
  return normalized;
}

// get window width (not to forget about ie, win, scrollbars, etc)
function getWindowWidth(){
  return window.innerWidth
}

// animate lazy class toggler
function animateLazy(element){
  var fadeTimeout = 250
  var $scaler = element.closest('.scaler')
  $scaler.addClass('is-loaded');

  if ( $scaler.is('.no-bg-onload') ){
    setTimeout(function(){
      $scaler.addClass('is-bg-hidden');
    }, fadeTimeout)
  }
}
