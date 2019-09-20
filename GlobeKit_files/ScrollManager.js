"use strict";

var Site = Site || {};
Site.Section = function() {
    var self = this;

    this.div = null;
    this.contentDiv = null;
    this.titleHeader = null;
    this.paginationItem = null;

    this.titleAnimatedIn = false;
    this.splitText = null;
    this.rect = null;
    this.manager = null;

    this.init = function(scrollManager, copySectionDiv) {
        this.div = copySectionDiv;
        this.manager = scrollManager;
        this.contentDiv = copySectionDiv.getElementsByClassName("copy-content")[0];
        this.paginationItem = new Site.Section.PaginationItem().init();

        this.paginationItem.link.onclick = function(e){
            self.manager.didSelectSection(self);
            e.preventDefault();
            return false;
        };

        var titleHeaders = copySectionDiv.getElementsByTagName("h1");
        if (titleHeaders.length > 0) {
            this.titleHeader = titleHeaders[0];
            this.titleHeader.style.visibility = "hidden";
            this.splitText = new SplitText(this.titleHeader, {type:"chars"});
            this.splitText.split({type: "chars"});
        }

        this.updateRect();
        return this;
    };

    this.updateRect = function() {
        this.rect = {
            top: this.div.offsetTop,
            height: this.div.offsetHeight
        };
    };

    this.animateIn = function() {
        if (!this.splitText) {
            return;
        }

        this.animatedIn = true;
        this.titleHeader.className += " in";
        this.titleHeader.style.visibility = "";

        var t = new TimelineLite();
        t.staggerFrom(this.splitText.chars, 0.8, {
                    opacity: 0, rotationX: -120, rotationZ: -5, delay: 0.1, transformOrigin: "0% 50% -60", ease: Expo.easeOut
                }, 0.02, "+=0");
    };

    this.select = function() {
        this.className = "selected";
        this.paginationItem.select();
    };

    this.deselect = function() {
        this.className = "";
        this.paginationItem.deselect();
    };
};

Site.Section.PaginationItem = function() {
    this.item = null;
    this.link = null;
    this.span = null;

    this.init = function() {
        this.item = document.createElement("li");
        this.link = document.createElement("a");
        this.span = document.createElement("span");
        this.item.appendChild(this.link);
        this.link.appendChild(this.span);
        return this;
    };

    this.select = function() {
        this.item.className = "selected";
    };

    this.deselect = function() {
        this.item.className = "";
    };
};

Site.PaginationText = function() {
    var tensColumn = null;
    var onesColumn = null;

    this.currentIndex = 0;

    this.init = function() {
        tensColumn = document.getElementById("page-count-tens").getElementsByClassName("page-numbers")[0];
        onesColumn = document.getElementById("page-count-ones").getElementsByClassName("page-numbers")[0];
        return this;
    };

    this.setIndex = function(index) {
        if (this.currentIndex != index) {
            var translate = index * -20.0;
            onesColumn.style.transform = "translate3d(0, " + translate + "vw, 0)";
            this.currentIndex = index;
        }
    };
};

Site.ScrollManager = function() {
    var self = this;

    var list = null;
    var content = null;
    // var sections = null;
    var textBlocks = null;
    var selectedSection = null;
    var paginationText = null;

    this.sections = [];
    var scrollAnim = null;

    this.sectionChangeSignal = new BK.Signal();

    this.init = function() {
        paginationText = new Site.PaginationText().init();
        content = document.getElementById("scrolling-content");

        var copySectionDivs = document.getElementsByClassName("copy-section");
        copySectionDivs = Array.prototype.slice.call(copySectionDivs);
        if (Site.isMobile) {
            copySectionDivs.pop();
        }

        var paginationList = document.getElementById("pagination-dots");

        for (var i=0; i<copySectionDivs.length; i++) {
            var copySectionDiv = copySectionDivs[i];
            var section = new Site.Section().init(this, copySectionDiv);
            paginationList.appendChild(section.paginationItem.item);
            this.sections.push(section);
        }

        return this;
    };

    this.windowDidScroll = function(){
        var windowTop = window.pageYOffset;
        var windowMid = windowTop + Site.wh * 0.5;
        var windowBot = windowTop + Site.wh;

        var deltas = [];
        for (i=0; i<this.sections.length; i++){
            var section = this.sections[i];
            var itemMid = section.rect.top + section.rect.height * 0.5;
            var delta = Math.abs(itemMid - windowMid);
            delta = Math.max(delta - Site.wh * 0.25, 0.0);
            section.div.style.opacity = Math.pow(1.0 - (delta / (Site.wh * 0.5)), 4.0);
            deltas.push({section: section, delta: delta});
        }

        deltas.sort(function(a, b) {
            return a.delta - b.delta
        });

        var newSelectedSection = deltas[0].section;
        if (newSelectedSection != selectedSection) {
            if (selectedSection) selectedSection.deselect();
            selectedSection = newSelectedSection;
            selectedSection.select();

            if (!selectedSection.animatedIn) {
                selectedSection.animateIn();
            }

            var selectedIndex = this.sections.indexOf(newSelectedSection);
            paginationText.setIndex(selectedIndex);

            this.sectionChangeSignal.fire(selectedIndex);
        }
    };

    this.selectSection = function(section) {
        if (section != selectedSection) {
            if (selectedSection) selectedSection.deselect();
            selectedSection = section;
            section.select();

            if (!section.animatedIn) section.animateIn();
            var index = this.sections.indexOf(section);
            paginationText.setIndex(index);
        }
    };

    this.didSelectSection = function(section) {
        if (scrollAnim) scrollAnim.stop();
        scrollAnim = new Animation(0.2);

        var scrollStart = window.pageYOffset;
        var scrollEnd = section.rect.top + section.rect.height * 0.5 - Site.wh * 0.5;
        var scrollDelta = scrollEnd - scrollStart;

        scrollAnim.updateFn = function(value) {
            var v = BK.Ease.outSine(value);
            window.scrollTo(0, scrollStart + scrollDelta * v);
        }
        scrollAnim.completeFn = function(valueWhenCompleted) {
            scrollAnim = null;
        }

        scrollAnim.start();
    };

    this.updateItemRects = function(){
        for (i=0; i<this.sections.length; i++){
            this.sections[i].updateRect();
        }
    };

    this.getScrollPercent = function(){
        if (!content) return 0.0;
        let h = content.offsetHeight - Site.wh;
        var p = window.pageYOffset / h;
        return p;
    };

    this.mouseWheelHide = function(ev) {
        document.getElementById("mouse-wheel").classList.add("hidden");
        window.removeEventListener("scroll", this.mouseWheelHide);
    };
};