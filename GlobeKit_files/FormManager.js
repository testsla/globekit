"use strict";

var Site = Site || {};
Site.FormManager = function() {
    var self = this;

    var form = null;
    var requestForm = null;
    var successMessage = null;
    var splitText = null;
    var nameInput = null;
    var companyInput = null;
    var emailInput = null;
    var needsInput = null;
    var errorMessage = null;
    var inputs = [];

    this.requestButton = null;
    this.formSubmitSignal = new BK.Signal();

    this.init = function() {
        form = document.getElementById("form-section");
        requestForm = document.getElementById("request-form");
        this.requestButton = document.getElementById("request");
        this.requestButton.span = this.requestButton.getElementsByTagName("span")[0];
        successMessage = document.getElementById("success-message");
        nameInput = document.getElementById("NAME");
        companyInput = document.getElementById("COMPANY");
        emailInput = document.getElementById("EMAIL");
        needsInput = document.getElementById("NEEDS");
        errorMessage = document.getElementById("error-message");
        inputs.push(nameInput, companyInput, emailInput, needsInput);

        var inputBlocks = document.getElementsByClassName('input-block');
        for (var i = 0; i < inputBlocks.length; i++) {
            var input = inputBlocks[i].getElementsByTagName('input')[0];

            input.addEventListener('focus', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                ev.srcElement.parentElement.classList.add("filled");
            });

            input.addEventListener('blur', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                if(ev.srcElement.value == "" || ev.srcElement.value == null) {
                    // it's empty
                    ev.srcElement.parentElement.classList.remove("filled")
                }
            });
        }

        var textArea = document.getElementById('NEEDS');
        textArea.addEventListener("focus", function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            ev.srcElement.parentElement.classList.add("filled")
        });

        textArea.addEventListener('blur', function(ev) {
            ev.stopPropagation()
            ev.preventDefault();
            if(ev.srcElement.value == "" || ev.srcElement.value == null) {
                // it's empty
                ev.srcElement.parentElement.classList.remove("filled")
            }
        });

        if (Site.isDesktop) {
            successMessage.style.visibility = "hidden";
            splitText = new SplitText(successMessage, {type:"chars"});
            splitText.split({type:"chars"});
        }
    };

    this.showForm = function(section) {
        if (section == 5) {
            form.classList.add("active");
            self.requestButton.classList.add("submit");
            self.requestButton.span.innerHTML = "Submit";
        } else {
            form.classList.remove("active");
            self.requestButton.classList.remove("submit");
            self.requestButton.span.innerHTML = "Request a Quote"
        }
    };

    this.requestFormSubmit = function() {
        var nameID = "entry.1648384019";
        var companyID = "entry.1226040904";
        var emailID = "entry.755399294";
        var needsID = "entry.348093703";

        var baseURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfqgIMyYq42o28HoIQ5PpBE65QNrKhCxYgs52LJ6d3azNKqmg/formResponse?';
        var submitRef = '&submit=6643460394068581655';
        var submitURL = (baseURL + nameID + "=" + nameInput.value + "&" + companyID + "=" + companyInput.value + "&" + emailID + "=" + String(emailInput.value) + "&" + needsID + "=" + needsInput.value + submitRef);

        this.inputsRemoveClass("error");
        this.errorCheck();

        if (nameInput.value != "" && nameInput.value != null && companyInput.value != "" && companyInput.value != null && String(emailInput.value) != "" && String(emailInput.value) != null && needsInput.value != "" && needsInput.value != null) {
            requestForm.action = submitURL;
            requestForm.submit();

            this.resetForm();
            this.successAnimate();

            // TODO: signal
            this.formSubmitSignal.fire();
        }
    };

    this.errorCheck = function() {
        for (i=0; i<inputs.length; i++) {
            if (String(inputs[i].value) == "" || String(inputs[i].value) == null) {
                inputs[i].parentElement.classList.add("error");
            }

            if (inputs[i].parentElement.classList.contains("error")) {
                errorMessage.classList.add("active");
            } else {
                errorMessage.classList.remove("active");
            }
        }
    };

    this.resetForm = function() {
        requestForm.reset();
        this.inputsRemoveClass("filled");
    };

    this.successAnimate = function() {
        // Animate form and requestButton out and success message in
        form.classList.remove("active");
        this.requestButton.classList.add("submitted");
        successMessage.classList.add("in");
        successMessage.style.visibility = "";
        var t = new TimelineLite();
        t.staggerFrom(splitText.chars, 0.7, {
            opacity: 0, rotationX: 90, delay: 0.1, transformOrigin: "0% 50% 0%", ease: Expo.easeOut
        }, 0.02);
        form.classList.add("submitted");
    };

    this.inputsRemoveClass = function(className) {
        for (i=0; i<inputs.length; i++) {
            inputs[i].parentElement.classList.remove(className);
        }
    }
}
