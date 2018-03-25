/* Copyright (c) 2018 g5wx - MIT license */

var SlickImage = {

    init: function() {

        this.originalSource = newImage.src;
        this.imageGenerated = false;

        // Settings
        this.downloadQuality = 1;
        this.downloadName    = 'filtered_';

        // File upload
        this.fileUpload();
        
        // Image styling
        this.styleImage();

        // Get mode
        this.getMode();

        // Dark mode
        this.setMode();

        // User settings
        this.userSettings();

        // Generate image
        this.generateImage();

        // Generate markup
        this.generateMarkup();
        
    },

    // File upload
    fileUpload: function() {

        var self  = this;
        var index = 0;

        uploadImage.addEventListener('change', function() {

            var reader  = new FileReader();
            var file    = uploadImage.files[0];

            reader.addEventListener('load', function() {

                newImage.src = reader.result;
                oldImage.src = reader.result;
                SlickImage.originalSource = reader.result; // Save original source for controls reseting

                // Reposition the preview box
                var clientImage = new Image();
                clientImage.src = reader.result;
                clientImage.onload = function() {
                    self.previewReposition(this.width, this.height);
                };

            }, false);

            if (file) {
                reader.readAsDataURL(file);
                SlickImage.downloadName = file.name.substring(0, file.name.lastIndexOf('.')); // Defines the image download name

                // Used only for first image upload
                if (index === 0) {
                    introLabel.style.display = 'none';
                    introLabel.classList.remove('active');
                    panel.classList += 'active';
                }
            }

            index++;

        }, false);

    },

    previewReposition: function(newImgWidth, newImgHeight) {
        
        // Calculate values for preview box top margin and limit of the images min/max widths
        var ratio  = newImgHeight / newImgWidth;
        var scaled = ratio * parseInt(previewBox.style.maxWidth, 10);
        var margin = (window.innerHeight - scaled) / 2;
        var limit  = (window.innerHeight * 80) / 100 + 'px';

        // Set new min/max width to the old and new image
        newImage.style.maxWidth   = limit;
        newImage.style.minWidth   = limit;
        oldImage.style.maxWidth   = limit;
        oldImage.style.minWidth   = limit;

        // Apply max width and top margin to preview box
        previewBox.style.maxWidth = limit;
        previewBox.style.marginTop = margin + 'px';

        // Reinitialize before/after image slider
        this.slideElement(slideImage, oldImage.parentNode, previewBox.offsetWidth, 'width');

    },

    // Image styling
    styleImage: function() {

        // Initialize panel (todo: move this to another more appropriate section)
        this.slideElement(slidePanel, panel, panel.offsetWidth, 'left', true);

        var reseted = false;
        var inputs  = document.getElementsByClassName('adjust');
        var filters = [];

        // Loop thro all availabe inputs
        for (var i = 0; i < inputs.length; i++) {
            
            var input = inputs[i];
            
            // Apply CSS to preview image
            input.addEventListener('input', function() {
                
                filters = (reseted) ? [] : filters;
                reseted = false;

                var attr    = this.id;
                var unit    = this.getAttribute('data-unit') || '';
                var val     = this.value;
                var initVal = this.getAttribute('data-init-val');

                // Apply CSS filters
                if (attr.indexOf('filter') > -1) {

                    var prop   = attr.split('_')[1];
                    var filter = attr.split('_')[1] + '(' + val + unit + ')';
                    filters[prop] = filter;
                    var combined  = '';

                    // Reset filters if value is equal as the init
                    if (val === initVal) filters[prop] = '';

                    // Combine and update filters
                    for (var key in filters) {
                        if (filters.hasOwnProperty(key)) {
                            combined += filters[key] + ' ';
                        }
                    }
                    
                    // Apply combined filters to the image
                    newImage.style.filter = combined;
                    
                }
                
                // Apply other CSS styles (prepared for extending to other CSS rules)
                else {
                    newImage.style[attr] = val + unit;
                }
                
                // Tooltip
                if (input.getAttribute('data-unit')) {

                    var indicator = this.parentNode.getElementsByClassName('value')[0] || '';
                    indicator.textContent = val + unit;

                }

            }, false);

        }

        // Reset controls and filters
        resetAll.addEventListener('click', function() {

            // Reset image filter styles and controls form
            newImage.style.filter = '';
            if (SlickImage.imageGenerated) {
                newImage.src = SlickImage.originalSource;
                SlickImage.imageGenerated = false;
            }
            controls.reset();

            // Reset tooltip values
            var inputs = controls.getElementsByClassName('adjust');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].parentNode.getElementsByClassName('value')[0].textContent = inputs[i].value + inputs[i].getAttribute('data-unit');
            }

            return reseted = true;
        }, false);

        // Auto adjustments
        var adjusters = document.getElementsByName('autoAdjust');
        for (var i = 0; i < adjusters.length; i++) {
            var adjuster = adjusters[i];

            adjuster.addEventListener('click', function() {

                // Apply CSS to image
                var val = this.value;
                newImage.style.filter = val;

                // Push to filters array
                filters = [];
                var props = val.split(' ');
                for (var i = 0; i < props.length; i++) {
                    var prop = props[i].split('(')[0];
                    var val  = props[i].split('(')[1].replace(')','');
                    filters[prop] = prop + '(' + val + ')';
                }

                // Reset all controls to init values
                for (var i = 0; i < inputs.length; i++) {
                    var initVal = inputs[i].getAttribute('data-init-val');
                    var unit    = inputs[i].getAttribute('data-unit') || '';
                    inputs[i].value = initVal;
                    inputs[i].parentNode.getElementsByClassName('value')[0].textContent = initVal + unit;
                }

                // Adjust controls used in the adjustment filters set
                for (key in props) {
                    
                    for (var i = 0; i < inputs.length; i++) {
                        
                        var inputId = inputs[i].id.replace('filter_', '');
                        var adjProp = props[key].split('(')[0];

                        if (inputId === adjProp) {

                            var newVal = props[key].split('(')[1].replace(')','');
                            inputs[i].value = parseFloat(newVal);
                            inputs[i].parentNode.getElementsByClassName('value')[0].textContent = newVal;
                            
                        }
                    }
                }

                return filters;

            }, false);
        }

    },

    slideElement: function(el, target, targetWidth, cssProp, isPanel) {

        var offsetX = 0;
        var active  = false;

        el.addEventListener('mousedown', function(e) {
            active = true;
            offsetX = el.offsetLeft - e.clientX;
        }, true);

        document.addEventListener('mousemove', function(e) {
            if (active) {
                var position = e.clientX + offsetX;
                e.preventDefault();

                if (((isPanel) ? position - 30 : position) > -1 && position < targetWidth) {
                    target.style[cssProp] = ((isPanel) ? position - targetWidth : position) + 'px';
                    el.style.left  = position + 'px';
                }
            }
        }, true);
        
        document.addEventListener('mouseup', function() {
            active = false;
        }, true);

    },

    // Get mode
    getMode: function() {

        var mode = localStorage.getItem('SlickImageMode');
        if (mode === 'dark') {
            document.body.classList = '';
            document.body.classList += 'dark';
            darkMode.checked = true;
        }

    },

    // Set mode
    setMode: function() {

        darkMode.addEventListener('change', function() {
            document.body.classList = '';
            if (this.checked) {
                document.body.classList += 'dark';
                localStorage.setItem('SlickImageMode', 'dark');
            } else {
                document.body.classList += 'light';
                localStorage.setItem('SlickImageMode', 'light');
            }
        }, false);

    },

    // User settings
    userSettings: function() {

        // Image download quality
        var qualityInputs = document.getElementsByName('imageQuality');
        for (var i = 0; i < qualityInputs.length; i++) {

            var input = qualityInputs[i];
            input.addEventListener('change', function() {
                SlickImage.downloadQuality = parseFloat(this.value);
            }, false);

        }

    },

    // Generate image
    generateImage: function() {

        var index = 1;

        // Generate canvas and download image
        generate.addEventListener('click', function() {
            
            var ctx = canvas.getContext('2d');
            canvas.width  = newImage.naturalWidth;
            canvas.height = newImage.naturalHeight;
            ctx.filter    = newImage.style.filter;
            ctx.drawImage(newImage, 0, 0);

            this.download = SlickImage.downloadName + '_filtered_' + index;
            this.href = canvas.toDataURL('image/jpeg', SlickImage.downloadQuality);

            index++;

            return SlickImage.imageGenerated = true;

        }, false);

    },

    // Markup generator
    generateMarkup: function() {

        openMarkup.addEventListener('click', function() {

            markup.classList += 'active';

            if (newImage.style.filter !== '') {
                nono.style.display = 'none';
                allGood.style.display = 'block';
                cssFilters1.textContent = newImage.style.filter;
                cssFilters2.textContent = newImage.style.filter;
            } else {
                nono.style.display = 'block';
                allGood.style.display = 'none';
            }
            
        }, false);

        closeMarkup.addEventListener('click', function() {
            markup.classList.remove('active');
            cssFilters1.textContent = '';
            cssFilters2.textContent = '';
        }, false);

    }

}

// Start
window.onload = function() {
    SlickImage.init();
}